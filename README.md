# Focus Flow Chrome Extension

Focus Flow helps users stay productive by blocking distracting sites and showing a daily to-do list with Pomodoro timer support.

## Features
- **Block distracting sites:** Default and user-configurable list (e.g., Facebook, Twitter, YouTube, etc.)
- **Beautiful new tab page:** Shows your daily to-do list and a Google search bar
- **Daily to-do list:** Add, edit, remove tasks with end times; resets every day
- **Pomodoro timer:** 25 min focus, 5 min break (configurable)
- **Options page:** Configure block list and timer durations with a modern UI
- **Blocking logic:** When you have pending to-dos, blocks distracting sites during focus periods and shows your current task

## Installation
1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Enable "Developer mode" (top right).
4. Click "Load unpacked" and select the `extension` folder.

## Usage
- Set up your to-do list on the new tab page.
- Configure block list and Pomodoro settings in the options page.
- When you have pending tasks, distracting sites will be blocked during focus periods and allowed during breaks.
- The to-do list resets every day.

## File Structure
- `manifest.json` — Chrome extension manifest
- `background.js` — Pomodoro timer and blocking logic
- `content.js` — Injects block page on blocked sites
- `newtab.html` / `newtab.js` — To-do list and Google search UI
- `options.html` / `options.js` — Block list and timer configuration UI
- `block.html` — Blank page with current task
- `storage.js` — Chrome storage utility

## Customization
- Add or remove sites from the block list in the options page
- Change Pomodoro timer durations in the options page

## License
MIT
