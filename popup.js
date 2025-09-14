document.addEventListener('DOMContentLoaded', async function() {
  // Get UI elements
  const goToOptionsButton = document.getElementById('go-to-options');
  

  
  if (goToOptionsButton) {
    goToOptionsButton.addEventListener('click', function() {
      chrome.runtime.openOptionsPage();
    });
  }
  
});

