(function initSmoothScroll() {
    // Lenis eases the real document scroll rather than transforming the page,
    // so fixed elements, anchors, IntersectionObserver and the slider's drag
    // all keep working. If the library is missing or the user prefers reduced
    // motion, native scrolling is left exactly as it was.
    if (typeof Lenis === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({
        autoRaf: true,
        // a fixed-length expo-out glide per wheel tick: leaves quickly, then
        // drifts to a stop. The classic Lenis feel — a plain lerp is too close
        // to the browser's own wheel smoothing to read as "smooth scroll".
        duration: 1.4,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        wheelMultiplier: 1,
        smoothWheel: true,
        syncTouch: false,    // phones keep native touch scrolling
        // in-page links go through lenis.scrollTo, so a click can't be dropped
        // by a native jump landing while a wheel animation is still settling
        anchors: true,
    });

    // shared so the menu can freeze the page behind the drawer
    window.siteLenis = lenis;
})();
