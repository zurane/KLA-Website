(function initLazyVideo() {
    // A video marked data-lazy carries preload="none" and no autoplay, so the
    // browser fetches nothing for it up front. It starts, and so starts
    // downloading, once its section is within a screen of the viewport.
    const videos = Array.from(document.querySelectorAll('video[data-lazy]'));
    if (!videos.length) return;

    function start(video) {
        if (video.dataset.started) return;
        video.dataset.started = 'true';
        video.preload = 'auto';
        const playing = video.play();
        if (playing && playing.catch) playing.catch(() => {});
    }

    if (!('IntersectionObserver' in window)) {
        videos.forEach(start);
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            start(entry.target);
            observer.unobserve(entry.target);
        });
    }, { rootMargin: '50% 0px' });

    // Only start watching once everything else has arrived, so the video
    // never competes with the stylesheet, fonts and hero for bandwidth and
    // never holds the preloader up.
    const watch = () => videos.forEach((video) => observer.observe(video));
    if (document.readyState === 'complete') watch();
    else window.addEventListener('load', watch, { once: true });
})();
