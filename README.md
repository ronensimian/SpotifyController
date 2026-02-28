# Spotify-Web Playback Controller

**Version**: 1.7

Take full command of your Spotify listening experience—right from your Chrome toolbar. This extension provides complete web playback control with track navigation, precision volume adjustment, and comprehensive global keyboard integration.

## ✨ Features & Capabilities

The Spotify-Web Playback Controller has been thoroughly refined into an "ultimate" quality-of-life extension, featuring a premium UI and a robust, modular Clean Code JavaScript architecture. 

### 🎵 Core Playback & Track Management
- **Full Media Controls**: Play, Pause, Next Track, Previous Track.
- **Advanced Controls**: Smart Shuffle and Repeat toggles with multi-state icon support directly mirroring Spotify's native behavior.
- **Track Progress**: Real-time track progress slider with drag-to-seek functionality.
- **Library Integration**: Live synchronization with "Liked Songs". A visual indicator shows if the current song is in your library, and clicking it toggles the save status.

### 🔊 Volume Control
- **Precision Slider**: Smooth volume adjustment via a dedicated slider.
- **Mouse Wheel Support**: Hover over the volume area and scroll up/down for quick steps.
- **Mute Toggle**: Instantly mute or restore the previous volume level with a single click.

### 💎 Premium UI/UX
- **Immersive Dynamic Background**: The popup window automatically extracts the highest-resolution album artwork (640x640px), applies a deep blur and darken effect, and uses it as a dynamic background that beautifully color-shifts as songs change.
- **Clean Interface**: The popup is strictly focused on playback. Additional features like "Rate Us" and Help reside in a dedicated modular Dashboard page.

### ⚡ Performance & Accessibility 
- **DOM Mutation Observers**: Unlike older extensions that poll the page every second, this extension uses highly-efficient injected `MutationObserver` instances. It updates its UI in real-time *only* when Spotify's underlying React DOM changes, drastically reducing CPU cycles and memory overhead.
- **Screen Reader Support**: Fully semantic `aria-label` tags are applied consistently across all UI controls, ensuring seamless navigation for vision-impaired users.

### ⌨️ Keyboard Shortcuts (Global Support)
Default shortcuts are provided, but the extension is built to support Chrome's **Global Shortcuts** feature, allowing you to control Spotify even while in a full-screen game or when the browser is completely minimized.

| Action | Shortcut (Default) |
| :--- | :--- |
| **Next Track** | `Shift` + `Alt` + `Right` |
| **Previous Track** | `Shift` + `Alt` + `Left` |
| **Play/Pause** | `Shift` + `Alt` + `Up` |
| **Pause Only** | `Shift` + `Alt` + `Down` |

*To enable global control: Go to `chrome://extensions/shortcuts` and change this extension's scope from "In Chrome" to "Global".*

## 🛠️ Installation

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **"Developer mode"** in the top right corner.
4. Click **"Load unpacked"**.
5. Select the directory where you extracted this extension.

## ⚠️ Notes & Limitations

- **Spotify Web Only**: This extension interfaces strictly with `open.spotify.com`. It does not control the native Spotify Desktop application (please close the desktop app to avoid routing conflicts).
- **Incognito Support**: To use the extension in private browsing, you must manually enable it by navigating to `chrome://extensions`, finding the extension, clicking "Details", and toggling "Allow in Incognito".

## 💻 Technical Architecture
- **ES6 Modularization**: The codebase utilizes a modern, modular architecture (`popup.js` for orchestration, `ui.js` for DOM manipulation, and `spotify-api.js` for isolated web scraping and script injection).
- **Clean Code Principles**: Highly readable, single-responsibility helper functions strictly govern state management and UI updates.
- **Safe Execution**: Proactive safeguarding against unhandled exceptions, race conditions, and native API failures.

---

**Contact**: ronen.developer.2@gmail.com

*If you enjoy this extension, please consider leaving a review on the [Chrome Web Store](https://chromewebstore.google.com/detail/spotify-playback-controll/khdhaehfdiihogeaaiomiamjdhcihmji/reviews).*
