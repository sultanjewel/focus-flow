# Permission Justifications for Chrome Web Store Submission

## Single Purpose Description
Focus Flow enhances productivity by combining task management with the Pomodoro technique and website blocking functionality in a beautifully designed new tab page.

## Storage Permission Justification
The storage permission is required to save and persist user data including:
- Task lists and deadlines
- Custom settings (focus duration, break duration)
- Website block list
- Daily focus time statistics
Without this permission, all user data would be lost when the browser is closed, making the extension unusable for its intended purpose.

## Tabs Permission Justification
The tabs permission is essential for the website blocking functionality, which is a core feature of Focus Flow. This permission allows the extension to:
- Detect when a user navigates to a blocked website during focus periods
- Apply the blocking mechanism only when appropriate (during focus periods and not during breaks)
- Display the current task instead of showing distracting content
This permission is directly tied to the primary purpose of helping users maintain focus by preventing access to distracting sites.

## Notifications Permission Justification
The notifications permission is used to alert users when:
- A focus period begins or ends
- A break period begins or ends
- A task is completed
These notifications are critical for users to stay aware of their current Pomodoro state without having to actively check the extension, helping them maintain their productivity flow.

## Host Permission Justification
Host permissions (http://*/* and https://*/*) are required for the website blocking functionality:
- The extension needs to detect when users visit sites on their block list
- The content script needs permission to modify the page content to show the block page
- The extension does not collect or transmit any browsing data
This permission is narrowly used for the specific purpose of implementing the website blocking feature, which is a core functionality of the extension.

## Remote Code Justification
Focus Flow does not use, download, or execute any remote code. All functionality is contained within the extension package that is reviewed and approved by the Chrome Web Store. The content script only modifies the DOM of pages that should be blocked during focus periods and does not inject or execute remote scripts.

## Additional Notes
- All user data is stored locally on the device
- No data is transmitted to external servers
- No analytics or tracking is implemented
- No personally identifiable information is collected
