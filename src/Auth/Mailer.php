<?php
declare(strict_types=1);

namespace SilentSpirits\ItemCreator\Auth;

use PHPMailer\PHPMailer\Exception as MailException;
use PHPMailer\PHPMailer\PHPMailer;
use RuntimeException;

/**
 * Sends the site's email (account verification, password resets) from the no-reply mailbox.
 *
 * config 'mail':
 *   transport   'smtp' sends for real (PHPMailer, vendored in lib/phpmailer); 'log' writes each
 *               message to a file instead (local development and tests: nothing leaves the machine)
 *   host, port, encryption ('ssl' or 'tls'), username, password   SMTP (Dreamhost: smtp.dreamhost.com, 465, ssl)
 *   from, from_name   the sender
 *   log_dir     where 'log' writes (default: the system temp dir, itemcreator-mail/)
 */
final class Mailer
{
    /** @param array<string, mixed> $config */
    public function __construct(private array $config, private string $root)
    {
    }

    /** @return string where it went: "smtp" or the log file's path */
    public function send(string $to, string $subject, string $text, string $html): string
    {
        $transport = $this->config['transport'] ?? 'log';
        if ($transport === 'log') {
            return $this->log($to, $subject, $text);
        }
        if ($transport !== 'smtp') {
            throw new RuntimeException("Unknown mail transport '$transport' (use 'smtp' or 'log').");
        }

        require_once $this->root . '/lib/phpmailer/src/Exception.php';
        require_once $this->root . '/lib/phpmailer/src/PHPMailer.php';
        require_once $this->root . '/lib/phpmailer/src/SMTP.php';

        $mail = new PHPMailer(true);
        try {
            $mail->isSMTP();
            $mail->Host = (string) ($this->config['host'] ?? '');
            $mail->Port = (int) ($this->config['port'] ?? 465);
            $mail->SMTPAuth = true;
            $mail->Username = (string) ($this->config['username'] ?? '');
            $mail->Password = (string) ($this->config['password'] ?? '');
            $mail->SMTPSecure = ($this->config['encryption'] ?? 'ssl') === 'tls' ? PHPMailer::ENCRYPTION_STARTTLS : PHPMailer::ENCRYPTION_SMTPS;
            $mail->CharSet = PHPMailer::CHARSET_UTF8;
            $mail->setFrom((string) $this->config['from'], (string) ($this->config['from_name'] ?? ''));
            $mail->addAddress($to);
            $mail->Subject = $subject;
            $mail->isHTML(true);
            $mail->Body = $html;
            $mail->AltBody = $text;
            $mail->send();
        } catch (MailException $e) {
            // PHPMailer's message can include server replies; log it, don't show it.
            error_log('[itemcreator] mail to ' . $to . ' failed: ' . $mail->ErrorInfo);
            throw new RuntimeException('The email could not be sent.', 0, $e);
        }
        return 'smtp';
    }

    private function log(string $to, string $subject, string $text): string
    {
        $dir = $this->config['log_dir'] ?? (sys_get_temp_dir() . '/itemcreator-mail');
        if (!is_dir($dir)) {
            @mkdir($dir, 0775, true);
        }
        $file = sprintf('%s/%s-%s.txt', $dir, gmdate('Ymd-His'), bin2hex(random_bytes(3)));
        $message = "To: $to\nSubject: $subject\nDate: " . gmdate(DATE_RFC2822) . "\n\n$text\n";
        if (file_put_contents($file, $message) === false) {
            throw new RuntimeException("Couldn't write the mail log in $dir.");
        }
        return $file;
    }
}
