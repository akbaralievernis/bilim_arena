(function() {
    'use strict';

    // --- QUIZ DATA ---
    const QUIZ = {
        title: "Правовые основы ИС и авторского права",
        questions: [
            {
                question: "Что защищает авторское право?",
                options: ["Идеи и мысли", "Исходный код и тексты", "Методы и процессы", "Физические предметы"],
                correctAnswer: "Исходный код и тексты",
                timeLimit: 20
            },
            {
                question: "Нужно ли регистрировать авторское право на программу?",
                options: ["Да, обязательно", "Нет, оно возникает автоматически", "Только для продажи", "Только в налоговой"],
                correctAnswer: "Нет, оно возникает автоматически",
                timeLimit: 20
            },
            {
                question: "Что дает патент его владельцу?",
                options: ["Право называться автором", "Монополию на технологию или изобретение", "Скидку на налоги", "Вечное владение кодом"],
                correctAnswer: "Монополию на технологию или изобретение",
                timeLimit: 30
            },
            {
                question: "Стандартный срок действия патента на изобретение составляет:",
                options: ["5 лет", "10 лет", "20 лет", "Бессрочно"],
                correctAnswer: "20 лет",
                timeLimit: 20
            },
            {
                question: "Что такое лицензия в контексте ИС?",
                options: ["Запрет на копирование", "Разрешение на использование на условиях", "Паспорт программы", "Вид государственного налога"],
                correctAnswer: "Разрешение на использование на условиях",
                timeLimit: 20
            },
            {
                question: "В чем главная особенность Open Source лицензий?",
                options: ["Код скрыт от всех пользователей", "Код можно изучать, менять и делить", "Запрещено любое использование", "Работает только на Linux"],
                correctAnswer: "Код можно изучать, менять и делить",
                timeLimit: 20
            },
            {
                question: "Кому обычно принадлежат права на код, написанный по заданию на работе?",
                options: ["Программисту-автору", "Государству", "Работодателю (компании)", "Общественности"],
                correctAnswer: "Работодателю (компании)",
                timeLimit: 20
            },
            {
                question: "Что является объектом защиты товарного знака?",
                options: ["Технология производства", "Дизайн-макет сайта", "Бренд, название и логотип", "Сюжет литературного произведения"],
                correctAnswer: "Бренд, название и логотип",
                timeLimit: 20
            },
            {
                question: "Какое право автора нельзя передать или продать другому лицу?",
                options: ["Право на получение прибыли", "Имущественные права", "Личное неимущественное право авторства", "Право на перевод"],
                correctAnswer: "Личное неимущественное право авторства",
                timeLimit: 30
            },
            {
                question: "Что происходит с произведением в «общественном достоянии»?",
                options: ["Оно становится платным", "Его можно использовать без разрешения автора", "Оно удаляется из интернета", "Оно переходит в собственность мэрии"],
                correctAnswer: "Его можно использовать без разрешения автора",
                timeLimit: 20
            }
        ]
    };

    // --- STATE ---
    const state = {
        playerName: "",
        currentQuestionIndex: 0,
        score: 0,
        correctAnswersCount: 0,
        timerValue: 0,
        timerInterval: null,
        isTransitioning: false
    };

    // --- DOM ELEMENTS ---
    const elements = {
        setup: document.getElementById('setup'),
        game: document.getElementById('game'),
        result: document.getElementById('result'),
        playerName: document.getElementById('playerName'),
        btnStart: document.getElementById('btnStart'),
        qCounter: document.getElementById('qCounter').querySelector('b'),
        timer: document.getElementById('timer'),
        scoreText: document.getElementById('scoreText').querySelector('b'),
        qText: document.getElementById('qText'),
        options: document.getElementById('options'),
        progressFill: document.getElementById('progressFill'),
        timerCircle: document.querySelector('.progress-ring__circle'),
        resultTitle: document.getElementById('resultTitle'),
        resultScore: document.getElementById('resultScore'),
        resultDetail: document.getElementById('resultDetail'),
        btnRestart: document.getElementById('btnRestart'),
        toast: document.getElementById('toast'),
        themeBtn: document.getElementById('themeBtn')
    };

    const ringRadius = 26;
    const ringCircumference = 2 * Math.PI * ringRadius;

    // --- INITIALIZATION ---
    function init() {
        elements.timerCircle.style.strokeDasharray = `${ringCircumference} ${ringCircumference}`;
        elements.timerCircle.style.strokeDashoffset = 0;
        
        elements.btnStart.onclick = startGame;
        elements.btnRestart.onclick = () => location.reload();
        elements.themeBtn.onclick = toggleTheme;
        initTheme();
    }

    // --- THEME LOGIC ---
    function initTheme() {
        const saved = localStorage.getItem('BA_PORTAL_THEME') || 'dark';
        document.body.className = saved;
        elements.themeBtn.textContent = saved === 'dark' ? '🌙' : '☀️';
    }

    function toggleTheme() {
        const current = document.body.classList.contains('dark') ? 'dark' : 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        localStorage.setItem('BA_PORTAL_THEME', next);
        document.body.className = next;
        elements.themeBtn.textContent = next === 'dark' ? '🌙' : '☀️';
    }

    // --- GAME FLOW ---
    function startGame() {
        state.playerName = elements.playerName.value.trim() || "Студент";
        elements.setup.classList.add('hidden');
        elements.game.classList.remove('hidden');
        loadQuestion();
    }

    function loadQuestion() {
        if (state.currentQuestionIndex >= QUIZ.questions.length) {
            endGame();
            return;
        }

        const q = QUIZ.questions[state.currentQuestionIndex];
        state.isTransitioning = false;
        
        // Update UI
        elements.qCounter.textContent = `${state.currentQuestionIndex + 1} / ${QUIZ.questions.length}`;
        elements.qText.textContent = q.question;
        elements.options.innerHTML = "";
        
        const shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);
        
        shuffledOptions.forEach(opt => {
            const btn = document.createElement("button");
            btn.className = "ansBtn";
            btn.textContent = opt;
            btn.onclick = () => selectOption(opt, btn);
            elements.options.appendChild(btn);
        });

        // Progress bar
        const progress = (state.currentQuestionIndex / QUIZ.questions.length) * 100;
        elements.progressFill.style.width = `${progress}%`;

        startTimer(q.timeLimit);
    }

    function startTimer(limit) {
        clearInterval(state.timerInterval);
        state.timerValue = limit;
        updateTimerUI(1);

        state.timerInterval = setInterval(() => {
            state.timerValue -= 0.1;
            const ratio = state.timerValue / limit;
            updateTimerUI(ratio);

            if (state.timerValue <= 0) {
                clearInterval(state.timerInterval);
                selectOption(null, null); // Timeout
            }
        }, 100);
    }

    function updateTimerUI(ratio) {
        elements.timer.textContent = Math.ceil(state.timerValue);
        const offset = ringCircumference - (ratio * ringCircumference);
        elements.timerCircle.style.strokeDashoffset = offset;
        
        if (ratio < 0.25) {
            elements.timerCircle.style.stroke = "var(--error)";
            elements.timer.style.color = "var(--error)";
        } else {
            elements.timerCircle.style.stroke = "var(--primary)";
            elements.timer.style.color = "#fff";
        }
    }

    function selectOption(selected, btn) {
        if (state.isTransitioning) return;
        state.isTransitioning = true;
        clearInterval(state.timerInterval);

        const q = QUIZ.questions[state.currentQuestionIndex];
        const isCorrect = selected === q.correctAnswer;

        if (isCorrect) {
            state.correctAnswersCount++;
            const points = 100 + Math.ceil(state.timerValue * 10);
            state.score += points;
            elements.scoreText.textContent = state.score;
            if (btn) btn.classList.add('correct');
            showToast(`Правильно! +${points}`, true);
        } else {
            if (btn) btn.classList.add('wrong');
            // Highlight correct one
            Array.from(elements.options.children).forEach(b => {
                if (b.textContent === q.correctAnswer) b.classList.add('correct');
            });
            showToast(selected === null ? "Время вышло!" : "Неверно", false);
        }

        setTimeout(() => {
            state.currentQuestionIndex++;
            loadQuestion();
        }, 2000);
    }

    function endGame() {
        elements.game.classList.add('hidden');
        elements.result.classList.remove('hidden');
        elements.progressFill.style.width = "100%";

        elements.resultTitle.textContent = `${state.playerName}, тест завершен!`;
        elements.resultScore.textContent = `Ваш счет: ${state.score}`;
        elements.resultDetail.textContent = `Правильных ответов: ${state.correctAnswersCount} из ${QUIZ.questions.length}`;
        
        if (state.correctAnswersCount === QUIZ.questions.length) {
            elements.resultTitle.textContent = `🏆 Идеально, ${state.playerName}!`;
        }
    }

    function showToast(msg, good) {
        elements.toast.textContent = msg;
        elements.toast.style.background = good ? "rgba(16, 185, 129, 0.9)" : "rgba(239, 68, 68, 0.9)";
        elements.toast.classList.remove('hidden');
        setTimeout(() => elements.toast.classList.add('hidden'), 1500);
    }

    init();

})();
