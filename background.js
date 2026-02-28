// Background script for Spotify Playback Controller

// --- Tab Helpers ---
async function getSpotifyTab() {
    const tabs = await chrome.tabs.query({ url: "*://open.spotify.com/*" });
    return tabs[0];
}

async function executeOnSpotify(tabId, func, args = [], world = 'ISOLATED') {
    try {
        const result = await chrome.scripting.executeScript({
            target: { tabId },
            func,
            args,
            world
        });
        return result[0]?.result;
    } catch (error) {
        console.error('Error executing script on Spotify tab:', error);
        return null;
    }
}

// --- Injected Functions (Run in context of Spotify page) ---

function injectedPlaybackCommand(cmd) {
    const SELECTORS = {
        'play-pause': '[data-testid="control-button-playpause"]',
        'pause': '[data-testid="control-button-playpause"]',
        'next': '[data-testid="control-button-skip-forward"]',
        'prev': '[data-testid="control-button-skip-back"]'
    };

    const MESSAGES = {
        'play-pause': 'Toggled play/pause',
        'next': 'Skipped to next track',
        'prev': 'Went to previous track'
    };

    const selector = SELECTORS[cmd];
    if (!selector) return { success: false, command: cmd, message: 'Unknown command' };

    const button = document.querySelector(selector);
    if (!button || button.disabled) {
        return { success: false, command: cmd, message: 'Command not available' };
    }

    // Special logic for forced pause
    if (cmd === 'pause') {
        const isPlaying = button.getAttribute('aria-label')?.toLowerCase().includes('pause');
        if (isPlaying) {
            button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            button.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
            button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
            button.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
            button.click();
            return { success: true, command: cmd, message: 'Paused playback' };
        }
        return { success: false, command: cmd, message: 'Already paused' };
    }

    button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    button.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    button.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    button.click();
    return { success: true, command: cmd, message: MESSAGES[cmd] };
}

function injectedVolumeCommand(cmd) {
    const VOLUME_SELECTORS = [
        '[data-testid="volume-bar-slider"]',
        'input[type="range"][step="0.1"]',
        '.volume-bar input',
        '[aria-label*="volume" i]'
    ];

    let volumeSlider = null;
    for (const selector of VOLUME_SELECTORS) {
        volumeSlider = document.querySelector(selector);
        if (volumeSlider) break;
    }

    if (!volumeSlider) return { success: false };

    const currentVolume = parseFloat(volumeSlider.value) * 100;
    const volumeStep = cmd === 'volume-up' ? 5 : -5;
    const newVolume = Math.min(100, Math.max(0, currentVolume + volumeStep));

    volumeSlider.value = newVolume / 100;

    const EVENTS_TO_DISPATCH = ['input', 'change', 'mouseup'];
    EVENTS_TO_DISPATCH.forEach(eventType => {
        volumeSlider.dispatchEvent(new Event(eventType, { bubbles: true }));
    });

    return { success: true, volume: newVolume };
}

function injectedMediaSessionSetup() {
    if (!('mediaSession' in navigator)) return;

    const findAndClick = (selector, condition = () => true) => {
        const btn = document.querySelector(selector);
        if (btn && condition(btn)) btn.click();
    };

    const PLAY_PAUSE_SELECTOR = '[data-testid="control-button-playpause"]';

    navigator.mediaSession.setActionHandler('play', () => {
        findAndClick(PLAY_PAUSE_SELECTOR, btn => btn.getAttribute('aria-label')?.includes('Play'));
    });

    navigator.mediaSession.setActionHandler('pause', () => {
        findAndClick(PLAY_PAUSE_SELECTOR, btn => btn.getAttribute('aria-label')?.includes('Pause'));
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
        findAndClick('[data-testid="control-button-skip-forward"]');
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
        findAndClick('[data-testid="control-button-skip-back"]');
    });

    console.log('Media session handlers registered');
}

// --- Event Handlers ---

async function handleKeyboardCommand(command) {
    const spotifyTab = await getSpotifyTab();
    if (!spotifyTab) {
        console.log('No Spotify tab found');
        return;
    }

    const commandMap = {
        'play-pause': 'play-pause',
        'next-track': 'next',
        'prev-track': 'prev',
        'pause': 'pause'
    };

    const playbackCommand = commandMap[command];

    if (playbackCommand) {
        const response = await executeOnSpotify(spotifyTab.id, injectedPlaybackCommand, [playbackCommand]);
        if (response?.message) {
            console.log(response.message);
        }
    } else if (['volume-up', 'volume-down'].includes(command)) {
        await executeOnSpotify(spotifyTab.id, injectedVolumeCommand, [command]);
    }
}

async function setupMediaSessionOnTabUpdate(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url?.includes('open.spotify.com')) {
        await executeOnSpotify(tabId, injectedMediaSessionSetup, [], 'MAIN');
    }
}

function handleExtensionInstallOrUpdate(details) {
    console.log('onInstalled event:', details);
    if (details.reason === 'install') {
        chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
    }
}

// --- Listener Initialization ---
chrome.commands.onCommand.addListener(handleKeyboardCommand);
chrome.tabs.onUpdated.addListener(setupMediaSessionOnTabUpdate);
chrome.runtime.onInstalled.addListener(handleExtensionInstallOrUpdate);
chrome.runtime.onSuspend.addListener(() => console.log('Spotify Playback Controller suspended'));

// Set uninstall URL to open a survey or goodbye page
chrome.runtime.setUninstallURL("https://lumie.click/uninstall_spotify_extension");