function getDate(){
    const today = new Date();
const localDate =
  today.getFullYear() + "-" +
  String(today.getMonth() + 1).padStart(2, '0') + "-" +
  String(today.getDate()).padStart(2, '0');
  return localDate;
}
document.getElementById('add-todo-date').value = getDate();

// Set default and min date/time for todo inputs
function pad(n) { return n < 10 ? '0' + n : n; }
function setTodoDateTimeInputs() {
  const now = new Date();
  const nextHour = new Date(now.getTime() + 60 * 60 * 1000);

  const dateStr = nextHour.getFullYear() + '-' + pad(nextHour.getMonth() + 1) + '-' + pad(nextHour.getDate());
  const timeStr = pad(nextHour.getHours()) + ':' + pad(nextHour.getMinutes());

  const minDateStr = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
  const minTimeStr = pad(now.getHours()) + ':' + pad(now.getMinutes());

  const dateInput = document.getElementById('add-todo-date');
  const timeInput = document.getElementById('add-todo-time');

  dateInput.value = dateStr;
  dateInput.min = minDateStr;
  timeInput.value = timeStr;
  timeInput.min = (dateStr === minDateStr) ? minTimeStr : '00:00';

  dateInput.addEventListener('change', function() {
    if (dateInput.value === minDateStr) {
      timeInput.min = minTimeStr;
      if (timeInput.value < minTimeStr) {
        timeInput.value = minTimeStr;
      }
    } else {
      timeInput.min = '00:00';
    }
  });
}

// Time/date display
function updateTime() {
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString('en-US', { 
    month: 'numeric', 
    day: 'numeric', 
    year: 'numeric' 
  });
  document.getElementById('current-time').innerHTML = `${time}<br>${date}`;
}
setInterval(updateTime, 1000);
updateTime();

// Google search
document.getElementById('google-search-form').onsubmit = function(e) {
  e.preventDefault();
  const q = document.getElementById('google-search').value.trim();
  if (q) {
    window.location.href = 'https://www.google.com/search?q=' + encodeURIComponent(q);
  }
};

// Todo functionality
function saveTodos() {
  chrome.storage.local.set({ todos });
}

function loadTodos() {
  chrome.storage.local.get(['todos'], (result) => {
    todos = result.todos || [];
    renderTodos();
  });
}

function renderTodos() {
  const todoList = document.getElementById('todo-list');
  todoList.innerHTML = '';
  // Sort todos by deadline (closest to farthest)
  const sortedTodos = [...todos].sort((a, b) => {
    const dateA = new Date(a.deadline);
    const dateB = new Date(b.deadline);
    return dateA - dateB;
  });
  const now = new Date();
  sortedTodos.forEach(todo => {
    const deadlineDate = new Date(todo.deadline);
    const isOverdue = deadlineDate < now;
    const completedClass = isOverdue ? 'completed' : '';
    const formattedDeadline = deadlineDate.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
    });
    const todoItem = document.createElement('div');
    todoItem.className = `todo-item ${completedClass}`;
    todoItem.innerHTML = `
      <input type="checkbox" ${todo.completed ? 'checked' : ''} data-id="${todo.id}">
      <span class="todo-text" data-id="${todo.id}">${todo.text}</span>
      <span class="todo-deadline" data-id="${todo.id}">${formattedDeadline}</span>
      <button class="todo-delete" title="Delete" data-id="${todo.id}">&#128465;</button>
    `;
    todoList.appendChild(todoItem);

    // Click-to-edit handlers
    todoItem.querySelector('.todo-text').addEventListener('click', function(e) {
      if (todo.completed) return; // Don't allow editing completed/overdue
      showEditForm(todoItem, todo);
    });
    todoItem.querySelector('.todo-deadline').addEventListener('click', function(e) {
      if (todo.completed) return;
      showEditForm(todoItem, todo);
    });

    // Remove checked items with animation
    if (todo.completed) {
      setTimeout(() => {
        todoItem.classList.add('removing');
        setTimeout(() => {
          deleteTodo(todo.id);
        }, 500);
      }, 100);
    }
  });
  // Add event listeners for checkboxes
  todoList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      const id = Number(this.getAttribute('data-id'));
      toggleTodo(id);
    });
  });
  // Add event listeners for delete buttons
  todoList.querySelectorAll('.todo-delete').forEach(btn => {
    btn.addEventListener('click', function() {
      const id = Number(this.getAttribute('data-id'));
      const item = this.closest('.todo-item');
      item.classList.add('removing');
      setTimeout(() => {
        deleteTodo(id);
      }, 500);
    });
  });
}

// Click-to-edit form with blur and escape to cancel
function showEditForm(todoItem, todo) {
  const deadlineDate = new Date(todo.deadline);
  const dateVal = deadlineDate.toISOString().slice(0,10);
  const timeVal = pad(deadlineDate.getHours()) + ':' + pad(deadlineDate.getMinutes());
  todoItem.classList.add('add-todo-row');
  todoItem.innerHTML = `
    <input type="text" class="edit-todo-text" value="${todo.text}">
    <input type="date" class="edit-todo-date" value="${dateVal}">
    <input type="time" class="edit-todo-time" value="${timeVal}">
    <button class="edit-save-btn" title="Save">✓</button>
  `;
  const textInput = todoItem.querySelector('.edit-todo-text');
  const dateInput = todoItem.querySelector('.edit-todo-date');
  const timeInput = todoItem.querySelector('.edit-todo-time');
  const saveBtn = todoItem.querySelector('.edit-save-btn');

  // Set min for date/time (prevent past)
  const now = new Date();
  const minDateStr = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
  const minTimeStr = pad(now.getHours()) + ':' + pad(now.getMinutes());
  dateInput.min = minDateStr;
  timeInput.min = (dateVal === minDateStr) ? minTimeStr : '00:00';

  dateInput.addEventListener('change', function() {
    if (dateInput.value === minDateStr) {
      timeInput.min = minTimeStr;
      if (timeInput.value < minTimeStr) timeInput.value = minTimeStr;
    } else {
      timeInput.min = '00:00';
    }
  });

  // Save on button click
  saveBtn.onclick = function() {
    const newText = textInput.value.trim();
    const newDate = dateInput.value;
    const newTime = timeInput.value;
    if (!newText || !newDate || !newTime) {
      alert('Please fill all fields.');
      return;
    }
    const newDeadline = new Date(newDate + 'T' + newTime);
    if (newDeadline < now) {
      alert('Please select a future date and time.');
      return;
    }
    // Update todo
    todo.text = newText;
    todo.deadline = newDate + 'T' + newTime;
    saveTodos();
    renderTodos();
  };

  // Cancel edit on blur (if focus leaves all inputs/buttons)
  [textInput, dateInput, timeInput].forEach(input => {
    input.addEventListener('blur', function(e) {
      setTimeout(() => {
        // If none of the edit fields or save button is focused, cancel
        if (![textInput, dateInput, timeInput, saveBtn].includes(document.activeElement)) {
          renderTodos();
        }
      }, 0);
    });
  });

  // Cancel edit on Escape key
  [textInput, dateInput, timeInput].forEach(input => {
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        renderTodos();
      }
    });
  });

  // Autofocus text input
  textInput.focus();
}

function deleteTodo(id) {
      todos = todos.filter(t => t.id !== id);
      saveTodos();
      renderTodos();
    }

    function toggleTodo(id) {
      const todo = todos.find(t => t.id === id);
      if (todo) {
        const wasCompleted = todo.completed;
        todo.completed = !todo.completed;
        
        // If the todo was just completed (not un-completed) and not overdue
        if (!wasCompleted && todo.completed) {
          const now = new Date();
          const deadlineDate = new Date(todo.deadline);
          
          // Only trigger a break if the todo deadline is in the future
          if (deadlineDate > now) {
            // Send message to background script to trigger a break
            chrome.runtime.sendMessage({ 
              type: 'taskCompleted',
              todoId: id
            });
          }
        }
        
        chrome.storage.local.set({ todos }, () => {
          renderTodos();
        });
      }
    }

    function addTodo(text, date, time) {
      // Combine date and time into ISO string
      const deadline = date + 'T' + time;
      const newTodo = {
        id: Date.now(),
        text: text.trim(),
        deadline: deadline,
        completed: false
      };
      todos.push(newTodo);
      saveTodos();
      renderTodos();
    }

    // Add todo form
    const addTodoForm = document.getElementById('add-todo-form');
    addTodoForm.onsubmit = function(e) {
      e.preventDefault();
      const textInput = document.getElementById('add-todo-text');
      const dateInput = document.getElementById('add-todo-date');
      const timeInput = document.getElementById('add-todo-time');
      const text = textInput.value.trim();
      const date = dateInput.value;
      const time = timeInput.value;
      if (text && date && time) {
        const deadline = new Date(date + 'T' + time);
        const now = new Date();
        if (deadline < now) {
          alert('Please select a future date and time.');
          return;
        }
        addTodo(text, date, time);
        textInput.value = '';
        setTodoDateTimeInputs(); // Reset to next hour after adding
      }
    };

    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
      setTodoDateTimeInputs();
      setInterval(updateTime, 1000);
      updateTime();
      loadTodos();
    });