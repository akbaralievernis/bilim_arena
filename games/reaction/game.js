/* Перенесено из страницы, чтобы она работала с политикой безопасности (CSP) */
        const canvas = document.getElementById('game-canvas');
        const ctx = canvas.getContext('2d');
        const uiOverlay = document.getElementById('ui-overlay');
        const gameOverScreen = document.getElementById('game-over');
        const finalScoreSpan = document.getElementById('final-score');

        // Настройки игры
        const NUM_STICKS = 8;
        const STICK_WIDTH = 24;
        const STICK_HEIGHT = 160;
        
        let gameState = {
            isRunning: false,
            score: 0,
            lives: 3,
            effects: [],
            lastDropTime: 0,
            dropInterval: 2000, // Начальный интервал сброса (мс)
            baseSpeed: 10 // Скорость падения
        };

        let sticks = [];

        const hand = {
            x: -100, y: -100,
            radius: 30,
            isVisible: false
        };

        // ==========================================
        // ИНИЦИАЛИЗАЦИЯ И РЕСАЙЗ
        // ==========================================
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initSticks(); // Пересчитываем позиции при изменении экрана
        }
        window.addEventListener('resize', resizeCanvas);

        // Расчет стартовой позиции стержней по дуге
        function getRackY(x) {
            // Формула параболы, чтобы создать эффект изогнутой конструкции (как на фото)
            // Центр ниже, края выше
            const normalizedX = (x / canvas.width) * 2 - 1; // от -1 до 1
            const curveDepth = 60; // Насколько края выше центра
            const baseHeight = 150; // Высота центральной точки от верха экрана
            return baseHeight - (normalizedX * normalizedX * curveDepth);
        }

        function initSticks() {
            sticks = [];
            // Распределяем стержни равномерно с отступами по краям
            const padding = canvas.width * 0.15; 
            const usableWidth = canvas.width - (padding * 2);
            const spacing = usableWidth / (NUM_STICKS - 1);

            for (let i = 0; i < NUM_STICKS; i++) {
                const x = padding + (i * spacing);
                const startY = getRackY(x);
                sticks.push({
                    id: i,
                    x: x,
                    baseY: startY,
                    currentY: startY,
                    width: STICK_WIDTH,
                    height: STICK_HEIGHT,
                    isFalling: false,
                    isCaught: false
                });
            }
        }

        function restartGame() {
            gameState.score = 0;
            gameState.lives = 3;
            gameState.dropInterval = 2000;
            gameState.baseSpeed = 10;
            gameState.isRunning = true;
            gameState.effects = [];
            gameState.lastDropTime = performance.now();
            initSticks();
            
            gameOverScreen.style.display = 'none';
        }

        // ==========================================
        // ОТРИСОВКА (ГРАФИКА)
        // ==========================================

        function drawArcadeMachine() {
            ctx.save();
            
            // Рисуем верхнюю направляющую балку
            ctx.beginPath();
            ctx.lineWidth = 40;
            ctx.strokeStyle = '#1a1a1a'; // Темный металл
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            // Кривая линия, соединяющая верхние точки стержней
            ctx.moveTo(sticks[0].x - 40, getRackY(sticks[0].x - 40));
            // Аппроксимация дуги по точкам стержней
            for (let i = 0; i < NUM_STICKS; i++) {
                ctx.lineTo(sticks[i].x, sticks[i].baseY);
            }
            ctx.lineTo(sticks[NUM_STICKS-1].x + 40, getRackY(sticks[NUM_STICKS-1].x + 40));
            ctx.stroke();

            // Внутренняя светлая полоса балки
            ctx.lineWidth = 15;
            ctx.strokeStyle = '#2a2a2a';
            ctx.stroke();

            // Рисуем зеленые светодиоды (как на картинке Epark)
            const numLeds = 30;
            const startX = sticks[0].x - 20;
            const endX = sticks[NUM_STICKS-1].x + 20;
            
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00ff00';
            ctx.fillStyle = '#ccffcc';
            
            for(let i = 0; i <= numLeds; i++) {
                const lx = startX + (endX - startX) * (i / numLeds);
                const ly = getRackY(lx);
                
                ctx.beginPath();
                ctx.arc(lx, ly, 4, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }

        function drawSticks() {
            for (let s of sticks) {
                ctx.save();
                
                // Тень стержня
                ctx.shadowBlur = 15;
                
                if (s.isFalling) {
                    // Падающий стержень (опасный/активный - красный или неоновый)
                    ctx.shadowColor = '#ff0055';
                    ctx.fillStyle = '#ffcccc';
                    // Сердцевина
                    ctx.beginPath();
                    ctx.roundRect(s.x - s.width / 2, s.currentY, s.width, s.height, s.width / 2);
                    ctx.fill();
                    // Свечение
                    ctx.fillStyle = 'rgba(255, 0, 85, 0.8)';
                    ctx.roundRect(s.x - s.width / 2, s.currentY, s.width, s.height, s.width / 2);
                    ctx.fill();
                } else if (!s.isCaught) {
                    // Висящий в ожидании стержень (темный металл, как на фото)
                    ctx.shadowColor = '#000000';
                    ctx.shadowBlur = 5;
                    ctx.fillStyle = '#444'; // Темно-серый
                    
                    // Градиент для имитации цилиндра
                    let grad = ctx.createLinearGradient(s.x - s.width/2, 0, s.x + s.width/2, 0);
                    grad.addColorStop(0, '#222');
                    grad.addColorStop(0.5, '#666');
                    grad.addColorStop(1, '#222');
                    ctx.fillStyle = grad;

                    ctx.beginPath();
                    ctx.roundRect(s.x - s.width / 2, s.currentY, s.width, s.height, 5);
                    ctx.fill();

                    // Маленький красный огонек готовности на конце стержня
                    ctx.shadowColor = '#ff0000';
                    ctx.fillStyle = '#ff0000';
                    ctx.beginPath();
                    ctx.arc(s.x, s.currentY + s.height - 10, 3, 0, Math.PI*2);
                    ctx.fill();
                }

                ctx.restore();
            }
        }

        function drawHand() {
            if (!hand.isVisible) return;
            
            ctx.save();
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#00ffcc';
            ctx.strokeStyle = '#00ffcc';
            ctx.lineWidth = 4;

            // Прицел
            ctx.beginPath();
            ctx.arc(hand.x, hand.y, hand.radius, 0, Math.PI * 2);
            ctx.stroke();

            // Внутренняя точка
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(hand.x, hand.y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        function drawEffects() {
            for (let i = gameState.effects.length - 1; i >= 0; i--) {
                let effect = gameState.effects[i];
                ctx.save();
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                ctx.strokeStyle = effect.color.replace('ALPHA', effect.alpha);
                ctx.lineWidth = 6;
                ctx.shadowBlur = 15;
                ctx.shadowColor = effect.color.replace('ALPHA', 1);
                ctx.stroke();
                ctx.restore();

                effect.radius += 8;
                effect.alpha -= 0.04;
                if (effect.alpha <= 0) gameState.effects.splice(i, 1);
            }
        }

        function drawDigitalUI() {
            ctx.save();
            ctx.shadowBlur = 10;
            
            // Отрисовка Счета (Стиль цифрового табло в центре)
            ctx.font = 'bold 40px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#00ff00';
            ctx.fillStyle = '#ccffcc';
            ctx.fillText(BALang.t('УПАЙ: {n}', { n: gameState.score.toString().padStart(3, '0') }), canvas.width / 2, 80);

            // Отрисовка Жизней
            ctx.textAlign = 'right';
            ctx.shadowColor = '#ff0055';
            ctx.fillStyle = '#ffcccc';
            let livesText = "";
            for(let i=0; i<gameState.lives; i++) livesText += "♥ ";
            ctx.fillText(livesText, canvas.width - 40, 80);

            ctx.restore();
        }

        function spawnEffect(x, y, type) {
            const color = type === 'catch' ? 'rgba(0, 255, 204, ALPHA)' : 'rgba(255, 0, 85, ALPHA)';
            gameState.effects.push({ x, y, radius: 10, alpha: 1, color });
        }


        // ==========================================
        // ИГРОВАЯ ЛОГИКА
        // ==========================================
        function updateLogic(timestamp) {
            if (!gameState.isRunning) return;

            // 1. Механизм случайного сброса стержней
            if (timestamp - gameState.lastDropTime > gameState.dropInterval) {
                // Найти все висящие стержни
                const availableSticks = sticks.filter(s => !s.isFalling);
                
                if (availableSticks.length > 0) {
                    // Выбираем случайный
                    const randomStick = availableSticks[Math.floor(Math.random() * availableSticks.length)];
                    randomStick.isFalling = true;
                    
                    // Обновляем таймер
                    gameState.lastDropTime = timestamp;
                    
                    // Постепенно усложняем игру: стержни падают чаще
                    if (gameState.dropInterval > 600) {
                        gameState.dropInterval -= 50; 
                    }
                    // И быстрее
                    if (gameState.baseSpeed < 25) {
                        gameState.baseSpeed += 0.2;
                    }
                }
            }

            // 2. Обновление физики и проверка коллизий
            for (let s of sticks) {
                if (s.isFalling) {
                    s.currentY += gameState.baseSpeed;

                    // Проверка на поимку (коллизия Круг руки vs Прямоугольник стержня)
                    if (hand.isVisible) {
                        // Слегка расширяем хитбокс по ширине для комфортной игры
                        const hitZoneW = s.width * 2.5; 
                        
                        // Проверяем пересечение
                        if (hand.x + hand.radius > s.x - hitZoneW/2 && 
                            hand.x - hand.radius < s.x + hitZoneW/2 &&
                            hand.y + hand.radius > s.currentY && 
                            hand.y - hand.radius < s.currentY + s.height) {
                            
                            // Поймал!
                            s.isFalling = false;
                            s.currentY = s.baseY; // Возвращаем на место
                            gameState.score += 10;
                            spawnEffect(hand.x, hand.y, 'catch');
                        }
                    }

                    // Проверка промаха (стержень улетел за нижний край экрана)
                    if (s.currentY > canvas.height) {
                        s.isFalling = false;
                        s.currentY = s.baseY; // Возвращаем на место
                        gameState.lives -= 1;
                        spawnEffect(s.x, canvas.height - 50, 'miss');

                        // Конец игры?
                        if (gameState.lives <= 0) {
                            gameState.isRunning = false;
                            finalScoreSpan.innerText = gameState.score;
                            gameOverScreen.style.display = 'block';
                        }
                    }
                }
            }
        }


        // ==========================================
        // ГЛАВНЫЙ ЦИКЛ
        // ==========================================
        function gameLoop(timestamp) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            updateLogic(timestamp);

            drawArcadeMachine();
            drawSticks();
            drawEffects();
            drawHand();
            drawDigitalUI();

            requestAnimationFrame(gameLoop);
        }

        resizeCanvas();
        requestAnimationFrame(gameLoop);


        // ==========================================
        // ИНТЕГРАЦИЯ MEDIAPIPE (ВЕБ-КАМЕРА)
        // ==========================================
        const videoElement = document.getElementById('bg-video');

        const hands = new Hands({locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`;
        }});

        hands.setOptions({
            maxNumHands: 1, 
            modelComplexity: 1, 
            minDetectionConfidence: 0.6,
            minTrackingConfidence: 0.6
        });

        hands.onResults((results) => {
            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                // Отслеживаем указательный палец (точка 8)
                const indexFinger = results.multiHandLandmarks[0][8];
                // Инвертируем X (т.к. видео отзеркалено)
                hand.x = (1 - indexFinger.x) * canvas.width;
                hand.y = indexFinger.y * canvas.height;
                hand.isVisible = true;
            } else {
                hand.isVisible = false;
            }
        });

        const camera = new Camera(videoElement, {
            onFrame: async () => {
                await hands.send({image: videoElement});
            },
            width: 1280,
            height: 720
        });

        BACamera.start(camera, { onReady: () => {
                uiOverlay.innerHTML = "ОЮНГА ДАЯР!<br><span style='font-size: 0.8rem; color:#fff'>Стерженди жерге түшүрбөй кол менен кармап калыңыз</span>";
                setTimeout(() => {
                    uiOverlay.style.display = 'none';
                    // Запускаем игру после скрытия сообщения
                    gameState.isRunning = true;
                    gameState.lastDropTime = performance.now();
                }, 3000);
        } });


// Кнопки страницы: data-on="функция(аргументы)" вместо onclick — так работает политика безопасности (CSP).
// Аргументы: числа, строки в кавычках и this (сама кнопка).
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-on]');
  if (!el) return;
  const m = /^(\w+)\((.*)\)$/.exec(el.dataset.on);
  if (!m || typeof window[m[1]] !== 'function') return;
  const args = m[2].trim() === '' ? [] : m[2].split(/\s*,\s*/).map((raw) =>
    raw === 'this' ? el : /^-?\d+(\.\d+)?$/.test(raw) ? Number(raw) : raw.replace(/^['"]|['"]$/g, ''));
  window[m[1]](...args);
});
