/*
 * Why choose us
 * Pages: home. Needs .why-choose-section with .why-choose-item rows and
 * one .why-choose-media image per row.
 *
 * An accordion: one row open at a time; opening a row swaps the picture
 * beside the list to match (is-active on both).
 */

(function initWhyChoose() {
    const section = document.querySelector('.why-choose-section');
    if (!section) return;

    const items = Array.from(section.querySelectorAll('.why-choose-item'));
    const images = Array.from(section.querySelectorAll('.why-choose-media img'));
    if (!items.length) return;

    function setActive(index) {
        items.forEach((item, k) => {
            const on = k === index;
            item.classList.toggle('is-active', on);
            item.querySelector('.why-choose-toggle').setAttribute('aria-expanded', String(on));
        });
        images.forEach((img, k) => img.classList.toggle('is-active', k === index));
    }

    items.forEach((item, i) => {
        item.querySelector('.why-choose-toggle').addEventListener('click', () => setActive(i));
    });

    const first = items.findIndex((item) => item.classList.contains('is-active'));
    setActive(first < 0 ? 0 : first);
})();
