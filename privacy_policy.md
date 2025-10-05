# Privacy Policy for Focus Flow

## Introduction

Focus Flow is a productivity extension designed to help users stay focused by implementing the Pomodoro technique with website blocking and task management features. This privacy policy explains what information we collect, how we use it, and the permissions we request.

## Data Collection and Use

Focus Flow operates with a strict **local-only** data policy:

1. **No Data Collection**: We do not collect, transmit, or store any user data on external servers.
2. **Local Storage Only**: All user data, including tasks, settings, and usage statistics, is stored locally on your device using Chrome's storage API.
3. **No Analytics**: We do not use any analytics tools or tracking mechanisms.
4. **No Personal Information**: We do not collect any personally identifiable information.

## Information Stored Locally

Focus Flow stores the following information locally on your device:

1. **Tasks and To-Dos**: Your task list with deadlines
2. **Settings**: Custom configurations like focus/break durations
3. **Block List**: Websites you've configured to be blocked during focus periods
4. **Focus Time Statistics**: Time spent in focus mode, stored only on your device

## Permissions and Their Purpose

Focus Flow requires the following permissions to function properly:

### Storage Permission
- **Purpose**: To save your tasks, settings, website block list, and focus time statistics locally on your device.
- **Justification**: Without storage access, the extension would reset every time you close your browser, losing your tasks and settings.

### Tabs Permission
- **Purpose**: To detect when you navigate to a blocked website during focus periods and display the block page instead.
- **Justification**: Required for the core website blocking functionality that prevents distraction during focus periods.

### Notifications Permission
- **Purpose**: To send alerts when focus and break periods begin/end.
- **Justification**: Notifications help users stay aware of their current Pomodoro state without having to check the extension.

### Host Permissions (http://*/* and https://*/*)
- **Purpose**: To detect and block distracting websites during focus periods.
- **Justification**: Required to implement the website blocking feature when users attempt to access sites on their block list.

### Content Scripts
- **Purpose**: To temporarily modify pages that should be blocked during focus periods.
- **Justification**: This is how the extension displays the block page with your current task instead of showing distracting content.

## No Remote Code Execution

Focus Flow does not download, execute, or incorporate any remote code. All functionality is contained within the extension package that is reviewed and approved by the Chrome Web Store.

## Data Retention and Deletion

Since all data is stored locally:
- Data persists until you clear your browser data or uninstall the extension
- You can reset all data by clearing your browser's storage for this extension
- Uninstalling the extension will remove all stored data

## Changes to This Policy

If we make significant changes to this privacy policy, we will provide notification through a new version release note.

## Contact

If you have questions about this privacy policy or the extension, please contact us through the Chrome Web Store support channel or email at [your-email@example.com].

Last Updated: October 5, 2025
