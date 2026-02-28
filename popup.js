console.log("Popup script loaded");

import {
    SPOTIFY_SELECTORS,
    injectedSetSpotifyVolume,
    injectedGetCurrentVolume,
    injectedGetCurrentTrackInfo,
    injectedSeekTo,
    injectedControlPlayback,
    injectedSetupObserver
} from './spotify-api.js';

import {
    UI,
    state,
    showNotification,
    updateVolumeDisplay,
    updatePlayPauseButton,
    updateTrackDisplay
} from './ui.js';

async function getSpotifyTab() {
    const tabs = await chrome.tabs.query({ url: "*://open.spotify.com/*" });
    const spotifyTab = tabs[0];
    state.currentSpotifyTab = spotifyTab;
    return spotifyTab;
}

async function ensureSpotifyTabLoaded() {
    const spotifyTab = await getSpotifyTab();
    if (spotifyTab) return spotifyTab;

    try {
        const newTab = await chrome.tabs.create({ url: 'https://open.spotify.com' });
        state.currentSpotifyTab = newTab;

        await new Promise(resolve => {
            let timeoutId;
            const listener = (tabId, info) => {
                if (tabId === newTab.id && info.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);
                    clearTimeout(timeoutId);
                    resolve();
                }
            };
            chrome.tabs.onUpdated.addListener(listener);
            timeoutId = setTimeout(() => {
                chrome.tabs.onUpdated.removeListener(listener);
                resolve();
            }, 5000);
        });
        return newTab;
    } catch (error) {
        console.error('Error opening Spotify tab:', error);
        return null;
    }
}

async function executeOnSpotify(func, args = []) {
    try {
        const spotifyTab = state.currentSpotifyTab || await getSpotifyTab();
        if (!spotifyTab) return null;

        const result = await chrome.scripting.executeScript({
            target: { tabId: spotifyTab.id },
            func: func,
            args: args
        });
        return result[0]?.result;
    } catch (error) {
        console.error('Error executing script:', error);
        state.currentSpotifyTab = null;
        return null;
    }
}

async function setSpotifyVolume(volume) {
    const result = await executeOnSpotify(injectedSetSpotifyVolume, [volume, SPOTIFY_SELECTORS.volume]);
    if (result?.success) updateVolumeDisplay(volume);
    else console.error("Failed to set Spotify volume:", result?.error);
}

async function getCurrentVolume() {
    const result = await executeOnSpotify(injectedGetCurrentVolume, [SPOTIFY_SELECTORS.volume]);
    if (result !== null) updateVolumeDisplay(result);
}

async function getCurrentTrackInfo() {
    const result = await executeOnSpotify(injectedGetCurrentTrackInfo, [SPOTIFY_SELECTORS]);
    updateTrackDisplay(result);
}

async function controlPlayback(action) {
    const spotifyTab = await ensureSpotifyTabLoaded();
    if (!spotifyTab) return;

    const result = await executeOnSpotify(injectedControlPlayback, [action, SPOTIFY_SELECTORS.playbackActions]);
    if (result?.success) setTimeout(getCurrentTrackInfo, 500);
}

async function seekSpotifyTrack(val) {
    await executeOnSpotify(injectedSeekTo, [val, SPOTIFY_SELECTORS]);
    setTimeout(getCurrentTrackInfo, 200);
}

async function checkInstallReminder() {
    return new Promise(resolve => {
        chrome.storage.local.get(['hasSeenDesktopReminder'], (result) => {
            if (chrome.runtime.lastError) {
                console.warn('Storage error:', chrome.runtime.lastError);
                return resolve();
            }
            if (!result || !result.hasSeenDesktopReminder) {
                showNotification('💡 Remember to close Spotify Desktop for best experience!', 6000);
                chrome.storage.local.set({ hasSeenDesktopReminder: true });
            }
            resolve();
        });
    });
}

function setupVolumeControls() {
    if (!UI.volumeSlider) return;

    UI.volumeSlider.addEventListener('input', (e) => {
        const volume = parseFloat(e.target.value);
        updateVolumeDisplay(volume);
        setSpotifyVolume(volume);
    });

    if (UI.volumeSlider.parentElement) {
        UI.volumeSlider.parentElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            const step = 4;
            const delta = e.deltaY < 0 ? step : -step;
            const newVolume = Math.max(0, Math.min(100, parseInt(UI.volumeSlider.value) + delta));
            updateVolumeDisplay(newVolume);
            setSpotifyVolume(newVolume);
        });
    }

    if (UI.muteToggleBtn) {
        UI.muteToggleBtn.addEventListener('click', () => {
            if (!state.isMuted && state.currentVolume > 0) {
                state.lastVolumeBeforeMute = state.currentVolume;
                setSpotifyVolume(0);
            } else {
                setSpotifyVolume(state.lastVolumeBeforeMute > 0 ? state.lastVolumeBeforeMute : 50);
            }
        });
    }
}

function setupProgressControls() {
    if (!UI.progressSlider) return;

    UI.progressSlider.addEventListener('mousedown', () => state.isDraggingProgress = true);

    UI.progressSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        const max = parseFloat(e.target.max);
        const percent = max > 0 ? (val / max) * 100 : 0;
        UI.progressSlider.style.setProperty('--val', percent + '%');
    });

    UI.progressSlider.addEventListener('change', (e) => {
        state.isDraggingProgress = false;
        seekSpotifyTrack(parseFloat(e.target.value));
    });
}

function setupPlaybackControls() {
    if (UI.playPauseBtn) UI.playPauseBtn.addEventListener('click', () => controlPlayback('play-pause'));
    if (UI.prevBtn) UI.prevBtn.addEventListener('click', () => controlPlayback('prev'));
    if (UI.nextBtn) UI.nextBtn.addEventListener('click', () => controlPlayback('next'));
    if (UI.shuffleBtn) UI.shuffleBtn.addEventListener('click', () => controlPlayback('shuffle'));
    if (UI.repeatBtn) UI.repeatBtn.addEventListener('click', () => controlPlayback('repeat'));
}

function setupUtilityControls() {
    if (!UI.readMeBtn) return;
    UI.readMeBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
    });
}

function setupEventListeners() {
    setupVolumeControls();
    setupProgressControls();
    setupPlaybackControls();
    setupUtilityControls();
}

document.addEventListener('DOMContentLoaded', async () => {
    Object.assign(UI, {
        volumeSlider: document.getElementById('volumeSlider'),
        volumeValue: document.getElementById('volumeValue'),
        progressSlider: document.getElementById('progressSlider'),
        albumArt: document.getElementById('albumArt'),
        bgBlur: document.getElementById('bgBlur'),
        trackTitle: document.getElementById('trackTitle'),
        titleWrapper: document.querySelector('.title-wrapper'),
        trackArtist: document.getElementById('trackArtist'),
        playPauseBtn: document.getElementById('playPauseBtn'),
        prevBtn: document.getElementById('prevBtn'),
        nextBtn: document.getElementById('nextBtn'),
        shuffleBtn: document.getElementById('shuffleBtn'),
        repeatBtn: document.getElementById('repeatBtn'),
        likeBtn: document.getElementById('likeBtn'),
        trackPosition: document.getElementById('trackPosition'),
        trackDuration: document.getElementById('trackDuration'),
        muteToggleBtn: document.getElementById('muteToggleBtn'),
        readMeBtn: document.getElementById('readMeBtn'),
        notification: document.getElementById('notification'),
        muteIconSVG: document.getElementById('muteIconSVG'),
        playIcon: document.getElementById('playIcon'),
        pauseIcon: document.getElementById('pauseIcon')
    });

    setupEventListeners();

    await checkInstallReminder();

    const spotifyTab = await getSpotifyTab();
    if (spotifyTab) {
        await executeOnSpotify(injectedSetupObserver, []);
        chrome.runtime.onMessage.addListener((request) => {
            if (request.type === 'SPOTIFY_DOM_MUTATED') {
                getCurrentTrackInfo();
            }
        });
        await getCurrentVolume();
        await getCurrentTrackInfo();
    }
});