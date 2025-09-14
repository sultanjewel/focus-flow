// Handles Pomodoro timer, blocking logic, and daily reset

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

// Load settings from storage
function loadSettings() {
  chrome.storage.local.get([
    'blockList', 'focusMinutes', 'breakMinutes', 'breakTime', 'todos'
  ], (result) => {
    blockList = result.blockList || DEFAULT_BLOCK_LIST;
    focusMinutes = result.focusMinutes || DEFAULT_FOCUS_MINUTES;
    breakMinutes = result.breakMinutes || DEFAULT_BREAK_MINUTES;
    breakTime = result.breakTime || DEFAULT_TASK_BREAK_TIME;
    hasTodos = (result.todos || []).some(todo => !todo.completed && new Date() < new Date(todo.deadline));
    startPomodoro();
    updateIcon();
  });
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
  if (!hasTodos) {
    pomodoroState = 'idle';
    timerEnd = null;
    updateIcon();
    return;
  }
  if (pomodoroState === 'focus') {
    pomodoroState = 'break';
    timerEnd = Date.now() + breakMinutes * 60 * 1000;
    setTimeout(() => switchState(), breakMinutes * 60 * 1000);
  } else {
    pomodoroState = 'focus';
    timerEnd = Date.now() + focusMinutes * 60 * 1000;
    setTimeout(() => switchState(), focusMinutes * 60 * 1000);
  }
  chrome.runtime.sendMessage({ type: 'pomodoroState', state: pomodoroState });
  updateIcon();
}

// Listen for changes in settings or todos
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    loadSettings();
  }
});

// Handle task completion break time
function startTaskBreak() {
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
  if (window.breakTimeout) {
    clearTimeout(window.breakTimeout);
  }
  
  // Set a timeout to switch back to focus mode after the break
  window.breakTimeout = setTimeout(() => switchState(), breakTimeToUse * 60 * 1000);
  
  // Update the extension icon
  updateIcon();
  
  // Broadcast state change
  chrome.runtime.sendMessage({ type: 'pomodoroState', state: pomodoroState });
}

// Respond to content script queries
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'getPomodoroState') {
    sendResponse({
      state: pomodoroState,
      blockList,
      timerEnd
    });
  } else if (msg.type === 'taskCompleted') {
    // When a task is completed, start a break
    startTaskBreak();
    // Update the badge immediately after starting break
    updateTimerBadge();
    sendResponse({ success: true });
  }
});

// Daily reset of todos
function dailyReset() {
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0) {
    chrome.storage.local.set({ todos: [] });
  }
  setTimeout(dailyReset, 60 * 1000); // check every minute
}

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
  
  // If timer has ended, switch state
  if (timeRemaining <= 0 && timerEnd) {
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

dailyReset();
loadSettings();
startBadgeUpdater();
