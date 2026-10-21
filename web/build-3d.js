/* Перенесено из страницы, чтобы она работала с политикой безопасности (CSP) */
// Без three.js (CDN недоступен) игра не запускается — shared/camera.js уже показал понятное сообщение
if (window.THREE) {
    const videoElement = document.getElementById('video-element');
    const canvasElement = document.getElementById('output-canvas');
    const canvasCtx = canvasElement.getContext('2d');
    const progressBar = document.getElementById('progress-bar');
    const cursorRing = document.getElementById('cursor-ring');

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('three-container').appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 10, 10);
    scene.add(directionalLight);

    camera.position.z = 5;

    const GRID_SIZE = 0.5;
    const cubes = [];
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    let ghostCube = null; 
    let isDeletingMode = false;
    let isMovingMode = false;
    let creationTimer = 0;
    let isDrawingReady = false;
    let isMovingReady = false;
    let lastMovePos = new THREE.Vector3();

    function createGhostCube() {
        const geo = new THREE.BoxGeometry(GRID_SIZE, GRID_SIZE, GRID_SIZE);
        const mat = new THREE.MeshPhongMaterial({ color: 0x00f2ff, transparent: true, opacity: 0.2, wireframe: true });
        ghostCube = new THREE.Mesh(geo, mat);
        ghostCube.visible = false;
        scene.add(ghostCube);
    }
    createGhostCube();

    function snapToGrid(position) {
        return new THREE.Vector3(
            Math.round(position.x / GRID_SIZE) * GRID_SIZE,
            Math.round(position.y / GRID_SIZE) * GRID_SIZE,
            0
        );
    }

    function isFist(landmarks) {
        const fingerTips = [8, 12, 16, 20];
        const wrist = landmarks[0];
        return fingerTips.every(tipIdx => {
            const tip = landmarks[tipIdx];
            const dist = Math.sqrt(Math.pow(tip.x - wrist.x, 2) + Math.pow(tip.y - wrist.y, 2));
            return dist < 0.15;
        });
    }

    function onResults(results) {
        document.getElementById('loading-screen').style.display = 'none';
        
        if (canvasElement.width !== window.innerWidth || canvasElement.height !== window.innerHeight) {
            canvasElement.width = window.innerWidth;
            canvasElement.height = window.innerHeight;
        }
        
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        
        canvasCtx.translate(canvasElement.width, 0);
        canvasCtx.scale(-1, 1);

        if (results.multiHandLandmarks) {
            let leftHand = null;
            let rightHand = null;

            results.multiHandedness.forEach((hand, index) => {
                if (hand.label === 'Left') leftHand = results.multiHandLandmarks[index];
                if (hand.label === 'Right') rightHand = results.multiHandLandmarks[index];
                
                drawConnectors(canvasCtx, results.multiHandLandmarks[index], HAND_CONNECTIONS, {color: '#ffffffaa', lineWidth: 3});
                drawLandmarks(canvasCtx, results.multiHandLandmarks[index], {color: hand.label === 'Left' ? '#00f2ff' : '#ff0000', lineWidth: 1, radius: 4});
            });

            if (rightHand) {
                isDeletingMode = rightHand[8].y < rightHand[0].y - 0.25;
            }

            if (leftHand) {
                const thumb = leftHand[4];
                const indexF = leftHand[8];
                const dist = Math.sqrt(Math.pow(thumb.x - indexF.x, 2) + Math.pow(thumb.y - indexF.y, 2));
                const fistDetected = isFist(leftHand);
                
                const x = (1 - thumb.x) * 2 - 1;
                const y = -(thumb.y * 2 - 1);
                const rawPos = new THREE.Vector3(x * 5, y * 3.5, 0);
                const gridPos = snapToGrid(rawPos);
                
                const uiX = (1 - thumb.x) * window.innerWidth;
                const uiY = thumb.y * window.innerHeight;
                cursorRing.style.left = `${uiX}px`;
                cursorRing.style.top = `${uiY}px`;

                if (fistDetected) {
                    isMovingMode = true;
                    cursorRing.className = "progress-ring move-mode";
                    ghostCube.visible = false;
                } else {
                    isMovingMode = false;
                    isMovingReady = false;
                    cursorRing.className = isDeletingMode ? "progress-ring delete-mode" : "progress-ring";
                    ghostCube.visible = true;
                    ghostCube.position.copy(gridPos);
                    ghostCube.material.color.setHex(isDeletingMode ? 0xff0000 : 0x00f2ff);
                }

                if ((dist < 0.05 && !isMovingMode) || (isMovingMode)) {
                    cursorRing.style.display = 'block';
                    if (!isDrawingReady && !isMovingReady) {
                        creationTimer += 3.5;
                        const offset = 226 - (Math.min(creationTimer, 100) / 100) * 226;
                        progressBar.style.strokeDashoffset = offset;
                        if (creationTimer >= 100) {
                            if (isMovingMode) {
                                isMovingReady = true;
                                lastMovePos.copy(rawPos);
                            } else {
                                isDrawingReady = true;
                            }
                            cursorRing.style.display = 'none';
                        }
                    }
                    if (isDrawingReady && !isMovingMode) {
                        if (isDeletingMode) {
                            handleDeleteLogic(gridPos);
                        } else {
                            placePermanentCube(gridPos);
                        }
                    }
                    if (isMovingReady && isMovingMode) {
                        const delta = new THREE.Vector3().subVectors(rawPos, lastMovePos);
                        worldGroup.position.add(delta);
                        lastMovePos.copy(rawPos);
                    }
                } else {
                    resetInteraction();
                }
            } else {
                resetInteraction();
            }
        }
        canvasCtx.restore();
    }

    function placePermanentCube(pos) {
        const localPos = worldGroup.worldToLocal(pos.clone());
        const gridLocal = snapToGrid(localPos);
        const exists = cubes.some(c => c.position.distanceTo(gridLocal) < 0.1);
        if (exists) return;
        const geo = new THREE.BoxGeometry(GRID_SIZE, GRID_SIZE, GRID_SIZE);
        const mat = new THREE.MeshPhongMaterial({ 
            color: 0x00f2ff, 
            transparent: true, 
            opacity: 0.5, 
            shininess: 90 
        });
        const cube = new THREE.Mesh(geo, mat);
        cube.position.copy(gridLocal);
        const edges = new THREE.EdgesGeometry(geo);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x00f2ff, transparent: true, opacity: 0.8 }));
        cube.add(line);
        worldGroup.add(cube);
        cubes.push(cube);
    }

    function handleDeleteLogic(pos) {
        const localPos = worldGroup.worldToLocal(pos.clone());
        const gridLocal = snapToGrid(localPos);
        let target = null;
        cubes.forEach(c => {
            if (c.position.distanceTo(gridLocal) < 0.1) target = c;
        });
        if (target) {
            worldGroup.remove(target);
            const idx = cubes.indexOf(target);
            if (idx > -1) cubes.splice(idx, 1);
        }
    }

    function resetInteraction() {
        cursorRing.style.display = 'none';
        creationTimer = 0;
        progressBar.style.strokeDashoffset = 226;
        isDrawingReady = false;
        isMovingReady = false;
    }

    const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`
    });
    hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.7, minTrackingConfidence: 0.7 });
    hands.onResults(onResults);
    
    const cameraHelper = new Camera(videoElement, {
        onFrame: async () => { await hands.send({image: videoElement}); },
        width: 1280,
        height: 720
    });
    BACamera.start(cameraHelper);
    
    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
    animate();
    
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}
