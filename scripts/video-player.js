/*
 * Video player
 * Pages: about. Needs .video-player with a <video>, .video-play and the
 * .video-controls buttons.
 *
 * Our own controls in place of the browser's: a "Play Video" pill on the
 * poster, then a bar with play/pause, seek, time, mute and full screen that
 * hides 2.2s after the pointer stops. State classes on .video-player:
 * is-started, is-playing, is-muted, is-active (bar showing).
 */

(function initVideoPlayers() {
    const players = Array.from(document.querySelectorAll('.video-player'));

    const format = (seconds) => {
        if (!isFinite(seconds)) return '0:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${String(s).padStart(2, '0')}`;
    };

    players.forEach((player) => {
        const video = player.querySelector('video');
        const play = player.querySelector('.video-play');
        const toggle = player.querySelector('.video-toggle');
        const seek = player.querySelector('.video-seek');
        const time = player.querySelector('.video-time');
        const mute = player.querySelector('.video-mute');
        const fullscreen = player.querySelector('.video-fullscreen');
        if (!video) return;

        let idle = null;

        const togglePlay = () => {
            if (video.paused || video.ended) {
                // a missing file rejects the promise; there is nothing to show yet
                video.play().catch(() => player.classList.remove('is-started'));
            } else {
                video.pause();
            }
        };

        // the bar hides itself after a short pause in pointer movement
        const wake = () => {
            player.classList.add('is-active');
            clearTimeout(idle);
            idle = setTimeout(() => player.classList.remove('is-active'), 2200);
        };

        const updateTime = () => {
            const pct = video.duration ? (video.currentTime / video.duration) * 100 : 0;
            seek.value = pct;
            seek.style.setProperty('--progress', `${pct}%`);
            time.textContent = `${format(video.currentTime)} / ${format(video.duration)}`;
        };

        play.addEventListener('click', () => {
            player.classList.add('is-started');
            togglePlay();
        });
        toggle.addEventListener('click', togglePlay);
        video.addEventListener('click', togglePlay);

        video.addEventListener('play', () => {
            player.classList.add('is-started', 'is-playing');
            toggle.setAttribute('aria-label', 'Pause');
            wake();
        });
        video.addEventListener('pause', () => {
            player.classList.remove('is-playing');
            toggle.setAttribute('aria-label', 'Play');
        });
        video.addEventListener('ended', () => {
            // back to the poster and the Play Video pill
            player.classList.remove('is-started', 'is-playing');
            video.currentTime = 0;
        });

        video.addEventListener('timeupdate', updateTime);
        video.addEventListener('loadedmetadata', updateTime);

        seek.addEventListener('input', () => {
            if (video.duration) video.currentTime = (seek.value / 100) * video.duration;
            seek.style.setProperty('--progress', `${seek.value}%`);
        });

        mute.addEventListener('click', () => {
            video.muted = !video.muted;
            player.classList.toggle('is-muted', video.muted);
            mute.setAttribute('aria-label', video.muted ? 'Unmute' : 'Mute');
        });

        fullscreen.addEventListener('click', () => {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else if (player.requestFullscreen) {
                player.requestFullscreen();
            } else if (video.webkitEnterFullscreen) {
                // iOS Safari only lets the video itself go full screen
                video.webkitEnterFullscreen();
            }
        });

        player.addEventListener('pointermove', wake);
        player.addEventListener('focusin', wake);
    });
})();
