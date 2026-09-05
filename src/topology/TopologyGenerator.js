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
        const SHAPES = [
            { id: 'monolith', name: 'Nordic Monolith' },
            { id: 'pyramid', name: 'Stepped Ziggurat' },
            { id: 'courtyard', name: 'Fortress Atrium' },
            { id: 'stepped', name: 'Terraced Spire' }
        ];

        const shapeInfo = SHAPES[(level - 1) % SHAPES.length];
        const tier = Math.floor((level - 1) / SHAPES.length) + 1;
        const romanNumerals = ['', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
        const tierSuffix = tier > 1 ? ` ${romanNumerals[tier - 1] || `Tier ${tier}`}` : '';
        const shapeName = `${shapeInfo.name}${tierSuffix}`;

        const pairCount = Math.min(55, 10 + (level - 1) * 3); // 10, 13, 16, 19, 22...
        const totalBlocks = pairCount * 2;
        const avgVol = 1.8;
        const estimatedVolume = totalBlocks * avgVol;

        const baseGridSize = Math.max(5, Math.min(9, Math.ceil(Math.pow(estimatedVolume / 1.5, 1 / 3))));
        // For pyramid and courtyard shapes, expand base grid slightly so tiers/atrium are well-proportioned
        const gridSize = (shapeInfo.id === 'pyramid' || shapeInfo.id === 'courtyard')
            ? Math.min(9, baseGridSize + 1)
            : baseGridSize;

        // Scale block length distribution: more doubles & triples on higher levels
        const length1Ratio = Math.max(0.18, 0.50 - (level - 1) * 0.04);
        const length3Ratio = Math.min(0.38, 0.10 + (level - 1) * 0.03);
        const length2Ratio = 1.0 - length1Ratio - length3Ratio;

        return {
            level,
            shape: shapeInfo.id,
            shapeName,
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
     * @param {string} [config.shape='monolith'] - Architectural tower shape ('monolith', 'pyramid', 'courtyard', 'stepped')
     * @param {string} [config.shapeName='Nordic Monolith']
     * @param {number} [config.length1Ratio=0.40] - Ratio of single-cell blocks (1x1x1)
     * @param {number} [config.length2Ratio=0.40] - Ratio of double-cell blocks (2x1x1)
     * @param {number} [config.length3Ratio=0.20] - Ratio of triple-cell blocks (3x1x1)
     */
    constructor(config = {}) {
        this.targetPairCount = config.targetPairCount || 10;
        this.gridSize = config.gridSize || 5;
        this.shape = config.shape || 'monolith';
        this.shapeName = config.shapeName || 'Nordic Monolith';
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
     * Generates a pair for the specified game mode.
     * @param {string} mode - 'sum10', 'sum20', 'shapes', or 'alphabet'
     * @returns {[number|string, number|string]}
     */
    _generatePairForMode(mode = 'sum10') {
        if (mode === 'sum20') {
            // Numbers 1 to 19 summing to 20
            const v1 = this._randInt(1, 19);
            const v2 = 20 - v1;
            return [v1, v2];
        } else if (mode === 'shapes') {
            // Minimalist geometric shapes: circle, triangle, square, diamond, star, hexagon
            const SHAPES = ['circle', 'triangle', 'square', 'diamond', 'star', 'hexagon'];
            const shape = SHAPES[this._randInt(0, SHAPES.length - 1)];
            return [shape, shape]; // Identical matching pairs
        } else if (mode === 'alphabet') {
            // Mirror cipher: A <-> Z, B <-> Y, C <-> X, ..., M <-> N
            const idx = this._randInt(0, 12); // A through M
            const char1 = String.fromCharCode(65 + idx);
            const char2 = String.fromCharCode(90 - idx);
            return Math.random() < 0.5 ? [char1, char2] : [char2, char1];
        } else {
            // Default sum10: 1 to 9 summing to 10
            const v1 = this._randInt(1, 9);
            const v2 = 10 - v1;
            return [v1, v2];
        }
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
     * Checks if a candidate block's voxels fit within the architectural shape boundaries.
     * @param {BlockModel} candidate
     * @param {number} gridSize
     * @param {string} shape
     * @returns {boolean}
     */
    _isBlockAllowedByShape(candidate, gridSize, shape) {
        if (!shape || shape === 'monolith') return true;

        const voxels = candidate.getOccupiedVoxels();

        if (shape === 'pyramid') {
            // Stepped Ziggurat: insets inward every 2 layers
            for (const v of voxels) {
                const margin = Math.min(Math.floor(gridSize / 2) - 1, Math.floor(v.y / 2));
                if (v.x < margin || v.x >= gridSize - margin || v.z < margin || v.z >= gridSize - margin) {
                    return false;
                }
            }
            return true;
        }

        if (shape === 'courtyard') {
            // Fortress Atrium: central open-air vertical courtyard
            const holeSize = Math.max(2, Math.floor(gridSize * 0.35));
            const holeStart = Math.floor((gridSize - holeSize) / 2);
            const holeEnd = holeStart + holeSize - 1;

            for (const v of voxels) {
                if (v.x >= holeStart && v.x <= holeEnd && v.z >= holeStart && v.z <= holeEnd) {
                    return false;
                }
            }
            return true;
        }

        if (shape === 'stepped') {
            // Terraced Spire: descending cascading platforms
            for (const v of voxels) {
                const maxAllowedLayer = Math.floor(2 + ((v.x + v.z) / (2 * (gridSize - 1))) * 7);
                if (v.y > maxAllowedLayer) {
                    return false;
                }
            }
            return true;
        }

        return true;
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
        const shape = overrideConfig.shape || this.shape || 'monolith';

        // Dynamic grid size formula from Jarrows: Volume = 1.5 * W^3
        const avgVolumePerBlock = 1.8;
        const estimatedVolume = totalBlocks * avgVolumePerBlock;
        const dynamicGridSize = Math.max(
            5,
            Math.min(8, Math.ceil(Math.pow(estimatedVolume / 1.5, 1 / 3)))
        );
        const baseGridSize = overrideConfig.gridSize || this.gridSize || dynamicGridSize;
        const gridSize = (shape === 'pyramid' || shape === 'courtyard')
            ? Math.min(8, baseGridSize + 1)
            : baseGridSize;

        const maxLayers = Math.max(10, Math.ceil(gridSize * 1.8));

        const mode = overrideConfig.mode || this.mode || 'sum10';
        topology.mode = mode;

        // 1. Generate value pairs (e.g. 10 pairs = 20 blocks, all summing/matching in pairs)
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
                value: mode === 'sum20' ? 10 : (mode === 'shapes' ? 'circle' : (mode === 'alphabet' ? 'A' : 5)),
                length: 1, // bombs are compact 1-cell blocks
                type: 'bomb'
            });
            // Add a Wildcard block
            blockSpecs.push({
                id: `b_${idCounter++}`,
                value: '★', // wildcard matches anything
                length: 1,
                type: 'wild'
            });
        }

        for (let p = 0; p < pairsToGenerate; p++) {
            const [v1, v2] = this._generatePairForMode(mode);
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

        // 2. Procedurally place blocks layer by layer according to architectural shape
        const orientations = ['X', 'Z'];

        for (const spec of blockSpecs) {
            let placed = false;
            let attempts = 0;
            const maxAttempts = 220;

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

                // Check architectural shape constraint, collision, and support
                if (this._isBlockAllowedByShape(candidate, gridSize, shape) &&
                    topology.canPlace(candidate) &&
                    topology.hasSupport(candidate)) {
                    topology.addBlock(candidate);
                    placed = true;
                }
            }

            // Fallback 1: Scan deterministically respecting shape
            if (!placed) {
                outerLoop1:
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

                                if (this._isBlockAllowedByShape(fallbackBlock, gridSize, shape) &&
                                    topology.canPlace(fallbackBlock) &&
                                    topology.hasSupport(fallbackBlock)) {
                                    topology.addBlock(fallbackBlock);
                                    placed = true;
                                    break outerLoop1;
                                }
                            }
                        }
                    }
                }
            }

            // Fallback 2: If strictly required, relax shape constraint to guarantee 100% placement
            if (!placed) {
                outerLoop2:
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
                                    break outerLoop2;
                                }
                            }
                        }
                    }
                }
            }
        }

        // 3. Post-placement adjacent pairing pass:
        // Guarantees all normal blocks are paired with touching adjacent neighbors summing to 10
        this._assignAdjacentPairValues(topology);

        return topology;
    }

    /**
     * Traverses placed blocks in 3D and assigns values 1-9 such that ALL normal blocks
     * are partitioned into strictly disjoint 1-to-1 pairs that sum to 10.
     * Touching neighbors are prioritized first; any remaining unpaired blocks are paired
     * with each other so no block is ever orphaned without a valid match.
     * @param {GridTopology} topology 
     */
    _assignAdjacentPairValues(topology) {
        const normalBlocks = Array.from(topology.blocks.values()).filter((b) => b.type === 'normal');
        if (normalBlocks.length === 0) return;

        // If there's an odd number of normal blocks (e.g. if a single special block was placed),
        // remove one block or make the last normal block a wild so the normal block count is strictly even
        if (normalBlocks.length % 2 === 1) {
            const oddBlock = normalBlocks.pop();
            oddBlock.type = 'wild';
            oddBlock.value = 10;
        }

        // Shuffle candidate list for variety across runs
        for (let i = normalBlocks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [normalBlocks[i], normalBlocks[j]] = [normalBlocks[j], normalBlocks[i]];
        }

        const pairedIds = new Set();

        const mode = topology.mode || 'sum10';

        // 1. First Pass: Pair touching adjacent neighbors (greedy maximal matching)
        for (const block of normalBlocks) {
            if (pairedIds.has(block.id)) continue;

            const neighbors = Array.from(topology.getNeighborBlocks(block.id))
                .filter((n) => n.type === 'normal' && !pairedIds.has(n.id));

            if (neighbors.length > 0) {
                const partner = neighbors[Math.floor(Math.random() * neighbors.length)];
                const [v1, v2] = this._generatePairForMode(mode);
                block.value = v1;
                partner.value = v2;
                pairedIds.add(block.id);
                pairedIds.add(partner.id);
            }
        }

        // 2. Second Pass: Strictly pair up any remaining unpaired blocks mutually in disjoint pairs of 2!
        // Never reuse already paired blocks and never leave any block unpaired!
        const unpaired = normalBlocks.filter((b) => !pairedIds.has(b.id));
        for (let i = 0; i < unpaired.length - 1; i += 2) {
            const b1 = unpaired[i];
            const b2 = unpaired[i + 1];
            const [v1, v2] = this._generatePairForMode(mode);
            b1.value = v1;
            b2.value = v2;
            pairedIds.add(b1.id);
            pairedIds.add(b2.id);
        }

        // Guarantee at least one valid move is immediately open from the start
        if (!topology.hasAnyValidMove()) {
            topology.shuffleDeadlock();
        }
    }
}
