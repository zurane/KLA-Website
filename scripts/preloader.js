(function initPreloader() {
    const el = document.querySelector('.preloader');
    if (!el) return;

    const html = document.documentElement;
    const strips = Array.from(el.querySelectorAll('.pl-strip'));
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Shortest time the loader stays up, so a cached reload doesn't flash.
    const MIN_TIME = reduced ? 0 : 1200;
    // How long the time-based creep takes to reach its ceiling on a slow load.
    const CREEP_TIME = 2500;
    const CREEP_CEILING = 90;
    // The hero video can hold the load event for a long time on a slow
    // connection; past this point the curtain lifts and it keeps loading.
    const MAX_WAIT = 6000;

    const start = performance.now();
    let loaded = false;
    let shown = 0;

    // Nothing scrolls while the curtain is up.
    html.classList.add('is-preloading');
    if (window.siteLenis) window.siteLenis.stop();

    // The real signal: the page has loaded and the webfont is in.
    const pageLoaded = new Promise((resolve) => {
        if (document.readyState === 'complete') resolve();
        else window.addEventListener('load', resolve, { once: true });
    });
    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    const patience = new Promise((resolve) => setTimeout(resolve, MAX_WAIT));
    Promise.race([Promise.all([pageLoaded, fontsReady]), patience]).then(() => { loaded = true; });

    // ---- odometer ----
    // Each column is a strip of 0-9 plus a trailing 0, so a 9 -> 0 step rolls
    // forward onto the spare 0 and then snaps back to the real one unseen.
    const current = strips.map(() => 0);

    function setDigit(i, digit) {
        const strip = strips[i];
        const prev = current[i];
        if (digit === prev) return;
        current[i] = digit;

        if (prev === 9 && digit === 0 && !reduced) {
            strip.style.setProperty('--d', '10');
            setTimeout(() => {
                strip.classList.add('no-transition');
                strip.style.setProperty('--d', '0');
                void strip.offsetHeight; // apply the snap before transitions return
                strip.classList.remove('no-transition');
            }, 260);
            return;
        }
        strip.style.setProperty('--d', String(digit));
    }

    function render(value) {
        const text = String(Math.min(100, Math.round(value))).padStart(strips.length, '0');
        for (let i = 0; i < strips.length; i++) setDigit(i, Number(text[i]));
    }

    function finish() {
        render(100);
        el.classList.add('is-done');

        html.classList.remove('is-preloading');
        html.classList.add('is-loaded');
        if (window.siteLenis) window.siteLenis.start();

        // Fired as the curtain sweeps over the hero, so the headline's words
        // rise in behind it rather than being already there when it clears.
        setTimeout(() => window.dispatchEvent(new CustomEvent('site:revealed')), reduced ? 0 : 350);

        const remove = () => { if (el.parentNode) el.remove(); };
        el.addEventListener('transitionend', (e) => { if (e.target === el) remove(); });
        setTimeout(remove, 2000); // in case transitionend never arrives
    }

    function tick(now) {
        const elapsed = now - start;

        // Creep with time until the page is in, then run to 100 — but never
        // faster than the minimum display time allows, so a cached load
        // counts steadily instead of racing to 99 and waiting there.
        const pace = MIN_TIME > 0 ? (elapsed / MIN_TIME) * 100 : 100;
        const goal = Math.min(pace, loaded ? 100 : Math.min(CREEP_CEILING, (elapsed / CREEP_TIME) * 100));
        shown += (goal - shown) * (reduced ? 1 : 0.18);
        render(shown);

        if (loaded && shown > 99.4 && elapsed >= MIN_TIME) {
            finish();
            return;
        }
        requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
})();
