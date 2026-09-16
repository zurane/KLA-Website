(function initIntroReveal() {
    const section = document.querySelector('.home-intro-section');
    if (!section) return;

    // Reduced motion, or no observer: leave the section fully visible.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!('IntersectionObserver' in window)) return;

    // Hide the pieces only now that we know we'll be able to show them.
    section.classList.add('reveal-pending');

    const observer = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        section.classList.remove('reveal-pending');
        section.classList.add('is-revealed');
        observer.disconnect(); // plays once
    }, { threshold: 0.25 });

    observer.observe(section);
})();
