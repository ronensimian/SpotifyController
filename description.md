# Spotify-Web Playback Controller

**Version**: 1.7
**Description**: Complete Spotify-Web playback control with track navigation, volume, and comprehensive keyboard integration. Take full command of your listening experience right from your Chrome toolbar.

## Current Extension Status & Features

The Spotify-Web Playback Controller has been thoroughly refined into an "ultimate" quality-of-life extension, featuring a premium UI and a robust, modular Clean Code JavaScript architecture. 

### Core Playback & Track Management
- **Full Media Controls**: Play, Pause, Next Track, Previous Track.
- **Advanced Controls**: Smart Shuffle and Repeat toggles with multi-state icon support directly mirroring Spotify's native behavior.
- **Track Progress**: Real-time track progress slider with drag-to-seek functionality.
- **Library Integration**: Live synchronization with "Liked Songs". A visual indicator shows if the current song is in your library, and clicking it toggles the save status.

### Volume Control
- **Precision Slider**: Smooth volume adjustment via a dedicated slider.
- **Mouse Wheel Support**: Hover over the volume area and scroll up/down for quick steps.
- **Mute Toggle**: Instantly mute or restore the previous volume level with a single click.

### Premium UI/UX (Sprint 6 Updates)
- **Immersive Dynamic Background**: The popup window automatically extracts the highest-resolution album artwork (640x640px), applies a deep blur and darken effect, and uses it as a dynamic background that beautifully color-shifts as songs change.
- **Marquee Track Titles**: A responsive, self-resetting marquee effect smoothly scrolls long track titles back and forth within the expanded CSS title wrapper, complete with a gradient fade mask.
- **Dashboard Relocation**: Non-essential UI clutter, such as the "Rate Us" button, has been cleanly moved to a dedicated Dashboard HTML page, keeping the main popup strictly focused on playback.

### Keyboard Shortcuts (Global Support)
Default shortcuts are provided, but the extension is built to support Chrome's **Global Shortcuts** feature, allowing you to control Spotify even while in a full-screen game or when the browser is completely minimized.

| Action | Shortcut (Default) |
| :--- | :--- |
| **Next Track** | `Shift` + `Alt` + `Right Arrow` |
| **Previous Track** | `Shift` + `Alt` + `Left Arrow` |
| **Play/Pause** | `Shift` + `Alt` + `Up Arrow` |
| **Pause Only** | `Shift` + `Alt` + `Down Arrow` |

### Technical Architecture
- **ES6 Modularization**: The codebase has been refactored from a monolithic script into a modern, modular architecture (`popup.js` for orchestration, `ui.js` for DOM manipulation, and `spotify-api.js` for isolated web scraping and script injection).
- **Clean Code Principles**: Highly readable, single-responsibility helper functions strictly govern state management and UI updates.
- **Safe Execution**: Proactive safeguarding against unhandled exceptions, race conditions, and `chrome.storage` API failures.

## Notes & Limitations
- **Web Player Only**: The extension interfaces strictly with `open.spotify.com`. It does not control the native Spotify Desktop application (and prompts users to close the desktop app to avoid routing conflicts).
- **Incognito Support**: Requires manual enablement via `chrome://extensions` to function in private browsing mode.
