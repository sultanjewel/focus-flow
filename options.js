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

function saveOptions() {
  const focusMinutes = parseInt(document.getElementById('focus-minutes').value) || 25;
  const breakMinutes = parseInt(document.getElementById('break-minutes').value) || 5;
  const breakTime = parseInt(document.getElementById('breakTime').value) || 10;
  chrome.storage.local.set({ blockList, focusMinutes, breakMinutes, breakTime }, () => {
    
  });
}

function isValidDomain(domain) {
  // Basic domain validation: e.g. example.com, sub.example.co.uk
  return /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(domain);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('save-options').onclick = saveOptions;
  loadOptions();

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