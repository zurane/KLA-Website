(function initWhyChoose() {
    const section = document.querySelector('.why-choose-section');
    if (!section) return;

    const track = section.querySelector('.why-choose-track');
    const sticky = section.querySelector('.why-choose-sticky');
    const items = Array.from(section.querySelectorAll('.why-choose-item'));
    const images = Array.from(section.querySelectorAll('.why-choose-media img'));

    if (!track || !sticky || !items.length) return;

    // Below this width the panel isn't pinned (see the CSS), so scrolling
    // no longer drives the list and a tap simply opens the item.
    const pinned = window.matchMedia('(min-width: 901px)');
    let active = -1;

    function setActive(index, fill) {
        const i = Math.max(0, Math.min(index, items.length - 1));

        if (i !== active) {
            active = i;
            items.forEach((item, k) => {
                const on = k === i;
                item.classList.toggle('is-active', on);
                item.querySelector('.why-choose-toggle').setAttribute('aria-expanded', String(on));
            });
            images.forEach((img, k) => img.classList.toggle('is-active', k === i));
        }

        items[i].style.setProperty('--fill', fill.toFixed(3));
    }

    // How far the panel stays pinned, split into one slot per item.
    const slotHeight = () => (track.offsetHeight - sticky.offsetHeight) / items.length;

    // Item i owns the stretch of scroll [i, i + 1) slots into the track.
    function update() {
        if (!pinned.matches) return;
        const step = slotHeight();
        if (step <= 0) return;

        const progress = -track.getBoundingClientRect().top / step;
        const i = Math.max(0, Math.min(Math.floor(progress), items.length - 1));
        setActive(i, Math.max(0, Math.min(progress - i, 1)));
    }

    // A click scrolls to the start of that item's slot rather than setting the
    // item directly, so the scroll position and the open item never disagree.
    items.forEach((item, i) => {
        item.querySelector('.why-choose-toggle').addEventListener('click', () => {
            if (!pinned.matches) {
                setActive(i, 1);
                return;
            }

            const top = track.getBoundingClientRect().top + window.scrollY + i * slotHeight() + 2;
            if (window.siteLenis) window.siteLenis.scrollTo(top, { duration: 1.1 });
            else window.scrollTo({ top, behavior: 'smooth' });
        });
    });

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
    pinned.addEventListener('change', () => {
        if (pinned.matches) update();
        else setActive(Math.max(active, 0), 1);
    });

    setActive(0, 0);
    update();
})();
