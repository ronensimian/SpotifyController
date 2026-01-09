# Spotify-Web Playback Controller

**Complete Spotify-Web playback control with track navigation, volume, and keyboard control.**

Take full command of your listening experience - right from your Chrome toolbar.

## Features

- **Playback Control**: Play, pause, next track, previous track.
- **Volume Control**: Adjust volume via slider or mouse wheel. Mute toggle.
- **Track Info**: Displays current track title and artist.
- **Like/Unlike**: Add songs to your "Liked Songs" directly from the extension.
- **Keyboard Shortcuts**: Control Spotify even when Chrome is minimized (requires Global configuration).
- **Incognito Support**: Works in Incognito/Private windows (requires enablement).

## Installation

1.  Clone or download this repository.
2.  Open Chrome and go to `chrome://extensions/`.
3.  Enable "Developer mode" in the top right corner.
4.  Click "Load unpacked".
5.  Select the directory where you downloaded/extracted this extension.

## Usage

### Popup Controls
Click the extension icon in the toolbar to open the popup:
- **Play/Pause**: Toggle playback.
- **Next/Prev**: Skip tracks.
- **Heart Icon**: Like/Unlike total current track.
- **Volume**: Drag the slider or use your mouse wheel over the volume area to adjust volume. Click the speaker icon to mute/unmute.

### Keyboard Shortcuts (Default)

| Action | Shortcut |
| :--- | :--- |
| **Next Track** | `Shift` + `Alt` + `Right Arrow` |
| **Previous Track** | `Shift` + `Alt` + `Left Arrow` |
| **Play/Pause** | `Shift` + `Alt` + `Up Arrow` |
| **Pause Only** | `Shift` + `Alt` + `Down Arrow` |

### Setting up Global Shortcuts (Control Spotify when minimized)

By default, shortcuts only work when Chrome is in focus. To make them work globally:

1.  Go to `chrome://extensions/shortcuts`.
2.  Find "Spotify-Web Playback Controller".
3.  Change the scope of the shortcuts from "In Chrome" to "Global".
4.  Restart Chrome (`about://restart`) if changes don't take effect immediately.

**Note:** You can also customize the shortcut keys from this menu.

## Important Notes

-   **Spotify Web Only**: This extension works for `open.spotify.com` and **not** for the Spotify desktop application. Please close the desktop app to avoid conflicts.
-   **Pin Extension**: For quick access, pin the extension to your Chrome toolbar.
-   **Incognito Mode**: To use in Incognito, go to `chrome://extensions/`, find this extension, click "Details", and enable "Allow in incognito".

## Credits

**Developer:** Ronen Simian
**Email:** ronen.developer.2@gmail.com

If you enjoy this extension, please consider leaving a review on the [Chrome Web Store](https://chromewebstore.google.com/detail/spotify-playback-controll/khdhaehfdiihogeaaiomiamjdhcihmji/reviews).
