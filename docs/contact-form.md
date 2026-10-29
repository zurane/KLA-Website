# Contact form

How the footer "We'd love to hear from you" form works, how to set it up on the
server, and what to check when enquiries stop arriving.

## How it works

```
footer form (every page)
  └─ scripts/contact-form.js      sends it in the background (fetch)
       └─ api/contact.php         checks it, saves it, emails it
            ├─ api/storage/leads.csv          a copy of every enquiry
            └─ website@ mailbox (SMTP)  ──►  hello@khuphukaleadershipacademy.co.za
```

1. The visitor fills in name, email and message and presses the round button.
2. `contact-form.js` posts the form to `api/contact.php` with
   `Accept: application/json` and shows "Sending…".
3. `contact.php`:
   - drops the submission quietly if the hidden `honeypot` field is filled
     (a spam bot); the bot is still told it worked
   - checks the fields are filled in, the email is valid and nothing is too long
   - turns away anyone who has sent 5 messages in the last hour (by IP)
   - adds a row to `api/storage/leads.csv`
   - signs in to the `website@` mailbox and emails the enquiry to `hello@`,
     with **Reply-To** set to the visitor so replying goes straight to them
4. It answers `{ "success": true }` or `{ "success": false, "error": "…" }`,
   and the script shows the green thank-you or the red error under the form.

If JavaScript is off, the form posts normally and `contact.php` sends the
visitor back to the same page with `?contact=sent` (or `?contact=error`) in the
address, which shows the same message.

## Files

| File | What it is |
|---|---|
| `scripts/contact-form.js` | Sends the form and shows the result. Loaded on all 7 pages. |
| `api/contact.php` | The endpoint. All the rules above live here. |
| `api/config.example.php` | Template for the settings. In git. |
| `api/config.php` | The real settings, **with the mailbox password**. On the server only, never in git. |
| `api/vendor/PHPMailer/` | The mail library (PHPMailer 6.9.3, three files). |
| `api/.htaccess` | Only `contact.php` can be opened from the web; everything else in `api/` is blocked. |
| `api/storage/` | Created by the server. `leads.csv` and the rate-limit files (`rate-*.json`). Blocked from the web. |
| `.gitignore` | Keeps `config.php` and the stored leads out of git. |

The form markup is the `<form class="footer-form" id="contact">` block in each
page's footer. Its `action` is `api/contact.php` on the top-level pages and
`../api/contact.php` on the pages in `programme/`.

## Setting up on HostAfrica (cPanel)

1. **Mailbox.** cPanel → *Email Accounts* → create
   `website@khuphukaleadershipacademy.co.za` with a strong password. `hello@`
   should already exist.
2. **Deliverability.** cPanel → *Email Deliverability* → press *Repair* on
   anything flagged (SPF, DKIM). Without this, enquiries can land in spam.
3. **Upload** the site into `public_html`, including the `api` folder and its
   `.htaccess` (File Manager hides dotfiles until *Settings → Show Hidden Files*).
4. **Settings.** In File Manager copy `api/config.example.php` to
   `api/config.php` and fill in the password. Check the server name and port
   under *Email Accounts → Connect Devices*; the defaults are
   `mail.khuphukaleadershipacademy.co.za`, port `465`, `ssl`.
5. **Test** from the live site (see the checklist below).

### Settings in `config.php`

| Key | Meaning |
|---|---|
| `smtp_host`, `smtp_port`, `smtp_secure` | The mail server. `465` + `ssl`, or `587` + `tls`. |
| `smtp_user`, `smtp_pass` | The mailbox the site signs in to. |
| `from_email`, `from_name` | Who the email says it is from. Keep this the same mailbox as `smtp_user`. |
| `to` | Where enquiries go. A list, so more people can be copied in. |
| `subject` | Start of the subject line; the visitor's name is added after it. |
| `rate_limit` | Messages one visitor may send per hour. |

If the mailbox password changes in cPanel, change it in `config.php` too, or
every send will fail.

## Test checklist

After any change to the server, the mailbox or these files:

- [ ] Send a message from the live site. The green thank-you appears.
- [ ] It arrives in `hello@` (check spam too).
- [ ] Pressing *Reply* addresses the visitor, not `website@`.
- [ ] A new row is in `api/storage/leads.csv` with `emailed` = `yes`.
- [ ] Opening `https://<domain>/api/config.php` and
      `https://<domain>/api/storage/leads.csv` in a browser gives *403 Forbidden*.

## Troubleshooting

Start with the two things the server writes down:

- **`api/storage/leads.csv`**: one row per enquiry. The last column, `emailed`,
  says whether the email went out. Download it through File Manager; it opens
  in Excel.
- **The PHP error log**: an `error_log` file in `api/` (or cPanel →
  *Metrics → Errors*). Every failure from `contact.php` starts with
  `contact.php:` and gives the reason.

To see exactly what the server answered, open the browser's developer tools →
*Network*, send the form, and click the `contact.php` request: the status code
and the JSON response are there.

| What you see | Likely cause | Fix |
|---|---|---|
| "The form is not set up yet…" (HTTP 500) | `api/config.php` is missing. | Create it from `config.example.php` (setup step 4). |
| "We could not send that just now…" (HTTP 502), row in the CSV with `emailed` = `no` | The email could not be sent. The reason is in `error_log`. | See the SMTP errors below. The enquiry is safe in the CSV; reply to it from there. |
| `SMTP Error: Could not authenticate` | Wrong `smtp_user` / `smtp_pass`, or the mailbox password was changed. | Reset the mailbox password in cPanel and update `config.php`. |
| `SMTP connect() failed` / `Connection refused` / timeout | Wrong host or port, or the port is blocked. | Check *Connect Devices* in cPanel. Try `587` + `tls`; on the same server, `localhost` also works as the host. |
| `certificate verify failed` | The mail server's certificate doesn't match `smtp_host`. | Use the host name shown in *Connect Devices* (often the server name, like `serverXX.hostafrica…`), not your own domain. |
| Thank-you shows, but no email arrives | It went to spam, or the mailbox is full. | Check spam; run *Email Deliverability → Repair*; check the `hello@` quota. The CSV still has the lead. |
| Thank-you shows, but no row in the CSV and no email | It was caught as spam: the hidden `honeypot` field was filled. Usually a browser autofill or password manager. | Rare for people. If it keeps happening, tell your developer. |
| "Please check your email address." (HTTP 400) | The email address is not valid. | Visitor error; nothing to fix. |
| "You have sent a few messages already…" (HTTP 429) | 5 sends from one IP in an hour. Common when testing. | Wait an hour, or delete the `rate-*.json` files in `api/storage/`, or raise `rate_limit`. |
| "We could not send that. Check your connection…" | The browser never got an answer: no internet, or `contact.php` is not where the form points. | Open `https://<domain>/api/contact.php` in a browser: it should show a JSON "Please use the contact form." error (405). A 404 means the `api` folder wasn't uploaded. |
| Every page in `api/` gives *500 Internal Server Error* | The server rejected a line in `api/.htaccess`. | Check `error_log`. Removing the `Options -Indexes` line usually fixes it. |
| `Call to undefined function mb_strlen()` | The `mbstring` PHP extension is off. | cPanel → *Select PHP Version* → *Extensions* → tick `mbstring`. Also needed: `openssl`. |
| `Permission denied` on `storage` | PHP can't create or write `api/storage/`. | Create the folder in File Manager with permissions `755`. |

## Changing things

- **Who receives enquiries:** edit `to` in `config.php`.
- **Messages on the page:** `sentText` and `errorText` in
  `scripts/contact-form.js`; the server's error wording is in `contact.php`.
- **Adding a field** (for example a phone number): add the input to the form in
  all 7 pages, then read it in `contact.php` next to `$name`, add it to the
  email `Body` and to the CSV row. The CSV header only gets written when the
  file is new, so rename the old `leads.csv` first.
- **Updating PHPMailer:** replace the three files in `api/vendor/PHPMailer/`
  with the same three from the `src/` folder of a newer release
  (github.com/PHPMailer/PHPMailer).

## Privacy

`leads.csv` holds people's names, emails and messages, so it falls under
POPIA. Download it only to devices you trust, and delete old rows you no longer
need.
