(function initTextReveal() {
    const targets = Array.from(document.querySelectorAll('[data-text-reveal]'));
    if (!targets.length) return;

    // Reduced motion, or no observer: the text simply stays as it is.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!('IntersectionObserver' in window)) return;

    // Wrap every word in a clipping span with an inner span that can rise
    // into view. Only text nodes and <br> are handled; an element with any
    // other markup inside is left alone rather than risk mangling it.
    function split(el) {
        const nodes = Array.from(el.childNodes);
        const usable = nodes.every(
            (n) => n.nodeType === Node.TEXT_NODE || (n.nodeType === Node.ELEMENT_NODE && n.tagName === 'BR')
        );
        if (!usable) return false;

        const plain = el.textContent.replace(/\s+/g, ' ').trim();
        const frag = document.createDocumentFragment();
        let index = 0;

        nodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                frag.appendChild(node.cloneNode(false));
                return;
            }
            const words = node.textContent.split(/(\s+)/);
            words.forEach((chunk) => {
                if (!chunk) return;
                if (/^\s+$/.test(chunk)) {
                    frag.appendChild(document.createTextNode(' '));
                    return;
                }
                const word = document.createElement('span');
                word.className = 'tr-word';
                const inner = document.createElement('span');
                inner.className = 'tr-inner';
                inner.style.setProperty('--i', String(index++));
                inner.textContent = chunk;
                word.appendChild(inner);
                frag.appendChild(word);
            });
        });

        // the split copy is presentational; the readable text lives in one
        // hidden span so assistive tech gets a single uninterrupted string
        const sr = document.createElement('span');
        sr.className = 'sr-only';
        sr.textContent = plain;

        const visual = document.createElement('span');
        visual.className = 'tr-visual';
        visual.setAttribute('aria-hidden', 'true');
        visual.appendChild(frag);

        el.textContent = '';
        el.appendChild(sr);
        el.appendChild(visual);
        return true;
    }

    // A gradient clipped to text on the element can't reach words that sit on
    // their own compositor layers (the transform does that), so the words
    // would paint transparent. Give each word the same gradient, sized to the
    // whole element and shifted by the word's offset, so together they still
    // read as one continuous ramp.
    function paintGradient(el) {
        const cs = getComputedStyle(el);
        if (!/gradient\(/.test(cs.backgroundImage) && !el.dataset.trGradient) return;
        if (!el.dataset.trGradient) {
            el.dataset.trGradient = cs.backgroundImage;
            el.style.backgroundImage = 'none';
        }
        const image = el.dataset.trGradient;
        const base = el.getBoundingClientRect();
        el.querySelectorAll('.tr-inner').forEach((inner) => {
            const r = inner.getBoundingClientRect();
            inner.style.backgroundImage = image;
            inner.style.backgroundSize = `${Math.round(base.width)}px 100%`;
            inner.style.backgroundPosition = `${Math.round(base.left - r.left)}px 0`;
            inner.style.webkitBackgroundClip = 'text';
            inner.style.backgroundClip = 'text';
            inner.style.webkitTextFillColor = 'transparent';
        });
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-in');
            observer.unobserve(entry.target); // plays once
        });
    }, { threshold: 0.15 });

    // Split straight away so nothing is visible before its cue...
    const ready = targets.filter((el) => {
        if (!split(el)) return false;

        // ms between one word starting and the next; headings can afford
        // a wider gap than a paragraph
        const step = parseInt(el.getAttribute('data-text-reveal'), 10);
        el.style.setProperty('--tr-step', `${step > 0 ? step : 40}ms`);
        el.classList.add('tr-ready');
        paintGradient(el);
        return true;
    });

    // word offsets change when lines rewrap
    window.addEventListener('resize', () => ready.forEach(paintGradient));

    // ...but only start watching once the preloader's curtain is lifting,
    // so the hero headline rises behind it instead of before it.
    const watch = () => ready.forEach((el) => observer.observe(el));

    if (document.documentElement.classList.contains('is-preloading')) {
        window.addEventListener('site:revealed', watch, { once: true });
    } else {
        watch();
    }
})();
