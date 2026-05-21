let currentVacancy = null;
let vacanciesList = [];
let questions = [];
let currentStep = 0;
let answers = {};
let isFirstOpen = true;
let isChatFinished = false;
let waitingForVacancySelection = false;
let waitingForReturnResponse = false;

const messagesDiv = document.getElementById("messages");
const inputArea = document.getElementById("inputArea");

function getCurrentTime() {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
}

function scrollToMessage(position) {
  if (position === "top") messagesDiv.scrollTop = 0;
  else messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function addBotMessage(text, isError = false) {
  const time = getCurrentTime();
  const wrapper = document.createElement("div");
  wrapper.className = "message-wrapper bot-wrapper";
  const msg = document.createElement("div");
  msg.className = "message bot" + (isError ? " error-message" : "");
  msg.innerHTML = text.replace(/\n/g, "<br>");
  const timeSpan = document.createElement("span");
  timeSpan.className = "message-time bot-time";
  timeSpan.textContent = time;
  wrapper.appendChild(msg);
  wrapper.appendChild(timeSpan);
  messagesDiv.appendChild(wrapper);
  scrollToLastMessage();
}

function addUserMessage(text) {
  const time = getCurrentTime();
  const wrapper = document.createElement("div");
  wrapper.className = "message-wrapper user-wrapper";
  const timeSpan = document.createElement("span");
  timeSpan.className = "message-time user-time";
  timeSpan.textContent = time;
  const msg = document.createElement("div");
  msg.className = "message user";
  msg.textContent = text;
  wrapper.appendChild(timeSpan);
  wrapper.appendChild(msg);
  messagesDiv.appendChild(wrapper);
  scrollToLastMessage();
}

function showTyping() {
  const typing = document.createElement("div");
  typing.className = "message bot typing-indicator";
  typing.id = "typing";
  typing.innerHTML =
    'Бот печатает<span class="typing-dots"><span>.</span><span>.</span><span>.</span></span>';
  messagesDiv.appendChild(typing);
  scrollToLastMessage();
}

function hideTyping() {
  const typing = document.getElementById("typing");
  if (typing) typing.remove();
  scrollToLastMessage();
}

function validateName(name) {
  const trimmed = name.trim();
  if (!trimmed) return { valid: false, message: "Введите имя" };
  if (trimmed.length < 2) return { valid: false, message: "Минимум 2 символа" };
  if (!/^[а-яёА-ЯЁa-zA-Z\s\-]+$/.test(trimmed))
    return { valid: false, message: "Только буквы" };
  return { valid: true, value: trimmed };
}

function validateAge(age) {
  const trimmed = age.trim();
  if (!trimmed) return { valid: false, message: "Введите возраст" };
  const ageNum = parseInt(trimmed, 10);
  if (isNaN(ageNum)) return { valid: false, message: "Введите число" };
  if (ageNum < 18)
    return { valid: false, message: "Минимальный возраст 18 лет" };
  if (ageNum > 100) return { valid: false, message: "Некорректный возраст" };
  return { valid: true, value: ageNum };
}

function validateCitizenship(citizenship) {
  const trimmed = citizenship.trim();
  if (!trimmed) return { valid: false, message: "Введите гражданство" };
  if (!/^[а-яёА-ЯЁa-zA-Z\s\-]+$/.test(trimmed))
    return { valid: false, message: "Только буквы" };
  return { valid: true, value: trimmed };
}

function validateExperience(experience) {
  const trimmed = experience.trim();
  if (!trimmed) return { valid: false, message: "Введите опыт работы" };
  const expNum = parseFloat(trimmed);
  if (isNaN(expNum)) return { valid: false, message: "Введите число (лет)" };
  if (expNum < 0)
    return { valid: false, message: "Опыт не может быть отрицательным" };
  return { valid: true, value: expNum };
}

function applyPhoneMask(input) {
  let val = input.value.replace(/[^\d]/g, "").substring(0, 11);
  let formatted = "";
  if (val.length > 0) {
    let first = val[0] === "8" || val[0] === "7" ? "+7" : "+7";
    let rest = val[0] === "8" || val[0] === "7" ? val.substring(1) : val;
    formatted = first;
    if (rest.length > 0) formatted += " (" + rest.substring(0, 3);
    if (rest.length > 3) formatted += ") " + rest.substring(3, 6);
    if (rest.length > 6) formatted += "-" + rest.substring(6, 8);
    if (rest.length > 8) formatted += "-" + rest.substring(8, 10);
  }
  input.value = formatted;
}

function validatePhone(phone) {
  let cleaned = phone.replace(/[\s\-\(\)\+]/g, "");
  if (!cleaned) return { valid: false, message: "Введите номер телефона" };
  if (cleaned.length !== 11)
    return { valid: false, message: "Номер должен содержать 11 цифр" };
  if (!/^(7|8)\d{10}$/.test(cleaned))
    return { valid: false, message: "Некорректный российский номер" };
  let formatted = cleaned.replace(/^8/, "7");
  return {
    valid: true,
    formatted: `+7 (${formatted.substring(1, 4)}) ${formatted.substring(4, 7)}-${formatted.substring(7, 9)}-${formatted.substring(9, 11)}`,
  };
}

async function loadVacancies() {
  try {
    const res = await fetch("api.php?action=getVacancies");
    vacanciesList = await res.json();

    if (!vacanciesList.length) {
      addBotMessage("На данный момент нет активных вакансий. Загляните позже!");
      return false;
    }

    addBotMessage(
      "Здравствуйте! Я представляю ООО «РВК - Воронеж» — одно из крупнейших коммунальных предприятий города.\n\nВыберите, пожалуйста, вакансию, которая вас интересует:",
    );

    setTimeout(() => {
      showVacancyButtons();
    }, 0);

    waitingForVacancySelection = true;
    return true;
  } catch (err) {
    addBotMessage("Ошибка загрузки данных. Попробуйте позже.", true);
    return false;
  }
}

function showVacancyButtons() {
  inputArea.innerHTML = "";
  inputArea.className = "input-area buttons-container";

  vacanciesList.forEach((vacancy) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = vacancy.title;
    btn.onclick = (e) => {
      e.stopPropagation();
      selectVacancy(vacancy);
    };
    inputArea.appendChild(btn);
  });
}

function selectVacancy(vacancy) {
  if (!waitingForVacancySelection) return;

  waitingForVacancySelection = false;
  waitingForReturnResponse = false;
  currentVacancy = vacancy;
  addUserMessage(vacancy.title);

  addBotMessage(
    `<strong>${vacancy.title}</strong>\n\n${vacancy.description}\n\nЗарплата: ${vacancy.salary_min || "не указана"} - ${vacancy.salary_max || "не указана"} руб. (до вычета НДФЛ)\nГрафик: ${vacancy.schedule || "не указан"}\n\nХотите откликнуться на вакансию?`,
  );

  showResponseButtons();
}

function showResponseButtons() {
  inputArea.innerHTML = "";
  inputArea.className = "input-area buttons-container";

  const yesBtn = document.createElement("button");
  yesBtn.className = "option-btn";
  yesBtn.textContent = "Хочу откликнуться";
  yesBtn.onclick = (e) => {
    e.stopPropagation();
    addUserMessage("Хочу откликнуться");
    startApplicationFlow();
  };

  const noBtn = document.createElement("button");
  noBtn.className = "option-btn";
  noBtn.textContent = "Нет, спасибо";
  noBtn.onclick = (e) => {
    e.stopPropagation();
    addUserMessage("Нет, спасибо");
    declineApplication();
  };

  inputArea.appendChild(yesBtn);
  inputArea.appendChild(noBtn);
}

function declineApplication() {
  addBotMessage(
    "Понимаю. Если передумаете, нажмите кнопку ниже, и мы продолжим.",
  );
  waitingForReturnResponse = true;

  inputArea.innerHTML = "";
  inputArea.className = "input-area buttons-container";

  const returnBtn = document.createElement("button");
  returnBtn.className = "option-btn";
  returnBtn.textContent = "Хочу откликнуться";
  returnBtn.onclick = (e) => {
    e.stopPropagation();
    addUserMessage("Хочу откликнуться");
    startApplicationFlow();
  };

  // Добавляем кнопку для выбора другой вакансии
  const otherVacancyBtn = document.createElement("button");
  otherVacancyBtn.className = "option-btn";
  otherVacancyBtn.textContent = "Выбрать другую вакансию";
  otherVacancyBtn.style.marginTop = "0px";
  otherVacancyBtn.onclick = (e) => {
    e.stopPropagation();
    addUserMessage("Выбрать другую вакансию");
    resetChat();
  };

  inputArea.appendChild(returnBtn);
  inputArea.appendChild(otherVacancyBtn);
}

function showReturnButton() {
  inputArea.innerHTML = "";
  inputArea.className = "input-area buttons-container";

  const returnBtn = document.createElement("button");
  returnBtn.className = "option-btn";
  returnBtn.textContent = "Хочу откликнуться";
  returnBtn.onclick = (e) => {
    e.stopPropagation();
    addUserMessage("Хочу откликнуться");
    startApplicationFlow();
  };

  inputArea.appendChild(returnBtn);
}

function startApplicationFlow() {
  waitingForReturnResponse = false;
  isChatFinished = false;
  answers = {};
  currentStep = 0;
  loadQuestionsForVacancy().then(() => {
    displayCurrentStep();
  });
}

async function loadQuestionsForVacancy() {
  try {
    const res = await fetch(
      `api.php?action=getQuestions&vacancy_id=${currentVacancy.id}`,
    );
    const dbQuestions = await res.json();

    if (dbQuestions.length) {
      questions = dbQuestions;
    } else {
      questions = [
        {
          bot_message: "Укажите ваше имя",
          type: "text",
          field_name: "firstName",
          validation: "name",
          required: true,
        },
        {
          bot_message: "Ваш номер телефона",
          type: "text",
          field_name: "phone",
          validation: "phone",
          required: true,
        },
        {
          bot_message: "Хотите прикрепить резюме?",
          type: "buttons",
          options: ["Да, прикрепить", "Нет, продолжить"],
          field_name: "hasResume",
        },
        {
          bot_message: "Загрузите резюме (PDF, DOC, DOCX)",
          type: "file",
          field_name: "resumeFile",
        },
        {
          bot_message: "Укажите ваш возраст (число)",
          type: "text",
          field_name: "age",
          validation: "age",
          required: true,
        },
        {
          bot_message: "Ваше гражданство",
          type: "text",
          field_name: "citizenship",
          validation: "citizenship",
          required: true,
        },
        {
          bot_message: "Опыт работы (лет)",
          type: "text",
          field_name: "experience",
          validation: "experience",
          required: true,
        },
        {
          bot_message: "Предпочтительное расположение?",
          type: "choice",
          options: ["Правый берег", "Левый берег", "Не имеет значения"],
          field_name: "location",
        },
        {
          bot_message: "Желаемый график?",
          type: "choice",
          options: ["5/2 полный день", "Сменный", "Гибкий", "Удалённый"],
          field_name: "schedule",
        },
        {
          bot_message: "Образование",
          type: "choice",
          options: [
            "Среднее специальное",
            "Высшее (бакалавр)",
            "Высшее (магистр)",
            "Неоконченное высшее",
          ],
          field_name: "education",
        },
        {
          bot_message: "Ожидаемая зарплата (руб.)",
          type: "text",
          field_name: "expectedSalary",
          validation: "salary",
          required: true,
        },
      ];
    }
  } catch (err) {
    addBotMessage("Ошибка загрузки вопросов.", true);
  }
}

function displayCurrentStep() {
  if (currentStep >= questions.length) {
    finishChat();
    return;
  }
  const step = questions[currentStep];

  if (
    step.field_name === "resumeFile" &&
    answers.hasResume === "Нет, продолжить"
  ) {
    currentStep++;
    displayCurrentStep();
    return;
  }

  showTyping();
  setTimeout(() => {
    hideTyping();
    addBotMessage(step.bot_message);
    buildInputArea(step);
    if (isFirstOpen && currentStep === 0) isFirstOpen = false;
    scrollToLastMessage();
  }, 500);
}

function buildInputArea(step) {
  inputArea.innerHTML = "";
  inputArea.className = "input-area";

  if (step.type === "buttons" || step.type === "choice") {
    inputArea.classList.add("buttons-container");
    (step.options || []).forEach((opt) => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.textContent = opt;
      btn.onclick = (e) => {
        e.stopPropagation();
        handleUserResponse(opt, step);
      };
      inputArea.appendChild(btn);
    });
  } else if (step.type === "text") {
    inputArea.classList.add("text-container");
    const wrapper = document.createElement("div");
    wrapper.className = "input-wrapper";

    const inputRow = document.createElement("div");
    inputRow.className = "input-row";

    const input = document.createElement("input");
    input.type = "text";

    // Настройка в зависимости от поля
    if (step.field_name === "phone") {
      input.placeholder = "+7 (___) ___-__-__";
      input.addEventListener("input", (e) => applyPhoneMask(e.target));
    } else if (step.field_name === "firstName") {
      input.placeholder = "Например: Иван";
      input.addEventListener("input", (e) => {
        let value = e.target.value;
        let cleaned = value.replace(/[^a-zA-Zа-яёА-ЯЁ\s\-]/g, "");
        let words = cleaned.split(/(\s+|-)/);
        let formatted = words
          .map((word) => {
            if (word.match(/^[\s-]+$/)) return word;
            if (word.length === 0) return word;
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
          })
          .join("");
        e.target.value = formatted;
      });
    } else if (step.field_name === "citizenship") {
      input.placeholder = "Например: Россия";
      input.addEventListener("input", (e) => {
        let value = e.target.value;
        let cleaned = value.replace(/[^a-zA-Zа-яёА-ЯЁ\s\-]/g, "");
        let words = cleaned.split(/(\s+|-)/);
        let formatted = words
          .map((word) => {
            if (word.match(/^[\s-]+$/)) return word;
            if (word.length === 0) return word;
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
          })
          .join("");
        e.target.value = formatted;
      });
    } else if (step.field_name === "experience") {
      input.placeholder = "Например: 3.5";
      input.addEventListener("input", (e) => {
        let value = e.target.value;
        value = value.replace(/[^0-9.]/g, "");
        const parts = value.split(".");
        if (parts.length > 2) {
          value = parts[0] + "." + parts.slice(1).join("");
        }
        e.target.value = value;
      });
    } else if (step.field_name === "age") {
      input.placeholder = "Например: 25";
      input.addEventListener("input", (e) => {
        let value = e.target.value;
        value = value.replace(/[^0-9]/g, "");
        e.target.value = value;
      });
    } else if (step.field_name === "expectedSalary") {
      input.placeholder = "Например: 60000";
      input.addEventListener("input", (e) => {
        let value = e.target.value;
        value = value.replace(/[^0-9]/g, "");
        e.target.value = value;
      });
    } else {
      input.placeholder = "Введите ответ...";
    }

    const sendBtn = document.createElement("button");
    sendBtn.className = "send-btn";
    sendBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <path d="M4.698 4.034l16.302 7.966l-16.302 7.966a.503 .503 0 0 1 -.546 -.124a.555 .555 0 0 1 -.12 -.568l2.468 -7.274l-2.468 -7.274a.555 .555 0 0 1 .12 -.568a.503 .503 0 0 1 .546 -.124"/>
    <path d="M6.5 12h14.5"/>
  </svg>`;
    sendBtn.onclick = (e) => {
      e.stopPropagation();
      const val = input.value.trim();
      processTextInput(val, step, input);
    };
    input.onkeypress = (e) => {
      if (e.key === "Enter") {
        e.stopPropagation();
        const val = input.value.trim();
        processTextInput(val, step, input);
      }
    };

    inputRow.appendChild(input);
    inputRow.appendChild(sendBtn);
    wrapper.appendChild(inputRow);
    inputArea.appendChild(wrapper);
    setTimeout(() => input.focus(), 100);
  } else if (step.type === "file") {
    inputArea.classList.add("file-container");
    const label = document.createElement("label");
    label.className = "file-label";
    label.innerHTML = "Выберите файл резюме";
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".pdf,.doc,.docx";
    fileInput.style.display = "none";
    fileInput.onchange = async (e) => {
      e.stopPropagation();
      if (fileInput.files.length) {
        addUserMessage(`Файл: ${fileInput.files[0].name}`);
        await uploadResume(fileInput.files[0], step);
      }
    };
    label.appendChild(fileInput);
    inputArea.appendChild(label);
  }
}

async function uploadResume(file, step) {
  const formData = new FormData();
  formData.append("resume", file);
  try {
    const res = await fetch("api.php?action=uploadResume", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (data.file_path) {
      answers[step.field_name] = data.file_path;
      currentStep++;
      displayCurrentStep();
    } else {
      addBotMessage(
        "Ошибка загрузки резюме: " + (data.error || "неизвестная"),
        true,
      );
    }
  } catch (err) {
    addBotMessage("Ошибка соединения при загрузке файла", true);
  }
}

function processTextInput(value, step, inputElement) {
  if (!value && step.required) {
    showInputError(inputElement, "Поле обязательно для заполнения");
    return;
  }

  if (step.validation === "name") {
    const v = validateName(value);
    if (!v.valid) {
      showInputError(inputElement, v.message);
      return;
    }
    value = v.value;
  }

  if (step.validation === "phone") {
    const v = validatePhone(value);
    if (!v.valid) {
      showInputError(inputElement, v.message);
      return;
    }
    value = v.formatted;
  }

  if (step.validation === "age") {
    const v = validateAge(value);
    if (!v.valid) {
      showInputError(inputElement, v.message);
      return;
    }
    value = v.value;
  }

  if (step.validation === "citizenship") {
    const v = validateCitizenship(value);
    if (!v.valid) {
      showInputError(inputElement, v.message);
      return;
    }
    value = v.value;
  }

  if (step.validation === "experience") {
    // Проверяем, есть ли уже сохранённый возраст
    if (answers.age) {
      const v = validateExperienceWithAge(value, answers.age);
      if (!v.valid) {
        showInputError(inputElement, v.message);
        return;
      }
      value = v.value;
    } else {
      // Если возраст ещё не введён (ошибка порядка вопросов)
      const v = validateExperience(value);
      if (!v.valid) {
        showInputError(inputElement, v.message);
        return;
      }
      value = v.value;
    }
  }

  if (step.validation === "salary") {
    const salaryNum = parseInt(value.replace(/[^0-9]/g, ""), 10);
    if (isNaN(salaryNum) || salaryNum < 0) {
      showInputError(inputElement, "Введите корректную сумму");
      return;
    }
    value = salaryNum;
  }

  hideInputError(inputElement);
  addUserMessage(value.toString());
  answers[step.field_name] = value;
  currentStep++;
  displayCurrentStep();
}

let errorTimeout = null;
let isErrorShowing = false;

function showInputError(input, message) {
  // Предотвращаем спам - если ошибка уже показывается, не создаём новую
  if (isErrorShowing) return;

  // Удаляем старую ошибку если есть
  const existingError = input
    .closest(".input-wrapper")
    ?.querySelector(".input-error-message");
  if (existingError) {
    // Если ошибка уже есть, просто обновляем сообщение
    existingError.textContent = message;
    existingError.classList.remove("show");
    setTimeout(() => {
      if (existingError) existingError.classList.add("show");
    }, 10);
    return;
  }

  isErrorShowing = true;
  input.classList.add("input-error");

  const errorDiv = document.createElement("div");
  errorDiv.className = "input-error-message";
  errorDiv.textContent = message;

  // Вставляем ошибку в .input-wrapper (контейнер)
  const wrapper = input.closest(".input-wrapper");
  if (wrapper) {
    wrapper.style.position = "relative";
    wrapper.insertBefore(errorDiv, wrapper.firstChild);
  } else {
    input.parentElement.insertBefore(errorDiv, input);
  }

  // Принудительное обновление layout перед добавлением класса
  errorDiv.offsetHeight;
  errorDiv.classList.add("show");

  // Очищаем предыдущий таймаут если есть
  if (errorTimeout) clearTimeout(errorTimeout);

  // Устанавливаем таймаут на скрытие ошибки
  errorTimeout = setTimeout(() => {
    if (input) input.classList.remove("input-error");
    if (errorDiv) {
      errorDiv.classList.remove("show");
      setTimeout(() => {
        if (errorDiv.parentNode) errorDiv.remove();
        isErrorShowing = false;
        errorTimeout = null;
      }, 300);
    }
  }, 3000);

  input.focus();
}

function hideInputError(input) {
  input.classList.remove("input-error");
  const err = document.querySelector(".input-error-message");
  if (err) err.remove();
}

function handleUserResponse(response, step) {
  addUserMessage(response);

  if (step.field_name === "hasResume") {
    answers[step.field_name] = response;
    if (response === "Да, прикрепить") {
      currentStep++;
      displayCurrentStep();
    } else {
      currentStep++;
      if (
        questions[currentStep] &&
        questions[currentStep].field_name === "resumeFile"
      ) {
        currentStep++;
      }
      displayCurrentStep();
    }
    return;
  }

  answers[step.field_name] = response;
  currentStep++;
  displayCurrentStep();
}

async function finishChat() {
  if (isChatFinished) return;
  isChatFinished = true;

  // Отправляем заявку, если есть ответы
  if (currentVacancy && Object.keys(answers).length) {
    try {
      await fetch("api.php?action=submitApplication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vacancy_id: currentVacancy.id,
          answers: answers,
        }),
      });
    } catch (err) {
      console.error(err);
    }
  }

  // Очищаем область ввода и показываем кнопку для нового диалога
  inputArea.innerHTML = "";
  inputArea.className = "input-area finished";

  const finishDiv = document.createElement("div");
  finishDiv.className = "finish-message";
  finishDiv.innerHTML = "Отклик отправлен!";
  inputArea.appendChild(finishDiv);

  // Добавляем кнопку для нового диалога
  const newChatBtn = document.createElement("button");
  newChatBtn.className = "option-btn";
  newChatBtn.textContent = "Выбрать другую вакансию";
  newChatBtn.style.marginTop = "12px";
  newChatBtn.style.width = "100%";
  newChatBtn.onclick = (e) => {
    e.stopPropagation();
    resetChat();
  };
  inputArea.appendChild(newChatBtn);
}

// Функция сброса чата для нового диалога
function resetChat() {
  // Очищаем все переменные
  currentVacancy = null;
  vacanciesList = [];
  questions = [];
  currentStep = 0;
  answers = {};
  isChatFinished = false;
  waitingForVacancySelection = false;
  waitingForReturnResponse = false;
  
  messagesDiv.innerHTML = "";
  inputArea.innerHTML = "";
  inputArea.className = "input-area";

  isFirstOpen = true;
  loadVacancies();
}

// Аккордеон логика 
const chatContainer = document.getElementById("chatContainer");
const chatHeader = document.getElementById("chatHeader");
let isExpanded = false;

function expandChat() {
  if (!isExpanded) {
    chatContainer.classList.add("expanded");
    isExpanded = true;
    if (messagesDiv.children.length === 0) {
      isFirstOpen = true;
      loadVacancies();
    }
  }
}

function collapseChat() {
  if (isExpanded) {
    chatContainer.classList.remove("expanded");
    isExpanded = false;
  }
}

chatHeader.onclick = (e) => {
  e.stopPropagation();
  if (isExpanded) collapseChat();
  else expandChat();
};

document.addEventListener("click", (e) => {
  if (isExpanded && !chatContainer.contains(e.target)) collapseChat();
});

// Остановка всплытия для всех кнопок внутри чата
document
  .querySelectorAll(".option-btn, .send-btn, .file-label")
  .forEach((el) => {
    el.addEventListener("click", (e) => e.stopPropagation());
  });

function scrollToLastMessage() {
  setTimeout(() => {
    const messagesDiv = document.getElementById("messages");
    if (!messagesDiv) return;

    // Находим последнее сообщение
    const lastMessage = messagesDiv.lastElementChild;
    if (!lastMessage) return;

    // Получаем позицию последнего сообщения
    const messageTop = lastMessage.offsetTop;
    const messageHeight = lastMessage.offsetHeight;
    const targetScroll = messageTop - 80;
    messagesDiv.scrollTo({
      top: targetScroll,
      behavior: "smooth",
    });
  }, 100);
}

function validateExperienceWithAge(experience, age) {
  const trimmedExp = experience.trim();
  if (!trimmedExp) return { valid: false, message: "Введите опыт работы" };

  const expNum = parseFloat(trimmedExp);
  if (isNaN(expNum)) return { valid: false, message: "Введите число (лет)" };
  if (expNum < 0)
    return { valid: false, message: "Опыт не может быть отрицательным" };

  // Проверка, что опыт не больше возраста минус 14 (минимальный возраст начала работы)
  const maxPossibleExp = age - 14;
  if (expNum > maxPossibleExp) {
    return {
      valid: false,
      message: `Опыт не может превышать ${maxPossibleExp} лет (ваш возраст ${age} лет)`,
    };
  }

  return { valid: true, value: expNum };
}
