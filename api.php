<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

require_once __DIR__ . '/db.php';

$action = $_GET['action'] ?? '';

try {
    // Получение всех активных вакансий (для чата)
    if ($action === 'getVacancies') {
        $stmt = $pdo->query("SELECT id, title, description, salary_min, salary_max, schedule FROM vacancies WHERE is_active = 1 ORDER BY id DESC");
        echo json_encode($stmt->fetchAll());
        exit;
    }

    // Получение вопросов для вакансии
    if ($action === 'getQuestions' && isset($_GET['vacancy_id'])) {
        $vacancy_id = intval($_GET['vacancy_id']);
        $stmt = $pdo->prepare("SELECT * FROM vacancy_questions WHERE vacancy_id = ? ORDER BY step_order");
        $stmt->execute([$vacancy_id]);
        $questions = $stmt->fetchAll();
        foreach ($questions as &$q) {
            $q['options'] = $q['options_json'] ? json_decode($q['options_json'], true) : [];
            unset($q['options_json']);
        }
        echo json_encode($questions);
        exit;
    }

    // Отправка заявки
    if ($action === 'submitApplication') {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) throw new Exception('Invalid JSON');
        
        $vacancy_id = intval($data['vacancy_id']);
        $answers = $data['answers'];
        $resume_path = $answers['resumeFile'] ?? null;
        
        // ========== ПРОВЕРКА СОГЛАСИЯ ==========
        // Проверка согласия - обязательно
        $consent = isset($answers['consentGiven']) && $answers['consentGiven'] === true;
        if (!$consent) {
            echo json_encode(['error' => 'Требуется согласие на обработку персональных данных']);
            exit;
        }
        // ======================================
        
        // Валидация телефона
        if (isset($answers['phone'])) {
            $phone = preg_replace('/[^0-9]/', '', $answers['phone']);
            if (!preg_match('/^7\d{10}$/', $phone)) {
                echo json_encode(['error' => 'Неверный формат телефона']);
                exit;
            }
        }
        
        // Валидация имени
        if (isset($answers['firstName'])) {
            $answers['firstName'] = preg_replace('/[^а-яёА-ЯЁa-zA-Z\s\-]/u', '', $answers['firstName']);
        }
        
        // IP и User-Agent для доказательства согласия
        $consent_ip = $_SERVER['REMOTE_ADDR'] ?? null;
        $consent_user_agent = $_SERVER['HTTP_USER_AGENT'] ?? null;
        
        // Сохраняем согласие в БД как 1 (true)
        $stmt = $pdo->prepare("INSERT INTO applications (vacancy_id, answers_json, resume_path, consent_granted, consent_ip, consent_user_agent, consent_created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())");
        $stmt->execute([
            $vacancy_id, 
            json_encode($answers, JSON_UNESCAPED_UNICODE), 
            $resume_path,
            1, // consent_granted = 1 (ДА)
            $consent_ip,
            $consent_user_agent
        ]);
        
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        exit;
    }
    
    // ========== АДМИНКА ==========
    
    // Админка: все вакансии
    if ($action === 'adminGetVacancies') {
        $stmt = $pdo->query("SELECT * FROM vacancies ORDER BY id DESC");
        echo json_encode($stmt->fetchAll());
        exit;
    }

    // Админка: создание вакансии
    if ($action === 'createVacancy') {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) throw new Exception('Invalid JSON');
        
        $check = $pdo->prepare("SELECT id FROM vacancies WHERE LOWER(title) = LOWER(?)");
        $check->execute([trim($data['title'])]);
        if ($check->fetch()) {
            echo json_encode(['error' => 'Вакансия с таким названием уже существует']);
            exit;
        }
        
        $stmt = $pdo->prepare("INSERT INTO vacancies (title, description, salary_min, salary_max, schedule, is_active) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            trim($data['title']),
            $data['description'],
            $data['salary_min'] ?: null,
            $data['salary_max'] ?: null,
            $data['schedule'],
            $data['is_active'] ?? 1
        ]);
        echo json_encode(['id' => $pdo->lastInsertId(), 'success' => true]);
        exit;
    }

    // Админка: обновление вакансии
    if ($action === 'updateVacancy') {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) throw new Exception('Invalid JSON');
        
        $check = $pdo->prepare("SELECT id FROM vacancies WHERE LOWER(title) = LOWER(?) AND id != ?");
        $check->execute([trim($data['title']), $data['id']]);
        if ($check->fetch()) {
            echo json_encode(['error' => 'Вакансия с таким названием уже существует']);
            exit;
        }
        
        $stmt = $pdo->prepare("UPDATE vacancies SET title=?, description=?, salary_min=?, salary_max=?, schedule=?, is_active=? WHERE id=?");
        $stmt->execute([
            trim($data['title']),
            $data['description'],
            $data['salary_min'] ?: null,
            $data['salary_max'] ?: null,
            $data['schedule'],
            $data['is_active'] ?? 1,
            $data['id']
        ]);
        echo json_encode(['success' => true]);
        exit;
    }

    // Админка: удаление вакансии
    if ($action === 'deleteVacancy') {
        $id = intval($_GET['id']);
        $stmt = $pdo->prepare("DELETE FROM vacancies WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
        exit;
    }

    // Админка: получить вопросы
    if ($action === 'getVacancyQuestions' && isset($_GET['vacancy_id'])) {
        $vacancy_id = intval($_GET['vacancy_id']);
        $stmt = $pdo->prepare("SELECT * FROM vacancy_questions WHERE vacancy_id = ? ORDER BY step_order");
        $stmt->execute([$vacancy_id]);
        $questions = $stmt->fetchAll();
        foreach ($questions as &$q) {
            $q['options'] = $q['options_json'] ? json_decode($q['options_json'], true) : [];
            unset($q['options_json']);
        }
        echo json_encode($questions);
        exit;
    }

    // Админка: сохранить вопросы
    if ($action === 'saveQuestions') {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) throw new Exception('Invalid JSON');
        
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("DELETE FROM vacancy_questions WHERE vacancy_id = ?");
            $stmt->execute([$data['vacancy_id']]);
            
            $insert = $pdo->prepare("INSERT INTO vacancy_questions (vacancy_id, step_order, bot_message, type, options_json, field_name, validation, required) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($data['questions'] as $q) {
                $options_json = isset($q['options']) ? json_encode($q['options']) : null;
                $insert->execute([
                    $data['vacancy_id'],
                    $q['step_order'],
                    $q['bot_message'],
                    $q['type'],
                    $options_json,
                    $q['field_name'],
                    $q['validation'] ?? null,
                    isset($q['required']) && $q['required'] ? 1 : 0
                ]);
            }
            $pdo->commit();
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
        exit;
    }

    // Админка: получить ВСЕ заявки
    if ($action === 'getApplications') {
        $stmt = $pdo->query("SELECT a.*, v.title AS vacancy_title FROM applications a LEFT JOIN vacancies v ON a.vacancy_id = v.id ORDER BY a.created_at DESC");
        $apps = $stmt->fetchAll();
        foreach ($apps as &$app) {
            $app['answers'] = json_decode($app['answers_json'], true);
            unset($app['answers_json']);
        }
        echo json_encode($apps);
        exit;
    }

    // Админка: получить заявки по конкретной вакансии
    if ($action === 'getApplicationsByVacancy' && isset($_GET['vacancy_id'])) {
        $vacancy_id = intval($_GET['vacancy_id']);
        $stmt = $pdo->prepare("SELECT a.*, v.title AS vacancy_title FROM applications a LEFT JOIN vacancies v ON a.vacancy_id = v.id WHERE a.vacancy_id = ? ORDER BY a.created_at DESC");
        $stmt->execute([$vacancy_id]);
        $apps = $stmt->fetchAll();
        foreach ($apps as &$app) {
            $app['answers'] = json_decode($app['answers_json'], true);
            unset($app['answers_json']);
        }
        echo json_encode($apps);
        exit;
    }

    // Админка: удаление заявки
    if ($action === 'deleteApplication') {
        $id = intval($_GET['id']);
        $stmt = $pdo->prepare("DELETE FROM applications WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
        exit;
    }

    // Загрузка резюме
    if ($action === 'uploadResume') {
        if (!isset($_FILES['resume']) || $_FILES['resume']['error'] !== UPLOAD_ERR_OK) {
            echo json_encode(['error' => 'Ошибка загрузки файла']);
            exit;
        }
        
        $allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        $allowedExt = ['pdf', 'doc', 'docx'];
        
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $_FILES['resume']['tmp_name']);
        finfo_close($finfo);
        
        $ext = strtolower(pathinfo($_FILES['resume']['name'], PATHINFO_EXTENSION));
        
        if (!in_array($mime, $allowed) || !in_array($ext, $allowedExt)) {
            echo json_encode(['error' => 'Разрешены только PDF, DOC, DOCX']);
            exit;
        }
        
        $filename = uniqid() . '.' . $ext;
        $uploadPath = 'uploads/' . $filename;
        
        if (!move_uploaded_file($_FILES['resume']['tmp_name'], $uploadPath)) {
            echo json_encode(['error' => 'Не удалось сохранить файл']);
            exit;
        }
        
        echo json_encode(['file_path' => $uploadPath]);
        exit;
    }
    
    // Если действие не найдено
    http_response_code(404);
    echo json_encode(['error' => 'Action not found: ' . $action]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>