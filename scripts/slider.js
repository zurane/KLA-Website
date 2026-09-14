(function initWhatWeDoSlider() {
    const viewport = document.querySelector('.what-we-do-viewport');
    const track = document.querySelector('.what-we-do-cards');
    const prev = document.querySelector('.what-we-do-controls .previous');
    const next = document.querySelector('.what-we-do-controls .next');

    if (!viewport || !track || !prev || !next) return;

    const cards = Array.from(track.querySelectorAll('.what-we-do-card'));
    if (!cards.length) return;

    const DRAG_THRESHOLD = 8;   // px before a press counts as a drag, not a click
    const FLICK_VELOCITY = 0.45; // px/ms that advances a slide regardless of distance

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

    function render({ animate = true } = {}) {
        index = Math.max(0, Math.min(index, lastIndex()));
        offset = targetOffset(index);

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

        cards.forEach((card, i) => {
            const visible = i >= index && cardOffset(i) < offset + viewport.clientWidth - 1;
            card.setAttribute('aria-hidden', visible ? 'false' : 'true');
            const link = card.querySelector('.card-link');
            if (link) link.tabIndex = visible ? 0 : -1;
        });
    }

    function goTo(i, options) {
        index = i;
        render(options);
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

        goTo(nearest);
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
