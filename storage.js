// Utility for Chrome storage
const Storage = {
  get: (key) => new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => resolve(result[key]));
  }),
  set: (key, value) => new Promise((resolve) => {
    chrome.storage.local.set({[key]: value}, () => resolve());
  })
};
// ...existing code...
