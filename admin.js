let currentVacancies = [];
let pendingDeleteId = null;
let pendingDeleteType = null;
let allApplications = []; // Храним все заявки для фильтрации

function showNotification(message, type = "success") {
  const notif = document.getElementById("notification");
  notif.textContent = message;
  notif.className = `notification ${type} show`;
  setTimeout(() => notif.classList.remove("show"), 3000);
}

// Функция переключения вкладки
function switchToTab(tab) {
  // Обновляем активную кнопку в sidebar
  document
    .querySelectorAll(".nav-item")
    .forEach((b) => b.classList.remove("active"));
  document
    .querySelector(`.nav-item[data-tab="${tab}"]`)
    .classList.add("active");

  // Обновляем видимость контента
  document
    .querySelectorAll(".tab-content")
    .forEach((t) => t.classList.remove("active"));
  document.getElementById(`${tab}-tab`).classList.add("active");

  // Обновляем заголовок
  const titles = {
    vacancies: "Управление вакансиями",
    applications: "Заявки кандидатов",
  };
  document.getElementById("page-title").textContent = titles[tab];

  // Загружаем нужные данные
  if (tab === "vacancies") {
    loadVacancies();
    const addBtn = document.getElementById("add-btn");
    if (addBtn) addBtn.style.display = "inline-flex";
  } else if (tab === "applications") {
    loadVacancyFilter();
    loadAllApplications();
    const addBtn = document.getElementById("add-btn");
    if (addBtn) addBtn.style.display = "none";
  }

  // Сохраняем активную вкладку в localStorage
  localStorage.setItem("activeTab", tab);
}

// Загрузка сохранённой вкладки при старте
function loadSavedTab() {
  const savedTab = localStorage.getItem("activeTab");
  if (savedTab === "vacancies" || savedTab === "applications") {
    switchToTab(savedTab);
  } else {
    switchToTab("vacancies");
  }
}

// Tab switching - обработчики кликов
document.querySelectorAll(".nav-item").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const tab = btn.dataset.tab;
    if (tab === "vacancies" || tab === "applications") {
      switchToTab(tab);
    }
  });
});

// Загружаем сохранённую вкладку при загрузке страницы
loadSavedTab();

// Load vacancy filter dropdown
async function loadVacancyFilter() {
  try {
    const res = await fetch("api.php?action=adminGetVacancies");
    const vacancies = await res.json();
    const select = document.getElementById("vacancy-filter");
    select.innerHTML =
      '<option value="all">Все вакансии</option>' +
      vacancies
        .map((v) => `<option value="${v.id}">${escapeHtml(v.title)}</option>`)
        .join("");
  } catch (err) {
    showNotification("Ошибка загрузки", "error");
  }
}

// Filter applications by selected vacancy
// Filter applications by selected vacancy
function filterApplications() {
  const vacancyId = document.getElementById("vacancy-filter").value;
  const container = document.getElementById("applications-list");
  const statsBar = document.getElementById("stats-bar");

  // Все заявки (без фильтра)
  const totalCount = allApplications.length;

  // Отфильтрованные заявки
  let filteredApps = allApplications;
  let filteredVacancyTitle = "Все вакансии";

  if (vacancyId !== "all") {
    filteredApps = allApplications.filter((app) => app.vacancy_id == vacancyId);
    const selectedOption =
      document.getElementById("vacancy-filter").options[
        document.getElementById("vacancy-filter").selectedIndex
      ];
    filteredVacancyTitle = selectedOption.text;
  }

  // Уникальные вакансии в отфильтрованных заявках
  const uniqueVacancies = [
    ...new Set(
      filteredApps.map((app) => app.vacancy_title || "Удаленная вакансия"),
    ),
  ];

  statsBar.innerHTML = `
    <div class="stat-card">
      <div class="stat-number">${totalCount}</div>
      <div class="stat-label">Всего заявок</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${filteredApps.length}</div>
      <div class="stat-label">Заявок по фильтру</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${uniqueVacancies.length}</div>
      <div class="stat-label">Вакансий</div>
    </div>
  `;

  if (!filteredApps.length) {
    container.innerHTML =
      '<div style="text-align:center;padding:60px;color:#94a3b8;"></div>';
    return;
  }

  container.innerHTML = renderApplications(filteredApps);
}

// Load all applications
async function loadAllApplications() {
  try {
    const res = await fetch("api.php?action=getApplications");
    const apps = await res.json();

    if (apps.error) {
      showNotification(apps.error, "error");
      return;
    }

    if (!Array.isArray(apps)) {
      console.error("apps is not an array:", apps);
      return;
    }

    allApplications = apps;
    filterApplications(); // Отображаем с текущим фильтром
  } catch (err) {
    console.error("loadAllApplications error:", err);
    showNotification("Ошибка загрузки: " + err.message, "error");
  }
}

// Render applications function
function renderApplications(apps) {
  if (!apps || !apps.length)
    return '<div style="text-align:center;padding:60px;color:#94a3b8;"></div>';

  return apps
    .map((app) => {
      const answers = app.answers || {};
      return `
        <div class="application-card">
            <div class="application-header">
    <span class="application-title">
    <span class="application-svg-icon">
         <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <path d="M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"/>
                        <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        <path d="M21 21v-2a4 4 0 0 0 -3 -3.85"/>
                    </svg> Заявка #${app.id || "?"}</span>
        <span class="vacancy-name">${escapeHtml(app.vacancy_title || "Вакансия удалена")}</span>
    </span>
    <span class="application-date">${app.created_at ? new Date(app.created_at).toLocaleString("ru-RU") : "—"}</span>
</div>
            <div class="application-fields">
                <div class="application-field"><strong>Имя:</strong> <span>${escapeHtml(answers.firstName) || "—"}</span></div>
                <div class="application-field"><strong>Телефон:</strong> <span>${escapeHtml(answers.phone) || "—"}</span></div>
                <div class="application-field"><strong>Опыт:</strong> <span>${escapeHtml(answers.experience) || "—"} лет</span></div>
                <div class="application-field"><strong>Расположение:</strong> <span>${escapeHtml(answers.location) || "—"}</span></div>
                <div class="application-field"><strong>График:</strong> <span>${escapeHtml(answers.schedule) || "—"}</span></div>
                <div class="application-field"><strong>Образование:</strong> <span>${escapeHtml(answers.education) || "—"}</span></div>
                <div class="application-field"><strong>Зарплата:</strong> <span>${escapeHtml(answers.expectedSalary) || "—"} ₽</span></div>
            </div>
           ${
             app.resume_path
               ? `<div class="application-field" style="margin-top:12px;"><strong>Резюме:</strong> <span><a href="${app.resume_path}" class="resume-link" target="_blank">Скачать</a></span></div>`
               : `<div class="application-field" style="margin-top:12px;"><strong>Резюме:</strong> <span style="color:#94a3b8;">— не прикреплено —</span></div>`
           }
            <div class="application-actions">
                <button class="btn-small btn-danger" onclick="confirmDelete('application', ${app.id})"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-trash"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg> Удалить заявку</button>
            </div>
        </div>
      `;
    })
    .join("");
}

// Vacancy Modal
function showVacancyModal(vacancy = null) {
  const modal = document.getElementById("vacancyModal");
  if (vacancy) {
    document.getElementById("vacancyModalTitle").textContent =
      "Редактировать вакансию";
    document.getElementById("vacancy-id").value = vacancy.id;
    document.getElementById("vacancy-title").value = vacancy.title;
    document.getElementById("vacancy-description").value = vacancy.description;
    document.getElementById("vacancy-salary-min").value =
      vacancy.salary_min || "";
    document.getElementById("vacancy-salary-max").value =
      vacancy.salary_max || "";
    document.getElementById("vacancy-schedule").value = vacancy.schedule || "";

    document.querySelectorAll(".schedule-option").forEach((btn) => {
      if (btn.dataset.schedule === vacancy.schedule) {
        btn.classList.add("selected");
      } else {
        btn.classList.remove("selected");
      }
    });
  } else {
    document.getElementById("vacancyModalTitle").textContent = "Новая вакансия";
    document.getElementById("vacancy-id").value = "";
    document.getElementById("vacancy-title").value = "";
    document.getElementById("vacancy-description").value = "";
    document.getElementById("vacancy-salary-min").value = "";
    document.getElementById("vacancy-salary-max").value = "";
    document.getElementById("vacancy-schedule").value = "";

    document
      .querySelectorAll(".schedule-option")
      .forEach((btn) => btn.classList.remove("selected"));
  }
  modal.style.display = "flex";
}

// Schedule buttons handler
document.querySelectorAll(".schedule-option").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".schedule-option")
      .forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    document.getElementById("vacancy-schedule").value = btn.dataset.schedule;
  });
});

async function saveVacancy() {
  const id = document.getElementById("vacancy-id").value;
  const data = {
    title: document.getElementById("vacancy-title").value.trim(),
    description: document.getElementById("vacancy-description").value,
    salary_min: document.getElementById("vacancy-salary-min").value || null,
    salary_max: document.getElementById("vacancy-salary-max").value || null,
    schedule: document.getElementById("vacancy-schedule").value,
  };

  if (!data.title) {
    showNotification("Введите название вакансии", "error");
    return;
  }

  const url = id
    ? "api.php?action=updateVacancy"
    : "api.php?action=createVacancy";
  if (id) data.id = id;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();

    if (result.error) {
      showNotification(result.error, "error");
    } else {
      showNotification(id ? "Вакансия обновлена" : "Вакансия создана");
      closeModal("vacancyModal");
      loadVacancies();
      loadVacancyFilter();
    }
  } catch (err) {
    showNotification("Ошибка: " + err.message, "error");
  }
}

function confirmDelete(type, id, title = "") {
  pendingDeleteId = id;
  pendingDeleteType = type;
  const msg =
    type === "vacancy"
      ? `Удалить вакансию "${title}"? Все связанные заявки также будут удалены.`
      : "Удалить эту заявку?";
  document.getElementById("delete-message").textContent = msg;
  document.getElementById("deleteModal").style.display = "flex";
}

async function executeDelete() {
  if (!pendingDeleteId) return;

  const action =
    pendingDeleteType === "vacancy"
      ? `deleteVacancy&id=${pendingDeleteId}`
      : `deleteApplication&id=${pendingDeleteId}`;

  try {
    const res = await fetch(`api.php?action=${action}`, { method: "DELETE" });
    const result = await res.json();

    if (result.success) {
      showNotification(
        pendingDeleteType === "vacancy" ? "Вакансия удалена" : "Заявка удалена",
      );
      closeModal("deleteModal");
      if (pendingDeleteType === "vacancy") {
        loadVacancies();
        loadVacancyFilter();
      } else {
        loadAllApplications(); // Перезагружаем заявки
      }
    } else {
      showNotification("Ошибка удаления", "error");
    }
  } catch (err) {
    showNotification("Ошибка: " + err.message, "error");
  }
  pendingDeleteId = null;
}

async function toggleVacancyStatus(id, currentStatus) {
  const vacancy = currentVacancies.find((v) => v.id === id);
  if (vacancy) {
    vacancy.is_active = currentStatus ? 0 : 1;
    try {
      const res = await fetch("api.php?action=updateVacancy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vacancy),
      });
      const result = await res.json();
      if (result.success) {
        showNotification(
          `Вакансия ${currentStatus ? "деактивирована" : "активирована"}`,
        );
        loadVacancies();
      } else {
        showNotification("Ошибка", "error");
      }
    } catch (err) {
      showNotification("Ошибка: " + err.message, "error");
    }
  }
}

async function loadVacancies() {
  try {
    const res = await fetch("api.php?action=adminGetVacancies");
    currentVacancies = await res.json();
    const container = document.getElementById("vacancies-list");

    if (!currentVacancies.length) {
      container.innerHTML =
        '<div style="text-align:center;padding:60px;color:#94a3b8;">📭 Нет вакансий. Создайте первую!</div>';
      return;
    }

    container.innerHTML = currentVacancies
      .map(
        (v) => `
          <div class="vacancy-card">
              <div class="vacancy-header">
                  <span class="vacancy-title">${escapeHtml(v.title)}</span>
              </div>
              <div class="vacancy-info">
                  <p>Зарплата: ${v.salary_min || "не указано"} - ${v.salary_max || "не указано"} ₽</p>
                  <p>График: ${v.schedule || "не указан"}</p>
              </div>
              <div class="vacancy-description">Описание: ${escapeHtml((v.description || "").substring(0, 150))}${(v.description || "").length > 150 ? "..." : ""}</div>
              <div class="vacancy-actions">
                  <button class="btn-small btn-primary" onclick='showVacancyModal(${JSON.stringify(v).replace(/'/g, "&#39;")})'><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-edit"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" /><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415" /><path d="M16 5l3 3" /></svg> Изменить</button>
                  
                  <button class="btn-small btn-danger" onclick="confirmDelete('vacancy', ${v.id}, '${escapeHtml(v.title)}')"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-trash"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg> Удалить</button>
              </div>
          </div>
        `,
      )
      .join("");
  } catch (err) {
    showNotification("Ошибка загрузки", "error");
  }
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

function escapeHtml(str) {
  if (str === undefined || str === null) return "";
  const string = String(str);
  return string.replace(/[&<>]/g, function (m) {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}

// Confirm delete button handler
document
  .getElementById("confirm-delete-btn")
  ?.addEventListener("click", executeDelete);

// Load initial data
loadVacancies();
