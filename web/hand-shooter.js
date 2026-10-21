/* Перенесено из страницы, чтобы она работала с политикой безопасности (CSP) */
const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const scoreElement = document.getElementById('score');
const speedElement = document.getElementById('speed-multiplier');
const speedContainer = document.getElementById('speed-container');
const statusElement = document.getElementById('status');
const crosshair = document.getElementById('crosshair');

let score = 0;
let speedMultiplier = 1.0;
const MAX_SPEED = 3.0;
const MIN_SPEED = 1.0;
let targets = [];
let particles = [];
let canShoot = true;
let lastTargetSpawn = 0;
let posBuffer = []; 

function resize() {
    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 8 + 2;
        this.speedX = (Math.random() - 0.5) * 25;
        this.speedY = (Math.random() - 0.5) * 25;
        this.life = 1.0;
        this.decay = Math.random() * 0.05 + 0.02;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
    }
    draw() {
        canvasCtx.globalAlpha = this.life;
        canvasCtx.fillStyle = this.color;
        canvasCtx.beginPath();
        canvasCtx.rect(this.x, this.y, this.size, this.size);
        canvasCtx.fill();
        canvasCtx.globalAlpha = 1.0;
    }
}

class Target {
    constructor(multiplier) {
        this.radius = 40 + Math.random() * 20;
        this.x = Math.random() < 0.5 ? -this.radius : canvasElement.width + this.radius;
        this.targetY = Math.random() * (canvasElement.height - 300) + 150;
        this.y = this.targetY;
        this.baseSpeed = (5 + Math.random() * 4);
        this.speed = (this.baseSpeed * multiplier) * (this.x < 0 ? 1 : -1);
        this.color = `hsl(${Math.random() * 360}, 90%, 60%)`;
        this.active = true;
        this.escaped = false;
    }
    draw() {
        canvasCtx.shadowBlur = 30;
        canvasCtx.shadowColor = this.color;
        canvasCtx.beginPath();
        canvasCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        canvasCtx.fillStyle = this.color;
        canvasCtx.fill();
        
        canvasCtx.shadowBlur = 0;
        canvasCtx.strokeStyle = "white";
        canvasCtx.lineWidth = 5;
        canvasCtx.stroke();
        
        canvasCtx.beginPath();
        canvasCtx.moveTo(this.x - this.radius, this.y);
        canvasCtx.lineTo(this.x + this.radius, this.y);
        canvasCtx.moveTo(this.x, this.y - this.radius);
        canvasCtx.lineTo(this.x, this.y + this.radius);
        canvasCtx.stroke();
    }
    update() {
        this.x += this.speed;
        if ((this.speed > 0 && this.x > canvasElement.width + this.radius) || 
            (this.speed < 0 && this.x < -this.radius)) {
            this.active = false;
            this.escaped = true;
        }
    }
}

function updateScore(amount) {
    score += amount;
    if (score < 0) score = 0;
    scoreElement.innerText = score;
    
    if (amount < 0) {
        scoreElement.parentElement.classList.add('score-penalty');
        setTimeout(() => scoreElement.parentElement.classList.remove('score-penalty'), 500);
    }
}

function updateSpeed(delta) {
    speedMultiplier += delta;
    speedMultiplier = Math.max(MIN_SPEED, Math.min(MAX_SPEED, parseFloat(speedMultiplier.toFixed(1))));
    speedElement.innerText = speedMultiplier.toFixed(1);

    speedContainer.classList.add('scale-110');
    if (delta < 0) {
        speedContainer.classList.add('border-red-500');
        setTimeout(() => speedContainer.classList.remove('border-red-500'), 300);
    }
    setTimeout(() => speedContainer.classList.remove('scale-110'), 150);
}

function onResults(results) {
    canvasCtx.fillStyle = "#000000";
    canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

    const now = Date.now();
    const spawnInterval = Math.max(600, 2000 / speedMultiplier);
    
    if (now - lastTargetSpawn > spawnInterval) {
        targets.push(new Target(speedMultiplier));
        lastTargetSpawn = now;
    }
    
    targets.forEach(t => {
        t.update();
        if (t.active) {
            t.draw();
        } else if (t.escaped) {
            updateScore(-5);
            updateSpeed(-0.1);
            t.escaped = false;
        }
    });
    
    targets = targets.filter(t => t.active);

    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => { p.update(); p.draw(); });

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        statusElement.innerText = "ТУТУМ ДАЯР";
        statusElement.style.color = "#22c55e";
        
        const hand = results.multiHandLandmarks[0];
        const indexTip = hand[8]; 
        
        const screenX = (1 - indexTip.x) * canvasElement.width;
        const screenY = indexTip.y * canvasElement.height;

        crosshair.style.display = 'block';
        crosshair.style.left = screenX + 'px';
        crosshair.style.top = screenY + 'px';

        posBuffer.push({x: screenX, y: screenY, rawY: indexTip.y});
        if (posBuffer.length > 5) posBuffer.shift();

        if (posBuffer.length >= 2) {
            const prev = posBuffer[posBuffer.length - 2];
            const velocityY = prev.rawY - indexTip.y; 

            if (velocityY > 0.05 && canShoot) {
                const shotPos = posBuffer[0];
                shoot(shotPos.x, shotPos.y);
                
                canShoot = false;
                crosshair.classList.add('firing');
                setTimeout(() => crosshair.classList.remove('firing'), 200);
                setTimeout(() => canShoot = true, 400);
            }
        }
    } else {
        statusElement.innerText = "КОЛУҢУЗДУ КӨРСӨТҮҢҮЗ";
        statusElement.style.color = "#ef4444";
        crosshair.style.display = 'none';
        posBuffer = [];
    }
}

function shoot(vizX, vizY) {
    canvasCtx.fillStyle = "rgba(255, 255, 255, 0.5)";
    canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

    const internalX = canvasElement.width - vizX;

    targets.forEach(t => {
        const dist = Math.hypot(t.x - internalX, t.y - vizY);
        if (dist < t.radius + 65) { 
            t.active = false;
            updateScore(10);
            updateSpeed(0.1); 
            for (let i = 0; i < 40; i++) {
                particles.push(new Particle(t.x, t.y, t.color));
            }
        }
    });
}

const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
});

hands.onResults(onResults);

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({image: videoElement});
    },
    width: 1280,
    height: 720
});

BACamera.start(camera);
