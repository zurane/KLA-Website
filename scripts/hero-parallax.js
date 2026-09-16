(function initHeroParallax() {
    const hero = document.querySelector('.container');
    const layer = hero && hero.querySelector('.hero-bg');
    const lenis = window.siteLenis;

    // No Lenis means reduced motion (or the library is missing): the hero
    // keeps a still background, the same as before.
    if (!hero || !layer || !lenis) return;

    // The image covers this fraction of the distance the page scrolls. The
    // layer's -30% top inset in the CSS must match: 0.3 * hero height.
    const SPEED = 0.3;

    let limit = hero.offsetHeight;
    let lastY = null;
    window.addEventListener('resize', () => { limit = hero.offsetHeight; });

    // Lenis emits once per eased frame, so the image moves with the smooth
    // scroll rather than jumping with the raw wheel. The scroll is clamped
    // to the hero's height rather than ignored past it, so the layer always
    // parks at its exact end position and there is no step on the way back.
    lenis.on('scroll', ({ scroll }) => {
        const y = Math.min(Math.max(0, scroll), limit) * SPEED;
        if (y === lastY) return;
        lastY = y;
        layer.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
    });
})();
