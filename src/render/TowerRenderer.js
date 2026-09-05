import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { getBlockTexture, NUMBER_COLORS } from './TextureGenerator.js';

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
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        /** @type {Map<string|number, { model: any, group: THREE.Group, materials: THREE.Material[] }>} */
        this.blockMeshes = new Map();

        /** @type {Array<{ group: THREE.Group, velocity: THREE.Vector3, angularVelocity: THREE.Vector3, opacity: number }>} */
        this.flyingBlocks = [];

        this.basePlate = null;
        this._isDisposed = false;

        this._initScene();
        this._initControls();
        this._initEvents();
        this._animate = this._animate.bind(this);
        requestAnimationFrame(this._animate);
    }

    _initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0f172a); // Deep modern slate

        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;

        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.set(12, 16, 18);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // Ambient & Directional Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
        dirLight.position.set(15, 25, 15);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 60;
        dirLight.shadow.camera.left = -15;
        dirLight.shadow.camera.right = 15;
        dirLight.shadow.camera.top = 15;
        dirLight.shadow.camera.bottom = -15;
        dirLight.shadow.bias = -0.0005;
        this.scene.add(dirLight);

        // Secondary soft rim light
        const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
        rimLight.position.set(-15, 10, -15);
        this.scene.add(rimLight);
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

        // Get procedural number texture
        const texture = getBlockTexture(block.value, block.length, block.orientation, block.direction);
        const palette = NUMBER_COLORS[block.value] || NUMBER_COLORS[1];

        // 6-face material array: faces show the number texture
        const materials = [];
        for (let i = 0; i < 6; i++) {
            materials.push(
                new THREE.MeshStandardMaterial({
                    map: texture,
                    color: 0xffffff,
                    roughness: 0.35,
                    metalness: 0.15,
                    emissive: new THREE.Color(palette.bg),
                    emissiveIntensity: 0.05
                })
            );
        }

        const mesh = new THREE.Mesh(geometry, materials);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.blockId = block.id;

        group.add(mesh);
        this.scene.add(group);

        this.blockMeshes.set(block.id, { model: block, group, mesh, materials });
    }

    /**
     * Highlights or unhighlights a block.
     * @param {string|number} blockId 
     * @param {boolean} isSelected 
     */
    setBlockSelected(blockId, isSelected) {
        const item = this.blockMeshes.get(blockId);
        if (!item) return;

        item.materials.forEach((mat) => {
            if (isSelected) {
                mat.emissive.set(0xfacc15); // Vibrant gold
                mat.emissiveIntensity = 0.55;
            } else {
                const palette = NUMBER_COLORS[item.model.value] || NUMBER_COLORS[1];
                mat.emissive.set(palette.bg);
                mat.emissiveIntensity = 0.05;
            }
        });
    }

    /**
     * Triggers rapid error shake on a block when invalid pair is chosen.
     * @param {string|number} blockId 
     */
    shakeBlock(blockId) {
        const item = this.blockMeshes.get(blockId);
        if (!item) return;

        const origX = item.group.position.x;
        const startTime = performance.now();
        const duration = 240;

        const animateShake = () => {
            const elapsed = performance.now() - startTime;
            if (elapsed < duration) {
                const offset = Math.sin(elapsed * 0.08) * 0.12 * (1 - elapsed / duration);
                item.group.position.x = origX + offset;
                requestAnimationFrame(animateShake);
            } else {
                item.group.position.x = origX;
            }
        };
        requestAnimationFrame(animateShake);
    }

    /**
     * Animates blocks flying out of the tower along their assigned exit trajectories.
     * @param {Array<string|number>} blockIds 
     */
    flyOutBlocks(blockIds) {
        blockIds.forEach((id) => {
            const item = this.blockMeshes.get(id);
            if (!item) return;

            const dir = item.model.direction;
            const flySpeed = 16.0;

            const velocity = new THREE.Vector3(
                dir.x !== 0 ? dir.x * flySpeed : (Math.random() - 0.5) * 4,
                3.0 + Math.random() * 4.0, // slight upward arc
                dir.z !== 0 ? dir.z * flySpeed : (Math.random() - 0.5) * 4
            );

            const angularVelocity = new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10
            );

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

    _animate() {
        if (this._isDisposed) return;
        requestAnimationFrame(this._animate);

        this.controls.update();

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
