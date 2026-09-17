(function initVideoGrow() {
    const section = document.querySelector('.home-video-section');
    const track = section && section.querySelector('.video-track');
    const sticky = section && section.querySelector('.video-sticky');
    const box = section && section.querySelector('.video-container');

    if (!section || !track || !sticky || !box) return;

    // Reduced motion: leave the section as a plain framed video.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // On a phone the scale needed to cover a tall viewport is enormous and
    // the video turns to mush, so the grow is desktop-only. The class is
    // what switches the tall track and pinning on (see the CSS).
    const wide = window.matchMedia('(min-width: 901px)');
    const applyMode = () => {
        section.classList.toggle('is-ready', wide.matches);
        if (!wide.matches) {
            box.style.transform = '';
            box.style.removeProperty('--grow');
            last = -1;
        }
    };

    // The scale that makes the box cover the pinned panel in both directions;
    // the panel's overflow: hidden crops whatever spills out.
    function coverScale() {
        return Math.max(
            sticky.clientWidth / box.offsetWidth,
            sticky.clientHeight / box.offsetHeight
        );
    }

    let full = coverScale();
    window.addEventListener('resize', () => { full = coverScale(); update(); });

    // Linear scroll mapping, softened at both ends so the grow starts and
    // settles gently rather than snapping into motion.
    const smooth = (t) => t * t * (3 - 2 * t);

    let last = -1;

    function update() {
        if (!wide.matches) return;
        const range = track.offsetHeight - sticky.offsetHeight;
        if (range <= 0) return;

        const raw = -track.getBoundingClientRect().top / range;
        const t = smooth(Math.max(0, Math.min(raw, 1)));
        if (t === last) return;
        last = t;

        const scale = 1 + (full - 1) * t;
        box.style.transform = `scale(${scale.toFixed(4)})`;
        box.style.setProperty('--grow', t.toFixed(3));
    }

    if (window.siteLenis) {
        window.siteLenis.on('scroll', update);
    } else {
        let frame = null;
        window.addEventListener('scroll', () => {
            if (frame) return;
            frame = requestAnimationFrame(() => { frame = null; update(); });
        }, { passive: true });
    }

    wide.addEventListener('change', () => { applyMode(); full = coverScale(); update(); });
    applyMode();
    update();
})();
