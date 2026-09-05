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
        const toRoman = (num) => {
            const romanMap = [
                [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
                [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
            ];
            let res = '';
            for (const [val, char] of romanMap) {
                while (num >= val) {
                    res += char;
                    num -= val;
                }
            }
            return res;
        };
        const tierSuffix = tier > 1 ? ` ${toRoman(tier)}` : '';
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
     * Curated bank of quotes/paragraphs for Letters mode.
     */
    static get QUOTES() {
        return [
            { quote: "BE WATER MY FRIEND", author: "Bruce Lee" },
            { quote: "STAY HUNGRY STAY FOOLISH", author: "Steve Jobs" },
            { quote: "SIMPLICITY IS PREREQUISITE FOR RELIABILITY", author: "Edsger Dijkstra" },
            { quote: "KNOWLEDGE IS POWER AND WISDOM IS FREEDOM", author: "Francis Bacon" },
            { quote: "EVERY MOMENT IS A FRESH BEGINNING", author: "T.S. Eliot" },
            { quote: "HUSTLE IN SILENCE LET SUCCESS MAKE THE NOISE", author: "Frank Ocean" },
            { quote: "CREATIVITY IS INTELLIGENCE HAVING FUN", author: "Albert Einstein" },
            { quote: "WHATEVER YOU ARE BE A GOOD ONE", author: "Abraham Lincoln" },
            { quote: "THE JOURNEY OF A THOUSAND MILES BEGINS WITH ONE STEP", author: "Lao Tzu" },
            { quote: "DO ONE THING EVERY DAY THAT SCARES YOU", author: "Eleanor Roosevelt" },
            { quote: "DREAM BIG AND DARE TO FAIL", author: "Norman Vaughan" },
            { quote: "ACTION IS THE FOUNDATIONAL KEY TO ALL SUCCESS", author: "Pablo Picasso" },
            { quote: "TURN YOUR WOUNDS INTO WISDOM", author: "Oprah Winfrey" },
            { quote: "NEVER REGRET ANYTHING THAT MADE YOU SMILE", author: "Mark Twain" },
            { quote: "EVERYTHING YOU CAN IMAGINE IS REAL", author: "Pablo Picasso" },
            { quote: "HAPPINESS DEPENDS UPON OURSELVES", author: "Aristotle" },
            { quote: "PEACE COMES FROM WITHIN DO NOT SEEK IT WITHOUT", author: "Buddha" },
            { quote: "LIGHT TOMORROW WITH TODAY", author: "Elizabeth Barrett Browning" },
            { quote: "MAKE EACH DAY YOUR MASTERPIECE", author: "John Wooden" },
            { quote: "THE ONLY WAY OUT IS THROUGH", author: "Robert Frost" }
        ];
    }

    /**
     * Generates a pair for the specified game mode.
     * @param {string} mode - 'numbers', 'sum10', 'sum20', 'shapes', or 'letters'
     * @param {number} targetSum - Target sum for numbers mode
     * @returns {[number|string, number|string]}
     */
    _generatePairForMode(mode = 'numbers', targetSum = 10) {
        if (mode === 'shapes') {
            // 24 luxury geometric rune emblems (no red/crimson, pure Nordic obsidian & jewel tones)
            const SHAPES = [
                'circle', 'triangle', 'square', 'diamond', 'star',
                'hexagon', 'crescent', 'pentagon', 'cross', 'ring',
                'octagon', 'heart', 'clover', 'infinity', 'spiral',
                'hourglass', 'teardrop', 'shield', 'compass', 'rhombus',
                'triskelion', 'prism', 'pillar', 'vortex'
            ];
            const shape = SHAPES[this._randInt(0, SHAPES.length - 1)];
            return [shape, shape]; // Identical matching pairs
        } else if (mode === 'letters') {
            const idx = this._randInt(0, 25);
            const char = String.fromCharCode(65 + idx);
            return [char, char];
        } else {
            // Numbers mode: values v1 + v2 = targetSum (where v1, v2 >= 1)
            const sum = Math.max(2, targetSum || 10);
            const maxVal = sum - 1;
            const v1 = this._randInt(1, maxVal);
            const v2 = sum - v1;
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
        } else if (orientation === 'Y') {
            // Vertical along Y: can slide horizontally in any of the 4 directions.
            // Direct towards the nearest perimeter wall for shortest escape path.
            const distWest = gridX;
            const distEast = gridSize - (gridX + 1);
            const distNorth = gridZ;
            const distSouth = gridSize - (gridZ + 1);
            const minDist = Math.min(distWest, distEast, distNorth, distSouth);
            if (minDist === distWest) return { x: -1, y: 0, z: 0 };
            if (minDist === distEast) return { x: 1, y: 0, z: 0 };
            if (minDist === distNorth) return { x: 0, y: 0, z: -1 };
            return { x: 0, y: 0, z: 1 };
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

        let mode = overrideConfig.mode || this.mode || 'numbers';
        // Normalize mode names
        if (mode === 'sum10' || mode === 'sum20') mode = 'numbers';
        if (mode === 'alphabet') mode = 'letters';

        const currentLevel = overrideConfig.level || 1;
        // Numbers mode: SUM 10 at lvl 1, SUM 11 at lvl 2, SUM 12 at lvl 3, etc.
        const targetSum = overrideConfig.targetSum || (9 + currentLevel);

        const topology = new GridTopology({ gridSize, maxLayers, targetSum, mode });

        // Sentence data for Letters mode
        let sentenceData = null;
        if (mode === 'letters') {
            const quoteObj = TopologyGenerator.QUOTES[(currentLevel - 1) % TopologyGenerator.QUOTES.length];
            const rawQuote = quoteObj.quote;
            // Extract letter characters only (A-Z)
            // Split quote into words to create natural consecutive letter pairs word-by-word
            const words = rawQuote.split(/\s+/).filter(w => w.length > 0);
            const quotePairs = [];
            const leftoverSingles = [];

            let rawPos = 0;
            for (const word of words) {
                const wordStart = rawQuote.indexOf(word, rawPos);
                rawPos = wordStart + word.length;

                const wordLetters = [];
                for (let k = 0; k < word.length; k++) {
                    const ch = word[k].toUpperCase();
                    if (ch >= 'A' && ch <= 'Z') {
                        wordLetters.push({ char: ch, rawIndex: wordStart + k });
                    }
                }

                // Pair consecutive letters within this word
                for (let i = 0; i < wordLetters.length - 1; i += 2) {
                    quotePairs.push({
                        pairId: quotePairs.length + 1,
                        char1: wordLetters[i].char,
                        char2: wordLetters[i + 1].char,
                        index1: wordLetters[i].rawIndex,
                        index2: wordLetters[i + 1].rawIndex
                    });
                }

                // If word has odd length, keep the last letter
                if (wordLetters.length % 2 === 1) {
                    leftoverSingles.push(wordLetters[wordLetters.length - 1]);
                }
            }

            // Pair leftover odd letters from words together
            for (let i = 0; i < leftoverSingles.length - 1; i += 2) {
                quotePairs.push({
                    pairId: quotePairs.length + 1,
                    char1: leftoverSingles[i].char,
                    char2: leftoverSingles[i + 1].char,
                    index1: leftoverSingles[i].rawIndex,
                    index2: leftoverSingles[i + 1].rawIndex
                });
            }

            // If an odd single remains overall, pair with itself
            if (leftoverSingles.length % 2 === 1) {
                const last = leftoverSingles[leftoverSingles.length - 1];
                quotePairs.push({
                    pairId: quotePairs.length + 1,
                    char1: last.char,
                    char2: last.char,
                    index1: last.rawIndex,
                    index2: last.rawIndex
                });
            }

            sentenceData = {
                quote: rawQuote,
                author: quoteObj.author,
                pairs: quotePairs,
                matchedPairIds: new Set()
            };
            topology.sentenceData = sentenceData;
        }

        // 1. Generate value pairs
        const blockSpecs = [];
        let idCounter = 1;

        // In letters mode, adjust pairsToGenerate to match the quote pair count
        const pairsToGenerate = (mode === 'letters' && sentenceData)
            ? sentenceData.pairs.length
            : pairCount;

        for (let p = 0; p < pairsToGenerate; p++) {
            let v1, v2;
            if (mode === 'letters' && sentenceData && sentenceData.pairs[p]) {
                v1 = sentenceData.pairs[p].char1;
                v2 = sentenceData.pairs[p].char2;
            } else {
                [v1, v2] = this._generatePairForMode(mode, targetSum);
            }
            blockSpecs.push(
                { id: `b_${idCounter++}`, value: v1, length: this._sampleLength(), type: 'normal', pairId: p + 1 },
                { id: `b_${idCounter++}`, value: v2, length: this._sampleLength(), type: 'normal', pairId: p + 1 }
            );
        }

        // Shuffle block specifications so pairs are mixed throughout the tower
        for (let i = blockSpecs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [blockSpecs[i], blockSpecs[j]] = [blockSpecs[j], blockSpecs[i]];
        }

        // 2. Procedurally place blocks layer by layer according to architectural shape
        // Mix horizontal (X, Z) and vertical (Y) orientations evenly
        const orientations = ['X', 'Z', 'Y'];

        for (const spec of blockSpecs) {
            let placed = false;
            let attempts = 0;
            const maxAttempts = 250;

            while (!placed && attempts < maxAttempts) {
                attempts++;

                const orient = orientations[this._randInt(0, orientations.length - 1)];

                const maxY = (orient === 'Y') ? maxLayers - spec.length : maxLayers - 1;
                const maxX = (orient === 'X') ? gridSize - spec.length : gridSize - 1;
                const maxZ = (orient === 'Z') ? gridSize - spec.length : gridSize - 1;

                if (maxX < 0 || maxZ < 0 || maxY < 0) continue;

                // Choose layer with weighted preference for lower layers to build from base up
                const layer = Math.min(
                    maxY,
                    Math.floor(Math.pow(Math.random(), 1.5) * (maxLayers / 2))
                );

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
                        type: spec.type || 'normal',
                        pairId: spec.pairId || null
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
                            const maxY = (orient === 'Y') ? maxLayers - spec.length : maxLayers - 1;
                            const maxX = (orient === 'X') ? gridSize - spec.length : gridSize - 1;
                            const maxZ = (orient === 'Z') ? gridSize - spec.length : gridSize - 1;
                            if (maxX < 0 || maxZ < 0 || y > maxY) continue;

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
                                        type: spec.type || 'normal',
                                        pairId: spec.pairId || null
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
                            const maxY = (orient === 'Y') ? maxLayers - spec.length : maxLayers - 1;
                            const maxX = (orient === 'X') ? gridSize - spec.length : gridSize - 1;
                            const maxZ = (orient === 'Z') ? gridSize - spec.length : gridSize - 1;
                            if (maxX < 0 || maxZ < 0 || y > maxY) continue;

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
                                        type: spec.type || 'normal',
                                        pairId: spec.pairId || null
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
            this._assignAdjacentPairValues(topology);

            return topology;
        }

    /**
     * Traverses placed blocks in 3D and assigns values such that ALL normal blocks
     * are partitioned into strictly disjoint 1-to-1 pairs matching the current mode rules.
     * @param {GridTopology} topology 
     */
    _assignAdjacentPairValues(topology) {
        const normalBlocks = Array.from(topology.blocks.values()).filter((b) => b.type === 'normal');
        if (normalBlocks.length === 0) return;

        // If there's an odd number of normal blocks, remove the odd block completely
        if (normalBlocks.length % 2 === 1) {
            const oddBlock = normalBlocks.pop();
            topology.removeBlock(oddBlock.id);
        }

        const mode = topology.mode || 'numbers';

        // In letters mode with sentenceData, pair blocks and assign quote pairs
        if (mode === 'letters' && topology.sentenceData && Array.isArray(topology.sentenceData.pairs)) {
            // Sort blocks with highest neighbor connectivity first
            const sortedBlocks = [...normalBlocks].sort((a, b) => {
                return topology.getNeighborBlocks(b.id).size - topology.getNeighborBlocks(a.id).size;
            });

            const paired = [];
            const used = new Set();

            for (const b1 of sortedBlocks) {
                if (used.has(b1.id)) continue;
                const neighbors = topology.getNeighborBlocks(b1.id);
                const nonNeighbors = normalBlocks.filter(b2 =>
                    b2.id !== b1.id &&
                    !used.has(b2.id) &&
                    !neighbors.has(b2)
                );

                let partner = null;
                if (nonNeighbors.length > 0) {
                    nonNeighbors.sort((a, b) => {
                        const distA = Math.hypot(a.gridX - b1.gridX, (a.gridY - b1.gridY) * 1.5, a.gridZ - b1.gridZ);
                        const distB = Math.hypot(b.gridX - b1.gridX, (b.gridY - b1.gridY) * 1.5, b.gridZ - b1.gridZ);
                        return distB - distA;
                    });
                    const poolSize = Math.max(1, Math.floor(nonNeighbors.length * 0.3));
                    partner = nonNeighbors[Math.floor(Math.random() * poolSize)];
                } else {
                    partner = normalBlocks.find(b2 => b2.id !== b1.id && !used.has(b2.id));
                }

                if (partner) {
                    used.add(b1.id);
                    used.add(partner.id);
                    paired.push([b1, partner]);
                }
            }

            const quotePairs = topology.sentenceData.pairs;
            // Assign quote pairs to block pairs
            for (let i = 0; i < paired.length; i++) {
                const qPair = quotePairs[i % quotePairs.length];
                const [b1, b2] = paired[i];
                b1.value = qPair.char1;
                b1.pairId = qPair.pairId;
                b2.value = qPair.char2;
                b2.pairId = qPair.pairId;
            }

            // Guarantee at least one move
            if (!topology.hasAnyValidMove()) {
                topology.shuffleDeadlock();
            }
            return;
        }

        // Clear existing values on normal blocks so they can be assigned freshly
        for (const b of normalBlocks) {
            b.value = null;
        }

        // 1. Partition all normal blocks into mutually disjoint pairs (b1, b2).
        const paired = [];
        const used = new Set();

        if (mode === 'shapes') {
            const sortedBlocks = [...normalBlocks].sort((a, b) => {
                return topology.getNeighborBlocks(b.id).size - topology.getNeighborBlocks(a.id).size;
            });

            for (const b1 of sortedBlocks) {
                if (used.has(b1.id)) continue;
                const neighbors = topology.getNeighborBlocks(b1.id);
                const nonNeighbors = normalBlocks.filter(b2 =>
                    b2.id !== b1.id &&
                    !used.has(b2.id) &&
                    !neighbors.has(b2)
                );

                let partner = null;
                if (nonNeighbors.length > 0) {
                    nonNeighbors.sort((a, b) => {
                        const distA = Math.hypot(a.gridX - b1.gridX, (a.gridY - b1.gridY) * 1.5, a.gridZ - b1.gridZ);
                        const distB = Math.hypot(b.gridX - b1.gridX, (b.gridY - b1.gridY) * 1.5, b.gridZ - b1.gridZ);
                        return distB - distA;
                    });
                    const poolSize = Math.max(1, Math.floor(nonNeighbors.length * 0.25));
                    partner = nonNeighbors[Math.floor(Math.random() * poolSize)];
                } else {
                    partner = normalBlocks.find(b2 => b2.id !== b1.id && !used.has(b2.id));
                }

                if (partner) {
                    used.add(b1.id);
                    used.add(partner.id);
                    paired.push([b1, partner]);
                }
            }
        } else {
            // Numbers mode (Dynamic SUM): mix adjacent touching blocks and nearby blocks
            for (let i = normalBlocks.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [normalBlocks[i], normalBlocks[j]] = [normalBlocks[j], normalBlocks[i]];
            }

            for (const b of normalBlocks) {
                if (used.has(b.id)) continue;
                const neighbors = Array.from(topology.getNeighborBlocks(b.id)).filter(n => n.type === 'normal' && !used.has(n.id));
                if (neighbors.length > 0) {
                    const partner = neighbors[Math.floor(Math.random() * neighbors.length)];
                    used.add(b.id);
                    used.add(partner.id);
                    paired.push([b, partner]);
                }
            }

            const unpaired = normalBlocks.filter(b => !used.has(b.id));
            for (let i = 0; i < unpaired.length - 1; i += 2) {
                used.add(unpaired[i].id);
                used.add(unpaired[i + 1].id);
                paired.push([unpaired[i], unpaired[i + 1]]);
            }
        }

        // 2. Build balanced pool of symbols or numbers
        const totalPairs = paired.length;
        const pairValuePool = [];

        if (mode === 'shapes') {
            const SHAPES = [
                'circle', 'triangle', 'square', 'diamond', 'star',
                'hexagon', 'crescent', 'pentagon', 'cross', 'ring',
                'octagon', 'heart', 'clover', 'infinity', 'spiral',
                'hourglass', 'teardrop', 'shield', 'compass', 'rhombus',
                'triskelion', 'prism', 'pillar', 'vortex'
            ];
            for (let i = 0; i < totalPairs; i++) {
                const s = SHAPES[i % SHAPES.length];
                pairValuePool.push([s, s]);
            }
        } else {
            // Numbers mode: values sum to topology.targetSum
            const targetSum = topology.targetSum || 10;
            const maxVal = targetSum - 1;
            for (let i = 0; i < totalPairs; i++) {
                const v1 = (i % maxVal) + 1;
                pairValuePool.push([v1, targetSum - v1]);
            }
        }

        // Shuffle the pool initially
        for (let i = pairValuePool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pairValuePool[i], pairValuePool[j]] = [pairValuePool[j], pairValuePool[i]];
        }

        // 3. Assign values to pairs
        if (mode === 'shapes') {
            paired.sort((pA, pB) => {
                const cA = topology.getNeighborBlocks(pA[0].id).size + topology.getNeighborBlocks(pA[1].id).size;
                const cB = topology.getNeighborBlocks(pB[0].id).size + topology.getNeighborBlocks(pB[1].id).size;
                return cB - cA;
            });

            for (const [b1, b2] of paired) {
                let bestIdx = 0;
                let minPenalty = Infinity;

                for (let i = 0; i < pairValuePool.length; i++) {
                    const [candVal1, candVal2] = pairValuePool[i];
                    let penalty = 0;

                    for (const assigned of normalBlocks) {
                        if (!assigned.value) continue;
                        if (assigned.value !== candVal1 && assigned.value !== candVal2) continue;

                        const d1 = Math.hypot(assigned.gridX - b1.gridX, assigned.gridY - b1.gridY, assigned.gridZ - b1.gridZ);
                        const d2 = Math.hypot(assigned.gridX - b2.gridX, assigned.gridY - b2.gridY, assigned.gridZ - b2.gridZ);

                        if (d1 < 1.8) penalty += 5000;
                        else if (d1 < 2.9) penalty += 400;
                        else if (d1 < 4.0) penalty += 40;

                        if (d2 < 1.8) penalty += 5000;
                        else if (d2 < 2.9) penalty += 400;
                        else if (d2 < 4.0) penalty += 40;
                    }

                    if (penalty < minPenalty) {
                        minPenalty = penalty;
                        bestIdx = i;
                        if (penalty === 0) break;
                    }
                }

                const [val1, val2] = pairValuePool.splice(bestIdx, 1)[0];
                b1.value = val1;
                b2.value = val2;
            }
        } else {
            // Standard assignment for numbers
            let pairCounter = 1;
            for (const [b1, b2] of paired) {
                const [val1, val2] = pairValuePool.pop();
                b1.value = val1;
                b1.pairId = pairCounter;
                b2.value = val2;
                b2.pairId = pairCounter++;
            }
        }

        // Guarantee at least one valid move is immediately open from the start
        if (!topology.hasAnyValidMove()) {
            topology.shuffleDeadlock();
        }
    }
}


