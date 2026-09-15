(function initWhyChooseRing() {
    const section = document.querySelector('.why-choose-section');
    const ring = section && section.querySelector('.why-ring-art');

    if (!section || !ring) return;

    // The lap runs only while the section is in view, so leaving mid-turn
    // pauses it and coming back picks it up where it stopped. After one
    // full turn it stays put.
    if (!('IntersectionObserver' in window)) {
        ring.classList.add('is-playing');
        return;
    }

    const observer = new IntersectionObserver(
        ([entry]) => ring.classList.toggle('is-playing', entry.isIntersecting),
        { threshold: 0.3 }
    );

    ring.addEventListener('animationend', () => {
        ring.classList.remove('is-playing');
        observer.disconnect();
    }, { once: true });

    observer.observe(section);
})();
