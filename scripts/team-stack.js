(function initTeamStack() {
    const cards = Array.from(document.querySelectorAll('.team-stack .team-card'));
    if (cards.length < 2) return;

    // The sticky stacking is pure CSS; this only adds depth. As the next
    // card climbs over a pinned one, the pinned card eases back and dims.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const wide = window.matchMedia('(min-width: 901px)');

    const SCALE_DROP = 0.06;
    const DIM = 0.35;

    function update() {
        if (!wide.matches) return;

        for (let i = 0; i < cards.length - 1; i++) {
            const card = cards[i];
            const next = cards[i + 1];
            const a = card.getBoundingClientRect();
            const b = next.getBoundingClientRect();

            // how far the next card has travelled up across this one
            const covered = Math.max(0, Math.min((a.bottom - b.top) / a.height, 1));
            const scale = 1 - SCALE_DROP * covered;
            const bright = 1 - DIM * covered;

            card.style.transform = `scale(${scale.toFixed(4)})`;
            card.style.filter = `brightness(${bright.toFixed(3)})`;
        }
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

    window.addEventListener('resize', update);
    wide.addEventListener('change', () => {
        if (!wide.matches) cards.forEach((c) => { c.style.transform = ''; c.style.filter = ''; });
        update();
    });

    update();
})();
