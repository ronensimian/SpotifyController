export const SPOTIFY_SELECTORS = {
    volume: [
        '[data-testid="volume-bar-slider"]',
        'input[type="range"][step="0.1"]',
        '.volume-bar input',
        '[aria-label*="volume" i]'
    ],
    title: [
        '[data-testid="context-item-info-title"]',
        '.track-info a[title]',
        '[class*="now-playing"] [class*="title"] a'
    ],
    artist: [
        '[data-testid="context-item-info-artist"]',
        '[data-testid="now-playing-widget"] [class*="artist"] a',
        '.now-playing .track-info__artists a',
        '.now-playing-bar .track-info__artists a',
        '.track-info .artist a',
        '.track-info .artists',
        '.now-playing .artist-name a',
        '[class*="track"][class*="artist"] a'
    ],
    playPauseBtn: [
        '[data-testid="control-button-playpause"]',
        '.player-controls__buttons button[aria-label*="Pause"], .player-controls__buttons button[aria-label*="Play"]',
        '.control-button[aria-label*="Pause"], .control-button[aria-label*="Play"]'
    ],
    playbackActions: {
        'play-pause': '[data-testid="control-button-playpause"]',
        'next': '[data-testid="control-button-skip-forward"]',
        'prev': '[data-testid="control-button-skip-back"]',
        'shuffle': '[data-testid="control-button-shuffle"], button[aria-label*="Shuffle"]',
        'repeat': '[data-testid="control-button-repeat"], button[aria-label*="Repeat"]'
    },
    albumArt: '[data-testid="cover-art-image"]',
    duration: '[data-testid="playback-duration"]',
    position: '[data-testid="playback-position"]',
    progressInput: '[data-testid="playback-progressbar"] input[type="range"]',
    likeBtn: 'button[aria-label="Add to Liked Songs"]',
    likedBtn: 'button[aria-checked="true"][aria-label="Add to playlist"]',
    shuffleBtn: '[data-testid="control-button-shuffle"], button[aria-label*="Shuffle"]',
    repeatBtn: '[data-testid="control-button-repeat"], button[aria-label*="Repeat"]'
};

export function injectedSetSpotifyVolume(vol, selectors) {
    let volumeSlider = null;
    for (const selector of selectors) {
        volumeSlider = document.querySelector(selector);
        if (volumeSlider) break;
    }

    if (volumeSlider) {
        volumeSlider.value = vol / 100;
        ['input', 'change', 'mouseup'].forEach(eventType => {
            volumeSlider.dispatchEvent(new Event(eventType, { bubbles: true }));
        });
        return { success: true, volume: vol };
    }
    return { success: false, error: 'Volume control not found' };
}

export function injectedGetCurrentVolume(selectors) {
    for (const selector of selectors) {
        const slider = document.querySelector(selector);
        if (slider) return parseFloat(slider.value) * 100;
    }
    return null;
}

export function injectedGetCurrentTrackInfo(selectors) {
    function getFirstText(selArray) {
        for (const sel of selArray) {
            const el = document.querySelector(sel);
            if (el) return el.textContent.trim();
        }
        return null;
    }

    function getTrackDetails() {
        const title = getFirstText(selectors.title) || 'No track playing';
        const artist = getFirstText(selectors.artist) || 'Unknown artist';
        const positionNode = document.querySelector(selectors.position);
        const durationNode = document.querySelector(selectors.duration);
        const position = positionNode ? positionNode.textContent.trim() : '--:--';
        const duration = durationNode ? durationNode.textContent.trim() : '--:--';
        return { title, artist, position, duration };
    }

    function getAlbumArt() {
        const artNode = document.querySelector(selectors.albumArt);
        let artSrc = artNode ? artNode.getAttribute('src') : null;
        if (artSrc) {
            artSrc = artSrc.replace('1e02', 'b273').replace('4851', 'b273');
        }
        return artSrc;
    }

    function getProgress() {
        const progressNode = document.querySelector(selectors.progressInput);
        const progressVal = progressNode ? parseFloat(progressNode.value) : 0;
        const progressMax = progressNode ? parseFloat(progressNode.max) : 100;
        return { progressVal, progressMax };
    }

    function getPlayingState() {
        const mediaElem = document.querySelector('video, audio');
        if (mediaElem) {
            return !mediaElem.ended && !mediaElem.paused;
        }
        for (const selector of selectors.playPauseBtn) {
            const btn = document.querySelector(selector);
            if (btn) {
                const label = (btn.getAttribute('aria-label') || '').toLowerCase();
                return label.includes('pause') || label.includes('pausa');
            }
        }
        return false;
    }

    function getShuffleState() {
        const shuffleNode = document.querySelector(selectors.shuffleBtn);
        if (!shuffleNode) return 'false';

        const ariaChecked = shuffleNode.getAttribute('aria-checked');
        if (ariaChecked) return ariaChecked;

        const ariaLabel = (shuffleNode.getAttribute('aria-label') || '').toLowerCase();
        if (ariaLabel.includes('disable smart shuffle')) return 'mixed';
        if (ariaLabel.includes('enable smart shuffle') || ariaLabel.includes('disable shuffle')) return 'true';
        return 'false';
    }

    function getRepeatState() {
        const repeatNode = document.querySelector(selectors.repeatBtn);
        return repeatNode ? repeatNode.getAttribute('aria-checked') : 'false';
    }

    function getIsLiked() {
        return !!document.querySelector(selectors.likedBtn);
    }

    const { title, artist, position, duration } = getTrackDetails();
    const artSrc = getAlbumArt();
    const { progressVal, progressMax } = getProgress();
    const playing = getPlayingState();
    const shuffleState = getShuffleState();
    const repeatState = getRepeatState();
    const isLiked = getIsLiked();

    return {
        title, artist, playing, position: position, duration: duration,
        artSrc, progressVal, progressMax, shuffleState, repeatState, isLiked
    };
}

export function injectedSeekTo(val, selectors) {
    const progressSlider = document.querySelector(selectors.progressInput);
    if (progressSlider) {
        progressSlider.value = val;
        progressSlider.dispatchEvent(new Event('input', { bubbles: true }));
        progressSlider.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        progressSlider.dispatchEvent(new Event('change', { bubbles: true }));
        return { success: true };
    }
    return { success: false, error: 'Progress slider not found' };
}

export function injectedControlPlayback(actionType, selectors) {
    const selector = selectors[actionType];
    if (!selector) return { success: false, error: 'Invalid action' };

    const button = document.querySelector(selector);
    if (button && !button.disabled) {
        button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        button.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        button.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
        button.click();
        return { success: true, action: actionType };
    }

    return { success: false, error: `Button not found or disabled` };
}

export function injectedSetupObserver() {
    if (window.__spotifyObserverInjected) return;
    window.__spotifyObserverInjected = true;

    let timeout;
    const observer = new MutationObserver(() => {
        if (timeout) return;
        timeout = setTimeout(() => {
            timeout = null;
            try {
                chrome.runtime.sendMessage({ type: 'SPOTIFY_DOM_MUTATED' });
            } catch (e) { }
        }, 100);
    });

    const target = document.body;
    if (target) {
        observer.observe(target, { childList: true, subtree: true, attributes: true, characterData: true });
    }
}
