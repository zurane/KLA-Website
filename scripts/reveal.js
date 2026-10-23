(function initReveal() {
    // Anything marked data-reveal gets is-in once it scrolls into view; the
    // CSS decides what that looks like. Plays once per element.
    const targets = Array.from(document.querySelectorAll('[data-reveal]'));
    if (!targets.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
        targets.forEach((el) => el.classList.add('is-in'));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-in');
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.2 });

    // hide only now that we know we'll be able to show again
    targets.forEach((el) => {
        el.classList.add('reveal-pending');
        observer.observe(el);
    });
})();
