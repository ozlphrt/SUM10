import { BlockModel } from './BlockModel.js';
import { GridTopology } from './GridTopology.js';

/**
 * TopologyGenerator: Generates multi-layer Jarrows-style 3D block towers
 * where blocks have numbers 1-9 and are generated in pairs that sum to 10.
 */
export class TopologyGenerator {
    /**
     * Calculates difficulty and sizing parameters dynamically for a given level.
     * Matches Jarrows' portrait tower volume ratio.
     * @param {number} level 
     */
    static getLevelConfig(level = 1) {
        const pairCount = Math.min(45, 10 + (level - 1) * 3); // 20, 26, 32, 38...
        const totalBlocks = pairCount * 2;
        const avgVol = 1.8;
        const estimatedVolume = totalBlocks * avgVol;
        const gridSize = Math.max(5, Math.min(8, Math.ceil(Math.pow(estimatedVolume / 1.5, 1 / 3))));

        // Scale block length distribution: more doubles & triples on higher levels
        const length1Ratio = Math.max(0.20, 0.50 - (level - 1) * 0.05);
        const length3Ratio = Math.min(0.35, 0.10 + (level - 1) * 0.04);
        const length2Ratio = 1.0 - length1Ratio - length3Ratio;

        return {
            level,
            targetPairCount: pairCount,
            gridSize,
            length1Ratio,
            length2Ratio,
            length3Ratio
        };
    }

    /**
     * @param {Object} [config]
     * @param {number} [config.targetPairCount=10] - Number of pairs (total blocks = pairs * 2)
     * @param {number} [config.gridSize=5] - 3D base grid width/depth
     * @param {number} [config.length1Ratio=0.40] - Ratio of single-cell blocks (1x1x1)
     * @param {number} [config.length2Ratio=0.40] - Ratio of double-cell blocks (2x1x1 or 1x2x1)
     * @param {number} [config.length3Ratio=0.20] - Ratio of triple-cell blocks (3x1x1 or 1x3x1)
     */
    constructor(config = {}) {
        this.targetPairCount = config.targetPairCount || 10;
        this.gridSize = config.gridSize || 5;
        this.length1Ratio = config.length1Ratio ?? 0.40;
        this.length2Ratio = config.length2Ratio ?? 0.40;
        this.length3Ratio = config.length3Ratio ?? 0.20;
    }

    /**
     * Generates a random integer between min and max inclusive.
     */
    _randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Generates a pair of numbers between 1 and 9 that sum to 10.
     * Possible pairs: (1, 9), (2, 8), (3, 7), (4, 6), (5, 5).
     * @returns {[number, number]}
     */
    _generateSum10Pair() {
        const v1 = this._randInt(1, 9);
        const v2 = 10 - v1;
        return [v1, v2];
    }

    /**
     * Samples a block length (1, 2, or 3) according to ratio probabilities.
     * @returns {number}
     */
    _sampleLength() {
        const r = Math.random();
        if (r < this.length1Ratio) return 1;
        if (r < this.length1Ratio + this.length2Ratio) return 2;
        return 3;
    }

    /**
     * Determines outward escape direction pointing towards the nearest perimeter edge.
     * Matches Jarrows' outward sliding trajectory.
     * @param {number} gridX 
     * @param {number} gridZ 
     * @param {number} gridSize 
     * @param {'X'|'Z'|'Y'} orientation 
     */
    _determineDirection(gridX, gridZ, gridSize, orientation) {
        const distNorth = gridZ;
        const distSouth = gridSize - 1 - gridZ;
        const distWest = gridX;
        const distEast = gridSize - 1 - gridX;

        if (orientation === 'X') {
            // Horizontal X-aligned blocks naturally slide East or West
            return distWest <= distEast ? { x: -1, y: 0, z: 0 } : { x: 1, y: 0, z: 0 };
        } else if (orientation === 'Z') {
            // Horizontal Z-aligned blocks slide North or South
            return distNorth <= distSouth ? { x: 0, y: 0, z: -1 } : { x: 0, y: 0, z: 1 };
        } else {
            // Vertical blocks can fly outward along the closest perimeter axis
            const minDist = Math.min(distNorth, distSouth, distWest, distEast);
            if (minDist === distWest) return { x: -1, y: 0, z: 0 };
            if (minDist === distEast) return { x: 1, y: 0, z: 0 };
            if (minDist === distNorth) return { x: 0, y: 0, z: -1 };
            return { x: 0, y: 0, z: 1 };
        }
    }

    /**
     * Generates a fully populated, structurally sound tower topology.
     * @param {Object} [overrideConfig]
     * @returns {GridTopology}
     */
    generate(overrideConfig = {}) {
        const pairCount = overrideConfig.targetPairCount || this.targetPairCount;
        const totalBlocks = pairCount * 2;

        // Dynamic grid size formula from Jarrows: Volume = 1.5 * W^3
        const avgVolumePerBlock = 1.8;
        const estimatedVolume = totalBlocks * avgVolumePerBlock;
        const dynamicGridSize = Math.max(
            5,
            Math.min(10, Math.ceil(Math.pow(estimatedVolume / 1.5, 1 / 3)))
        );
        const gridSize = overrideConfig.gridSize || dynamicGridSize;
        const maxLayers = Math.max(10, Math.ceil(gridSize * 1.8));

        const topology = new GridTopology({ gridSize, maxLayers });

        // 1. Generate value pairs (e.g. 10 pairs = 20 blocks, all summing to 10 in pairs)
        const blockSpecs = [];
        let idCounter = 1;
        for (let p = 0; p < pairCount; p++) {
            const [v1, v2] = this._generateSum10Pair();
            blockSpecs.push(
                { id: `b_${idCounter++}`, value: v1, length: this._sampleLength() },
                { id: `b_${idCounter++}`, value: v2, length: this._sampleLength() }
            );
        }

        // Shuffle block specifications so pairs are mixed throughout the tower
        for (let i = blockSpecs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [blockSpecs[i], blockSpecs[j]] = [blockSpecs[j], blockSpecs[i]];
        }

        // 2. Procedurally place blocks layer by layer
        const orientations = ['X', 'Z', 'Y'];

        for (const spec of blockSpecs) {
            let placed = false;
            let attempts = 0;
            const maxAttempts = 200;

            while (!placed && attempts < maxAttempts) {
                attempts++;

                // Choose layer with weighted preference for lower layers to build from base up
                const layer = Math.min(
                    maxLayers - spec.length,
                    Math.floor(Math.pow(Math.random(), 1.5) * (maxLayers / 2))
                );

                const orient = (spec.length === 1)
                    ? 'X' // Single cube orientation is isotropic, treat as X
                    : orientations[this._randInt(0, orientations.length - 1)];

                // Choose random grid position within valid boundaries
                const maxX = (orient === 'X') ? gridSize - spec.length : gridSize - 1;
                const maxZ = (orient === 'Z') ? gridSize - spec.length : gridSize - 1;
                const maxY = (orient === 'Y') ? maxLayers - spec.length : maxLayers - 1;

                if (maxX < 0 || maxZ < 0 || layer > maxY) continue;

                const gx = this._randInt(0, maxX);
                const gz = this._randInt(0, maxZ);

                const dir = this._determineDirection(gx, gz, gridSize, orient);

                const candidate = new BlockModel({
                    id: spec.id,
                    value: spec.value,
                    length: spec.length,
                    orientation: orient,
                    gridX: gx,
                    gridY: layer,
                    gridZ: gz,
                    direction: dir
                });

                // Check collision and support
                if (topology.canPlace(candidate) && topology.hasSupport(candidate)) {
                    topology.addBlock(candidate);
                    placed = true;
                }
            }

            // Fallback: If placement failed after maxAttempts, scan deterministically for first valid slot
            if (!placed) {
                outerLoop:
                for (let y = 0; y < maxLayers; y++) {
                    for (const orient of orientations) {
                        const maxX = (orient === 'X') ? gridSize - spec.length : gridSize - 1;
                        const maxZ = (orient === 'Z') ? gridSize - spec.length : gridSize - 1;
                        if (maxX < 0 || maxZ < 0 || (orient === 'Y' && y + spec.length > maxLayers)) continue;

                        for (let gx = 0; gx <= maxX; gx++) {
                            for (let gz = 0; gz <= maxZ; gz++) {
                                const dir = this._determineDirection(gx, gz, gridSize, orient);
                                const fallbackBlock = new BlockModel({
                                    id: spec.id,
                                    value: spec.value,
                                    length: spec.length,
                                    orientation: orient,
                                    gridX: gx,
                                    gridY: y,
                                    gridZ: gz,
                                    direction: dir
                                });

                                if (topology.canPlace(fallbackBlock) && topology.hasSupport(fallbackBlock)) {
                                    topology.addBlock(fallbackBlock);
                                    placed = true;
                                    break outerLoop;
                                }
                            }
                        }
                    }
                }
            }
        }

        return topology;
    }
}
