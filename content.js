// Content script for Spotify Playback Controller
// Enhanced script with better element detection and control

(function() {
    'use strict';
    
    let lastTrackInfo = { title: '', artist: '', playing: false };
    let observers = [];
    
    // Enhanced element selectors for different Spotify layouts
    const SELECTORS = {
        volume: [
            '[data-testid="volume-bar-slider"]',
            'input[type="range"][step="0.1"]',
            '.volume-bar input[type="range"]',
            '[aria-label*="volume" i]'
        ],
        playPause: [
            '[data-testid="control-button-playpause"]',
            '.player-controls__buttons button[aria-label*="Pause"]',
            '.player-controls__buttons button[aria-label*="Play"]',
            '.control-button[aria-label*="Play"]',
            '.control-button[aria-label*="Pause"]'
        ],
        nextTrack: [
            '[data-testid="control-button-skip-forward"]',
            '.player-controls__buttons button[aria-label*="Next"]',
            '.control-button[aria-label*="Next"]'
        ],
        prevTrack: [
            '[data-testid="control-button-skip-back"]',
            '.player-controls__buttons button[aria-label*="Previous"]',
            '.control-button[aria-label*="Previous"]'
        ],
        trackTitle: [
            '[data-testid="now-playing-widget"] a[dir="auto"]',
            '.now-playing .track-info__name a',
            '[data-testid="context-item-link"]',
            '.Root__now-playing-bar .track-info__name a'
        ],
        trackArtist: [
            '[data-testid="now-playing-widget"] span[dir="auto"]:not(a)',
            '.now-playing .track-info__artists a',
            '.Root__now-playing-bar .track-info__artists a'
        ]
    };
    
    // Find element using multiple selectors
    function findElement(selectorGroup) {
        for (const selector of SELECTORS[selectorGroup] || []) {
            const element = document.querySelector(selector);
            if (element) return element;
        }
        return null;
    }
    
    // Enhanced volume control
    function setVolume(volume) {
        const volumeSlider = findElement('volume');
        if (!volumeSlider) {
            console.log('Spotify Playback Controller: Volume slider not found');
            return false;
        }
        
        const normalizedVolume = Math.max(0, Math.min(1, volume / 100));
        volumeSlider.value = normalizedVolume;
        
        // Trigger comprehensive events
        const events = [
            new Event('input', { bubbles: true }),
            new Event('change', { bubbles: true }),
            new MouseEvent('mousedown', { bubbles: true }),
            new MouseEvent('mouseup', { bubbles: true }),
            new Event('blur', { bubbles: true })
        ];
        
        events.forEach(event => volumeSlider.dispatchEvent(event));
        
        console.log(`Spotify Playback Controller: Volume set to ${Math.round(volume)}%`);
        return true;
    }
    
    // Get current volume
    function getCurrentVolume() {
        const volumeSlider = findElement('volume');
        return volumeSlider ? parseFloat(volumeSlider.value) * 100 : null;
    }
    
    // Control playback
    function controlPlayback(action) {
        let button;
        
        switch (action) {
            case 'play-pause':
                button = findElement('playPause');
                break;
            case 'next':
                button = findElement('nextTrack');
                break;
            case 'prev':
                button = findElement('prevTrack');
                break;
        }
        
        if (button && !button.disabled) {
            button.click();
            console.log(`Spotify Playback Controller: ${action} executed`);
            return true;
        }
        
        console.log(`Spotify Playback Controller: ${action} button not found or disabled`);
        return false;
    }
    
    // Get current track information
    function getTrackInfo() {
        const titleElement = findElement('trackTitle');
        const artistElement = findElement('trackArtist');
        const playButton = findElement('playPause');
        
        const title = titleElement ? titleElement.textContent.trim() : 'No track playing';
        const artist = artistElement ? artistElement.textContent.trim() : 'Unknown artist';
        
        let playing = false;
        if (playButton) {
            const ariaLabel = playButton.getAttribute('aria-label') || '';
            playing = ariaLabel.toLowerCase().includes('pause');
        }
        
        return { title, artist, playing };
    }
    
    // Enhanced message listener
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        try {
            switch (request.action) {
                case 'setVolume':
                    const volumeSuccess = setVolume(request.volume);
                    sendResponse({ success: volumeSuccess });
                    break;
                    
                case 'getVolume':
                    const currentVol = getCurrentVolume();
                    sendResponse({ 
                        volume: currentVol, 
                        success: currentVol !== null 
                    });
                    break;
                    
                case 'playback':
                    const playbackSuccess = controlPlayback(request.command);
                    sendResponse({ success: playbackSuccess });
                    break;
                    
                case 'getTrackInfo':
                    const trackInfo = getTrackInfo();
                    sendResponse({ ...trackInfo, success: true });
                    break;
                    
                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Spotify Playback Controller Error:', error);
            sendResponse({ success: false, error: error.message });
        }
    });
    
    // Monitor for DOM changes and track updates
    function setupObservers() {
        // Clean up existing observers
        observers.forEach(observer => observer.disconnect());
        observers = [];
        
        // Observer for track changes
        const trackObserver = new MutationObserver(() => {
            const currentTrack = getTrackInfo();
            
            // Check if track info has changed
            if (currentTrack.title !== lastTrackInfo.title || 
                currentTrack.artist !== lastTrackInfo.artist ||
                currentTrack.playing !== lastTrackInfo.playing) {
                
                lastTrackInfo = currentTrack;
                
                // Notify background script of track change
                try {
                    chrome.runtime.sendMessage({
                        type: 'trackUpdate',
                        trackInfo: currentTrack
                    }).catch(err => {
                        // Ignore errors if background script isn't listening
                        console.log('Background script not available:', err.message);
                    });
                } catch (error) {
                    console.log('Error sending track update:', error.message);
                }
                
                console.log('Spotify Playback Controller: Track updated -', currentTrack);
            }
        });
        
        // Observe the now-playing area for changes
        const nowPlayingContainer = document.querySelector('[data-testid="now-playing-widget"]') ||
                                  document.querySelector('.now-playing') ||
                                  document.querySelector('.Root__now-playing-bar');
        
        if (nowPlayingContainer) {
            trackObserver.observe(nowPlayingContainer, {
                childList: true,
                subtree: true,
                characterData: true
            });
            observers.push(trackObserver);
        }
        
        // Observer for player controls area
        const controlsObserver = new MutationObserver(() => {
            // Re-check track info when controls change
            setTimeout(() => {
                const currentTrack = getTrackInfo();
                if (currentTrack.playing !== lastTrackInfo.playing) {
                    lastTrackInfo = currentTrack;
                    
                    try {
                        chrome.runtime.sendMessage({
                            type: 'playbackStateChange',
                            playing: currentTrack.playing
                        }).catch(err => {
                            console.log('Background script not available:', err.message);
                        });
                    } catch (error) {
                        console.log('Error sending playback state:', error.message);
                    }
                }
            }, 100);
        });
        
        const controlsContainer = document.querySelector('[data-testid="player-controls"]') ||
                                document.querySelector('.player-controls') ||
                                document.querySelector('.Root__now-playing-bar');
        
        if (controlsContainer) {
            controlsObserver.observe(controlsContainer, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['aria-label', 'disabled', 'class']
            });
            observers.push(controlsObserver);
        }
    }
    
    // Initialize when DOM is ready
    function initialize() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(setupObservers, 1000); // Give Spotify time to load
            });
        } else {
            setTimeout(setupObservers, 1000);
        }
        
        // Also set up observers when the page changes (SPA navigation)
        let lastUrl = location.href;
        new MutationObserver(() => {
            const currentUrl = location.href;
            if (currentUrl !== lastUrl) {
                lastUrl = currentUrl;
                setTimeout(setupObservers, 2000); // Give more time for SPA navigation
            }
        }).observe(document, { subtree: true, childList: true });
        
        console.log('Spotify Playback Controller: Content script initialized');
    }
    
    // Utility function to wait for elements to appear
    function waitForElement(selectorGroup, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const element = findElement(selectorGroup);
            if (element) {
                resolve(element);
                return;
            }
            
            const observer = new MutationObserver(() => {
                const element = findElement(selectorGroup);
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element not found within ${timeout}ms`));
            }, timeout);
        });
    }
    
    // Clean up function
    function cleanup() {
        observers.forEach(observer => observer.disconnect());
        observers = [];
    }
    
    // Handle page unload
    window.addEventListener('beforeunload', cleanup);
    
    // Initialize the extension
    initialize();
    
    // Expose some functions for debugging
    if (typeof window !== 'undefined') {
        window.spotifyController = {
            getTrackInfo,
            setVolume,
            getCurrentVolume,
            controlPlayback,
            findElement,
            SELECTORS
        };
    }
    
})();