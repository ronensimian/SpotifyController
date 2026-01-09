// Background script for Spotify Playback Controller

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
    // Always find the Spotify tab dynamically
    const tabs = await chrome.tabs.query({});
    const spotifyTab = tabs.find(tab => tab.url && tab.url.includes('open.spotify.com'));
    if (!spotifyTab) {
        console.log('No Spotify tab found');
        return;
    }
    
    let playbackCommand = '';
    switch (command) {
        case 'play-pause':
            playbackCommand = 'play-pause';
            break;
        case 'next-track':
            playbackCommand = 'next';
            break;
        case 'prev-track':
            playbackCommand = 'prev';
            break;
        case 'pause':
            playbackCommand = 'pause';
            break;
    }
    
    if (playbackCommand) {
        try {
            const result = await chrome.scripting.executeScript({
                target: { tabId: spotifyTab.id },
                func: (cmd) => {
                    let button;
                    if (cmd === 'pause') {
                        button = document.querySelector('[data-testid="control-button-playpause"]');
                        if (button && button.getAttribute('aria-label')?.toLowerCase().includes('pause')) {
                            button.click();
                            return { success: true, command: cmd, message: 'Paused playback' };
                        }
                        return { success: false, command: cmd, message: 'Already paused' };
                    } else {
                        switch (cmd) {
                            case 'play-pause':
                                button = document.querySelector('[data-testid="control-button-playpause"]');
                                break;
                            case 'next':
                                button = document.querySelector('[data-testid="control-button-skip-forward"]');
                                break;
                            case 'prev':
                                button = document.querySelector('[data-testid="control-button-skip-back"]');
                                break;
                        }
                        if (button && !button.disabled) {
                            button.click();
                            return { 
                                success: true, 
                                command: cmd,
                                message: cmd === 'play-pause' ? 'Toggled play/pause' :
                                        cmd === 'next' ? 'Skipped to next track' :
                                        'Went to previous track'
                            };
                        }
                        return { 
                            success: false, 
                            command: cmd,
                            message: 'Command not available'
                        };
                    }
                },
                args: [playbackCommand]
            });

            // Log the result instead of sending a message
            const response = result[0]?.result;
            console.log(response.message);
        } catch (error) {
            console.error('Error executing keyboard shortcut:', error);
        }
    } else if (command === 'volume-up' || command === 'volume-down') {
        try {
            await chrome.scripting.executeScript({
                target: { tabId: spotifyTab.id },
                func: (cmd) => {
                    const volumeSlider = document.querySelector('[data-testid="volume-bar-slider"]') ||
                        document.querySelector('input[type="range"][step="0.1"]') ||
                        document.querySelector('.volume-bar input') ||
                        document.querySelector('[aria-label*="volume" i]');
                    if (volumeSlider) {
                        let current = parseFloat(volumeSlider.value) * 100;
                        let newVol = cmd === 'volume-up' ? Math.min(100, current + 5) : Math.max(0, current - 5);
                        volumeSlider.value = newVol / 100;
                        ['input', 'change', 'mouseup'].forEach(eventType => {
                            const event = new Event(eventType, { bubbles: true });
                            volumeSlider.dispatchEvent(event);
                        });
                        return { success: true, volume: newVol };
                    }
                    return { success: false };
                },
                args: [command]
            });
        } catch (error) {
            console.error('Error executing volume shortcut:', error);
        }
    }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'findSpotifyTab':
            chrome.tabs.query({}, (tabs) => {
                const spotifyTab = tabs.find(tab => 
                    tab.url && tab.url.includes('open.spotify.com')
                );
                sendResponse({ tab: spotifyTab });
            });
            return true; // Keep message channel open
            
        case 'trackChanged':
            // Handle track change notifications from content script
            console.log('Track changed:', request.trackInfo);
            break;
            
        case 'volumeChanged':
            // Handle volume change notifications from content script
            console.log('Volume changed:', request.volume);
            break;
            
        default:
            // Forward other messages to appropriate tabs
            if (sender.tab) {
                sendResponse({ received: true });
            }
    }
});

// Optional: Media session integration for system media keys
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && 
        tab.url && tab.url.includes('open.spotify.com')) {
        
        try {
            // Inject media session handler
            await chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: () => {
                    if ('mediaSession' in navigator) {
                        navigator.mediaSession.setActionHandler('play', () => {
                            const playBtn = document.querySelector('[data-testid="control-button-playpause"]');
                            if (playBtn && playBtn.getAttribute('aria-label')?.includes('Play')) {
                                playBtn.click();
                            }
                        });
                        
                        navigator.mediaSession.setActionHandler('pause', () => {
                            const pauseBtn = document.querySelector('[data-testid="control-button-playpause"]');
                            if (pauseBtn && pauseBtn.getAttribute('aria-label')?.includes('Pause')) {
                                pauseBtn.click();
                            }
                        });
                        
                        navigator.mediaSession.setActionHandler('nexttrack', () => {
                            const nextBtn = document.querySelector('[data-testid="control-button-skip-forward"]');
                            if (nextBtn) nextBtn.click();
                        });
                        
                        navigator.mediaSession.setActionHandler('previoustrack', () => {
                            const prevBtn = document.querySelector('[data-testid="control-button-skip-back"]');
                            if (prevBtn) prevBtn.click();
                        });
                        
                        console.log('Media session handlers registered');
                    }
                }
            });
        } catch (error) {
            console.error('Error setting up media session:', error);
        }
    }
});

// Clean up on extension disable/uninstall
chrome.runtime.onSuspend.addListener(() => {
    console.log('Spotify Playback Controller suspended');
});

// Open description_popup.html on install or update
chrome.runtime.onInstalled.addListener((details) => {
    console.log('onInstalled event:', details);
    if (details.reason === 'install' || details.reason === 'update') {
        chrome.tabs.create({ url: chrome.runtime.getURL('description_popup.html') });
    }
});