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

// Format seconds into hours, minutes, seconds
function formatFocusTime(seconds) {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  let formattedTime = '';
  
  if (hours > 0) {
    formattedTime += `${hours} hour${hours !== 1 ? 's' : ''} `;
  }
  
  if (minutes > 0 || hours > 0) {
    formattedTime += `${minutes} minute${minutes !== 1 ? 's' : ''} `;
  }
  
  formattedTime += `${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
  
  return formattedTime;
}

// Focus time tracking
function updateFocusTimeDisplay(seconds) {
  const focusTimeElement = document.getElementById('focus-time-display');
  const focusContainer = document.getElementById('focus-time-container');
  
  if (focusTimeElement) {
    focusTimeElement.textContent = formatFocusTime(seconds);
  }
  
  // Update active class based on pomodoro state
  chrome.runtime.sendMessage({ type: 'getPomodoroState' }, (response) => {
    if (response && response.state === 'focus') {
      focusContainer.classList.add('active');
    } else {
      focusContainer.classList.remove('active');
    }
  });
}

// Initialize focus time display
function initializeFocusTime() {
  // Get initial focus time value
  chrome.runtime.sendMessage({ type: 'getFocusTimeToday' }, (response) => {
    if (response) {
      updateFocusTimeDisplay(response.focusTimeToday);
      
      // Check if currently in focus mode
      if (response.pomodoroState === 'focus') {
        document.getElementById('focus-time-container').classList.add('active');
      }
    }
  });
  
  // Listen for focus time updates
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'focusTimeUpdated') {
      updateFocusTimeDisplay(message.focusTimeToday);
      sendResponse({ status: 'updated' });
    } else if (message.type === 'pomodoroState') {
      const focusContainer = document.getElementById('focus-time-container');
      if (message.state === 'focus') {
        focusContainer.classList.add('active');
      } else {
        focusContainer.classList.remove('active');
      }
      sendResponse({ status: 'updated' });
    } else {
      // We don't handle this message
      return false;
    }
    // Return true for messages we handle to indicate async response
    return true;
  });
}

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
  try {
    chrome.storage.local.set({ todos }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error saving todos:', chrome.runtime.lastError);
      }
    });
  } catch (error) {
    console.error('Error accessing storage:', error);
  }
}

function loadTodos() {
  try {
    chrome.storage.local.get(['todos'], (result) => {
      try {
        // Check for runtime errors
        if (chrome.runtime.lastError) {
          console.error('Error loading todos:', chrome.runtime.lastError.message);
          todos = [];
          renderTodos();
          return;
        }
        
        // Check if result exists
        if (!result) {
          console.log('Storage result is undefined, using empty array');
          todos = [];
          renderTodos();
          return;
        }
        
        // Assign todos with fallback
        todos = result.todos || [];
        
        // Validate todos to ensure they have proper structure
        todos = todos.filter(todo => {
          return todo && 
                 typeof todo.id !== 'undefined' &&
                 typeof todo.text === 'string' &&
                 typeof todo.deadline === 'string' &&
                 typeof todo.completed !== 'undefined';
        });
        
        renderTodos();
      } catch (innerError) {
        console.error('Error processing todos data:', innerError);
        todos = [];
        renderTodos();
      }
    });
  } catch (error) {
    console.error('Error accessing storage:', error);
    todos = [];
    renderTodos();
  }
}

function renderTodos() {
  try {
    const todoList = document.getElementById('todo-list');
    if (!todoList) {
      console.error('Todo list element not found');
      return;
    }
    
    todoList.innerHTML = '';
    
    // Make a safe copy of todos
    const todosCopy = Array.isArray(todos) ? [...todos] : [];
    
    // Sort todos by deadline (closest to farthest) with error handling
    const sortedTodos = todosCopy.sort((a, b) => {
      try {
        const dateA = new Date(a.deadline);
        const dateB = new Date(b.deadline);
        return dateA - dateB;
      } catch (error) {
        console.log('Error comparing todo dates:', error);
        return 0; // Keep original order if date comparison fails
      }
    });
    
    if (sortedTodos.length === 0) {
      // Add a message when there are no todos
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-todo-message';
      emptyMessage.textContent = 'No tasks to show. Add a new task below.';
      todoList.appendChild(emptyMessage);
      return;
    }
    
    const now = new Date();
    
    // Process each todo item
    sortedTodos.forEach(todo => {
      try {
        // Skip invalid todos
        if (!todo || !todo.deadline || !todo.text || typeof todo.id === 'undefined') {
          console.log('Skipping invalid todo item:', todo);
          return;
        }
        
        let deadlineDate;
        try {
          deadlineDate = new Date(todo.deadline);
          if (isNaN(deadlineDate.getTime())) {
            console.log('Invalid date format:', todo.deadline);
            deadlineDate = new Date(); // Use current date as fallback
          }
        } catch (dateError) {
          console.log('Error parsing deadline date:', dateError);
          deadlineDate = new Date(); // Use current date as fallback
        }
        
        const isOverdue = deadlineDate < now;
        const overdueClass = isOverdue ? 'overdue' : '';
        const completedClass = todo.completed ? 'completed' : '';
        
        let formattedDeadline = 'Unknown deadline';
        try {
          formattedDeadline = deadlineDate.toLocaleString('en-US', {
            month: 'short', 
            day: 'numeric', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: true
          });
        } catch (formatError) {
          console.log('Error formatting date:', formatError);
        }
        
        const todoItem = document.createElement('div');
        todoItem.className = `todo-item ${overdueClass} ${completedClass}`;
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
      } catch (todoError) {
        console.error('Error rendering todo item:', todoError);
      }
    });
    
    // Add event listeners for checkboxes
    todoList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        try {
          const id = Number(this.getAttribute('data-id'));
          toggleTodo(id);
        } catch (error) {
          console.error('Error handling checkbox change:', error);
        }
      });
    });
    
    // Add event listeners for delete buttons
    todoList.querySelectorAll('.todo-delete').forEach(btn => {
      btn.addEventListener('click', function() {
        try {
          const id = Number(this.getAttribute('data-id'));
          const item = this.closest('.todo-item');
          item.classList.add('removing');
          setTimeout(() => {
            deleteTodo(id);
          }, 500);
        } catch (error) {
          console.error('Error handling delete click:', error);
        }
      });
    });
  } catch (outerError) {
    console.error('Error in renderTodos:', outerError);
  }
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

  // Save edit on blur (if focus leaves all inputs/buttons)
  [textInput, dateInput, timeInput].forEach(input => {
    input.addEventListener('blur', function(e) {
      setTimeout(() => {
        // If none of the edit fields or save button is focused, save changes
        if (![textInput, dateInput, timeInput, saveBtn].includes(document.activeElement)) {
          // Get values
          const newText = textInput.value.trim();
          const newDate = dateInput.value;
          const newTime = timeInput.value;
          
          // Basic validation
          if (!newText || !newDate || !newTime) {
            // If fields are invalid, don't save and just revert
            renderTodos();
            return;
          }
          
          // Check if date is in the future
          const newDeadline = new Date(newDate + 'T' + newTime);
          if (newDeadline < new Date()) {
            // If date is in the past, don't save and just revert
            renderTodos();
            return;
          }
          
          // Update todo
          todo.text = newText;
          todo.deadline = newDate + 'T' + newTime;
          saveTodos();
          renderTodos();
        }
      }, 100); // Slightly longer timeout to ensure click events are processed
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
        
        // If the todo was just completed (not un-completed)
        if (!wasCompleted && todo.completed) {
          // Send message to background script to trigger a break
          // for both future and overdue tasks
          chrome.runtime.sendMessage({ 
            type: 'taskCompleted',
            todoId: id
          });
          
          // Find the todo item in the DOM
          const todoItem = document.querySelector(`.todo-item input[data-id="${id}"]`).closest('.todo-item');
          
          // Apply removal animation
          todoItem.classList.add('removing');
          
          // Remove the todo after animation completes
          setTimeout(() => {
            // Remove from array
            todos = todos.filter(t => t.id !== id);
            
            // Save to storage
            chrome.storage.local.set({ todos }, () => {
              renderTodos();
            });
          }, 600); // Animation takes 500ms, wait a bit longer
          
          // Return early to prevent the normal save and render
          return;
        }
        
        // If todo was unchecked, just update normally
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
      let todos = [];
      loadTodos();
      setTodoDateTimeInputs();
      initializeFocusTime();
      setInterval(updateTime, 1000);
      updateTime();
      loadTodos();
    });