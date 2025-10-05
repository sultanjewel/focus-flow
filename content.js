// Injects block.html if site is in block list and Pomodoro is active

function isBlocked(url, blockList) {
  return blockList.some(site => url.includes(site));
}

// Function to show block page
function showBlockPage() {
  try {
    chrome.storage.local.get(['todos'], (result) => {
      try {
        if (chrome.runtime.lastError) {
          console.log('Error getting todos:', chrome.runtime.lastError.message);
          return;
        }
        
        if (!result || !result.todos) {
          console.log('No todos found in storage');
          return;
        }
        
        // Get all uncompleted todos, including overdue ones
        // Filter out malformed todos
        const uncompletedTodos = (result.todos || []).filter(todo => {
          return todo && 
                 typeof todo.completed !== 'undefined' && 
                 !todo.completed && 
                 todo.text && 
                 todo.deadline;
        });
        
        if (uncompletedTodos.length === 0) {
          console.log('No valid uncompleted todos found');
          return; // Don't block if no pending to-dos
        }
        
        // Find the closest deadline task
        const now = new Date();
        uncompletedTodos.sort((a, b) => {
          try {
            return new Date(a.deadline) - new Date(b.deadline);
          } catch(e) {
            return 0; // If date parsing fails, treat them as equal
          }
        });
        
        const nextTask = uncompletedTodos[0];
        
        try {
          const deadlineDate = new Date(nextTask.deadline);
          const isOverdue = deadlineDate < now;
          
          document.documentElement.innerHTML = '';
          fetch(chrome.runtime.getURL('block.html'))
            .then(r => r.text())
            .then(html => {
              document.open();
              document.write(html);
              document.close();
              
              const el = document.getElementById('focus-task');
              if (el && nextTask) {
                try {
                  const formattedDate = deadlineDate.toLocaleString('en-US', {
                    month:'short',
                    day:'numeric',
                    year:'numeric',
                    hour:'2-digit',
                    minute:'2-digit',
                    hour12:true
                  });
                  
                  if (isOverdue) {
                    // Special message for overdue tasks
                    el.innerHTML = `<strong class="overdue">OVERDUE TASK:</strong> "${nextTask.text}".<br>The deadline was ${formattedDate}.<br><br>If you have already finished it, please mark it as done in the new tab.`;
                  } else {
                    // Regular message for upcoming tasks
                    el.textContent = `You should work on "${nextTask.text}". The deadline is ${formattedDate}.`;
                  }
                } catch (formatError) {
                  // Fallback if date formatting fails
                  el.textContent = `You should work on "${nextTask.text}".`;
                  console.log('Error formatting date:', formatError);
                }
              }
            })
            .catch(error => {
              console.log('Error fetching block page:', error);
            });
        } catch (dateError) {
          console.log('Error processing deadline date:', dateError);
        }
      } catch (innerError) {
        console.log('Error processing todos data:', innerError);
      }
    });
  } catch (error) {
    console.log('Error in showBlockPage:', error);
  }
}

// Check initial state when page loads
try {
  chrome.runtime.sendMessage({ type: 'getPomodoroState' }, (response) => {
    // Check for errors
    if (chrome.runtime.lastError) {
      console.log('Error getting pomodoro state:', chrome.runtime.lastError.message);
      return;
    }
    
    // Check valid response
    if (!response) return;
    const { state, blockList } = response;
    
    // Only block during focus period
    if (state === 'focus' && isBlocked(window.location.href, blockList)) {
      showBlockPage();
    }
    // Do not block during break period
  });
} catch (error) {
  console.log('Error sending message to background:', error);
}

// Listen for state changes from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'modeChanged') {
    try {
      chrome.runtime.sendMessage({ type: 'getPomodoroState' }, (response) => {
        // Check for runtime errors
        if (chrome.runtime.lastError) {
          console.log('Error getting pomodoro state:', chrome.runtime.lastError.message);
          return;
        }
        
        // Check valid response
        if (!response) return;
        const { blockList } = response;
        
        try {
          // Check if current page is in block list
          if (isBlocked(window.location.href, blockList)) {
            if (message.mode === 'focus') {
              // Switch to focus mode - show block page
              showBlockPage();
            } else if (message.mode === 'break') {
              // Switch to break mode - reload the page to show the actual content
              window.location.reload();
            }
          }
        } catch (innerError) {
          console.log('Error processing state change:', innerError);
        }
      });
    } catch (error) {
      console.log('Error sending message to background:', error);
    }
    
    // Always respond to the sender
    try {
      sendResponse({ status: 'ok' });
    } catch (sendError) {
      console.log('Error sending response:', sendError);
    }
    
    return true; // Keep the message channel open for the async response
  }
  
  return false; // We didn't handle this message type
});
