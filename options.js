// Handles site list and timer config UI with tag management

let blockList = [];

function renderBlockList() {
  const tagList = document.getElementById('block-list-tags');
  tagList.innerHTML = '';
  blockList.forEach((domain, idx) => {
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.innerHTML = `
      <span>${domain}</span>
      <button class="remove-tag" title="Remove" data-idx="${idx}">&times;</button>
    `;
    tagList.appendChild(tag);
  });
  // Add remove event listeners
  tagList.querySelectorAll('.remove-tag').forEach(btn => {
    btn.addEventListener('click', function() {
      const idx = Number(this.getAttribute('data-idx'));
      blockList.splice(idx, 1);
      saveOptions();
      renderBlockList();
    });
  });
}

function loadOptions() {
  chrome.storage.local.get(['blockList', 'focusMinutes', 'breakMinutes', 'breakTime'], (result) => {
    blockList = result.blockList || ['facebook.com','twitter.com','instagram.com','youtube.com','reddit.com','tiktok.com'];
    document.getElementById('focus-minutes').value = result.focusMinutes || 25;
    document.getElementById('break-minutes').value = result.breakMinutes || 5;
    document.getElementById('breakTime').value = result.breakTime || 10;
    renderBlockList();
  });
}

function validateOptions() {
  const focusMinutes = parseInt(document.getElementById('focus-minutes').value) || 25;
  const breakMinutes = parseInt(document.getElementById('break-minutes').value) || 5;
  const breakTime = parseInt(document.getElementById('breakTime').value) || 10;
  
  // Clear previous error messages
  document.getElementById('focus-error').textContent = '';
  document.getElementById('break-error').textContent = '';
  document.getElementById('task-break-error').textContent = '';
  
  let isValid = true;
  
  // Validation 1: Focus time should not exceed 99 minutes
  if (focusMinutes > 99) {
    document.getElementById('focus-error').textContent = 'Focus time cannot exceed 99 minutes';
    isValid = false;
  }
  
  // Validation 2: Break time should not exceed 99 minutes
  if (breakMinutes > 99) {
    document.getElementById('break-error').textContent = 'Break time cannot exceed 99 minutes';
    isValid = false;
  }
  
  // Validation 3: Break time after task should not exceed 99 minutes
  if (breakTime > 99) {
    document.getElementById('task-break-error').textContent = 'Break time cannot exceed 99 minutes';
    isValid = false;
  }
  
  // Validation 4: Break times cannot be more than focus time
  if (breakMinutes > focusMinutes) {
    document.getElementById('break-error').textContent = 'Break time cannot be longer than focus time';
    isValid = false;
  }
  
  // Validation 5: Task break time cannot be more than focus time
  if (breakTime > focusMinutes) {
    document.getElementById('task-break-error').textContent = 'Task break time cannot be longer than focus time';
    isValid = false;
  }
  
  return isValid;
}

function saveOptions() {
  if (!validateOptions()) {
    return; // Don't save if validation fails
  }
  
  const focusMinutes = parseInt(document.getElementById('focus-minutes').value) || 25;
  const breakMinutes = parseInt(document.getElementById('break-minutes').value) || 5;
  const breakTime = parseInt(document.getElementById('breakTime').value) || 10;
  
  chrome.storage.local.set({ blockList, focusMinutes, breakMinutes, breakTime }, () => {
    const saveBtn = document.getElementById('save-options');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Saved!';
    
    setTimeout(() => {
      saveBtn.textContent = originalText;
    }, 1500);
  });
}

function isValidDomain(domain) {
  // Basic domain validation: e.g. example.com, sub.example.co.uk
  return /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(domain);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('save-options').onclick = saveOptions;
  loadOptions();
  
  // Add input validation on change
  const focusInput = document.getElementById('focus-minutes');
  const breakInput = document.getElementById('break-minutes');
  const taskBreakInput = document.getElementById('breakTime');
  
  [focusInput, breakInput, taskBreakInput].forEach(input => {
    input.addEventListener('change', validateOptions);
    input.addEventListener('input', function() {
      // Enforce max value of 99 during input
      if (parseInt(this.value) > 99) {
        this.value = 99;
      }
    });
  });

  // Add domain on Enter
  const input = document.getElementById('block-list-input');
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = input.value.trim();
      if (!isValidDomain(val)) {
        alert('Please enter a valid domain (e.g. example.com)');
        return;
      }
      if (val && !blockList.includes(val)) {
        blockList.push(val);
        input.value = '';
        saveOptions();
        renderBlockList();
      }
    }
  });
});