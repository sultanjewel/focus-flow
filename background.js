// Handles Pomodoro timer, blocking logic, and daily reset

// Focus time tracking variables
let focusTimeToday = 0;
let focusSessionStartTime = null;
let lastActiveDate = new Date().toLocaleDateString();

const DEFAULT_BLOCK_LIST = [
  'facebook.com', 'twitter.com', 'instagram.com', 'youtube.com', 'reddit.com', 'tiktok.com'
];
const DEFAULT_FOCUS_MINUTES = 25;
const DEFAULT_BREAK_MINUTES = 5;
const DEFAULT_TASK_BREAK_TIME = 10;
const BADGE_UPDATE_INTERVAL = 1000; // Update badge every second

let blockList = DEFAULT_BLOCK_LIST;
let focusMinutes = DEFAULT_FOCUS_MINUTES;
let breakMinutes = DEFAULT_BREAK_MINUTES;
let breakTime = DEFAULT_TASK_BREAK_TIME;
let pomodoroState = 'focus'; // 'focus' or 'break'
let timerEnd = null;
let hasTodos = false;

// Global timeout variables
let stateChangeTimeout = null;
let breakTimeout = null;

// Function to get today's focus time from storage
function loadFocusTime() {
  const today = new Date().toLocaleDateString();
  try {
    chrome.storage.local.get(['focusTimeTracking'], (result) => {
      try {
        if (chrome.runtime.lastError) {
          console.error('Error loading focus time:', chrome.runtime.lastError);
          focusTimeToday = 0;
          lastActiveDate = today;
          return;
        }
        
        if (result.focusTimeTracking && result.focusTimeTracking[today]) {
          console.log('Loading focus time for today:', result.focusTimeTracking);
          focusTimeToday = result.focusTimeTracking[today];
        } else {
          focusTimeToday = 0;
          // Initialize focus time for today
          saveFocusTime();
        }
        
        // Reset the date check
        lastActiveDate = today;
        
        // Start tracking if we're in focus mode
        if (pomodoroState === 'focus' && hasTodos) {
          startFocusTimeTracking();
        }
      } catch (error) {
        console.error('Error processing focus time data:', error);
        focusTimeToday = 0;
        lastActiveDate = today;
      }
    });
  } catch (error) {
    console.error('Error accessing storage:', error);
    focusTimeToday = 0;
    lastActiveDate = today;
  }
}

// Save focus time to storage
function saveFocusTime() {
  const today = new Date().toLocaleDateString();
  try {
    chrome.storage.local.get(['focusTimeTracking'], (result) => {
      try {
        const tracking = result.focusTimeTracking || {};
        tracking[today] = focusTimeToday;
        
        // Only keep the last 7 days of tracking data
        const dates = Object.keys(tracking).sort();
        if (dates.length > 7) {
          const oldDates = dates.slice(0, dates.length - 7);
          oldDates.forEach(date => delete tracking[date]);
        }
        
        chrome.storage.local.set({ focusTimeTracking: tracking }, () => {
          // Handle potential error
          if (chrome.runtime.lastError) {
            console.error('Error saving focus time:', chrome.runtime.lastError);
          }
        });
      } catch (error) {
        console.error('Error processing focus time data:', error);
      }
    });
  } catch (error) {
    console.error('Error accessing storage:', error);
  }
}

// Start tracking focus time
function startFocusTimeTracking() {
  // Check if we need to reset for a new day
  const today = new Date().toLocaleDateString();
  if (today !== lastActiveDate) {
    focusTimeToday = 0;
    lastActiveDate = today;
    saveFocusTime();
  }
  
  // Record the start time of this focus session
  focusSessionStartTime = Date.now();
  
  // Broadcast the current time (won't change until we switch to break)
  try {
    chrome.runtime.sendMessage({ 
      type: 'focusTimeUpdated', 
      focusTimeToday: focusTimeToday 
    }, (response) => {
      // Handle any errors silently
      if (chrome.runtime.lastError) {
        // It's ok if there are no listeners
      }
    });
  } catch (error) {
    // Fail silently if runtime is not available
    console.log('Could not send focus time update');
  }
}

// Stop tracking focus time and add the session time to total
function stopFocusTimeTracking() {
  // Only add time if we were in a focus session
  if (focusSessionStartTime !== null) {
    // Calculate how many seconds the focus session lasted
    // Don't use actual elapsed time - use the configured focus minutes instead
    // This ensures consistency with the pomodoro timer
    const focusTimeInSeconds = focusMinutes * 60;
    
    // Log the time being added
    const oldTotal = focusTimeToday;
    
    // Add this session's time to the daily total
    focusTimeToday += focusTimeInSeconds;
    
    // Log the time addition
    console.log(`Added ${focusMinutes} minutes (${focusTimeInSeconds} seconds) of focus time`);
    console.log(`Total focus time: ${formatFocusTimeForLogging(oldTotal)} → ${formatFocusTimeForLogging(focusTimeToday)}`);
    
    // Reset session start time
    focusSessionStartTime = null;
    
    // Save the updated total
    saveFocusTime();
    
    // Broadcast the updated time
    try {
      chrome.runtime.sendMessage({ 
        type: 'focusTimeUpdated', 
        focusTimeToday: focusTimeToday 
      });
    } catch (error) {
      // Fail silently if runtime is not available
      console.log('Could not send focus time update');
    }
  }
}

// Load settings from storage
function loadSettings() {
  try {
    chrome.storage.local.get([
      'blockList', 'focusMinutes', 'breakMinutes', 'breakTime', 'todos'
    ], (result) => {
      try {
        // Check if result exists and has expected properties
        if (!result) {
          console.log('Storage result is undefined, using defaults');
          result = {};
        }

        // Safely assign values with fallbacks
        blockList = result.blockList || DEFAULT_BLOCK_LIST;
        focusMinutes = result.focusMinutes || DEFAULT_FOCUS_MINUTES;
        breakMinutes = result.breakMinutes || DEFAULT_BREAK_MINUTES;
        breakTime = result.breakTime || DEFAULT_TASK_BREAK_TIME;
        
        // Safely check todos
        const todos = result.todos || [];
        // Include all uncompleted todos, regardless of deadline
        hasTodos = todos.some(todo => todo && !todo.completed);
        
        startPomodoro();
        updateIcon();
      } catch (innerError) {
        console.error('Error processing settings:', innerError);
        // Use defaults if there's an error
        blockList = DEFAULT_BLOCK_LIST;
        focusMinutes = DEFAULT_FOCUS_MINUTES;
        breakMinutes = DEFAULT_BREAK_MINUTES;
        breakTime = DEFAULT_TASK_BREAK_TIME;
        hasTodos = false;
        
        startPomodoro();
        updateIcon();
      }
    });
  } catch (error) {
    console.error('Error loading settings:', error);
    // Use defaults if there's an error
    blockList = DEFAULT_BLOCK_LIST;
    focusMinutes = DEFAULT_FOCUS_MINUTES;
    breakMinutes = DEFAULT_BREAK_MINUTES;
    breakTime = DEFAULT_TASK_BREAK_TIME;
    hasTodos = false;
    
    startPomodoro();
    updateIcon();
  }
}

function startPomodoro() {
  if (!hasTodos) {
    pomodoroState = 'idle';
    timerEnd = null;
    return;
  }
  pomodoroState = 'focus';
  timerEnd = Date.now() + focusMinutes * 60 * 1000;
  setTimeout(() => switchState(), focusMinutes * 60 * 1000);
}

function updateIcon() {
  let iconPath = pomodoroState === 'focus'
    ? {
        "16": "images/icon_red.png",
        "48": "images/icon_red.png",
        "128": "images/icon_red.png"
      }
    : {
        "16": "images/icon_green.png",
        "48": "images/icon_green.png",
        "128": "images/icon_green.png"
      };
  if(pomodoroState === 'idle'){
    iconPath = {
      "16": "images/icon_default.png",
      "48": "images/icon_default.png",
      "128": "images/icon_default.png"
    };
    chrome.action.setIcon({ path: iconPath });
    // Clear badge when idle
    chrome.action.setBadgeText({ text: '' });
    return;
  }
  chrome.action.setIcon({ path: iconPath });
  
  // Set badge background color based on state
  chrome.action.setBadgeBackgroundColor({ 
    color: pomodoroState === 'focus' ? '#f44336' : '#4CAF50' 
  });
  
  // Update timer display
  updateTimerBadge();
}

function switchState() {
  // Prevent duplicate state switches
  if (isSwitchingState) {
    return;
  }
  
  // Set the flag to indicate we're in the middle of a state switch
  isSwitchingState = true;
  
  if (!hasTodos) {
    pomodoroState = 'idle';
    timerEnd = null;
    updateIcon();
    stopFocusTimeTracking();
    isSwitchingState = false;
    return;
  }
  
  // Clear any existing timeouts to prevent duplicate switches
  if (stateChangeTimeout) {
    clearTimeout(stateChangeTimeout);
    stateChangeTimeout = null;
  }
  
  // Switch the state
  if (pomodoroState === 'focus') {
    pomodoroState = 'break';
    timerEnd = Date.now() + breakMinutes * 60 * 1000;
    stateChangeTimeout = setTimeout(() => switchState(), breakMinutes * 60 * 1000);
    
    // Stop focus time tracking and save the current total
    stopFocusTimeTracking();
    
    // Play sound notification
    playSound();
    
    // Notify content scripts to reload blocked tabs
    notifyBlockedTabsToReload();
  } else {
    pomodoroState = 'focus';
    timerEnd = Date.now() + focusMinutes * 60 * 1000;
    stateChangeTimeout = setTimeout(() => switchState(), focusMinutes * 60 * 1000);
    
    // Start focus time tracking
    startFocusTimeTracking();
    
    // Play sound notification
    playSound();
    
    // Notify content scripts to block if necessary
    notifyBlockedTabsToShow();
  }
  
  // Notify about state change
  try {
    chrome.runtime.sendMessage({ type: 'pomodoroState', state: pomodoroState }, (response) => {
      // Handle any errors silently
      if (chrome.runtime.lastError) {
        // It's ok if there are no listeners
        console.log('Pomodoro state update not received:', chrome.runtime.lastError.message);
      }
    });
  } catch (error) {
    // Fail silently if runtime is not available
    console.log('Could not send pomodoro state update');
  }
  updateIcon();
  
  // Reset the flag once the state switch is complete
  setTimeout(() => {
    isSwitchingState = false;
  }, 1000); // Allow a short delay before enabling state switches again
}

// Listen for changes in settings or todos
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    // Only reload complete settings when todos or settings change
    // to avoid overwriting focus time tracking
    if (changes.todos || changes.blockList || changes.focusMinutes || 
        changes.breakMinutes || changes.breakTime) {
      loadSettings();
    }
  }
});

// Format focus time for console logging (HH:MM:SS format)
function formatFocusTimeForLogging(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Handle requests for focus time data
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'getFocusTimeToday') {
    // Log the current focus time (for debugging)
    console.log(`Current focus time: ${formatFocusTimeForLogging(focusTimeToday)}`);
    
    sendResponse({
      focusTimeToday: focusTimeToday,
      pomodoroState: pomodoroState
    });
    return true;
  }
});

// Handle task completion break time
function startTaskBreak() {
  // Set flag to prevent duplicate state switches
  isSwitchingState = true;
  
  // If we're in focus mode, record the focus time before switching to break
  if (pomodoroState === 'focus' && focusSessionStartTime !== null) {
    // Stop focus time tracking (adds the current session time to the total)
    stopFocusTimeTracking();
  }
  
  // Calculate remaining time if we're already in a break
  let remainingBreakTime = 0;
  if (pomodoroState === 'break' && timerEnd) {
    remainingBreakTime = Math.max(0, (timerEnd - Date.now()) / (60 * 1000));
  }

  // Use the maximum break time (either the remaining or the configured break time)
  const breakTimeToUse = Math.max(remainingBreakTime, breakTime);

  // Set pomodoro state to break and update timer end
  pomodoroState = 'break';
  timerEnd = Date.now() + breakTimeToUse * 60 * 1000;
  
  // Clear any existing timeouts
  if (breakTimeout) {
    clearTimeout(breakTimeout);
    breakTimeout = null;
  }
  if (stateChangeTimeout) {
    clearTimeout(stateChangeTimeout);
    stateChangeTimeout = null;
  }
  
  // Set a timeout to switch back to focus mode after the break
  stateChangeTimeout = setTimeout(() => switchState(), breakTimeToUse * 60 * 1000);
  
  // Update the extension icon
  updateIcon();
  
  // Broadcast state change
  try {
    chrome.runtime.sendMessage({ type: 'pomodoroState', state: pomodoroState }, (response) => {
      // Handle any errors silently
      if (chrome.runtime.lastError) {
        // It's ok if there are no listeners
        console.log('Pomodoro state update not received:', chrome.runtime.lastError.message);
      }
    });
  } catch (error) {
    // Fail silently if runtime is not available
    console.log('Could not send pomodoro state update');
  }
  
  // Reset the flag after a short delay
  setTimeout(() => {
    isSwitchingState = false;
  }, 1000);
}

// Respond to content script queries
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'getPomodoroState') {
    sendResponse({
      state: pomodoroState,
      blockList,
      timerEnd
    });
    return true; // Indicate asynchronous response
  } else if (msg.type === 'taskCompleted') {
    // When a task is completed, start a break
    startTaskBreak();
    // Update the badge immediately after starting break
    updateTimerBadge();
    sendResponse({ success: true });
    return true; // Indicate asynchronous response
  }
});

// Daily reset of todos
// function dailyReset() {
  // const now = new Date();
  // if (now.getHours() === 0 && now.getMinutes() === 0) {
  //   chrome.storage.local.set({ todos: [] });
  // }
  // setTimeout(dailyReset, 60 * 1000); // check every minute
// }

// Keep track of whether we're currently processing a state switch to avoid duplicate switches
let isSwitchingState = false;

// Function to update the badge text with remaining time
function updateTimerBadge() {
  if (pomodoroState === 'idle' || !timerEnd) {
    chrome.action.setBadgeText({ text: '' });
    return;
  }
  
  const timeRemaining = Math.max(0, timerEnd - Date.now());
  const minutes = Math.floor(timeRemaining / (60 * 1000));
  const seconds = Math.floor((timeRemaining % (60 * 1000)) / 1000);
  
  // For better visibility in the small badge area, use a more compact format
  // If more than 60 minutes, just show minutes, otherwise show M:SS
  let formattedTime;
  if (minutes >= 60) {
    formattedTime = `${Math.floor(minutes / 60)}h`;
  } else if (minutes >= 10) {
    formattedTime = `${minutes}m`;
  } else {
    formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  
  chrome.action.setBadgeText({ text: formattedTime });
  
  // If timer has ended and we're not already in the process of switching states
  if (timeRemaining <= 0 && timerEnd && !isSwitchingState) {
    switchState();
  }
}

// Set up interval to update the timer badge
let badgeUpdateInterval;
function startBadgeUpdater() {
  // Clean up existing interval if any
  if (badgeUpdateInterval) {
    clearInterval(badgeUpdateInterval);
  }
  
  // Update immediately
  updateTimerBadge();
  
  // Then update every second
  badgeUpdateInterval = setInterval(updateTimerBadge, BADGE_UPDATE_INTERVAL);
}

// Clean up interval when extension is unloaded
chrome.runtime.onSuspend.addListener(() => {
  if (badgeUpdateInterval) {
    clearInterval(badgeUpdateInterval);
  }
});

// Function to play notification sounds using Chrome notifications
function playSound() {
  // Create a notification with a sound
  chrome.notifications.create({
    type: 'basic',
    iconUrl: pomodoroState === 'focus' ? 'images/icon_red.png' : 'images/icon_green.png',
    title: pomodoroState === 'focus' ? 'Focus Time' : 'Break Time',
    message: pomodoroState === 'focus' ? 'Time to focus!' : 'Time to take a break!',
    silent: false  // This will play the default system sound
  });
}

// Function to notify content scripts in blocked tabs to reload when going to break mode
function notifyBlockedTabsToReload() {
  try {
    chrome.tabs.query({}, (tabs) => {
      if (chrome.runtime.lastError) {
        console.log('Error querying tabs:', chrome.runtime.lastError.message);
        return;
      }
      
      for (const tab of tabs) {
        try {
          // Skip tabs without proper URLs
          if (!tab || !tab.url || !tab.id) continue;
          
          // Check if the tab URL is in the block list
          const isBlocked = blockList.some(site => tab.url.includes(site));
          if (isBlocked) {
            // Send message with error handling
            chrome.tabs.sendMessage(tab.id, { type: 'modeChanged', mode: 'break' }, () => {
              // Always check for runtime errors in sendMessage callbacks
              if (chrome.runtime.lastError) {
                // Ignore errors from tabs that don't have our content script
                console.log(`Tab ${tab.id} not ready or doesn't have content script:`, chrome.runtime.lastError.message);
              }
            });
          }
        } catch (tabError) {
          console.log('Error processing tab:', tabError);
        }
      }
    });
  } catch (error) {
    console.log('Error in notifyBlockedTabsToReload:', error);
  }
}

// Function to notify content scripts in blocked tabs to show block page when going to focus mode
function notifyBlockedTabsToShow() {
  try {
    chrome.tabs.query({}, (tabs) => {
      if (chrome.runtime.lastError) {
        console.log('Error querying tabs:', chrome.runtime.lastError.message);
        return;
      }
      
      for (const tab of tabs) {
        try {
          // Skip tabs without proper URLs
          if (!tab || !tab.url || !tab.id) continue;
          
          // Check if the tab URL is in the block list
          const isBlocked = blockList.some(site => tab.url.includes(site));
          if (isBlocked) {
            // Send message with error handling
            chrome.tabs.sendMessage(tab.id, { type: 'modeChanged', mode: 'focus' }, () => {
              // Always check for runtime errors in sendMessage callbacks
              if (chrome.runtime.lastError) {
                // Ignore errors from tabs that don't have our content script
                console.log(`Tab ${tab.id} not ready or doesn't have content script:`, chrome.runtime.lastError.message);
              }
            });
          }
        } catch (tabError) {
          console.log('Error processing tab:', tabError);
        }
      }
    });
  } catch (error) {
    console.log('Error in notifyBlockedTabsToShow:', error);
  }
}

// dailyReset();
loadSettings();
startBadgeUpdater();
loadFocusTime();

// No need to preload sounds as we're using system notifications
