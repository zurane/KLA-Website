/*
 * Contact form
 * Pages: all (the footer form). Needs .footer-form with .footer-submit and
 * .footer-form-status.
 *
 * Sends the form to api/contact.php in the background and shows "Sending",
 * the thank-you or the error under it (data-state on the form). Without
 * JS the form posts normally and the server sends the visitor back with
 * ?contact=sent, which shows the same message. See docs/contact-form.md.
 */

(function initContactForm() {
    const forms = Array.from(document.querySelectorAll('.footer-form'));
    const sentText = "Thank you, your message is on its way. We'll be in touch soon.";
    const errorText = 'Something went wrong. Please try again, or email hello@khuphukaleadershipacademy.co.za.';
    const returned = new URLSearchParams(window.location.search).get('contact');

    forms.forEach((form) => {
        const status = form.querySelector('.footer-form-status');
        const submit = form.querySelector('.footer-submit');

        const show = (state, text) => {
            form.dataset.state = state;
            if (status) status.textContent = text;
        };

        if (returned === 'sent') show('sent', sentText);
        if (returned === 'error') show('error', errorText);

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
                    show('sent', sentText);
                } else {
                    show('error', data.error || errorText);
                }
            } catch (error) {
                show('error', 'We could not send that. Check your connection, or email hello@khuphukaleadershipacademy.co.za.');
            } finally {
                submit.disabled = false;
            }
        });
    });
})();
