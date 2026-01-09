console.log("Popup script loaded");

document.addEventListener('DOMContentLoaded', async () => {
    // UI Elements
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeValue = document.getElementById('volumeValue');
    const trackTitle = document.getElementById('trackTitle');
    const trackArtist = document.getElementById('trackArtist');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const likeBtn = document.getElementById('likeBtn');
    const muteToggleBtn = document.getElementById('muteToggleBtn');
    const readMeBtn = document.getElementById('readMeBtn');
    const notification = document.getElementById('notification');
    
    // State variables
    let currentVolume = 50;
    let isPlaying = false;
    let currentSpotifyTab = null;
    let isMuted = false;
    let lastVolumeBeforeMute = 50;
    
    // Show notification function
    function showNotification(message, duration = 3000) {
        notification.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, duration);
    }
    
	// Modern SVGs for speaker and mute - white color, properly aligned
	const speakerSVG = `
	  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
		<g transform="translate(1, 2)">
		  <path d="M2 6V10H5L9 14V2L5 6H2Z" fill="white"/>
		  <path d="M11.54 4.46C12.4772 5.39782 13 6.67392 13 8C13 9.3261 12.4772 10.6022 11.54 11.54" stroke="white" stroke-width="2" stroke-linecap="round"/>
		</g>
	  </svg>`;
	const muteSVG = `
	  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
		<g transform="translate(1, 2)">
		  <path d="M2 6V10H5L9 14V2L5 6H2Z" fill="white"/>
		  <line x1="11" y1="4" x2="14" y2="12" stroke="white" stroke-width="2" stroke-linecap="round"/>
		  <line x1="14" y1="4" x2="11" y2="12" stroke="white" stroke-width="2" stroke-linecap="round"/>
		</g>
	  </svg>`;

  
    // Get current Spotify tab
    async function getCurrentSpotifyTab() {
        const tabs = await chrome.tabs.query({});
        const spotifyTab = tabs.find(tab => tab.url && tab.url.includes('open.spotify.com'));
        currentSpotifyTab = spotifyTab;
        return spotifyTab;
    }
    
    // Execute script on Spotify tab
    async function executeOnSpotify(func, args = []) {
        try {
            const spotifyTab = currentSpotifyTab || await getCurrentSpotifyTab();
            if (!spotifyTab) {
                return null;
            }
            
            const result = await chrome.scripting.executeScript({
                target: { tabId: spotifyTab.id },
                func: func,
                args: args
            });
            
            return result[0]?.result;
        } catch (error) {
            console.error('Error executing script:', error);
            return null;
        }
    }
    
    // Update volume display
    function updateVolumeDisplay(volume) {
        volumeSlider.value = volume;
        volumeValue.textContent = Math.round(volume) + '%';
        currentVolume = volume;
        if (volume === 0) {
            document.getElementById('muteIconSVG').innerHTML = muteSVG;
            isMuted = true;
        } else {
            document.getElementById('muteIconSVG').innerHTML = speakerSVG;
            isMuted = false;
        }
    }
    
	// Set volume on Spotify
	async function setSpotifyVolume(volume) {
		const result = await executeOnSpotify((vol) => {
			const volumeSlider = document.querySelector('[data-testid="volume-bar-slider"]') ||
							   document.querySelector('input[type="range"][step="0.1"]') ||
							   document.querySelector('.volume-bar input') ||
							   document.querySelector('[aria-label*="volume" i]');
			if (volumeSlider) {
				const normalizedVol = vol / 100;
				volumeSlider.value = normalizedVol;
				const events = ['input', 'change', 'mouseup'];
				events.forEach(eventType => {
					const event = new Event(eventType, { bubbles: true });
					volumeSlider.dispatchEvent(event);
				});
				return { success: true, volume: vol };
			}
			return { success: false, error: 'Volume control not found' };
		}, [volume]); // Pass 'volume' from setSpotifyVolume as an argument 'vol' to the injected function

		if (result?.success) {
			updateVolumeDisplay(volume); // Assuming this function updates your popup UI
		} else {
			console.error("Failed to set Spotify volume:", result?.error);
		}
	}
    
	// Get current volume from Spotify
	async function getCurrentVolume() {
		const result = await executeOnSpotify(() => {
			const volumeSlider = document.querySelector('[data-testid="volume-bar-slider"]') ||
							   document.querySelector('input[type="range"][step="0.1"]') ||
							   document.querySelector('.volume-bar input') ||
							   document.querySelector('[aria-label*="volume" i]');
			
			if (volumeSlider) {
				return parseFloat(volumeSlider.value) * 100;
			}
			return null;
		});
		
		if (result !== null) {
			updateVolumeDisplay(result);
		}
	}
    
    // Get current track info and playback state
    async function getCurrentTrackInfo() {
        const result = await executeOnSpotify(() => {

        // Try multiple selectors for track info

		const titleSelectors = [
            // Primary Spotify Web Player selectors
            '[data-testid="context-item-info-title"]',
            
            // Generic fallbacks
            '.track-info a[title]',
            '[class*="now-playing"] [class*="title"] a',
        ];
        
        
        // Comprehensive selectors for track artist
        const artistSelectors = [
            // Primary artist selectors
            '[data-testid="context-item-info-artist"]',
            '[data-testid="now-playing-widget"] [class*="artist"] a',
            
            // Main artist info selectors
            '.now-playing .track-info__artists a',
            '.now-playing-bar .track-info__artists a',
            '.Root__now-playing-bar .now-playing .track-info .track-info__artists a',
            
            // Alternative artist selectors
            '.player-bar .track-info .artists a',
            '.now-playing .artist-name a',
            '.playback-bar .track-info .artist a',
            '.track-info .artist a',
            
            // Compound artist selectors (multiple artists)
            '.now-playing .track-info__artists',
            '.track-info .artists',
            '[class*="artist"][class*="info"]',
            
            // Generic artist fallbacks
            '[class*="track"][class*="artist"] a',
            '[class*="now-playing"] [class*="artist"] a',
            '.track-info span:not([class*="name"]):not([class*="title"])',
        ];
            
            const playButtonSelectors = [
                '[data-testid=\"control-button-playpause\"]',
                '.player-controls__buttons button[aria-label*=\"Pause\"], .player-controls__buttons button[aria-label*=\"Play\"]',
                '.control-button[aria-label*=\"Pause\"], .control-button[aria-label*=\"Play\"]'
            ];
            
            let title = 'No track playing';
            let artist = 'Unknown artist';
            let playing = false;
            
            // Get track title
            for (const selector of titleSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                    title = element.textContent.trim();
                    break;
                }
            }
            
            // Get artist
            for (const selector of artistSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                    artist = element.textContent.trim();
                    break;
                }
            }
            
            // Get play state
            for (const selector of playButtonSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                    const ariaLabel = element.getAttribute('aria-label') || '';
                    playing = ariaLabel.toLowerCase().includes('pause');
                    break;
                }
            }
            
            return { title, artist, playing };
        });
        
        if (result) {
            trackTitle.textContent = result.title;
            trackArtist.textContent = result.artist;
            isPlaying = result.playing;
            updatePlayPauseButton();
        }
    }
    
    // Update play/pause button
    function updatePlayPauseButton() {
        // Toggle SVG play/pause icons
        const playIcon = document.querySelector('#playIcon');
        const pauseIcon = document.querySelector('#pauseIcon');
        if (isPlaying) {
            if (playIcon) playIcon.style.display = 'none';
            if (pauseIcon) pauseIcon.style.display = 'block';
            playPauseBtn.title = 'Pause';
        } else {
            if (playIcon) playIcon.style.display = 'block';
            if (pauseIcon) pauseIcon.style.display = 'none';
            playPauseBtn.title = 'Play';
        }
    }
    
    // Control playback
    async function controlPlayback(action) {
        // First check if we have a Spotify tab
        const spotifyTab = await getCurrentSpotifyTab();
        
        if (!spotifyTab) {
            // No Spotify tab found, open a new one
            try {
                const newTab = await chrome.tabs.create({ url: 'https://open.spotify.com' });
                currentSpotifyTab = newTab;
                
                // Wait for the tab to load
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                console.error('Error opening Spotify tab:', error);
                return;
            }
        }

        const result = await executeOnSpotify((actionType) => {
            let selector = '';
            let buttonText = '';
            
            switch (actionType) {
                case 'play-pause':
                    selector = '[data-testid="control-button-playpause"]';
                    buttonText = 'play/pause';
                    break;
                case 'next':
                    selector = '[data-testid="control-button-skip-forward"]';
                    buttonText = 'next track';
                    break;
                case 'prev':
                    selector = '[data-testid="control-button-skip-back"]';
                    buttonText = 'previous track';
                    break;
            }
            
            const button = document.querySelector(selector);
            if (button && !button.disabled) {
                button.click();
                return { success: true, action: buttonText };
            }
            
            return { success: false, error: `${buttonText} button not found or disabled` };
        }, [action]);
        
        if (result?.success) {
            // Update track info after a short delay
            setTimeout(getCurrentTrackInfo, 500);
        }
    }
    
    // Like track function
    async function likeTrack() {
        const result = await executeOnSpotify(() => {
            // First check if the track is already liked
            const likeButton = document.querySelector('button[aria-label="Add to Liked Songs"]');
            const likedButton = document.querySelector('button[aria-checked="true"][aria-label="Add to playlist"]');
            
            if (likedButton) {
                // Track is already liked
                return { success: true, alreadyLiked: true, message: 'Track is already in Liked Songs' };
            }
            
            if (likeButton && !likeButton.disabled) {
                likeButton.click();
                return { success: true, alreadyLiked: false, message: 'Track added to liked songs' };
            }
            
            return { success: false, error: 'Like button not found or disabled' };
        });
        
        if (result?.success) {
            if (result.alreadyLiked) {
                console.log(result.message);
                showNotification('❤️ Already in Liked Songs!');
            } else {
                console.log(result.message);
                showNotification('❤️ Added to Liked Songs!');
            }
        } else {
            console.error('Failed to like track:', result?.error);
            showNotification('❌ Could not add to Liked Songs');
        }
    }
    
    // Initialize extension
    async function initialize() {
        const spotifyTab = await getCurrentSpotifyTab();
        if (!spotifyTab) {
            return;
        }
        
        // Check if this is the first time and show reminder
        chrome.storage.local.get(['hasSeenDesktopReminder'], (result) => {
            if (!result.hasSeenDesktopReminder) {
                showNotification('💡 Remember to close Spotify Desktop for best experience!', 6000);
                chrome.storage.local.set({ hasSeenDesktopReminder: true });
            }
        });
        
        // Get initial state
        await getCurrentVolume();
        await getCurrentTrackInfo();
        
        // Refresh track info periodically
        setInterval(getCurrentTrackInfo, 2000);
    }
    
    // Event Listeners
    
    // Volume slider
    volumeSlider.addEventListener('input', (e) => {
        const volume = parseFloat(e.target.value);
        updateVolumeDisplay(volume);
        setSpotifyVolume(volume);
    });
    
    // Mouse wheel scroll on volume bar to change volume
    volumeSlider.addEventListener('wheel', (e) => {
        e.preventDefault();
        let step = 4;
        let delta = e.deltaY < 0 ? step : -step;
        let newVolume = Math.max(0, Math.min(100, parseInt(volumeSlider.value) + delta));
        updateVolumeDisplay(newVolume);
        setSpotifyVolume(newVolume);
    });
    
    // Playback controls
    playPauseBtn.addEventListener('click', () => {
        controlPlayback('play-pause');
    });
    
    prevBtn.addEventListener('click', () => {
        controlPlayback('prev');
    });
    
    nextBtn.addEventListener('click', () => {
        controlPlayback('next');
    });
    
    // Like button
    likeBtn.addEventListener('click', () => {
        likeTrack();
    });
    
    // Mute/Unmute button logic
    muteToggleBtn.addEventListener('click', () => {
        if (!isMuted && currentVolume > 0) {
            lastVolumeBeforeMute = currentVolume;
            setSpotifyVolume(0);
        } else {
            setSpotifyVolume(lastVolumeBeforeMute > 0 ? lastVolumeBeforeMute : 50);
        }
    });
    
    // Read Me button
    if (readMeBtn) {
        readMeBtn.addEventListener('click', function() {
            console.log("Read Me button clicked");
            chrome.tabs.create({ url: chrome.runtime.getURL('description_popup.html') });
        });
    }
    
    // Initialize the extension
    await initialize();
});