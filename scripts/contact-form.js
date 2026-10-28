(function initContactForm() {
    // Sends the footer form to Static Forms in the background and shows the
    // result under it. Without JS the form still posts the normal way and the
    // visitor lands on the Static Forms confirmation page.
    const forms = Array.from(document.querySelectorAll('.footer-form'));

    forms.forEach((form) => {
        const status = form.querySelector('.footer-form-status');
        const submit = form.querySelector('.footer-submit');

        const show = (state, text) => {
            form.dataset.state = state;
            if (status) status.textContent = text;
        };

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (form.dataset.state === 'sending') return;

            show('sending', 'Sending…');
            submit.disabled = true;

            try {
                const response = await fetch(form.action, {
                    method: 'POST',
                    body: new FormData(form),
                    headers: { Accept: 'application/json' },
                });
                const isJson = (response.headers.get('content-type') || '').includes('application/json');
                const data = isJson ? await response.json() : {};

                if (response.ok && data.success !== false) {
                    form.reset();
                    show('sent', "Thank you, your message is on its way. We'll be in touch soon.");
                } else {
                    show('error', data.error || 'Something went wrong. Please try again, or email hello@khuphukaleadershipacademy.co.za.');
                }
            } catch (error) {
                show('error', 'We could not send that. Check your connection, or email hello@khuphukaleadershipacademy.co.za.');
            } finally {
                submit.disabled = false;
            }
        });
    });
})();
