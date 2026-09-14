(function initWhatWeDoSlider() {
    const viewport = document.querySelector('.what-we-do-viewport');
    const track = document.querySelector('.what-we-do-cards');
    const prev = document.querySelector('.what-we-do-controls .previous');
    const next = document.querySelector('.what-we-do-controls .next');

    if (!viewport || !track || !prev || !next) return;

    const cards = Array.from(track.querySelectorAll('.what-we-do-card'));
    if (!cards.length) return;

    const DRAG_THRESHOLD = 8;    // px before a press counts as a drag, not a click
    const FLICK_VELOCITY = 0.45; // px/ms that advances a slide regardless of distance
    const BASE_DURATION = 680;   // ms for a button press
    const MIN_DURATION = 460;    // ms floor for a hard flick
    const STAGGER_STEP = 70;     // ms between each card entering the move
    const TRAVEL_DURATION = 720; // ms, must match --travel-duration in the CSS

    let index = 0;
    let offset = 0;      // the committed translate for the current index
    let dragOffset = 0;  // live translate while dragging
    let dragging = false;
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastTime = 0;
    let velocity = 0;
    let axisLocked = null;
    let lagTimer = null;

    // Distance from the first card's left edge — works with any gap/width,
    // so nothing has to be kept in sync with the CSS.
    const cardOffset = (i) => cards[i].offsetLeft - cards[0].offsetLeft;

    const maxScroll = () => Math.max(track.scrollWidth - viewport.clientWidth, 0);

    function lastIndex() {
        const limit = maxScroll();
        for (let i = 0; i < cards.length; i++) {
            if (cardOffset(i) >= limit - 1) return i;
        }
        return cards.length - 1;
    }

    function targetOffset(i) {
        return Math.min(cardOffset(i), maxScroll());
    }

    function setTranslate(value) {
        track.style.transform = `translate3d(${-value}px, 0, 0)`;
    }

    // Run the card-travel keyframes over the visible cards, offset from each
    // other so the row lands as a wave instead of one rigid block.
    function playLag(direction, visible) {
        if (!direction || !visible.length) return;

        // drop the class and flush, or the keyframes won't restart on a
        // second press while the first wave is still running
        track.classList.remove('is-sliding');
        void track.offsetWidth;

        const last = visible.length - 1;
        let maxStagger = 0;

        visible.forEach((i, position) => {
            // the card the row is travelling towards leads, the rest follow
            const order = direction > 0 ? position : last - position;
            const delay = order * STAGGER_STEP;
            maxStagger = Math.max(maxStagger, delay);
            cards[i].style.setProperty('--stagger', `${delay}ms`);
        });

        track.style.setProperty('--slide-dir', String(direction));
        track.classList.add('is-sliding');

        clearTimeout(lagTimer);
        lagTimer = setTimeout(
            () => track.classList.remove('is-sliding'),
            TRAVEL_DURATION + maxStagger + 60
        );
    }

    function render({ animate = true, duration = BASE_DURATION, direction = 0 } = {}) {
        index = Math.max(0, Math.min(index, lastIndex()));
        offset = targetOffset(index);

        track.style.setProperty('--slide-duration', `${duration}ms`);

        if (!animate) {
            track.classList.add('no-transition');
            setTranslate(offset);
            void track.offsetWidth; // flush so the next frame animates again
            track.classList.remove('no-transition');
        } else {
            setTranslate(offset);
        }

        prev.disabled = index <= 0;
        next.disabled = index >= lastIndex();

        const visible = [];
        cards.forEach((card, i) => {
            const onScreen = i >= index && cardOffset(i) < offset + viewport.clientWidth - 1;
            if (onScreen) visible.push(i);
            card.setAttribute('aria-hidden', onScreen ? 'false' : 'true');
            const link = card.querySelector('.card-link');
            if (link) link.tabIndex = onScreen ? 0 : -1;
        });

        if (animate) playLag(direction, visible);
    }

    function goTo(i, options = {}) {
        const from = index;
        index = i;
        render({ direction: Math.sign(index - from), ...options });
    }

    prev.addEventListener('click', () => goTo(index - 1));
    next.addEventListener('click', () => goTo(index + 1));

    viewport.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            goTo(index - 1);
        } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            goTo(index + 1);
        }
    });

    // ---- pointer drag / swipe ----

    function onPointerDown(event) {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        if (maxScroll() === 0) return;

        pointerId = event.pointerId;
        dragging = false;
        axisLocked = null;
        startX = lastX = event.clientX;
        startY = event.clientY;
        lastTime = event.timeStamp;
        velocity = 0;
        dragOffset = offset;
    }

    function onPointerMove(event) {
        if (event.pointerId !== pointerId) return;

        const dx = event.clientX - startX;
        const dy = event.clientY - startY;

        if (!axisLocked) {
            if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
            axisLocked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
            if (axisLocked === 'y') {
                pointerId = null; // let the page scroll
                return;
            }
            dragging = true;
            viewport.classList.add('is-dragging');
            viewport.setPointerCapture(event.pointerId);
        }

        const dt = event.timeStamp - lastTime;
        if (dt > 0) velocity = (event.clientX - lastX) / dt;
        lastX = event.clientX;
        lastTime = event.timeStamp;

        let nextOffset = offset - dx;
        const limit = maxScroll();
        // rubber-band past the ends instead of stopping dead
        if (nextOffset < 0) nextOffset *= 0.35;
        else if (nextOffset > limit) nextOffset = limit + (nextOffset - limit) * 0.35;

        dragOffset = nextOffset;
        setTranslate(dragOffset);
    }

    function onPointerUp(event) {
        if (event.pointerId !== pointerId) return;
        pointerId = null;

        if (!dragging) return;
        dragging = false;
        viewport.classList.remove('is-dragging');

        const step = cardOffset(1) || viewport.clientWidth;
        let landing = dragOffset;

        if (Math.abs(velocity) > FLICK_VELOCITY) {
            landing = dragOffset - velocity * step * 0.5;
        }

        // snap to the nearest card boundary
        let nearest = 0;
        let best = Infinity;
        for (let i = 0; i <= lastIndex(); i++) {
            const distance = Math.abs(targetOffset(i) - landing);
            if (distance < best) {
                best = distance;
                nearest = i;
            }
        }

        // a harder flick lands in less time
        const duration = Math.max(
            MIN_DURATION,
            Math.min(BASE_DURATION, BASE_DURATION - Math.abs(velocity) * 180)
        );

        goTo(nearest, { duration });
    }

    viewport.addEventListener('pointerdown', onPointerDown);
    viewport.addEventListener('pointermove', onPointerMove, { passive: true });
    viewport.addEventListener('pointerup', onPointerUp);
    viewport.addEventListener('pointercancel', onPointerUp);

    // a drag must not fire the card's link
    viewport.addEventListener('click', (event) => {
        if (Math.abs(lastX - startX) > DRAG_THRESHOLD) {
            event.preventDefault();
            event.stopPropagation();
        }
    }, true);

    viewport.addEventListener('dragstart', (event) => event.preventDefault());

    // ---- keep geometry correct as the layout changes ----

    let resizeFrame = null;
    const onResize = () => {
        if (resizeFrame) cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(() => render({ animate: false }));
    };

    if ('ResizeObserver' in window) {
        new ResizeObserver(onResize).observe(viewport);
    } else {
        window.addEventListener('resize', onResize);
    }

    // images settle after load and can change the track width
    track.querySelectorAll('img').forEach((img) => {
        if (!img.complete) img.addEventListener('load', onResize, { once: true });
    });

    render({ animate: false });
})();
