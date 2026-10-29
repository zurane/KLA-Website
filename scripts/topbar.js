/*
 * Top bar
 * Pages: all. Needs .topbar.
 *
 * 1. Over the hero the bar is see-through; past 10px of scroll it gets
 *    is-scrolled and turns into the frosted white bar.
 * 2. The Programmes drop-down: hover opens it in CSS; this adds click,
 *    keyboard and Escape, and closes it when a click lands elsewhere.
 */

(function initTopbarScroll() {
    // The homepage bar sits see-through over the hero photo; once the page
    // scrolls it turns into the usual white bar (see .topbar--overlay).
    const bar = document.querySelector('.topbar--overlay');
    if (!bar) return;

    const update = () => bar.classList.toggle('is-scrolled', window.scrollY > 10);
    update();
    window.addEventListener('scroll', update, { passive: true });
})();

(function initTopbar() {
    // The Programmes dropdown. Hover opens it through the CSS; this handles
    // click and keyboard, and closes it when focus or a click lands elsewhere.
    const menus = Array.from(document.querySelectorAll('.topbar .has-menu'));
    if (!menus.length) return;

    function setOpen(menu, open) {
        menu.classList.toggle('is-open', open);
        menu.querySelector('.topbar-trigger').setAttribute('aria-expanded', String(open));
    }

    const closeAll = () => menus.forEach((menu) => setOpen(menu, false));

    menus.forEach((menu) => {
        const trigger = menu.querySelector('.topbar-trigger');

        trigger.addEventListener('click', () => {
            const open = !menu.classList.contains('is-open');
            closeAll();
            setOpen(menu, open);
        });

        // tabbing out of the list closes it
        menu.addEventListener('focusout', (event) => {
            if (!menu.contains(event.relatedTarget)) setOpen(menu, false);
        });

        // choosing an entry closes it so it isn't left open behind an in-page jump
        menu.querySelectorAll('.topbar-menu a').forEach((link) => {
            link.addEventListener('click', () => setOpen(menu, false));
        });
    });

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.topbar .has-menu')) closeAll();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        const open = menus.find((menu) => menu.classList.contains('is-open'));
        if (!open) return;
        closeAll();
        open.querySelector('.topbar-trigger').focus();
    });
})();
