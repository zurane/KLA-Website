<?php
// Copy this file to config.php on the server and fill in the mailbox
// password. config.php is kept out of git so the password never is.
// The mailbox comes from cPanel > Email Accounts; the server details are
// under "Connect Devices" next to it.

return [
    // the mailbox the website signs in to and sends from
    'smtp_host'     => 'mail.khuphukaleadershipacademy.co.za',
    'smtp_port'     => 465,              // 465 = SSL, 587 = STARTTLS
    'smtp_secure'   => 'ssl',            // 'ssl' for 465, 'tls' for 587
    'smtp_user'     => 'website@khuphukaleadershipacademy.co.za',
    'smtp_pass'     => 'CHANGE-ME',

    'from_email'    => 'website@khuphukaleadershipacademy.co.za',
    'from_name'     => 'KLA Website',

    // where enquiries are delivered; add more addresses to copy others in
    'to'            => ['hello@khuphukaleadershipacademy.co.za'],
    'subject'       => 'New enquiry from the KLA website',

    // sends per visitor (by IP) per hour before they are turned away
    'rate_limit'    => 5,
];
