<?php
if (!ob_get_level()) ob_start();
if (session_status() === PHP_SESSION_NONE) session_start();

define('DB_HOST', 'localhost');
define('DB_NAME', 'chatbot_recruitment');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_PORT', '3307');

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    http_response_code(500);
    die(json_encode(['error' => 'Ошибка подключения к БД: ' . $e->getMessage()]));
}

function sanitize($data) {
    if (is_array($data)) return array_map('sanitize', $data);
    return htmlspecialchars(strip_tags(trim($data)));
}
?>