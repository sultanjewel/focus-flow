// Injects block.html if site is in block list and Pomodoro is active

function isBlocked(url, blockList) {
  return blockList.some(site => url.includes(site));
}

chrome.runtime.sendMessage({ type: 'getPomodoroState' }, (response) => {
  if (!response) return;
  const { state, blockList } = response;
  // Only block during focus period
  if (state === 'focus' && isBlocked(window.location.href, blockList)) {
    chrome.storage.local.get(['todos'], (result) => {
      const todos = (result.todos || []).filter(todo => !todo.completed && new Date() < new Date(todo.deadline));
      if (todos.length === 0) return; // Don't block if no pending to-dos
      // Find the closest deadline task
      todos.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
      const nextTask = todos[0];
      document.documentElement.innerHTML = '';
      fetch(chrome.runtime.getURL('block.html'))
        .then(r => r.text())
        .then(html => {
          document.open();
          document.write(html);
          document.close();
          const el = document.getElementById('focus-task');
          if (el && nextTask) {
            el.textContent = `You should work on "${nextTask.text}". The deadline is ${new Date(nextTask.deadline).toLocaleString('en-US', {month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:true})}.`;
          }
        });
    });
  }
  // Do not block during break period
});
