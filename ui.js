export const SVGS = {
    speaker: `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g transform="translate(1, 2)">
          <path d="M2 6V10H5L9 14V2L5 6H2Z" fill="white"/>
          <path d="M11.54 4.46C12.4772 5.39782 13 6.67392 13 8C13 9.3261 12.4772 10.6022 11.54 11.54" stroke="white" stroke-width="2" stroke-linecap="round"/>
        </g>
      </svg>`,
    mute: `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g transform="translate(1, 2)">
          <path d="M2 6V10H5L9 14V2L5 6H2Z" fill="white"/>
          <line x1="11" y1="4" x2="14" y2="12" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <line x1="14" y1="4" x2="11" y2="12" stroke="white" stroke-width="2" stroke-linecap="round"/>
        </g>
      </svg>`
};

export const state = {
    currentVolume: 50,
    isPlaying: false,
    currentSpotifyTab: null,
    isMuted: false,
    lastVolumeBeforeMute: 50,
    isDraggingProgress: false
};

export const UI = {};

export function showNotification(message, duration = 3000) {
    if (!UI.notification) return;
    UI.notification.textContent = message;
    UI.notification.classList.add('show');
    setTimeout(() => UI.notification.classList.remove('show'), duration);
}

export function updateVolumeDisplay(volume) {
    if (!UI.volumeSlider) return;
    UI.volumeSlider.value = volume;
    UI.volumeSlider.style.setProperty('--val', volume + '%');
    UI.volumeValue.textContent = Math.round(volume) + '%';
    state.currentVolume = volume;

    if (volume === 0) {
        if (UI.muteIconSVG) UI.muteIconSVG.innerHTML = SVGS.mute;
        state.isMuted = true;
    } else {
        if (UI.muteIconSVG) UI.muteIconSVG.innerHTML = SVGS.speaker;
        state.isMuted = false;
    }
}

export function updatePlayPauseButton() {
    if (!UI.playPauseBtn) return;
    if (state.isPlaying) {
        if (UI.playIcon) UI.playIcon.style.display = 'none';
        if (UI.pauseIcon) UI.pauseIcon.style.display = 'block';
        UI.playPauseBtn.title = 'Pause';
    } else {
        if (UI.playIcon) UI.playIcon.style.display = 'block';
        if (UI.pauseIcon) UI.pauseIcon.style.display = 'none';
        UI.playPauseBtn.title = 'Play';
    }
}

function updateTextDisplay(info) {
    if (UI.trackTitle && UI.trackTitle.textContent !== info.title) {
        UI.trackTitle.textContent = info.title;
    }

    if (UI.trackArtist && UI.trackArtist.textContent !== info.artist) {
        UI.trackArtist.textContent = info.artist;
    }
}

function updateTimeDisplay(info) {
    if (UI.trackPosition && info.position) {
        UI.trackPosition.textContent = info.position;
    }
    if (UI.trackDuration && info.duration) {
        UI.trackDuration.textContent = info.duration;
    }
}

function updateProgressDisplay(info) {
    if (UI.progressSlider && !state.isDraggingProgress) {
        UI.progressSlider.max = info.progressMax;
        UI.progressSlider.value = info.progressVal;
        const percent = info.progressMax > 0 ? (info.progressVal / info.progressMax) * 100 : 0;
        UI.progressSlider.style.setProperty('--val', percent + '%');
    }
}

function updateAlbumArtDisplay(info) {
    if (UI.albumArt) {
        if (info.artSrc) {
            if (UI.albumArt.src !== info.artSrc) {
                UI.albumArt.src = info.artSrc;
                if (UI.bgBlur) {
                    UI.bgBlur.style.backgroundImage = `url(${info.artSrc})`;
                }
            }
            UI.albumArt.style.display = 'block';
        } else {
            UI.albumArt.style.display = 'none';
            if (UI.bgBlur) UI.bgBlur.style.backgroundImage = 'none';
        }
    }
}

function updateToggleDisplay(btn, state, iconId, mixedIconId, enableTitle, disableTitle) {
    if (!btn) return;

    const icon = document.getElementById(iconId);
    const mixedIcon = document.getElementById(mixedIconId);

    btn.classList.toggle('active', state === 'true' || state === 'mixed');

    if (icon && mixedIcon) {
        icon.style.display = state !== 'mixed' ? 'block' : 'none';
        mixedIcon.style.display = state === 'mixed' ? 'block' : 'none';
        btn.title = state !== 'false' ? disableTitle : enableTitle;
    }
}

function updateShuffleDisplay(info) {
    updateToggleDisplay(UI.shuffleBtn, info.shuffleState, 'shuffleIcon', 'smartShuffleIcon', 'Enable Shuffle', 'Disable Shuffle');
}

function updateRepeatDisplay(info) {
    updateToggleDisplay(UI.repeatBtn, info.repeatState, 'repeatIcon', 'repeatOnceIcon', 'Enable repeat', 'Disable repeat');
}

function updateLikeDisplay(info) {
    if (!UI.likeBtn) return;

    const likeIcon = document.getElementById('likeIcon');
    const likedIcon = document.getElementById('likedIcon');
    if (likeIcon && likedIcon) {
        if (info.isLiked) {
            UI.likeBtn.classList.add('liked');
            likeIcon.style.display = 'none';
            likedIcon.style.display = 'block';
            UI.likeBtn.title = "Saved to Your Library";
        } else {
            UI.likeBtn.classList.remove('liked');
            likeIcon.style.display = 'block';
            likedIcon.style.display = 'none';
            UI.likeBtn.title = "Not in Your Library";
        }
    }
}

export function updateTrackDisplay(info) {
    if (!info) return;

    updateTextDisplay(info);
    updateTimeDisplay(info);
    updateProgressDisplay(info);
    updateAlbumArtDisplay(info);
    updateShuffleDisplay(info);
    updateRepeatDisplay(info);
    updateLikeDisplay(info);

    state.isPlaying = info.playing;
    updatePlayPauseButton();
}
