import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { getBlockTexture, NUMBER_COLORS } from './TextureGenerator.js';

const LEVEL_THEMES = [
    {
        // Level 1: Classic Deep Emerald Felt Table
        bg: 0x0a2f24,
        ambient: 0xfffbeb,
        ambientInt: 0.78,
        rim: 0xfde047,
        plate: 0x1c130d
    },
    {
        // Level 2: Royal Sapphire Casino Felt
        bg: 0x0c213b,
        ambient: 0xf8fafc,
        ambientInt: 0.78,
        rim: 0x60a5fa,
        plate: 0x111827
    },
    {
        // Level 3: Vintage Bordeaux Felt
        bg: 0x2b0d18,
        ambient: 0xfff1f2,
        ambientInt: 0.78,
        rim: 0xfb7185,
        plate: 0x18080f
    },
    {
        // Level 4: Charcoal Obsidian Felt
        bg: 0x111827,
        ambient: 0xf8fafc,
        ambientInt: 0.78,
        rim: 0x38bdf8,
        plate: 0x030712
    }
];

export class TowerRenderer {
    /**
     * @param {HTMLElement} container 
     * @param {Object} options 
     */
    constructor(container, options = {}) {
        this.container = container;
        this.onBlockClick = options.onBlockClick || (() => {});
        this.onBackgroundClick = options.onBackgroundClick || (() => {});

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.ambientLight = null;
        this.dirLight = null;
        this.rimLight = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        /** @type {Map<string|number, { model: any, group: THREE.Group, materials: THREE.Material[] }>} */
        this.blockMeshes = new Map();

        /** @type {Array<{ group: THREE.Group, velocity: THREE.Vector3, angularVelocity: THREE.Vector3, opacity: number }>} */
        this.flyingBlocks = [];

        /** @type {Array<{ mesh: THREE.Mesh, mat: THREE.Material, geo: THREE.BufferGeometry, velocity: THREE.Vector3, life: number, maxLife: number }>} */
        this.particles = [];

        /** @type {THREE.Mesh|null} */
        this.exitGuideBeam = null;
        this.currentGridSize = 5;
        this.currentCellSize = 1.0;
        this.currentLevel = 1;
        this.isDarkTheme = false;

        this.basePlate = null;
        this._isDisposed = false;

        this.cameraShakeIntensity = 0;
        this.cameraShakeStartTime = 0;
        this.cameraShakeDuration = 0;
        this._cameraShakeOffset = new THREE.Vector3();

        this._initScene();
        this._initControls();
        this._initEvents();
        this._animate = this._animate.bind(this);
        requestAnimationFrame(this._animate);
    }

    /**
     * Triggers dynamic camera shake effect on explosions.
     * @param {number} intensity 
     * @param {number} durationMs 
     */
    shakeCamera(intensity = 0.35, durationMs = 400) {
        this.cameraShakeIntensity = intensity;
        this.cameraShakeDuration = durationMs;
        this.cameraShakeStartTime = performance.now();
    }

    _initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(LEVEL_THEMES[0].bg);

        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;

        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.set(12, 14, 18);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // 1. Natural Studio Hemisphere Fill Light (sky bounce + ground reflection)
        this.hemiLight = new THREE.HemisphereLight(0xf8fafc, 0xe2e8f0, 0.65);
        this.scene.add(this.hemiLight);

        // 2. Subtle Warm Ambient Fill
        this.ambientLight = new THREE.AmbientLight(0xfffbf5, 0.35);
        this.scene.add(this.ambientLight);

        // 3. Warm Directional Key Light with Soft PCF Shadows
        this.dirLight = new THREE.DirectionalLight(0xfff7ed, 1.30);
        this.dirLight.position.set(16, 26, 16);
        this.dirLight.castShadow = true;
        this.dirLight.shadow.mapSize.width = 2048;
        this.dirLight.shadow.mapSize.height = 2048;
        this.dirLight.shadow.camera.near = 0.5;
        this.dirLight.shadow.camera.far = 65;
        this.dirLight.shadow.camera.left = -16;
        this.dirLight.shadow.camera.right = 16;
        this.dirLight.shadow.camera.top = 16;
        this.dirLight.shadow.camera.bottom = -16;
        this.dirLight.shadow.bias = -0.0002;
        this.dirLight.shadow.radius = 2.4; // Soft PCF shadow edges
        this.scene.add(this.dirLight);

        // 4. Secondary Cool Rim Light for Chamfer Definition
        this.rimLight = new THREE.DirectionalLight(0x93c5fd, 0.55);
        this.rimLight.position.set(-16, 14, -16);
        this.scene.add(this.rimLight);
    }

    /**
     * Dynamically smoothly transitions visual atmosphere based on current level and theme.
     * @param {number} level 
     */
    applyLevelTheme(level = 1) {
        this.currentLevel = level;

        if (this.isDarkTheme) {
            // Midnight Obsidian Emerald Felt
            if (this.scene && this.scene.background) {
                this.scene.background.set(0x04140f);
            }
            if (this.hemiLight) {
                this.hemiLight.color.set(0x064e3b);
                this.hemiLight.groundColor.set(0x022c22);
                this.hemiLight.intensity = 0.55;
            }
            if (this.ambientLight) {
                this.ambientLight.color.set(0x064e3b);
                this.ambientLight.intensity = 0.35;
            }
            if (this.dirLight) {
                this.dirLight.color.set(0xfffbeb);
                this.dirLight.intensity = 1.25;
            }
            if (this.rimLight) {
                this.rimLight.color.set(0xfacc15);
                this.rimLight.intensity = 0.65;
            }
            if (this.basePlate && this.basePlate.material) {
                this.basePlate.material.color.set(0x140d08);
            }
            return;
        }

        const themeIdx = (level - 1) % LEVEL_THEMES.length;
        const theme = LEVEL_THEMES[themeIdx];

        if (this.scene && this.scene.background) {
            this.scene.background.set(theme.bg);
        }
        if (this.hemiLight) {
            this.hemiLight.color.set(0xf8fafc);
            this.hemiLight.groundColor.set(theme.plate || 0xe2e8f0);
            this.hemiLight.intensity = 0.65;
        }
        if (this.ambientLight) {
            this.ambientLight.color.set(0xfffbf5);
            this.ambientLight.intensity = 0.35;
        }
        if (this.dirLight) {
            this.dirLight.color.set(0xfff7ed);
            this.dirLight.intensity = 1.30;
        }
        if (this.rimLight) {
            this.rimLight.color.set(theme.rim || 0x93c5fd);
            this.rimLight.intensity = 0.55;
        }
        if (this.basePlate && this.basePlate.material) {
            this.basePlate.material.color.set(theme.plate);
        }
    }

    /**
     * Toggles between Scandinavian Light and Slate Obsidian Dark mode.
     * @param {boolean} isDark 
     */
    setTheme(isDark = false) {
        this.isDarkTheme = isDark;
        this.applyLevelTheme(this.currentLevel || 1);
    }

    _initControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08; // Buttery smooth rotational and zoom deceleration
        this.controls.zoomSpeed = 0.85; // Refined zoom sensitivity for silky transitions
        this.controls.maxPolarAngle = Math.PI / 2 + 0.05; // allow viewing slightly below horizon
        this.controls.minDistance = 3.0;
        this.controls.maxDistance = 50;
        this.controls.target.set(0, 4, 0);
    }

    _initEvents() {
        window.addEventListener('resize', () => this.handleResize());

        let pointerDownTime = 0;
        let pointerDownX = 0;
        let pointerDownY = 0;
        let pointerMovedDist = 0;
        this._isPointerDown = false;

        this.renderer.domElement.addEventListener('pointerdown', (e) => {
            this._isPointerDown = true;
            pointerDownTime = performance.now();
            pointerDownX = e.clientX;
            pointerDownY = e.clientY;
            pointerMovedDist = 0;
        });

        this.renderer.domElement.addEventListener('pointermove', (e) => {
            if (this._isPointerDown) {
                const d = Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY);
                if (d > pointerMovedDist) pointerMovedDist = d;
            }
        });

        window.addEventListener('pointerup', (e) => {
            this._isPointerDown = false;
        });

        window.addEventListener('pointercancel', () => {
            this._isPointerDown = false;
        });

        this.renderer.domElement.addEventListener('pointerup', (e) => {
            const duration = performance.now() - pointerDownTime;
            const dist = Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY);
            const effectiveDist = Math.max(dist, pointerMovedDist);
            // Ultra-forgiving Tap-to-Select:
            // Allows up to 800ms duration and up to 24px cursor jitter (touch/mouse drift)
            if (duration < 800 && effectiveDist < 24) {
                this._handleClick(e);
            }
        });

        // Smooth Wheel Zoom: intercepts mouse wheel to apply silky, inertia-smoothed zooming
        this._targetZoomDist = null;
        this.renderer.domElement.addEventListener('wheel', (e) => {
            if (this._isCameraAnimating) {
                this._isCameraAnimating = false;
            }
            e.preventDefault();
            const currentDist = this.camera.position.distanceTo(this.controls.target);
            if (this._targetZoomDist === null || Math.abs(this._targetZoomDist - currentDist) > currentDist * 0.5) {
                this._targetZoomDist = currentDist;
            }
            // Proportional smooth scaling: small notches produce smooth, continuous zoom
            const factor = Math.exp(e.deltaY * 0.0015);
            this._targetZoomDist = Math.max(this.controls.minDistance, Math.min(this.controls.maxDistance, this._targetZoomDist * factor));
        }, { passive: false });
    }

    handleResize() {
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        this.fitCameraToBlocks({ animate: false });
    }

    /**
     * Calculates the bounding box of all active blocks and computes the tightest
     * camera distance and center to zoom in as much as possible, eliminating side padding
     * while keeping all blocks inside the viewport.
     * @param {THREE.Vector3} [viewDirection]
     */
    _calculateOptimalCameraFit(viewDirection = null) {
        const box = new THREE.Box3();
        if (this.blockMeshes && this.blockMeshes.size > 0) {
            for (const item of this.blockMeshes.values()) {
                box.expandByObject(item.group);
            }
        } else if (this.currentTopology) {
            const halfGrid = (this.currentGridSize * this.currentCellSize) / 2;
            const height = this.currentTopology.maxLayers * this.currentCellSize;
            box.min.set(-halfGrid, 0, -halfGrid);
            box.max.set(halfGrid, height, halfGrid);
        } else {
            box.min.set(-2.5, 0, -2.5);
            box.max.set(2.5, 6, 2.5);
        }

        const center = new THREE.Vector3();
        box.getCenter(center);

        // 8 corner vertices of the active blocks' 3D bounding box
        const corners = [
            new THREE.Vector3(box.min.x, box.min.y, box.min.z),
            new THREE.Vector3(box.min.x, box.min.y, box.max.z),
            new THREE.Vector3(box.min.x, box.max.y, box.min.z),
            new THREE.Vector3(box.min.x, box.max.y, box.max.z),
            new THREE.Vector3(box.max.x, box.min.y, box.min.z),
            new THREE.Vector3(box.max.x, box.min.y, box.max.z),
            new THREE.Vector3(box.max.x, box.max.y, box.min.z),
            new THREE.Vector3(box.max.x, box.max.y, box.max.z)
        ];

        // Determine view direction vector
        let u;
        if (viewDirection) {
            u = viewDirection.clone().normalize();
        } else if (this.camera && this.controls) {
            const rel = this.camera.position.clone().sub(this.controls.target);
            if (rel.lengthSq() > 0.5) {
                u = rel.normalize();
                // Ensure gentle downward pitch angle between 16° and 60°
                const pitch = Math.asin(Math.max(0.26, Math.min(0.75, u.y)));
                const yaw = Math.atan2(u.x, u.z);
                u.set(
                    Math.sin(yaw) * Math.cos(pitch),
                    Math.sin(pitch),
                    Math.cos(yaw) * Math.cos(pitch)
                ).normalize();
            } else {
                const pitch = 24 * (Math.PI / 180);
                u = new THREE.Vector3(
                    Math.SQRT1_2 * Math.cos(pitch),
                    Math.sin(pitch),
                    Math.SQRT1_2 * Math.cos(pitch)
                ).normalize();
            }
        } else {
            const pitch = 24 * (Math.PI / 180);
            u = new THREE.Vector3(
                Math.SQRT1_2 * Math.cos(pitch),
                Math.sin(pitch),
                Math.SQRT1_2 * Math.cos(pitch)
            ).normalize();
        }

        // Camera coordinate frame
        const forward = u.clone().negate();
        const worldUp = new THREE.Vector3(0, 1, 0);
        let right = new THREE.Vector3().crossVectors(forward, worldUp);
        if (right.lengthSq() < 0.0001) {
            right = new THREE.Vector3(1, 0, 0);
        } else {
            right.normalize();
        }
        const camUp = new THREE.Vector3().crossVectors(right, forward).normalize();

        const aspect = (this.camera && this.camera.aspect) ? this.camera.aspect : 1.0;
        const vFovRad = ((this.camera ? this.camera.fov : 45) * Math.PI) / 180;
        const halfVFov = vFovRad / 2;
        const tanHalfV = Math.tan(halfVFov);
        const tanHalfH = tanHalfV * aspect;

        // Snug margins: 0.95 horizontal (eliminates excessive side padding, ~2.5% edge clearance), 0.90 vertical
        const marginX = 0.95;
        const marginY = 0.90;

        let maxDist = 0;
        for (const corner of corners) {
            const d = corner.clone().sub(center);
            const xc = d.dot(right);
            const yc = d.dot(camUp);
            const zProj = d.dot(u);

            const reqDx = zProj + Math.abs(xc) / (tanHalfH * marginX);
            const reqDy = zProj + Math.abs(yc) / (tanHalfV * marginY);

            maxDist = Math.max(maxDist, reqDx, reqDy);
        }

        const optimalDist = Math.max(4.5, maxDist);
        const position = center.clone().add(u.clone().multiplyScalar(optimalDist));

        return {
            center,
            distance: optimalDist,
            optimalDist,
            position,
            viewDir: u
        };
    }

    /**
     * Adjusts the camera zoom and target to frame all blocks tightly in the viewport.
     * Smoothly interpolates both camera position and orbital target to keep remaining blocks centered.
     * @param {Object} [options]
     * @param {boolean} [options.animate=false]
     * @param {number} [options.duration=650]
     * @param {Function} [options.onComplete]
     */
    fitCameraToBlocks({ animate = false, duration = 650, onComplete = null } = {}) {
        if (!this.camera || !this.controls) return;
        if (this._isPointerDown) return; // Don't interrupt active manual orbit dragging

        const fit = this._calculateOptimalCameraFit();
        this.controls.minDistance = Math.max(2.5, fit.optimalDist * 0.35);
        this.controls.maxDistance = fit.optimalDist * 2.8;

        // Preserve player's current orbit angle if camera was already rotated
        const relCam = this.camera.position.clone().sub(this.controls.target);
        let targetPos;
        if (relCam.lengthSq() > 1.0) {
            const currentDir = relCam.normalize();
            targetPos = fit.center.clone().add(currentDir.multiplyScalar(fit.optimalDist));
        } else {
            targetPos = fit.position;
        }

        if (this._activeFitAnimFrame) {
            cancelAnimationFrame(this._activeFitAnimFrame);
            this._activeFitAnimFrame = null;
        }

        if (!animate) {
            this.controls.target.copy(fit.center);
            this.camera.position.copy(targetPos);
            this.controls.update();
            this._targetZoomDist = null;
            if (onComplete) onComplete();
            return;
        }

        this._isCameraAnimating = true;
        const startPos = this.camera.position.clone();
        const startTarget = this.controls.target.clone();
        const destTarget = fit.center.clone();
        const startTime = performance.now();

        const animateFit = () => {
            if (this._isPointerDown) {
                this._isCameraAnimating = false;
                this._activeFitAnimFrame = null;
                return;
            }

            const elapsed = performance.now() - startTime;
            const progress = Math.min(1.0, elapsed / duration);
            // Smooth natural ease-in-out curve (smoothstep / sinusoidal S-curve)
            const ease = 0.5 - 0.5 * Math.cos(progress * Math.PI);

            this.camera.position.lerpVectors(startPos, targetPos, ease);
            this.controls.target.lerpVectors(startTarget, destTarget, ease);
            this.controls.update();

            if (progress < 1.0) {
                this._activeFitAnimFrame = requestAnimationFrame(animateFit);
            } else {
                this._isCameraAnimating = false;
                this._activeFitAnimFrame = null;
                this._targetZoomDist = this.camera.position.distanceTo(this.controls.target);
                if (onComplete) onComplete();
            }
        };

        this._activeFitAnimFrame = requestAnimationFrame(animateFit);
    }

    /**
     * Smoothly glides the camera from a cinematic wider orbit into the optimal tight zoom.
     * @param {Function} [onComplete]
     */
    playLevelEntrance(onComplete) {
        if (!this.camera || !this.controls) return;
        this._isCameraAnimating = true;

        const fit = this._calculateOptimalCameraFit();
        this.controls.target.set(fit.center.x, fit.center.y, fit.center.z);
        this.controls.minDistance = Math.max(3.0, fit.optimalDist * 0.4);
        this.controls.maxDistance = fit.optimalDist * 2.8;

        const destPos = fit.position;
        // Start: slightly wider orbit angle (1.40x optimal distance)
        const entranceDist = fit.optimalDist * 1.40;
        const startPos = fit.center.clone().add(
            new THREE.Vector3(entranceDist * 0.9, entranceDist * 0.8, entranceDist * 0.3)
        );

        this.camera.position.copy(startPos);
        this.controls.update();

        const startTime = performance.now();
        const duration = 850;

        const animateEntrance = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(1.0, elapsed / duration);
            const easeOut = 1 - Math.pow(1 - progress, 3);

            this.camera.position.lerpVectors(startPos, destPos, easeOut);
            this.controls.update();

            if (progress < 1.0) {
                requestAnimationFrame(animateEntrance);
            } else {
                this._isCameraAnimating = false;
                if (onComplete) onComplete();
            }
        };

        requestAnimationFrame(animateEntrance);
    }

    /**
     * Smoothly animates the camera to align with the nearest cardinal or 45° corner angle,
     * maintaining the tightest optimal zoom factor.
     * @param {Function} [onComplete]
     */
    snapCameraToNearestAngle(onComplete) {
        if (this._isCameraAnimating) return;
        this._isCameraAnimating = true;

        const target = this.controls.target.clone();
        const rel = this.camera.position.clone().sub(target);
        const currentAngle = Math.atan2(rel.x, rel.z);

        // Snap to nearest 45-degree angle (isometric corners & faces)
        const step = Math.PI / 4;
        const targetAngle = Math.round(currentAngle / step) * step;
        const currentDist = Math.max(1, rel.length());
        const pitch = Math.asin(Math.max(0.24, Math.min(0.70, rel.y / currentDist)));

        const targetDir = new THREE.Vector3(
            Math.sin(targetAngle) * Math.cos(pitch),
            Math.sin(pitch),
            Math.cos(targetAngle) * Math.cos(pitch)
        ).normalize();

        const fit = this._calculateOptimalCameraFit(targetDir);
        const destPos = fit.position;
        const startPos = this.camera.position.clone();
        const startTime = performance.now();
        const duration = 320;

        const animateSnap = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(1.0, elapsed / duration);
            const ease = 0.5 - 0.5 * Math.cos(progress * Math.PI); // smooth cosine ease

            this.camera.position.lerpVectors(startPos, destPos, ease);
            this.controls.update();

            if (progress < 1.0) {
                requestAnimationFrame(animateSnap);
            } else {
                this._isCameraAnimating = false;
                if (onComplete) onComplete();
            }
        };

        requestAnimationFrame(animateSnap);
    }

    /**
     * Smoothly rotates the camera 90 degrees left (-1) or right (+1),
     * maintaining the tightest optimal zoom factor.
     * @param {number} direction - 1 for right, -1 for left
     * @param {Function} [onComplete]
     */
    rotateCamera90(direction = 1, onComplete) {
        if (this._isCameraAnimating) return;
        this._isCameraAnimating = true;

        const target = this.controls.target.clone();
        const rel = this.camera.position.clone().sub(target);
        const currentAngle = Math.atan2(rel.x, rel.z);

        // Advance by 90 degrees (Math.PI / 2) from the nearest 45° step
        const step = Math.PI / 4;
        const snappedCurrent = Math.round(currentAngle / step) * step;
        const targetAngle = snappedCurrent + direction * (Math.PI / 2);
        const currentDist = Math.max(1, rel.length());
        const pitch = Math.asin(Math.max(0.24, Math.min(0.70, rel.y / currentDist)));

        const targetDir = new THREE.Vector3(
            Math.sin(targetAngle) * Math.cos(pitch),
            Math.sin(pitch),
            Math.cos(targetAngle) * Math.cos(pitch)
        ).normalize();

        const fit = this._calculateOptimalCameraFit(targetDir);
        const destPos = fit.position;
        const startPos = this.camera.position.clone();
        const startTime = performance.now();
        const duration = 320;

        const animateRotate = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(1.0, elapsed / duration);
            const ease = 0.5 - 0.5 * Math.cos(progress * Math.PI);

            this.camera.position.lerpVectors(startPos, destPos, ease);
            this.controls.update();

            if (progress < 1.0) {
                requestAnimationFrame(animateRotate);
            } else {
                this._isCameraAnimating = false;
                if (onComplete) onComplete();
            }
        };

        requestAnimationFrame(animateRotate);
    }

    _handleClick(e) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        // Direct, high-precision intersection on primary block domino meshes
        const candidateMeshes = [];
        for (const item of this.blockMeshes.values()) {
            if (item.mesh) {
                candidateMeshes.push(item.mesh);
            }
        }

        const intersects = this.raycaster.intersectObjects(candidateMeshes, false);
        if (intersects.length > 0) {
            const hitMesh = intersects[0].object;
            const blockId = hitMesh.userData.blockId;
            if (blockId && this.blockMeshes.has(blockId)) {
                this.onBlockClick(this.blockMeshes.get(blockId).model);
            }
        } else {
            this.onBackgroundClick();
        }
    }

    /**
     * Renders a populated GridTopology into 3D meshes.
     * @param {import('../topology/GridTopology.js').GridTopology} topology 
     */
    setTopology(topology) {
        this.hideExitBeam();
        this.currentGridSize = topology.gridSize;
        this.currentCellSize = topology.cellSize;

        // Clear existing block meshes
        for (const item of this.blockMeshes.values()) {
            this.scene.remove(item.group);
        }
        this.blockMeshes.clear();

        // Update / create base plate
        if (this.basePlate) {
            this.scene.remove(this.basePlate);
        }

        const plateSize = topology.gridSize * topology.cellSize + 2;
        const plateGeo = new RoundedBoxGeometry(plateSize, 0.4, plateSize, 4, 0.12);
        const plateMat = new THREE.MeshStandardMaterial({
            color: this.isDarkTheme ? 0x1e293b : 0xe2e8f0,
            roughness: 0.85,
            metalness: 0.15
        });
        this.basePlate = new THREE.Mesh(plateGeo, plateMat);
        this.basePlate.position.set(0, -0.2, 0);
        this.basePlate.receiveShadow = true;
        this.scene.add(this.basePlate);

        // Ambient contact shadow disc beneath plinth
        if (this.contactShadow) {
            this.scene.remove(this.contactShadow);
            if (this.contactShadow.geometry) this.contactShadow.geometry.dispose();
            if (this.contactShadow.material) this.contactShadow.material.dispose();
        }
        const shadowCanvas = document.createElement('canvas');
        shadowCanvas.width = 128;
        shadowCanvas.height = 128;
        const sCtx = shadowCanvas.getContext('2d');
        const sGrad = sCtx.createRadialGradient(64, 64, 38, 64, 64, 64);
        sGrad.addColorStop(0, this.isDarkTheme ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.18)');
        sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        sCtx.fillStyle = sGrad;
        sCtx.fillRect(0, 0, 128, 128);
        const shadowTex = new THREE.CanvasTexture(shadowCanvas);
        const shadowMat = new THREE.MeshBasicMaterial({
            map: shadowTex,
            transparent: true,
            depthWrite: false
        });
        const shadowGeo = new THREE.PlaneGeometry(plateSize * 1.35, plateSize * 1.35);
        this.contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
        this.contactShadow.rotation.x = -Math.PI / 2;
        this.contactShadow.position.set(0, -0.405, 0);
        this.scene.add(this.contactShadow);

        this.currentTopology = topology;

        // Create 3D meshes for every block first so bounds are known
        for (const block of topology.blocks.values()) {
            this._createBlockMesh(block, topology.gridSize, topology.cellSize);
        }

        // Auto-adjust camera zoom factor to zoom in as much as possible while keeping all blocks in viewport
        this.playLevelEntrance();
    }

    _createBlockMesh(block, gridSize, cellSize) {
        const group = new THREE.Group();
        const center = block.getWorldCenter(gridSize, cellSize);
        group.position.set(center.x, center.y, center.z);

        const dims = block.getWorldDimensions(cellSize);
        const margin = 0.04;
        const w = dims.width - margin;
        const h = dims.height - margin;
        const d = dims.depth - margin;

        const geometry = new RoundedBoxGeometry(w, h, d, 4, 0.08);

        const palette = NUMBER_COLORS[block.value] || NUMBER_COLORS[1];

        // Materials for 6 faces: [right (+X), left (-X), top (+Y), bottom (-Y), front (+Z), back (-Z)]
        // Calculate cell width and height for each face orientation to render single centered number:
        // +X / -X: width along Z (length if Z, else 1), height along Y (always 1)
        const xCellsW = block.orientation === 'Z' ? block.length : 1;
        const xCellsH = 1;
        const texX = getBlockTexture(block.value, xCellsW, xCellsH, block.orientation, block.direction, block.type || 'normal');

        // +Y / -Y (top/bottom): width along X (length if X, else 1), height along Z (length if Z, else 1)
        const yCellsW = block.orientation === 'X' ? block.length : 1;
        const yCellsH = block.orientation === 'Z' ? block.length : 1;
        const texY = getBlockTexture(block.value, yCellsW, yCellsH, block.orientation, block.direction, block.type || 'normal');

        // +Z / -Z (front/back): width along X (length if X, else 1), height along Y (always 1)
        const zCellsW = block.orientation === 'X' ? block.length : 1;
        const zCellsH = 1;
        const texZ = getBlockTexture(block.value, zCellsW, zCellsH, block.orientation, block.direction, block.type || 'normal');

        const createMat = (map) => new THREE.MeshPhysicalMaterial({
            map,
            color: 0xffffff,
            roughness: 0.12,          // Highly polished shiny domino plastic
            metalness: 0.0,           // Non-metallic melamine resin
            clearcoat: 0.95,          // Glossy protective clearcoat layer
            clearcoatRoughness: 0.06, // Mirror specular sheen
            ior: 1.54,                // High refractive index of resin/plastic
            reflectivity: 0.70
        });

        const materials = [
            createMat(texX), // +X
            createMat(texX), // -X
            createMat(texY), // +Y (top)
            createMat(texY), // -Y (bottom)
            createMat(texZ), // +Z (front)
            createMat(texZ)  // -Z (back)
        ];

        const mesh = new THREE.Mesh(geometry, materials);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.blockId = block.id;

        group.add(mesh);
        this.scene.add(group);

        const restingPosition = group.position.clone();
        this.blockMeshes.set(block.id, { model: block, group, mesh, materials, restingPosition });
    }


    /**
     * Highlights or unhighlights a block with 3D physical elevation & glow.
     * @param {string|number} blockId 
     * @param {boolean} isSelected 
     */
    setBlockSelected(blockId, isSelected) {
        const item = this.blockMeshes.get(blockId);
        if (!item) return;

        // Ensure permanent resting position is recorded
        if (!item.restingPosition) {
            item.restingPosition = item.group.position.clone();
        }

        // Cancel any existing elevation animation
        if (item._elevAnimFrame) {
            cancelAnimationFrame(item._elevAnimFrame);
            item._elevAnimFrame = null;
        }

        const dir = item.model.direction || { x: 0, y: 0, z: 0 };
        const nudgeDist = 0.18;

        // Strictly horizontal nudge along the block's long axis (gentle drawer slide effect)
        const targetPos = isSelected
            ? item.restingPosition.clone().add(new THREE.Vector3(dir.x * nudgeDist, 0, dir.z * nudgeDist))
            : item.restingPosition.clone();

        // Smooth elevation transition
        const startPos = item.group.position.clone();
        const startTime = performance.now();
        const duration = 160;

        const animateElevation = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(1.0, elapsed / duration);
            const easeOut = 1 - Math.pow(1 - progress, 2);

            item.group.position.lerpVectors(startPos, targetPos, easeOut);

            if (progress < 1.0) {
                item._elevAnimFrame = requestAnimationFrame(animateElevation);
            } else {
                item._elevAnimFrame = null;
                item.group.position.copy(targetPos);
            }
        };
        item._elevAnimFrame = requestAnimationFrame(animateElevation);

        // Vivid emissive tint on selection for instant visual clarity
        item.materials.forEach((mat) => {
            if (isSelected) {
                mat.emissive.set(0x38bdf8); // Sky blue neon highlight
                mat.emissiveIntensity = 0.28; // Crystal-clear noticeable glow
            } else {
                mat.emissive.set(0x000000);
                mat.emissiveIntensity = 0.0;
            }
        });
    }

    /**
     * Triggers rapid jam/error shake along the block's long slide axis.
     * @param {string|number} blockId 
     */
    shakeBlock(blockId, onComplete = null) {
        const item = this.blockMeshes.get(blockId);
        if (!item) {
            if (onComplete) onComplete();
            return;
        }

        if (!item.restingPosition) {
            item.restingPosition = item.group.position.clone();
        }

        // Cancel previous shake if running
        if (item._shakeAnimFrame) {
            cancelAnimationFrame(item._shakeAnimFrame);
            item._shakeAnimFrame = null;
        }

        const basePos = item.group.position.clone();
        const dir = item.model.direction || { x: 1, y: 0, z: 0 };
        const startTime = performance.now();
        const duration = 260;

        const animateShake = () => {
            const elapsed = performance.now() - startTime;
            if (elapsed < duration) {
                const decay = 1 - elapsed / duration;
                const offset = Math.sin(elapsed * 0.09) * 0.14 * decay;
                item.group.position.set(
                    basePos.x + dir.x * offset,
                    basePos.y,
                    basePos.z + dir.z * offset
                );
                item._shakeAnimFrame = requestAnimationFrame(animateShake);
            } else {
                item._shakeAnimFrame = null;
                item.group.position.copy(basePos);
                if (onComplete) onComplete();
            }
        };
        item._shakeAnimFrame = requestAnimationFrame(animateShake);
    }

    /**
     * Updates textures and models for active blocks in place without resetting scene or camera.
     * @param {import('../topology/GridTopology.js').GridTopology} topology
     */
    updateBlockValues(topology) {
        for (const [id, item] of this.blockMeshes.entries()) {
            const block = topology.blocks.get(id);
            if (!block) continue;
            item.model = block;

            const xCellsW = block.orientation === 'Z' ? block.length : 1;
            const xCellsH = 1;
            const texX = getBlockTexture(block.value, xCellsW, xCellsH, block.orientation, block.direction, block.type || 'normal');

            const yCellsW = block.orientation === 'X' ? block.length : 1;
            const yCellsH = block.orientation === 'Z' ? block.length : 1;
            const texY = getBlockTexture(block.value, yCellsW, yCellsH, block.orientation, block.direction, block.type || 'normal');

            const zCellsW = block.orientation === 'X' ? block.length : 1;
            const zCellsH = 1;
            const texZ = getBlockTexture(block.value, zCellsW, zCellsH, block.orientation, block.direction, block.type || 'normal');

            item.materials[0].map = texX; item.materials[0].needsUpdate = true;
            item.materials[1].map = texX; item.materials[1].needsUpdate = true;
            item.materials[2].map = texY; item.materials[2].needsUpdate = true;
            item.materials[3].map = texY; item.materials[3].needsUpdate = true;
            item.materials[4].map = texZ; item.materials[4].needsUpdate = true;
            item.materials[5].map = texZ; item.materials[5].needsUpdate = true;

            item.materials.forEach((m) => {
                m.emissive.set(0x000000);
                m.emissiveIntensity = 0.0;
            });
        }
    }

    /**
     * Physical tower quake: shakes all active blocks with random phases without disrupting the camera.
     * @param {number} [durationMs=420]
     */
    shakeTower(durationMs = 420) {
        const startTime = performance.now();
        const initialOffsets = new Map();
        for (const [id, item] of this.blockMeshes.entries()) {
            initialOffsets.set(id, {
                x: item.group.position.x,
                z: item.group.position.z,
                phase: Math.random() * Math.PI * 2
            });
        }

        const animateTowerQuake = () => {
            const elapsed = performance.now() - startTime;
            if (elapsed < durationMs) {
                const decay = 1 - elapsed / durationMs;
                for (const [id, item] of this.blockMeshes.entries()) {
                    const init = initialOffsets.get(id);
                    if (!init) continue;
                    const wobble = Math.sin(elapsed * 0.07 + init.phase) * 0.09 * decay;
                    item.group.position.x = init.x + (item.model.orientation === 'X' ? wobble : 0);
                    item.group.position.z = init.z + (item.model.orientation === 'Z' ? wobble : 0);
                }
                requestAnimationFrame(animateTowerQuake);
            } else {
                for (const [id, item] of this.blockMeshes.entries()) {
                    const init = initialOffsets.get(id);
                    if (init) {
                        item.group.position.x = init.x;
                        item.group.position.z = init.z;
                    }
                }
            }
        };

        requestAnimationFrame(animateTowerQuake);
    }

    /**
     * Shows a subtle glowing translucent corridor runway along the block's open exit path.
     * (Removed per user request for pure minimalist view)
     */
    showExitBeam(block, exitInfo) {
        // Exit corridor runway removed per user request
    }

    /**
     * Hides and disposes the current exit corridor guide beam if any exists.
     */
    hideExitBeam() {
        if (this.exitGuideBeam) {
            this.scene.remove(this.exitGuideBeam);
            if (this.exitGuideBeam.geometry) this.exitGuideBeam.geometry.dispose();
            if (this.exitGuideBeam.material) this.exitGuideBeam.material.dispose();
            this.exitGuideBeam = null;
        }
    }

    /**
     * Spawns gentle pastel shimmer particles along the exit trajectory of a block.
     * @param {THREE.Vector3} startPos 
     * @param {{x: number, y: number, z: number}} dir 
     * @param {string} hexColor 
     */
    spawnSlideShimmer(startPos, dir, hexColor = '#93c5fd') {
        const particleCount = 12;
        const color = new THREE.Color(hexColor);

        for (let i = 0; i < particleCount; i++) {
            const size = 0.07 + Math.random() * 0.08;
            const geo = new THREE.SphereGeometry(size, 6, 6);
            const mat = new THREE.MeshBasicMaterial({
                color,
                transparent: true,
                opacity: 0.82,
                depthWrite: false
            });
            const mesh = new THREE.Mesh(geo, mat);

            const spreadX = (Math.random() - 0.5) * 0.5;
            const spreadY = (Math.random() - 0.5) * 0.4;
            const spreadZ = (Math.random() - 0.5) * 0.5;

            mesh.position.set(
                startPos.x + spreadX,
                startPos.y + spreadY,
                startPos.z + spreadZ
            );

            const driftSpeed = 3.5 + Math.random() * 4.5;
            const velocity = new THREE.Vector3(
                dir.x * driftSpeed + (Math.random() - 0.5) * 0.8,
                0.3 + Math.random() * 0.7,
                dir.z * driftSpeed + (Math.random() - 0.5) * 0.8
            );

            const maxLife = 0.45 + Math.random() * 0.35;
            this.scene.add(mesh);
            this.particles.push({
                mesh,
                mat,
                geo,
                velocity,
                life: maxLife,
                maxLife
            });
        }
    }

    /**
     * Animates blocks leaving the tower with a snappy, high-velocity physical flick along their long axis.
     * @param {Array<string|number>} blockIds 
     */
    flyOutBlocks(blockIds) {
        blockIds.forEach((id) => {
            const item = this.blockMeshes.get(id);
            if (!item) return;

            const dir = item.model.direction;
            // High-velocity flick impulse: shoots out swiftly along the long axis
            const flySpeed = 46.0;

            // Spawn soft pastel shimmer particles shooting along exit vector
            const palette = NUMBER_COLORS[item.model.value] || NUMBER_COLORS[1];
            const particleColor = item.model.type === 'wild' ? '#facc15' : (item.model.type === 'bomb' ? '#f87171' : palette.border);
            this.spawnSlideShimmer(item.group.position, dir, particleColor);

            // Strictly horizontal velocity along the long axis
            const velocity = new THREE.Vector3(
                dir.x * flySpeed,
                0,
                dir.z * flySpeed
            );

            // Outward flick acceleration giving explosive snap momentum
            const acceleration = new THREE.Vector3(
                dir.x * 24.0,
                0,
                dir.z * 24.0
            );

            const angularVelocity = new THREE.Vector3(0, 0, 0);

            this.flyingBlocks.push({
                group: item.group,
                materials: item.materials,
                velocity,
                acceleration,
                angularVelocity,
                opacity: 1.0
            });

            this.blockMeshes.delete(id);
        });
    }

    /**
     * Spawns subtle micro dust puff particles around a block's landing perimeter.
     * @param {THREE.Vector3} landingPos 
     * @param {number} blockLength 
     * @param {'X'|'Z'} orientation 
     */
    spawnLandingDustPuff(landingPos, blockLength = 1, orientation = 'X') {
        const puffCount = 6;
        const color = new THREE.Color(0xf1f5f9);

        for (let i = 0; i < puffCount; i++) {
            const size = 0.04 + Math.random() * 0.04;
            const geo = new THREE.SphereGeometry(size, 5, 5);
            const mat = new THREE.MeshBasicMaterial({
                color,
                transparent: true,
                opacity: 0.60,
                depthWrite: false
            });
            const mesh = new THREE.Mesh(geo, mat);

            // Perimeter distribution
            const angle = (i / puffCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
            const radius = 0.42;
            const spreadX = Math.cos(angle) * radius * (orientation === 'X' ? blockLength * 0.7 : 0.7);
            const spreadZ = Math.sin(angle) * radius * (orientation === 'Z' ? blockLength * 0.7 : 0.7);

            mesh.position.set(
                landingPos.x + spreadX,
                landingPos.y - 0.45,
                landingPos.z + spreadZ
            );

            // Subtle radial drift and quick dissipation
            const velocity = new THREE.Vector3(
                Math.cos(angle) * (0.7 + Math.random() * 1.0),
                0.12 + Math.random() * 0.2,
                Math.sin(angle) * (0.7 + Math.random() * 1.0)
            );

            const maxLife = 0.26 + Math.random() * 0.14;
            this.scene.add(mesh);
            this.particles.push({
                mesh,
                mat,
                geo,
                velocity,
                life: maxLife,
                maxLife
            });
        }
    }

    /**
     * Animates blocks falling down due to gravity with a crisp micro-bounce and dust puff.
     * @param {Array<{ block: any, oldGridY: number, newGridY: number, dropLayers: number }>} fallenList 
     * @param {number} cellSize 
     * @param {Function} [onComplete] 
     */
    animateFallingBlocks(fallenList, cellSize = 1.0, onComplete = () => {}) {
        if (!fallenList || fallenList.length === 0) {
            onComplete();
            return;
        }

        const animations = [];
        fallenList.forEach(({ block, oldGridY, newGridY }) => {
            const item = this.blockMeshes.get(block.id);
            if (!item) return;

            const startY = item.group.position.y;
            const targetY = startY - (oldGridY - newGridY) * cellSize;
            const duration = Math.min(140, 60 + (oldGridY - newGridY) * 30);

            animations.push({
                group: item.group,
                mesh: item.mesh,
                block,
                startY,
                targetY,
                dropLayers: oldGridY - newGridY,
                duration,
                hasPuffed: false,
                startTime: performance.now()
            });
        });

        const updateFalls = () => {
            const now = performance.now();
            let allDone = true;

            animations.forEach((anim) => {
                const elapsed = now - anim.startTime;
                const totalProgress = Math.min(1.0, elapsed / anim.duration);

                if (totalProgress < 1.0) {
                    allDone = false;

                    // Fall phase under acceleration (0.0 -> 0.82)
                    if (totalProgress <= 0.82) {
                        const fallT = totalProgress / 0.82;
                        const easeIn = fallT * fallT;
                        anim.group.position.y = anim.startY + (anim.targetY - anim.startY) * easeIn;
                    } else {
                        // Crisp micro-bounce & landing dust puff phase (0.82 -> 1.0)
                        if (!anim.hasPuffed) {
                            anim.hasPuffed = true;
                            this.spawnLandingDustPuff(
                                new THREE.Vector3(anim.group.position.x, anim.targetY, anim.group.position.z),
                                anim.block.length,
                                anim.block.orientation
                            );
                        }
                        const bounceT = (totalProgress - 0.82) / 0.18;
                        const bounceHeight = Math.sin(bounceT * Math.PI) * (0.055 * Math.min(2.0, anim.dropLayers));
                        anim.group.position.y = anim.targetY + bounceHeight;

                        // Subtle tactile squash & stretch
                        if (anim.mesh) {
                            const squash = Math.sin(bounceT * Math.PI) * 0.045;
                            anim.mesh.scale.set(1.0 + squash, 1.0 - squash * 1.4, 1.0 + squash);
                        }
                    }
                } else {
                    anim.group.position.y = anim.targetY;
                    if (anim.mesh) {
                        anim.mesh.scale.set(1.0, 1.0, 1.0);
                    }
                    const item = this.blockMeshes.get(anim.block?.id);
                    if (item) {
                        item.restingPosition = anim.group.position.clone();
                    }
                }
            });

            if (!allDone) {
                requestAnimationFrame(updateFalls);
            } else {
                onComplete();
            }
        };

        requestAnimationFrame(updateFalls);
    }

    _animate() {
        if (this._isDisposed) return;
        requestAnimationFrame(this._animate);

        // Smooth Wheel Zoom: seamlessly interpolate camera distance towards target distance
        if (this._targetZoomDist !== null && !this._isCameraAnimating && !this._isPointerDown) {
            const rel = this.camera.position.clone().sub(this.controls.target);
            const currentDist = rel.length();
            if (Math.abs(currentDist - this._targetZoomDist) > 0.02) {
                // Smooth exponential dampening towards target zoom distance
                const newDist = THREE.MathUtils.lerp(currentDist, this._targetZoomDist, 0.12);
                rel.normalize().multiplyScalar(newDist);
                this.camera.position.copy(this.controls.target).add(rel);
            } else {
                this._targetZoomDist = null;
            }
        }

        this.controls.update();

        // Apply camera shake if active
        if (this.cameraShakeDuration > 0) {
            const elapsed = performance.now() - this.cameraShakeStartTime;
            if (elapsed < this.cameraShakeDuration) {
                const progress = elapsed / this.cameraShakeDuration;
                const decay = Math.pow(1 - progress, 1.5);
                const currentAmp = this.cameraShakeIntensity * decay;
                this.camera.position.sub(this._cameraShakeOffset);
                this._cameraShakeOffset.set(
                    (Math.random() - 0.5) * 2 * currentAmp,
                    (Math.random() - 0.5) * 2 * currentAmp,
                    (Math.random() - 0.5) * 2 * currentAmp
                );
                this.camera.position.add(this._cameraShakeOffset);
            } else {
                this.camera.position.sub(this._cameraShakeOffset);
                this._cameraShakeOffset.set(0, 0, 0);
                this.cameraShakeDuration = 0;
            }
        }

        // Update flying blocks physics (crisp flicked launch)
        const dt = 0.016;
        for (let i = this.flyingBlocks.length - 1; i >= 0; i--) {
            const fb = this.flyingBlocks[i];
            if (fb.acceleration) {
                fb.velocity.addScaledVector(fb.acceleration, dt);
            }
            fb.group.position.addScaledVector(fb.velocity, dt);
            fb.group.rotation.x += fb.angularVelocity.x * dt;
            fb.group.rotation.y += fb.angularVelocity.y * dt;
            fb.group.rotation.z += fb.angularVelocity.z * dt;

            // Fade out cleanly as it shoots off-screen
            fb.opacity -= dt * 1.6;
            fb.materials.forEach((m) => {
                m.transparent = true;
                m.opacity = Math.max(0, fb.opacity);
            });

            if (fb.opacity <= 0) {
                this.scene.remove(fb.group);
                this.flyingBlocks.splice(i, 1);
            }
        }

        // Update gentle pastel shimmer particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                p.geo.dispose();
                p.mat.dispose();
                this.particles.splice(i, 1);
            } else {
                p.mesh.position.addScaledVector(p.velocity, dt);
                p.velocity.y *= 0.97;
                const progress = p.life / p.maxLife;
                p.mat.opacity = progress * 0.82;
                const scale = 0.5 + 0.5 * progress;
                p.mesh.scale.set(scale, scale, scale);
            }
        }



        this.renderer.render(this.scene, this.camera);
    }

    dispose() {
        this.hideExitBeam();
        this._isDisposed = true;
        window.removeEventListener('resize', this.handleResize);
        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement.parentElement) {
                this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
            }
        }
    }
}
