# Focus Flow - Productivity & Focus Timer

Focus Flow is a Chrome extension that helps users stay productive by combining the Pomodoro technique with website blocking and task management - all in a beautiful, modern interface.

## What is Focus Flow?

Focus Flow is designed for students, professionals, and anyone who wants to improve their productivity by managing distractions and organizing their daily tasks. The extension transforms your new tab page into a productivity hub while blocking distracting websites during designated focus periods.

## Key Features

- **Smart Website Blocker:** Automatically blocks distracting websites (like social media) during focus periods and allows access during breaks
- **Daily Focus Time Tracking:** Monitors and displays how much time you've spent in focused work each day
- **Beautiful New Tab Page:** Clean, modern interface showing your tasks, focus timer, and search functionality
- **Pomodoro Timer:** Alternates between customizable focus and break periods to maximize productivity
- **Task Management:** Create, edit, and complete tasks with deadlines and priority levels
- **Visual Notifications:** Clear visual and sound indicators when switching between focus and break modes
- **Fully Customizable:** Set your own focus/break durations and manage your website block list

## How to Use Focus Flow

1. **Add Tasks:** Enter your daily tasks with deadlines on the new tab page
2. **Start Working:** The Pomodoro timer will automatically cycle between focus and break periods
3. **Stay Focused:** Distracting websites will be blocked during focus periods, showing your current task instead
4. **Take Breaks:** During break periods, all websites become accessible again
5. **Track Progress:** Monitor your daily focus time and completed tasks

## File Structure
- `manifest.json` — Chrome extension manifest
- `background.js` — Pomodoro timer and blocking logic
- `content.js` — Injects block page on blocked sites
- `newtab.html` / `newtab.js` — To-do list and Google search UI
- `options.html` / `options.js` — Block list and timer configuration UI
- `block.html` — Blank page with current task
- `storage.js` — Chrome storage utility

## Customization

- **Website Block List:** Add or remove sites from the block list in the options page
- **Timer Settings:** Customize focus period duration (default: 25 minutes)
- **Break Duration:** Set your ideal break length between focus sessions (default: 5 minutes)
- **Task Break:** Configure special break time awarded when completing a task (default: 10 minutes)

## Privacy & Permissions

Focus Flow respects your privacy:

- **Local Storage Only:** All your data (tasks, settings, focus time) is stored locally on your device
- **No Data Collection:** We don't collect any personal information or usage statistics
- **Limited Permissions:** Only requests access to necessary browser features:
  - Storage: To save your tasks and settings
  - Notifications: For focus/break alerts
  - Tab access: To manage website blocking during focus periods

## Support

Having issues or want to suggest features? Please file an issue in our GitHub repository or contact us through the Chrome Web Store listing.

## License

MIT License
