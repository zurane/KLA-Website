(function initSiteMenu() {
    const overlay = document.querySelector('#site-menu');
    const toggle = document.querySelector('.btn-menu-toggle');
    const close = overlay && overlay.querySelector('.btn-menu-close');

    if (!overlay || !toggle || !close) return;

    const FOCUSABLE = 'a[href], button:not([disabled])';
    let lastFocused = null;

    const isOpen = () => overlay.classList.contains('is-open');

    function openMenu() {
        if (isOpen()) return;

        lastFocused = document.activeElement;
        overlay.classList.add('is-open');
        overlay.removeAttribute('inert');
        overlay.setAttribute('aria-hidden', 'false');
        toggle.setAttribute('aria-expanded', 'true');
        document.body.classList.add('menu-open');
        if (window.siteLenis) window.siteLenis.stop();
        close.focus();
    }

    function closeMenu() {
        if (!isOpen()) return;

        // move focus out before inert lands, or the browser drops it to <body>
        if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
        else toggle.focus();

        overlay.classList.remove('is-open');
        overlay.setAttribute('inert', '');
        overlay.setAttribute('aria-hidden', 'true');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-open');
        if (window.siteLenis) window.siteLenis.start();
    }

    toggle.addEventListener('click', openMenu);
    close.addEventListener('click', closeMenu);

    // clicking the blurred scrim beside the drawer dismisses it
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) closeMenu();
    });

    document.addEventListener('keydown', (event) => {
        if (!isOpen()) return;

        if (event.key === 'Escape') {
            event.preventDefault();
            closeMenu();
            return;
        }

        // keep tabbing inside the overlay while it covers the page
        if (event.key !== 'Tab') return;

        const items = Array.from(overlay.querySelectorAll(FOCUSABLE));
        if (!items.length) return;

        const first = items[0];
        const last = items[items.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });

    // a menu link that goes somewhere should not leave the overlay open behind it
    overlay.querySelectorAll('.menu-link').forEach((link) => {
        link.addEventListener('click', () => {
            if (link.getAttribute('href')) closeMenu();
        });
    });
})();
