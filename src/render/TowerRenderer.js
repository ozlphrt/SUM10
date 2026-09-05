import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { getBlockTexture, NUMBER_COLORS } from './TextureGenerator.js';

const LEVEL_THEMES = [
    {
        // Level 1: Nordic Pearl
        bg: 0xf1f5f9,
        ambient: 0xffffff,
        ambientInt: 0.85,
        rim: 0x93c5fd,
        plate: 0xe2e8f0
    },
    {
        // Level 2: Soft Rose Quartz
        bg: 0xfdf2f8,
        ambient: 0xffffff,
        ambientInt: 0.85,
        rim: 0xf472b6,
        plate: 0xfce7f3
    },
    {
        // Level 3: Warm Linen Sand
        bg: 0xfaf5ef,
        ambient: 0xfffbeb,
        ambientInt: 0.85,
        rim: 0xfbbf24,
        plate: 0xfef3c7
    },
    {
        // Level 4: Sage Mist
        bg: 0xf0fdf4,
        ambient: 0xffffff,
        ambientInt: 0.85,
        rim: 0x34d399,
        plate: 0xdcfce7
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

        // Ambient & Directional Lighting
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(this.ambientLight);

        this.dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
        this.dirLight.position.set(15, 25, 15);
        this.dirLight.castShadow = true;
        this.dirLight.shadow.mapSize.width = 2048;
        this.dirLight.shadow.mapSize.height = 2048;
        this.dirLight.shadow.camera.near = 0.5;
        this.dirLight.shadow.camera.far = 60;
        this.dirLight.shadow.camera.left = -15;
        this.dirLight.shadow.camera.right = 15;
        this.dirLight.shadow.camera.top = 15;
        this.dirLight.shadow.camera.bottom = -15;
        this.dirLight.shadow.bias = -0.0005;
        this.scene.add(this.dirLight);

        // Secondary soft rim light
        this.rimLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
        this.rimLight.position.set(-15, 10, -15);
        this.scene.add(this.rimLight);
    }

    /**
     * Dynamically smoothly transitions visual atmosphere based on current level.
     * @param {number} level 
     */
    applyLevelTheme(level = 1) {
        const themeIdx = (level - 1) % LEVEL_THEMES.length;
        const theme = LEVEL_THEMES[themeIdx];

        if (this.scene && this.scene.background) {
            this.scene.background.set(theme.bg);
        }
        if (this.ambientLight) {
            this.ambientLight.color.set(theme.ambient);
            this.ambientLight.intensity = theme.ambientInt;
        }
        if (this.rimLight) {
            this.rimLight.color.set(theme.rim);
        }
        if (this.basePlate && this.basePlate.material) {
            this.basePlate.material.color.set(theme.plate);
        }
    }

    _initControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2 + 0.05; // allow viewing slightly below horizon
        this.controls.minDistance = 6;
        this.controls.maxDistance = 50;
        this.controls.target.set(0, 4, 0);
    }

    _initEvents() {
        window.addEventListener('resize', () => this.handleResize());

        let pointerDownTime = 0;
        let pointerDownX = 0;
        let pointerDownY = 0;

        this.renderer.domElement.addEventListener('pointerdown', (e) => {
            pointerDownTime = performance.now();
            pointerDownX = e.clientX;
            pointerDownY = e.clientY;
        });

        this.renderer.domElement.addEventListener('pointerup', (e) => {
            const duration = performance.now() - pointerDownTime;
            const dist = Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY);
            // Ignore drags / orbit interactions
            if (duration < 300 && dist < 5) {
                this._handleClick(e);
            }
        });
    }

    handleResize() {
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        this._adjustCameraForAspect();
    }

    _adjustCameraForAspect() {
        if (!this.camera) return;
        const aspect = this.camera.aspect;
        // In portrait mode (aspect < 1), zoom out proportionately so tower is never cropped
        const distMult = aspect < 1 ? Math.max(1.3, 1.0 / aspect * 0.85) : 1.0;
        const basePos = new THREE.Vector3(12, 14, 18).multiplyScalar(distMult);
        this.camera.position.copy(basePos);
    }

    /**
     * Smoothly animates the camera to align with the nearest cardinal or 45° corner angle.
     * @param {Function} [onComplete]
     */
    snapCameraToNearestAngle(onComplete) {
        if (this._isCameraAnimating) return;
        this._isCameraAnimating = true;

        const target = this.controls.target.clone();
        const rel = this.camera.position.clone().sub(target);
        const radiusXZ = Math.hypot(rel.x, rel.z);
        const currentAngle = Math.atan2(rel.x, rel.z);

        // Snap to nearest 45-degree angle (isometric corners & faces)
        const step = Math.PI / 4;
        const targetAngle = Math.round(currentAngle / step) * step;

        const targetX = target.x + radiusXZ * Math.sin(targetAngle);
        const targetZ = target.z + radiusXZ * Math.cos(targetAngle);
        const targetY = target.y + Math.max(radiusXZ * 0.55, rel.y);

        const startPos = this.camera.position.clone();
        const destPos = new THREE.Vector3(targetX, targetY, targetZ);
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
     * Smoothly rotates the camera 90 degrees left (-1) or right (+1).
     * @param {number} direction - 1 for right, -1 for left
     * @param {Function} [onComplete]
     */
    rotateCamera90(direction = 1, onComplete) {
        if (this._isCameraAnimating) return;
        this._isCameraAnimating = true;

        const target = this.controls.target.clone();
        const rel = this.camera.position.clone().sub(target);
        const radiusXZ = Math.hypot(rel.x, rel.z);
        const currentAngle = Math.atan2(rel.x, rel.z);

        // Advance by 90 degrees (Math.PI / 2) from the nearest 45° step
        const step = Math.PI / 4;
        const snappedCurrent = Math.round(currentAngle / step) * step;
        const targetAngle = snappedCurrent + direction * (Math.PI / 2);

        const targetX = target.x + radiusXZ * Math.sin(targetAngle);
        const targetZ = target.z + radiusXZ * Math.cos(targetAngle);
        const targetY = this.camera.position.y;

        const startPos = this.camera.position.clone();
        const destPos = new THREE.Vector3(targetX, targetY, targetZ);
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
        const intersectableMeshes = [];
        for (const item of this.blockMeshes.values()) {
            item.group.traverse((child) => {
                if (child.isMesh) {
                    intersectableMeshes.push(child);
                }
            });
        }

        const intersects = this.raycaster.intersectObjects(intersectableMeshes, false);
        if (intersects.length > 0) {
            const hitMesh = intersects[0].object;
            const blockId = hitMesh.userData.blockId;
            if (blockId && this.blockMeshes.has(blockId)) {
                this.onBlockClick(this.blockMeshes.get(blockId).model);
            }
        }
    }

    /**
     * Renders a populated GridTopology into 3D meshes.
     * @param {import('../topology/GridTopology.js').GridTopology} topology 
     */
    setTopology(topology) {
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
        const plateGeo = new RoundedBoxGeometry(plateSize, 0.4, plateSize, 4, 0.1);
        const plateMat = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            roughness: 0.8,
            metalness: 0.2
        });
        this.basePlate = new THREE.Mesh(plateGeo, plateMat);
        this.basePlate.position.set(0, -0.2, 0);
        this.basePlate.receiveShadow = true;
        this.scene.add(this.basePlate);

        // Adjust camera target to center of tower height
        this.controls.target.set(0, (topology.maxLayers * topology.cellSize) / 4, 0);
        this._adjustCameraForAspect();

        // Create 3D meshes for every block
        for (const block of topology.blocks.values()) {
            this._createBlockMesh(block, topology.gridSize, topology.cellSize);
        }
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

        // Get procedural number texture (supports normal, bomb, wild)
        const texture = getBlockTexture(block.value, block.length, block.orientation, block.direction, block.type || 'normal');
        const palette = NUMBER_COLORS[block.value] || NUMBER_COLORS[1];

        // 6-face material array: faces show the number texture
        // Materials for faces: [right (+X), left (-X), top (+Y), bottom (-Y), front (+Z), back (-Z)]
        const materials = [];

        // Determine repeats along respective axes so textures stay cubic and unstretched
        const repeatX = block.orientation === 'X' ? block.length : 1;
        const repeatY = block.orientation === 'Y' ? block.length : 1;
        const repeatZ = block.orientation === 'Z' ? block.length : 1;

        // Clone textures with appropriate repeats for different face orientations
        const makeFaceMat = (repU, repV) => {
            const faceTex = texture.clone();
            faceTex.wrapS = THREE.RepeatWrapping;
            faceTex.wrapT = THREE.RepeatWrapping;
            faceTex.repeat.set(repU, repV);
            faceTex.needsUpdate = true;

            return new THREE.MeshStandardMaterial({
                map: faceTex,
                color: 0xffffff,
                roughness: 0.82, // Tactile matte ceramic / clay texture
                metalness: 0.04,
                emissive: new THREE.Color(palette.bg),
                emissiveIntensity: 0.02
            });
        };

        // +X, -X faces (Z vs Y)
        materials.push(makeFaceMat(repeatZ, repeatY));
        materials.push(makeFaceMat(repeatZ, repeatY));
        // +Y, -Y faces (X vs Z)
        materials.push(makeFaceMat(repeatX, repeatZ));
        materials.push(makeFaceMat(repeatX, repeatZ));
        // +Z, -Z faces (X vs Y)
        materials.push(makeFaceMat(repeatX, repeatY));
        materials.push(makeFaceMat(repeatX, repeatY));

        const mesh = new THREE.Mesh(geometry, materials);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.blockId = block.id;

        group.add(mesh);
        this.scene.add(group);

        this.blockMeshes.set(block.id, { model: block, group, mesh, materials });
    }

    /**
     * Highlights or unhighlights a block with 3D physical elevation & glow.
     * @param {string|number} blockId 
     * @param {boolean} isSelected 
     */
    setBlockSelected(blockId, isSelected) {
        const item = this.blockMeshes.get(blockId);
        if (!item) return;

        // Ensure resting position is recorded
        if (!item.restingPosition) {
            item.restingPosition = item.group.position.clone();
        }

        const dir = item.model.direction || { x: 0, y: 0, z: 0 };
        const nudgeDist = 0.22;

        // Strictly horizontal nudge along the block's long axis (drawer slide effect)
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
                requestAnimationFrame(animateElevation);
            }
        };
        requestAnimationFrame(animateElevation);

        // Visual emissive glow
        item.materials.forEach((mat) => {
            if (isSelected) {
                mat.emissive.set(0xf59e0b); // Tactile warm amber highlight
                mat.emissiveIntensity = 0.45;
            } else {
                const palette = NUMBER_COLORS[item.model.value] || NUMBER_COLORS[1];
                mat.emissive.set(palette.bg);
                mat.emissiveIntensity = 0.02;
            }
        });
    }

    /**
     * Triggers rapid jam/error shake along the block's long slide axis.
     * @param {string|number} blockId 
     */
    shakeBlock(blockId) {
        const item = this.blockMeshes.get(blockId);
        if (!item) return;

        const resting = item.restingPosition ? item.restingPosition.clone() : item.group.position.clone();
        const dir = item.model.direction || { x: 1, y: 0, z: 0 };
        const startTime = performance.now();
        const duration = 260;

        const animateShake = () => {
            const elapsed = performance.now() - startTime;
            if (elapsed < duration) {
                const decay = 1 - elapsed / duration;
                const offset = Math.sin(elapsed * 0.09) * 0.14 * decay;
                item.group.position.set(
                    resting.x + dir.x * offset,
                    resting.y,
                    resting.z + dir.z * offset
                );
                requestAnimationFrame(animateShake);
            } else {
                item.group.position.copy(resting);
            }
        };
        requestAnimationFrame(animateShake);
    }

    /**
     * Animates blocks flying smoothly and horizontally out of the tower along their long axis.
     * @param {Array<string|number>} blockIds 
     */
    flyOutBlocks(blockIds) {
        blockIds.forEach((id) => {
            const item = this.blockMeshes.get(id);
            if (!item) return;

            const dir = item.model.direction;
            const flySpeed = 18.0;

            // Strictly horizontal velocity along the long axis (no vertical Y lift or tumble)
            const velocity = new THREE.Vector3(
                dir.x * flySpeed,
                0,
                dir.z * flySpeed
            );

            // Keep rotation stable along slide axis
            const angularVelocity = new THREE.Vector3(0, 0, 0);

            this.flyingBlocks.push({
                group: item.group,
                materials: item.materials,
                velocity,
                angularVelocity,
                opacity: 1.0
            });

            this.blockMeshes.delete(id);
        });
    }

    /**
     * Animates blocks falling down due to gravity.
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
            const duration = Math.min(450, 180 + (oldGridY - newGridY) * 90); // duration scales with distance

            animations.push({
                group: item.group,
                startY,
                targetY,
                duration,
                startTime: performance.now()
            });
        });

        const updateFalls = () => {
            const now = performance.now();
            let allDone = true;

            animations.forEach((anim) => {
                const elapsed = now - anim.startTime;
                const progress = Math.min(1.0, elapsed / anim.duration);

                // Quadratic ease-in (gravity acceleration) with small bounce at end
                if (progress < 1.0) {
                    allDone = false;
                    const easeIn = progress * progress;
                    anim.group.position.y = anim.startY + (anim.targetY - anim.startY) * easeIn;
                } else {
                    anim.group.position.y = anim.targetY;
                    const item = this.blockMeshes.get(anim.group.children[0]?.userData?.blockId);
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

        // Update flying blocks physics
        const dt = 0.016;
        for (let i = this.flyingBlocks.length - 1; i >= 0; i--) {
            const fb = this.flyingBlocks[i];
            fb.group.position.addScaledVector(fb.velocity, dt);
            fb.group.rotation.x += fb.angularVelocity.x * dt;
            fb.group.rotation.y += fb.angularVelocity.y * dt;
            fb.group.rotation.z += fb.angularVelocity.z * dt;

            // Fade out
            fb.opacity -= dt * 0.8;
            fb.materials.forEach((m) => {
                m.transparent = true;
                m.opacity = Math.max(0, fb.opacity);
            });

            if (fb.opacity <= 0) {
                this.scene.remove(fb.group);
                this.flyingBlocks.splice(i, 1);
            }
        }

        this.renderer.render(this.scene, this.camera);
    }

    dispose() {
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
