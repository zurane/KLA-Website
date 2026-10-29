<?php
// Receives the footer contact form, keeps a copy of the lead, and emails it
// to the academy through the site's own mailbox (see config.example.php).
//
// Answers fetch() with JSON ({ success, message | error }) and a plain form
// post with a redirect back to the page it came from.

declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as MailException;

require __DIR__ . '/vendor/PHPMailer/Exception.php';
require __DIR__ . '/vendor/PHPMailer/PHPMailer.php';
require __DIR__ . '/vendor/PHPMailer/SMTP.php';

const MAX_NAME = 120;
const MAX_EMAIL = 254;
const MAX_MESSAGE = 5000;

$wantsJson = stripos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;

function respond(bool $ok, string $text, int $status = 200): void
{
    global $wantsJson;

    if ($wantsJson) {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($ok ? ['success' => true, 'message' => $text] : ['success' => false, 'error' => $text]);
        exit;
    }

    // no JS: back to the page, where contact-form.js reads the flag
    $back = $_SERVER['HTTP_REFERER'] ?? '/';
    $back = strtok($back, '#');
    $back = preg_replace('/([?&])contact=[^&]*&?/', '$1', $back);
    $back = rtrim($back, '?&');
    $back .= (strpos($back, '?') === false ? '?' : '&') . 'contact=' . ($ok ? 'sent' : 'error') . '#contact';
    header('Location: ' . $back, true, 303);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    respond(false, 'Please use the contact form.', 405);
}

$configFile = __DIR__ . '/config.php';
if (!is_file($configFile)) {
    error_log('contact.php: api/config.php is missing');
    respond(false, 'The form is not set up yet. Please email hello@khuphukaleadershipacademy.co.za.', 500);
}
$config = require $configFile;

// bots fill every field, people never see this one; pretend it worked
if (trim((string) ($_POST['honeypot'] ?? '')) !== '') {
    respond(true, 'Form submitted successfully');
}

// one line each, so nothing can be smuggled into the mail headers
$name = trim(preg_replace('/[\r\n\t]+/', ' ', (string) ($_POST['name'] ?? '')));
$email = trim((string) ($_POST['email'] ?? ''));
$message = trim(str_replace("\r\n", "\n", (string) ($_POST['message'] ?? '')));

if ($name === '' || $email === '' || $message === '') {
    respond(false, 'Please fill in your name, email and message.', 400);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > MAX_EMAIL) {
    respond(false, 'Please check your email address.', 400);
}
if (mb_strlen($name) > MAX_NAME || mb_strlen($message) > MAX_MESSAGE) {
    respond(false, 'That message is too long. Please shorten it and try again.', 413);
}

// leads and rate-limit counts live here; .htaccess keeps it private
$storage = __DIR__ . '/storage';
if (!is_dir($storage)) {
    mkdir($storage, 0750, true);
}

// rate limit: a small file per visitor holding their recent send times
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$hitsFile = $storage . '/rate-' . hash('sha256', $ip) . '.json';
$now = time();
$hits = is_file($hitsFile) ? (json_decode((string) file_get_contents($hitsFile), true) ?: []) : [];
$hits = array_values(array_filter($hits, fn ($t) => $t > $now - 3600));
if (count($hits) >= (int) ($config['rate_limit'] ?? 5)) {
    respond(false, 'You have sent a few messages already. Please try again later, or email hello@khuphukaleadershipacademy.co.za.', 429);
}
$hits[] = $now;
file_put_contents($hitsFile, json_encode($hits), LOCK_EX);

// keep every lead, so a mail failure never loses one
$page = (string) ($_SERVER['HTTP_REFERER'] ?? '');
$log = fopen($storage . '/leads.csv', 'a');
if ($log) {
    flock($log, LOCK_EX);
    if (ftell($log) === 0) {
        fputcsv($log, ['received', 'name', 'email', 'message', 'page', 'ip', 'emailed']);
    }
}

$mail = new PHPMailer(true);
$sent = false;

try {
    $mail->isSMTP();
    $mail->Host = $config['smtp_host'];
    $mail->Port = (int) $config['smtp_port'];
    $mail->SMTPSecure = $config['smtp_secure'];
    $mail->SMTPAuth = true;
    $mail->Username = $config['smtp_user'];
    $mail->Password = $config['smtp_pass'];
    $mail->CharSet = PHPMailer::CHARSET_UTF8;

    // sent from the site's own address, with replies going to the visitor
    $mail->setFrom($config['from_email'], $config['from_name']);
    foreach ((array) $config['to'] as $to) {
        $mail->addAddress($to);
    }
    $mail->addReplyTo($email, $name);

    $mail->Subject = $config['subject'] . ': ' . $name;
    $mail->Body = "Name: {$name}\nEmail: {$email}\nPage: {$page}\n\n{$message}\n";

    $mail->send();
    $sent = true;
} catch (MailException $error) {
    error_log('contact.php: ' . $mail->ErrorInfo);
}

if ($log) {
    // a leading = + - @ would run as a formula when the CSV opens in Excel
    $cell = fn (string $value) => preg_match('/^[=+\-@\t\r]/', $value) ? "'" . $value : $value;
    fputcsv($log, array_map($cell, [date('c', $now), $name, $email, $message, $page, $ip, $sent ? 'yes' : 'no']));
    flock($log, LOCK_UN);
    fclose($log);
}

if (!$sent) {
    respond(false, 'We could not send that just now. Please try again, or email hello@khuphukaleadershipacademy.co.za.', 502);
}

respond(true, 'Form submitted successfully');
