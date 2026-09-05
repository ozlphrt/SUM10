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
     * Determines outward escape direction pointing strictly along the block's long axis
     * towards the nearest perimeter edge.
     * @param {number} gridX 
     * @param {number} gridZ 
     * @param {number} length 
     * @param {number} gridSize 
     * @param {'X'|'Z'} orientation 
     * @returns {{x: number, y: number, z: number}}
     */
    _determineDirection(gridX, gridZ, length, gridSize, orientation) {
        if (orientation === 'X') {
            // Long axis is X: can ONLY slide West (-X) or East (+X)
            const distWest = gridX;
            const distEast = gridSize - (gridX + length);
            return distWest <= distEast ? { x: -1, y: 0, z: 0 } : { x: 1, y: 0, z: 0 };
        } else {
            // Long axis is Z: can ONLY slide North (-Z) or South (+Z)
            const distNorth = gridZ;
            const distSouth = gridSize - (gridZ + length);
            return distNorth <= distSouth ? { x: 0, y: 0, z: -1 } : { x: 0, y: 0, z: 1 };
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

        const currentLevel = overrideConfig.level || 1;
        // From Level 2+, include special blocks (1 Bomb, 1 Wildcard)
        const includeSpecial = currentLevel >= 2;

        let pairsToGenerate = pairCount;
        if (includeSpecial) {
            pairsToGenerate = Math.max(1, pairCount - 1);
            // Add a Bomb block
            blockSpecs.push({
                id: `b_${idCounter++}`,
                value: 5, // nominal value
                length: 1, // bombs are compact 1-cell blocks
                type: 'bomb'
            });
            // Add a Wildcard block
            blockSpecs.push({
                id: `b_${idCounter++}`,
                value: 10, // wildcard matches anything
                length: 1,
                type: 'wild'
            });
        }

        for (let p = 0; p < pairsToGenerate; p++) {
            const [v1, v2] = this._generateSum10Pair();
            blockSpecs.push(
                { id: `b_${idCounter++}`, value: v1, length: this._sampleLength(), type: 'normal' },
                { id: `b_${idCounter++}`, value: v2, length: this._sampleLength(), type: 'normal' }
            );
        }

        // Shuffle block specifications so pairs are mixed throughout the tower
        for (let i = blockSpecs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [blockSpecs[i], blockSpecs[j]] = [blockSpecs[j], blockSpecs[i]];
        }

        // 2. Procedurally place blocks layer by layer (all blocks horizontal along X or Z)
        const orientations = ['X', 'Z'];

        for (const spec of blockSpecs) {
            let placed = false;
            let attempts = 0;
            const maxAttempts = 200;

            while (!placed && attempts < maxAttempts) {
                attempts++;

                // Choose layer with weighted preference for lower layers to build from base up
                const layer = Math.min(
                    maxLayers - 1,
                    Math.floor(Math.pow(Math.random(), 1.5) * (maxLayers / 2))
                );

                const orient = orientations[this._randInt(0, orientations.length - 1)];

                // Choose random grid position within valid boundaries
                const maxX = (orient === 'X') ? gridSize - spec.length : gridSize - 1;
                const maxZ = (orient === 'Z') ? gridSize - spec.length : gridSize - 1;

                if (maxX < 0 || maxZ < 0 || layer >= maxLayers) continue;

                const gx = this._randInt(0, maxX);
                const gz = this._randInt(0, maxZ);

                const dir = this._determineDirection(gx, gz, spec.length, gridSize, orient);

                const candidate = new BlockModel({
                    id: spec.id,
                    value: spec.value,
                    length: spec.length,
                    orientation: orient,
                    gridX: gx,
                    gridY: layer,
                    gridZ: gz,
                    direction: dir,
                    type: spec.type || 'normal'
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
                        if (maxX < 0 || maxZ < 0) continue;

                        for (let gx = 0; gx <= maxX; gx++) {
                            for (let gz = 0; gz <= maxZ; gz++) {
                                const dir = this._determineDirection(gx, gz, spec.length, gridSize, orient);
                                const fallbackBlock = new BlockModel({
                                    id: spec.id,
                                    value: spec.value,
                                    length: spec.length,
                                    orientation: orient,
                                    gridX: gx,
                                    gridY: y,
                                    gridZ: gz,
                                    direction: dir,
                                    type: spec.type || 'normal'
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
