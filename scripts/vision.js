/*
 * Vision and mission
 * Pages: about. Needs .vision-section with .vision-tab and
 * .vision-statement pairs.
 *
 * Shows one statement at a time and moves to the next every 7s while the
 * section is on screen and not hovered or focused. The line under the
 * active tab fills as the time runs (--p, 0 to 1). Tabs also work by click
 * and the arrow keys.
 */

(function initVisionMission() {
    const section = document.querySelector('.vision-section');
    if (!section) return;

    const tabs = Array.from(section.querySelectorAll('.vision-tab'));
    const panels = Array.from(section.querySelectorAll('.vision-statement'));
    if (tabs.length < 2 || panels.length !== tabs.length) return;

    const HOLD = 7000; // ms each statement stays before the next
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let active = 0;
    let progress = 0;      // 0..1 through the current hold
    let running = false;   // in view and not hovered
    let last = null;
    let frame = null;

    function show(index) {
        active = (index + tabs.length) % tabs.length;
        tabs.forEach((tab, i) => {
            const on = i === active;
            tab.classList.toggle('is-active', on);
            tab.setAttribute('aria-selected', String(on));
            tab.tabIndex = on ? 0 : -1;
            tab.style.setProperty('--p', '0');
        });
        panels.forEach((panel, i) => {
            const on = i === active;
            panel.classList.toggle('is-active', on);
            panel.setAttribute('aria-hidden', String(!on));
        });
        progress = 0;
    }

    function tick(now) {
        frame = null;
        if (!running) { last = null; return; }
        if (last !== null) {
            progress += (now - last) / HOLD;
            if (progress >= 1) {
                show(active + 1);
            } else {
                tabs[active].style.setProperty('--p', progress.toFixed(4));
            }
        }
        last = now;
        frame = requestAnimationFrame(tick);
    }

    function start() {
        if (reduced || running) return;
        running = true;
        last = null;
        if (!frame) frame = requestAnimationFrame(tick);
    }

    function stop() {
        running = false;
    }

    tabs.forEach((tab, i) => {
        tab.addEventListener('click', () => show(i));
        tab.addEventListener('keydown', (event) => {
            if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
            event.preventDefault();
            show(active + (event.key === 'ArrowRight' ? 1 : -1));
            tabs[active].focus();
        });
    });

    // hold still while the pointer or keyboard focus is on the block
    let hovered = false;
    let inView = false;
    const settle = () => { if (inView && !hovered) start(); else stop(); };
    section.addEventListener('pointerenter', () => { hovered = true; settle(); });
    section.addEventListener('pointerleave', () => { hovered = false; settle(); });
    section.addEventListener('focusin', () => { hovered = true; settle(); });
    section.addEventListener('focusout', (event) => {
        if (section.contains(event.relatedTarget)) return;
        hovered = false;
        settle();
    });

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(([entry]) => {
            inView = entry.isIntersecting;
            settle();
        }, { threshold: 0.4 }).observe(section);
    } else {
        inView = true;
        settle();
    }

    show(0);
})();
