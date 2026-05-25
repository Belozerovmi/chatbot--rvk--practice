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
  setTimeout(addAntiSpamToAllButtons, 50);
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
  setTimeout(addAntiSpamToAllButtons, 50);
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

  showConsentButtons();
}

function showConsentButtons() {
  inputArea.innerHTML = "";
  inputArea.className = "input-area";

  const consentText = document.createElement("div");
  consentText.style.cssText =
    "margin-bottom: 8px; font-size: 13px; color: #1485d1; display: flex; flex-direction: column; align-items: center;";
  consentText.innerHTML = `
        <p style = "text-align: center; font-weight: 600;">Для отклика на вакансию необходимо ваше согласие на обработку персональных данных</p>
        <p class="consent_personal_data_checkbox" style="font-size: 12px; margin-top: 8px; text-align: center;">
            Пожалуйста, ознакомьтесь с 
            <a href="https://voronezh.rosvodokanal.ru/upload/voronezh/%D0%9F%D1%80%D0%B8%D0%BB%D0%BE%D0%B6%D0%B5%D0%BD%D0%B8%D0%B5%20%E2%84%961%20%D0%9F%D0%BE%D0%BB%D0%B8%D1%82%D0%B8%D0%BA%D0%B0%20%D0%9F%D0%B4%D0%9D%20%D0%A0%D0%92%D0%9A-%D0%92%D0%BE%D1%80%D0%BE%D0%BD%D0%B5%D0%B6%202023.DOCX" target="_blank" style="color: #1485d1; text-decoration: underline;">Политикой обработки персональных данных</a>.
        </p>
    `;
  inputArea.appendChild(consentText);

  const checkboxWrapper = document.createElement("div");
  checkboxWrapper.className = "checkbox-wrapper-42";
  checkboxWrapper.style.cssText =
    "display: flex; align-items: center; margin-bottom: 16px;";

  const checkboxInput = document.createElement("input");
  checkboxInput.type = "checkbox";
  checkboxInput.id = "user-consent";

  const customCbx = document.createElement("label");
  customCbx.className = "cbx";
  customCbx.htmlFor = "user-consent";

  const textLabel = document.createElement("label");
  textLabel.className = "lbl";
  textLabel.htmlFor = "user-consent";
  textLabel.textContent =
    "Я даю согласие на обработку моих персональных данных";

  checkboxWrapper.appendChild(checkboxInput);
  checkboxWrapper.appendChild(customCbx);
  checkboxWrapper.appendChild(textLabel);
  inputArea.appendChild(checkboxWrapper);

  const buttonsWrapper = document.createElement("div");
  buttonsWrapper.style.cssText =
    "display: flex; gap: 10px; flex-direction: column; width: 100%;";

  const agreeBtn = document.createElement("button");
  agreeBtn.className = "option-btn";
  agreeBtn.textContent = "Продолжить";
  agreeBtn.onclick = (e) => {
    e.stopPropagation();

    // Проверяем чекбокс
    if (!checkboxInput.checked) {
      const existingError = checkboxWrapper.querySelector(
        ".input-error-message",
      );
      if (existingError) existingError.remove();

      const errorDiv = document.createElement("div");
      errorDiv.className = "input-error-message";
      errorDiv.textContent =
        "Пожалуйста, дайте согласие на обработку персональных данных";

      checkboxInput.classList.add("input-error");
      checkboxWrapper.style.position = "relative";
      checkboxWrapper.insertBefore(errorDiv, checkboxWrapper.firstChild);
      setTimeout(() => errorDiv.classList.add("show"), 10);
      setTimeout(() => {
        errorDiv.classList.remove("show");
        checkboxInput.classList.remove("input-error");
        setTimeout(() => errorDiv.remove(), 300);
      }, 3000);
      return;
    }

    addUserMessage("Даю согласие");
    answers.consentGiven = true;
    answers.consentTimestamp = new Date().toISOString();
    startApplicationFlow();
  };

  const declineBtn = document.createElement("button");
  declineBtn.className = "option-btn";
  declineBtn.style.opacity = "0.5";
  declineBtn.textContent = "Не даю согласие";
  declineBtn.onclick = (e) => {
    e.stopPropagation();
    addUserMessage("Не даю согласие");
    answers.consentGiven = false;

    inputArea.innerHTML = "";
    inputArea.className = "input-area";

    const messageDiv = document.createElement("div");
    messageDiv.style.cssText =
      "text-align: center; padding: 20px; background: #f5f5f5; border-radius: 10px; margin-bottom: 15px;";
    messageDiv.innerHTML = `
      <p style="margin-bottom: 10px;">Вы не дали согласие на обработку персональных данных.</p>
      <p style="font-size: 12px; color: #666;">Мы не можем обработать ваш отклик без этого.</p>
    `;
    inputArea.appendChild(messageDiv);

    const restartBtn = document.createElement("button");
    restartBtn.className = "option-btn";
    restartBtn.style.background = "#1485d1";
    restartBtn.style.color = "white";
    restartBtn.textContent = "Выбрать другую вакансию";
    restartBtn.onclick = (e2) => {
      e2.stopPropagation();
      resetChat();
    };
    inputArea.appendChild(restartBtn);
  };

  buttonsWrapper.appendChild(agreeBtn);
  buttonsWrapper.appendChild(declineBtn);
  inputArea.appendChild(buttonsWrapper);
  setTimeout(addAntiSpamToAllButtons, 50);
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
  setTimeout(addAntiSpamToAllButtons, 50);
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
  setTimeout(addAntiSpamToAllButtons, 50);
}

function startApplicationFlow() {
  waitingForReturnResponse = false;
  isChatFinished = false;

  // Сохраняем согласие, если оно было
  const savedConsent = answers.consentGiven;
  const savedConsentTimestamp = answers.consentTimestamp;

  answers = {};
  currentStep = 0;

  // Восстанавливаем согласие
  if (savedConsent) {
    answers.consentGiven = savedConsent;
    answers.consentTimestamp = savedConsentTimestamp;
  }

  loadQuestionsForVacancy().then(() => {
    displayCurrentStep();
  });
}

async function loadQuestionsForVacancy() {
  questions = [
    {
      bot_message: "Как вас зовут?",
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
      bot_message: "Прикрепите резюме (PDF, DOC, DOCX)",
      type: "file",
      field_name: "resumeFile",
    },
    {
      bot_message: "Ваш опыт работы (в годах)",
      type: "text",
      field_name: "experience",
      validation: "experience",
      required: true,
    },
    {
      bot_message: "В каком районе проживаете?",
      type: "choice",
      options: ["Левый берег", "Правый берег", "Не имеет значения"],
      field_name: "location",
    },
    {
      bot_message: "Какой график работы предпочтителен?",
      type: "choice",
      options: [
        "5/2 полный день",
        "Сменный график",
        "Гибкий график",
        "Удаленный",
      ],
      field_name: "schedule",
    },
    {
      bot_message: "Ваше образование",
      type: "choice",
      options: [
        "Среднее общее",
        "Среднее специальное",
        "Среднее профессиональное",
        "Высшее (бакалавр)",
        "Высшее (магистр)",
        "Ученая степень",
      ],
      field_name: "education",
    },
    {
      bot_message: "Ожидаемая зарплата (в рублях)",
      type: "text",
      field_name: "expectedSalary",
      validation: "salary",
      required: true,
    },
  ];
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
    setTimeout(addAntiSpamToAllButtons, 50);
  } else if (step.type === "text") {
    inputArea.classList.add("text-container");
    const wrapper = document.createElement("div");
    wrapper.className = "input-wrapper";

    const inputRow = document.createElement("div");
    inputRow.className = "input-row";

    const input = document.createElement("input");
    input.type = "text";

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
    setTimeout(addAntiSpamToAllButtons, 50);
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
    setTimeout(addAntiSpamToAllButtons, 50);
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

  if (step.validation === "experience") {
    const v = validateExperience(value);
    if (!v.valid) {
      showInputError(inputElement, v.message);
      return;
    }
    value = v.value;
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
  if (isErrorShowing) return;

  const existingError = input
    .closest(".input-wrapper")
    ?.querySelector(".input-error-message");
  if (existingError) {
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

  const wrapper = input.closest(".input-wrapper");
  if (wrapper) {
    wrapper.style.position = "relative";
    wrapper.insertBefore(errorDiv, wrapper.firstChild);
  } else {
    input.parentElement.insertBefore(errorDiv, input);
  }

  errorDiv.offsetHeight;
  errorDiv.classList.add("show");

  if (errorTimeout) clearTimeout(errorTimeout);

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

  // Проверяем согласие перед отправкой
  if (!answers.consentGiven) {
    addBotMessage(
      "Без согласия на обработку данных мы не можем принять вашу заявку.",
      true,
    );
    isChatFinished = false;
    return;
  }

  if (currentVacancy && Object.keys(answers).length) {
    try {
      const response = await fetch("api.php?action=submitApplication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vacancy_id: currentVacancy.id,
          answers: answers,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        addBotMessage(
          "Произошла ошибка при отправке: " +
            (result.error || "Неизвестная ошибка"),
          true,
        );
        isChatFinished = false;
        return;
      }
    } catch (err) {
      console.error(err);
      addBotMessage("Ошибка соединения. Попробуйте позже.", true);
      isChatFinished = false;
      return;
    }
  }

  inputArea.innerHTML = "";
  inputArea.className = "input-area finished";

  const finishDiv = document.createElement("div");
  finishDiv.className = "finish-message";
  finishDiv.innerHTML = "Отклик отправлен!";
  inputArea.appendChild(finishDiv);

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
  setTimeout(addAntiSpamToAllButtons, 50);
}

function resetChat() {
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

document
  .querySelectorAll(".option-btn, .send-btn, .file-label")
  .forEach((el) => {
    el.addEventListener("click", (e) => e.stopPropagation());
  });

function scrollToLastMessage() {
  setTimeout(() => {
    const messagesDiv = document.getElementById("messages");
    if (!messagesDiv) return;

    const lastMessage = messagesDiv.lastElementChild;
    if (!lastMessage) return;

    const messageTop = lastMessage.offsetTop;
    const targetScroll = messageTop - 80;

    messagesDiv.scrollTo({
      top: targetScroll,
      behavior: "smooth",
    });
  }, 100);
}

function addAntiSpamToAllButtons() {
  document.querySelectorAll("button").forEach((btn) => {
    if (btn.hasAttribute("data-anti-spam")) return;
    btn.setAttribute("data-anti-spam", "true");

    const originalClick = btn.onclick;
    btn.onclick = (e) => {
      if (btn.disabled) return;
      btn.disabled = true;
      btn.style.opacity = "0.5";

      setTimeout(() => {
        btn.disabled = false;
        btn.style.opacity = "";
      }, 1000);

      if (originalClick) originalClick.call(btn, e);
    };
  });
}

setTimeout(addAntiSpamToAllButtons, 100);
