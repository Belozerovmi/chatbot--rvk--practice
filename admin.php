<?php
session_start();

if (!isset($_SESSION['admin_logged'])) {
    if (isset($_POST['password']) && $_POST['password'] === 'admin123') {
        $_SESSION['admin_logged'] = true;
    } else {
        echo '<!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
            <title>Вход в админ-панель</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
                }
                
                body {
                    background: linear-gradient(135deg, #1485d1 0%, #0c5a8f 100%);
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 20px;
                }
                
                .login-card {
                    background: white;
                    padding: 40px 32px;
                    border-radius: 24px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    width: 100%;
                    max-width: 400px;
                    text-align: center;
                    transition: transform 0.3s ease;
                }
                
                .login-card:hover {
                    transform: translateY(-4px);
                }
                
                .login-card h2 {
                    color: #1485d1;
                    margin-bottom: 8px;
                    font-size: 28px;
                    font-weight: 700;
                }
                
                .login-card p {
                    color: #64748b;
                    margin-bottom: 32px;
                    font-size: 14px;
                }
                
                .login-card input {
                    width: 100%;
                    padding: 14px 16px;
                    margin: 8px 0;
                    border: 2px solid #e2e8f0;
                    border-radius: 12px;
                    font-size: 15px;
                    outline: none;
                    transition: all 0.3s;
                    background: #f8fafc;
                }
                
                .login-card input:focus {
                    border-color: #1485d1;
                    background: #ffffff;
                    box-shadow: 0 0 0 3px rgba(20, 133, 209, 0.1);
                }
                
                .login-card input::placeholder {
                    color: #94a3b8;
                }
                
                .login-card button {
                    width: 100%;
                    padding: 14px;
                    background: #1485d1;
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                    margin-top: 16px;
                }
                
                .login-card button:hover {
                    background: #0f6bb0;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(20, 133, 209, 0.3);
                }
                
                .login-card button:active {
                    transform: translateY(0);
                }
                
               
                
            
                
                .login-footer {
                    margin-top: 24px;
                    font-size: 12px;
                    color: #94a3b8;
                    border-top: 1px solid #e2e8f0;
                    padding-top: 20px;
                }
                
                /* Адаптив для мобильных устройств */
                @media (max-width: 480px) {
                    body {
                        padding: 16px;
                    }
                    
                    .login-card {
                        padding: 32px 24px;
                        border-radius: 20px;
                    }
                    
                    .login-card h2 {
                        font-size: 24px;
                    }
                    
                    .login-card input {
                        padding: 12px 14px;
                        font-size: 14px;
                    }
                    
                    .login-card button {
                        padding: 12px;
                        font-size: 15px;
                    }
                }
                
                /* Для очень маленьких экранов */
                @media (max-width: 360px) {
                    .login-card {
                        padding: 24px 20px;
                    }
                    
                    .login-card h2 {
                        font-size: 22px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="login-card">
                <h2> Админ-панель</h2>
                <p>РВК-Воронеж • Подбор персонала</p>
                <form method="POST">
                    <input type="password" name="password" placeholder="Введите пароль" required autofocus>
                    <button type="submit">Войти</button>
                </form>
                <div class="login-footer">
                    <span>Внутренняя система управления</span>
                </div>
            </div>
        </body>
        </html>';
        exit;
    }
}
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Админ-панель | РВК-Воронеж</title>
    <link rel="stylesheet" href="AdminStyle.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <div class="admin-container">
        <!-- Sidebar -->
        <aside class="sidebar">
            <div class="sidebar-header">
                <div class="logo">
                    <div class="logo-icon">
                        <img class="logo-icon" src="RVK-logo.png" alt="">
                    </div>
                    <span>РВК-Воронеж</span>
                </div>
            </div>
            <nav class="sidebar-nav">
                <button class="nav-item active" data-tab="vacancies">
                    <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <path d="M9.615 20h-2.615a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v8"/>
                        <path d="M14 19l2 2l4 -4"/>
                        <path d="M9 8h4"/>
                        <path d="M9 12h2"/>
                    </svg>
                    <span>Вакансии</span>
                </button>
                <button class="nav-item" data-tab="applications">
                    <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <path d="M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"/>
                        <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        <path d="M21 21v-2a4 4 0 0 0 -3 -3.85"/>
                    </svg>
                    <span>Заявки</span>
                </button>
            </nav>
            <div class="sidebar-footer">
                <form method="POST" action="logout.php" style="width: 100%;">
                    <button type="submit" class="logout-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                            <path d="M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2"/>
                            <path d="M9 12h12l-3 -3"/>
                            <path d="M18 15l3 -3"/>
                        </svg>
                        <span>Выйти</span>
                    </button>
                </form>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <div class="content-header">
                <h1 id="page-title">Управление вакансиями</h1>
                <button class="btn-primary add-vacancy" id="add-btn" onclick="showVacancyModal()">+ Новая вакансия</button>
            </div>

            <!-- Vacancies Tab -->
            <div id="vacancies-tab" class="tab-content active">
                <div id="vacancies-list" class="cards-grid"></div>
            </div>

            <!-- Applications Tab (с фильтром) -->
            <div id="applications-tab" class="tab-content">
                <div class="filter-section">
                    <label>Фильтр по вакансии:</label>
                    <select id="vacancy-filter" class="vacancy-filter" onchange="filterApplications()">
                        <option value="all">-- Все вакансии --</option>
                    </select>
                </div>
                <div class="stats-bar" id="stats-bar"></div>
                <div id="applications-list" class="applications-list"></div>
            </div>
        </main>
    </div>

    <!-- Modal for Vacancy -->
    <div id="vacancyModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="vacancyModalTitle">Новая вакансия</h2>
                <button class="modal-close" onclick="closeModal('vacancyModal')">&times;</button>
            </div>
            <div class="modal-body">
                <input type="hidden" id="vacancy-id">
                <div class="form-group">
                    <label>Название вакансии</label>
                    <input type="text" id="vacancy-title" placeholder="Например: Инженер ВКХ" required>
                </div>
                <div class="form-group">
                    <label>Описание вакансии</label>
                    <textarea id="vacancy-description" rows="6" placeholder="Полное описание..."></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Зарплата от (₽)</label>
                        <input type="number" id="vacancy-salary-min" placeholder="55000">
                    </div>
                    <div class="form-group">
                        <label>Зарплата до (₽)</label>
                        <input type="number" id="vacancy-salary-max" placeholder="70000">
                    </div>
                </div>
                <div class="form-group table-group">
                    <label>График работы</label>
                    <div class="schedule-group">
                        <button type="button" class="schedule-option" data-schedule="5/2 полный день">5/2</button>
                        <button type="button" class="schedule-option" data-schedule="Сменный график">Сменный</button>
                        <button type="button" class="schedule-option" data-schedule="Гибкий график">Гибкий</button>
                        <button type="button" class="schedule-option" data-schedule="Удаленная работа">Удалёнка</button>
                    </div>
                    <input type="text" id="vacancy-schedule" placeholder="Или укажите свой вариант" style="margin-top: 10px;">
                </div>
                <!-- <div class="form-group">
                    <label class="checkbox">
                        <input type="checkbox" id="vacancy-is-active" checked>
                        <span class="checkbox-label">Вакансия активна</span>
                    </label>
                </div> -->
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeModal('vacancyModal')">Отмена</button>
                <button class="btn-primary save-btn" onclick="saveVacancy()">Сохранить</button>
            </div>
        </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div id="deleteModal" class="modal">
        <div class="modal-content modal-sm">
            <div class="modal-header">
                <h2>Подтверждение</h2>
                <button class="modal-close" onclick="closeModal('deleteModal')">&times;</button>
            </div>
            <div class="modal-body">
                <p id="delete-message">Вы уверены, что хотите удалить?</p>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeModal('deleteModal')">Отмена</button>
                <button class="btn-danger" id="confirm-delete-btn">Удалить</button>
            </div>
        </div>
    </div>

    <div id="notification" class="notification"></div>

    <script src="admin.js"></script>
</body>
</html>