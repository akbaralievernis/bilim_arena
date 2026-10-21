/* Перенесено из страницы, чтобы она работала с политикой безопасности (CSP) */
        const videoElement = document.getElementById('input_video');
        const canvasElement = document.getElementById('output_canvas');
        const canvasCtx = canvasElement.getContext('2d', { alpha: false });
        const modeText = document.getElementById('current-mode');
        const loadingScreen = document.getElementById('loading-screen');

        let drawings = []; 
        let currentPath = null;
        let selectedDrawing = null;
        let isDragging = false;
        let currentMode = "БАЙКОО";
        let selectedColor = '#ff3131'; 

        let lastFingerPos = { x: 0, y: 0 };
        let initialDistance = null;
        let initialScale = 1;
        let initialAngle = null;
        let drawingBaseAngle = 0;

        function setupCanvas() {
            canvasElement.width = window.innerWidth;
            canvasElement.height = window.innerHeight;
        }
        window.addEventListener('resize', setupCanvas);
        setupCanvas();

        function clearCanvas() {
            drawings = [];
            selectedDrawing = null;
            currentPath = null;
        }

        function changeColor(color, btn) {
            selectedColor = color;
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }

        function getDist(p1, p2) {
            return Math.sqrt(Math.pow((p1.x - p2.x) * canvasElement.width, 2) + Math.pow((p1.y - p2.y) * canvasElement.height, 2));
        }

        function isFist(landmarks) {
            const tips = [8, 12, 16, 20];
            const pips = [6, 10, 14, 18];
            const wrist = landmarks[0];
            return tips.every((tIdx, i) => {
                const tipDist = getDist(landmarks[tIdx], wrist);
                const pipDist = getDist(landmarks[pips[i]], wrist);
                return tipDist < pipDist;
            });
        }

        function isPalmOpen(landmarks) {
            const tips = [8, 12, 16, 20];
            const pips = [6, 10, 14, 18];
            return tips.every((tIdx, i) => landmarks[tIdx].y < landmarks[pips[i]].y);
        }

        function findDrawingAt(x, y) {
            const hitPadding = 30; 
            
            for (let i = drawings.length - 1; i >= 0; i--) {
                const d = drawings[i];
                for (let j = 0; j < d.points.length; j++) {
                    const p = d.points[j];
                    const dx = x - p.x;
                    const dy = y - p.y;
                    if (Math.sqrt(dx*dx + dy*dy) < hitPadding * (d.scale || 1)) {
                        return d;
                    }
                }
            }
            return null;
        }

        function onResults(results) {
            if (loadingScreen.style.display !== 'none') loadingScreen.style.display = 'none';

            requestAnimationFrame(() => {
                canvasCtx.fillStyle = '#050505';
                canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

                drawAll();

                if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                    const hands = results.multiHandLandmarks;

                    if (hands.length === 2 && isPalmOpen(hands[0]) && isPalmOpen(hands[1])) {
                        processScale(hands[0], hands[1]);
                    } else {
                        processSingleHand(hands[0]);
                        initialDistance = null;
                    }

                    hands.forEach(drawHandUI);
                } else {
                    setMode("БАЙКОО");
                    currentPath = null;
                    isDragging = false;
                    selectedDrawing = null;
                    initialAngle = null;
                }
            });
        }

        function processSingleHand(hand) {
            const thumbTip = hand[4];
            const indexTip = hand[8];
            const middleTip = hand[12];
            const wrist = hand[0];

            const pinchX = ((thumbTip.x + indexTip.x) / 2) * canvasElement.width;
            const pinchY = ((thumbTip.y + indexTip.y) / 2) * canvasElement.height;

            const pinchDist = getDist(thumbTip, indexTip);
            const isPinching = pinchDist < 40;

            if (isFist(hand)) {
                setMode("АЙЛАНДЫРУУ");
                if (!selectedDrawing) selectedDrawing = findDrawingAt(pinchX, pinchY);
                if (selectedDrawing) {
                    const angle = Math.atan2(indexTip.y - wrist.y, indexTip.x - wrist.x);
                    if (initialAngle === null) {
                        initialAngle = angle;
                        drawingBaseAngle = selectedDrawing.rotation || 0;
                    } else {
                        selectedDrawing.rotation = drawingBaseAngle + (angle - initialAngle);
                    }
                }
            } else if (isPinching) {
                setMode("КЫЙМЫЛДАТУУ");
                if (!isDragging) {
                    selectedDrawing = findDrawingAt(pinchX, pinchY);
                    if (selectedDrawing) {
                        isDragging = true;
                        lastFingerPos = { x: pinchX, y: pinchY };
                    }
                }
                
                if (isDragging && selectedDrawing) {
                    const dx = pinchX - lastFingerPos.x;
                    const dy = pinchY - lastFingerPos.y;
                    
                    selectedDrawing.points.forEach(p => {
                        p.x += dx;
                        p.y += dy;
                    });
                    lastFingerPos = { x: pinchX, y: pinchY };
                }
                currentPath = null;
            } else if (indexTip.y < hand[6].y && middleTip.y > hand[10].y) {
                setMode("СҮРӨТ ТАРТУУ");
                selectedDrawing = null;
                isDragging = false;
                initialAngle = null;

                if (!currentPath) {
                    currentPath = { points: [], scale: 1, rotation: 0, color: selectedColor };
                    drawings.push(currentPath);
                }
                currentPath.points.push({ x: indexTip.x * canvasElement.width, y: indexTip.y * canvasElement.height });
            } else {
                setMode("БАЙКОО");
                currentPath = null;
                selectedDrawing = null;
                isDragging = false;
                initialAngle = null;
            }
        }

        function processScale(h1, h2) {
            setMode("МАСШТАБДОО");
            const d = getDist(h1[8], h2[8]);
            const midX = (h1[8].x + h2[8].x) / 2 * canvasElement.width;
            const midY = (h1[8].y + h2[8].y) / 2 * canvasElement.height;

            if (!selectedDrawing) selectedDrawing = findDrawingAt(midX, midY);

            if (selectedDrawing) {
                if (initialDistance === null) {
                    initialDistance = d;
                    initialScale = selectedDrawing.scale || 1;
                } else {
                    selectedDrawing.scale = initialScale * (d / initialDistance);
                }
            }
        }

        function setMode(m) {
            if (currentMode !== m) {
                currentMode = m;
                modeText.innerText = m;
                const colors = {
                    "СҮРӨТ ТАРТУУ": "var(--neon-blue)",
                    "КЫЙМЫЛДАТУУ": "var(--neon-green)",
                    "АЙЛАНДЫРУУ": "var(--neon-yellow)",
                    "МАСШТАБДОО": "var(--neon-purple)",
                    "БАЙКОО": "var(--neon-blue)"
                };
                modeText.style.color = colors[m] || "white";
            }
        }

        function drawAll() {
            for (let i = 0; i < drawings.length; i++) {
                const d = drawings[i];
                if (d.points.length < 2) continue;
                
                canvasCtx.save();
                const cx = d.points[0].x;
                const cy = d.points[0].y;
                
                canvasCtx.translate(cx, cy);
                canvasCtx.scale(d.scale || 1, d.scale || 1);
                canvasCtx.rotate(d.rotation || 0);
                canvasCtx.translate(-cx, -cy);

                canvasCtx.beginPath();
                if (selectedDrawing === d) {
                    canvasCtx.strokeStyle = "#ffffff";
                    canvasCtx.shadowBlur = 20;
                    canvasCtx.shadowColor = d.color;
                    canvasCtx.lineWidth = 6;
                } else {
                    canvasCtx.strokeStyle = d.color;
                    canvasCtx.lineWidth = 4;
                    canvasCtx.shadowBlur = 5;
                    canvasCtx.shadowColor = d.color;
                }

                canvasCtx.lineCap = 'round';
                canvasCtx.lineJoin = 'round';

                canvasCtx.moveTo(d.points[0].x, d.points[0].y);
                for (let j = 1; j < d.points.length; j++) {
                    canvasCtx.lineTo(d.points[j].x, d.points[j].y);
                }
                canvasCtx.stroke();
                canvasCtx.restore();
            }
        }

        function drawHandUI(landmarks) {
            canvasCtx.strokeStyle = 'rgba(0, 242, 255, 0.4)';
            canvasCtx.lineWidth = 2;
            
            const connections = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
            
            connections.forEach(([start, end]) => {
                const p1 = landmarks[start];
                const p2 = landmarks[end];
                canvasCtx.beginPath();
                canvasCtx.moveTo(p1.x * canvasElement.width, p1.y * canvasElement.height);
                canvasCtx.lineTo(p2.x * canvasElement.width, p2.y * canvasElement.height);
                canvasCtx.stroke();
            });

            const tipIdx = (currentMode === "КЫЙМЫЛДАТУУ") ? 4 : 8;
            const tip = landmarks[tipIdx];
            canvasCtx.beginPath();
            canvasCtx.arc(tip.x * canvasElement.width, tip.y * canvasElement.height, 8, 0, Math.PI*2);
            canvasCtx.fillStyle = (currentMode === "КЫЙМЫЛДАТУУ") ? "#39ff14" : "#00f2ff";
            canvasCtx.fill();
        }

        const hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`
        });

        hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 0, 
            minDetectionConfidence: 0.65,
            minTrackingConfidence: 0.65
        });
        hands.onResults(onResults);

        const camera = new Camera(videoElement, {
            onFrame: async () => await hands.send({ image: videoElement }),
            width: 640, 
            height: 480
        });
        BACamera.start(camera);

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
