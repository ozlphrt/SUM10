import { BlockModel } from './BlockModel.js';

/**
 * GridTopology: Coordinates the discrete 3D spatial occupancy of the tower.
 * Matches Jarrows' grid dimensions, layering, and boundary rules.
 */
export class GridTopology {
    /**
     * @param {Object} options
     * @param {number} options.gridSize - Width and depth of base grid (e.g. 5, 6, 7)
     * @param {number} options.maxLayers - Maximum layer height of the tower
     * @param {number} options.cellSize - Edge length of a 1x1x1 cube (default 1.0)
     */
    constructor({ gridSize = 5, maxLayers = 12, cellSize = 1.0 } = {}) {
        this.gridSize = gridSize;
        this.maxLayers = maxLayers;
        this.cellSize = cellSize;

        /** @type {Map<string|number, BlockModel>} */
        this.blocks = new Map();

        /** @type {Map<string, string|number>} voxelKey "x,y,z" -> blockId */
        this.voxelMap = new Map();
    }

    /**
     * Helper to create a consistent string key for voxel coordinates.
     */
    static toKey(x, y, z) {
        return `${x},${y},${z}`;
    }

    /**
     * Checks if coordinates fall within the grid boundaries.
     */
    isInBounds(x, y, z) {
        return (
            x >= 0 && x < this.gridSize &&
            y >= 0 && y < this.maxLayers &&
            z >= 0 && z < this.gridSize
        );
    }

    /**
     * Checks if a voxel coordinate is currently occupied.
     */
    isOccupied(x, y, z) {
        return this.voxelMap.has(GridTopology.toKey(x, y, z));
    }

    /**
     * Gets the block occupying a specific voxel, if any.
     */
    getBlockAt(x, y, z) {
        const id = this.voxelMap.get(GridTopology.toKey(x, y, z));
        return id ? this.blocks.get(id) : null;
    }

    /**
     * Determines whether a block can be safely placed at its target coordinates
     * without overlapping existing blocks or exceeding grid boundaries.
     * @param {BlockModel} block 
     * @returns {boolean}
     */
    canPlace(block) {
        const voxels = block.getOccupiedVoxels();
        for (const v of voxels) {
            if (!this.isInBounds(v.x, v.y, v.z)) return false;
            if (this.isOccupied(v.x, v.y, v.z)) return false;
        }
        return true;
    }

    /**
     * Support Check: Ground layer (y = 0) is supported.
     * Upper layers (y > 0) require at least one voxel below the block's footprint
     * to have an existing block (matching Jarrows' anti-floating physics rule).
     * @param {BlockModel} block 
     * @returns {boolean}
     */
    hasSupport(block) {
        if (block.gridY === 0) return true;

        // For vertical blocks (Y), support is required right beneath the bottom layer (gridY - 1)
        // For horizontal blocks (X/Z), support is required beneath any of its occupied voxels
        if (block.orientation === 'Y') {
            return this.isOccupied(block.gridX, block.gridY - 1, block.gridZ);
        }

        const footprint = block.getOccupiedVoxels();
        for (const v of footprint) {
            if (v.y > 0 && this.isOccupied(v.x, v.y - 1, v.z)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Adds a block to the topology and registers its occupied voxels.
     * @param {BlockModel} block 
     * @returns {boolean} true if successfully placed
     */
    addBlock(block) {
        if (!this.canPlace(block)) return false;

        this.blocks.set(block.id, block);
        for (const v of block.getOccupiedVoxels()) {
            this.voxelMap.set(GridTopology.toKey(v.x, v.y, v.z), block.id);
        }
        return true;
    }

    /**
     * Removes a block from the topology and frees its voxels.
     * @param {string|number} blockId 
     * @returns {BlockModel|null} The removed block
     */
    removeBlock(blockId) {
        const block = this.blocks.get(blockId);
        if (!block) return null;

        for (const v of block.getOccupiedVoxels()) {
            this.voxelMap.delete(GridTopology.toKey(v.x, v.y, v.z));
        }
        block.isRemoved = true;
        this.blocks.delete(blockId);
        return block;
    }

    /**
     * Finds all neighboring blocks adjacent to a given block (for Bomb explosions).
     * @param {string|number} blockId 
     * @returns {Set<BlockModel>}
     */
    getNeighborBlocks(blockId) {
        const block = this.blocks.get(blockId);
        const neighbors = new Set();
        if (!block) return neighbors;

        const myVoxels = block.getOccupiedVoxels();
        for (const v of myVoxels) {
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dz = -1; dz <= 1; dz++) {
                        const nx = v.x + dx;
                        const ny = v.y + dy;
                        const nz = v.z + dz;
                        const otherId = this.voxelMap.get(GridTopology.toKey(nx, ny, nz));
                        if (otherId && otherId !== blockId && this.blocks.has(otherId)) {
                            neighbors.add(this.blocks.get(otherId));
                        }
                    }
                }
            }
        }
        return neighbors;
    }

    /**
     * Determines whether two blocks are physically adjacent in 3D
     * (sharing a face or edge along X, Y, or Z).
     * @param {BlockModel} blockA 
     * @param {BlockModel} blockB 
     * @returns {boolean}
     */
    areBlocksAdjacent(blockA, blockB) {
        if (!blockA || !blockB || blockA.id === blockB.id) return false;
        const neighbors = this.getNeighborBlocks(blockA.id);
        return neighbors.has(blockB);
    }

    /**
     * Determines whether two blocks can be paired:
     * 1. Physically adjacent in 3D, OR
     * 2. Separated anywhere on the board as long as both can freely slide out of the tower, OR
     * 3. Either block is an isolated cluster without neighbors, OR
     * 4. Endgame (<= 2 blocks left).
     * @param {BlockModel} blockA 
     * @param {BlockModel} blockB 
     * @returns {boolean}
     */
    canBlocksBePaired(blockA, blockB) {
        if (!blockA || !blockB || blockA.id === blockB.id) return false;
        // Always allowed if physically adjacent
        if (this.areBlocksAdjacent(blockA, blockB)) return true;
        // Allowed in endgame
        if (this.blocks.size <= 2) return true;
        // Allowed if either block has no touching neighbors (isolated)
        const neighborsA = this.getNeighborBlocks(blockA.id);
        const neighborsB = this.getNeighborBlocks(blockB.id);
        if (neighborsA.size === 0 || neighborsB.size === 0) return true;
        // Allowed across space if both blocks have a clear sliding exit route out of the tower!
        const exitA = this.canBlockSlideOut(blockA, blockB);
        const exitB = this.canBlockSlideOut(blockB, blockA);
        if (exitA.canExit && exitB.canExit) return true;
        return false;
    }


    /**
     * Simulates downward gravity fall for any blocks that have lost support.
     * Iterates from bottom to top so lower drops happen first.
     * @returns {Array<{ block: BlockModel, oldGridY: number, newGridY: number, dropLayers: number }>}
     */
    settleGravity() {
        const fallenBlocks = [];
        let anyMoved = true;

        // Iterate repeatedly until no more blocks can fall
        while (anyMoved) {
            anyMoved = false;

            // Sort active blocks by gridY ascending so lower blocks drop first
            const sortedBlocks = Array.from(this.blocks.values()).sort((a, b) => a.gridY - b.gridY);

            for (const block of sortedBlocks) {
                if (block.gridY === 0) continue; // Already at ground

                // Test how many layers this block can drop
                let dropCount = 0;
                let currentY = block.gridY;

                while (currentY > 0) {
                    const testY = currentY - 1;
                    let canDropOne = true;

                    // Footprint check for the slice at testY
                    const voxels = block.getOccupiedVoxels();
                    for (const v of voxels) {
                        const checkX = v.x;
                        const checkY = v.y - (block.gridY - testY);
                        const checkZ = v.z;

                        const occupantId = this.voxelMap.get(GridTopology.toKey(checkX, checkY, checkZ));
                        if (occupantId && occupantId !== block.id) {
                            canDropOne = false;
                            break;
                        }
                    }

                    if (canDropOne) {
                        dropCount++;
                        currentY = testY;
                    } else {
                        break;
                    }
                }

                if (dropCount > 0) {
                    const oldGridY = block.gridY;
                    const newGridY = oldGridY - dropCount;

                    // Remove old voxels from voxelMap
                    for (const v of block.getOccupiedVoxels()) {
                        this.voxelMap.delete(GridTopology.toKey(v.x, v.y, v.z));
                    }

                    // Apply new layer
                    block.gridY = newGridY;

                    // Register new voxels
                    for (const v of block.getOccupiedVoxels()) {
                        this.voxelMap.set(GridTopology.toKey(v.x, v.y, v.z), block.id);
                    }

                    fallenBlocks.push({
                        block,
                        oldGridY,
                        newGridY,
                        dropLayers: dropCount
                    });

                    anyMoved = true;
                }
            }
        }

        return fallenBlocks;
    }

    /**
     * Checks if a block has an unobstructed path to slide out of the tower
     * along its assigned escape direction.
    /**
     * Checks if a block has an unobstructed path to slide out in a specific direction.
     * @param {BlockModel} block 
     * @param {{x: number, y: number, z: number}} dir 
     * @returns {{canExit: boolean, stepsToExit: number}}
     */
    _checkSlideInDirection(block, dir, partnerBlock = null) {
        let steps = 0;
        const maxSteps = this.gridSize * 2;
        const currentVoxels = block.getOccupiedVoxels();

        while (steps < maxSteps) {
            steps++;
            let allExited = true;

            for (const v of currentVoxels) {
                const targetX = v.x + dir.x * steps;
                const targetY = v.y + dir.y * steps;
                const targetZ = v.z + dir.z * steps;

                // Check if target is inside grid bounds
                if (this.isInBounds(targetX, targetY, targetZ)) {
                    allExited = false;
                    const occupantId = this.voxelMap.get(GridTopology.toKey(targetX, targetY, targetZ));
                    // Obstructed by another block (excluding self and partner)
                    if (occupantId && occupantId !== block.id && (!partnerBlock || occupantId !== partnerBlock.id)) {
                        return { canExit: false, stepsToExit: steps };
                    }
                }
            }

            if (allExited) {
                return { canExit: true, stepsToExit: steps };
            }
        }

        return { canExit: false, stepsToExit: steps };
    }

    /**
     * Checks if a block has an unobstructed path to slide out of the tower:
     * - Single cell blocks (length 1) can move in all four horizontal directions (+X, -X, +Z, -Z), upon availability.
     * - Multi-cell blocks (length 2 or 3) move strictly along their long axis.
     * Automatically assigns the clearer/shorter escape direction to the block.
     * @param {BlockModel} block 
     * @returns {{canExit: boolean, stepsToExit: number, direction: {x: number, y: number, z: number}}}
     */
    canBlockSlideOut(block, partnerBlock = null) {
        // Single cell blocks and vertical (Y) blocks can slide horizontally in all four directions (+X, -X, +Z, -Z).
        // Horizontal multi-cell blocks move strictly along their long axis (X or Z).
        const axisDirs = (block.length === 1 || block.orientation === 'Y')
            ? [
                { x: 1, y: 0, z: 0 },
                { x: -1, y: 0, z: 0 },
                { x: 0, y: 0, z: 1 },
                { x: 0, y: 0, z: -1 }
              ]
            : ((block.orientation === 'X')
                ? [{ x: -1, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }]
                : [{ x: 0, y: 0, z: -1 }, { x: 0, y: 0, z: 1 }]);

        const candidateResults = axisDirs.map((dir) => ({
            dir,
            ...this._checkSlideInDirection(block, dir, partnerBlock)
        }));

        const clearResults = candidateResults.filter((r) => r.canExit);

        if (clearResults.length > 0) {
            // Sort primarily by fewest steps to exit (shortest distance to tower perimeter)
            clearResults.sort((a, b) => {
                if (a.stepsToExit !== b.stepsToExit) {
                    return a.stepsToExit - b.stepsToExit;
                }
                // Tie-breaker: if a partner block is provided, prefer moving away from partner
                if (partnerBlock) {
                    const awayX = block.gridX - partnerBlock.gridX;
                    const awayZ = block.gridZ - partnerBlock.gridZ;
                    const dotA = a.dir.x * awayX + a.dir.z * awayZ;
                    const dotB = b.dir.x * awayX + b.dir.z * awayZ;
                    return dotB - dotA;
                }
                return 0;
            });

            block.direction = { ...clearResults[0].dir };
            return {
                canExit: true,
                stepsToExit: clearResults[0].stepsToExit,
                direction: clearResults[0].dir
            };
        }

        // If blocked in all directions, pick direction with the longest clearance for shake/nudge
        candidateResults.sort((a, b) => b.stepsToExit - a.stepsToExit);
        block.direction = { ...candidateResults[0].dir };
        return {
            canExit: false,
            stepsToExit: candidateResults[0].stepsToExit,
            direction: candidateResults[0].dir
        };
    }

    /**
     * Finds all currently available pairs of blocks whose values sum to the target (default 10).
     * @param {number} targetSum 
     * @returns {Array<[BlockModel, BlockModel]>}
     */
    findSumPairs(targetSum = 10) {
        const activeBlocks = Array.from(this.blocks.values());
        const pairs = [];
        for (let i = 0; i < activeBlocks.length; i++) {
            for (let j = i + 1; j < activeBlocks.length; j++) {
                if (activeBlocks[i].value + activeBlocks[j].value === targetSum) {
                    pairs.push([activeBlocks[i], activeBlocks[j]]);
                }
            }
        }
        return pairs;
    }

    /**
     * Checks if there is at least one playable move right now:
     * - Any active bomb (can always be detonated)
     * - Any unblocked Wildcard paired with any unblocked block
     * - Any pair of unblocked blocks summing to 10
     * @returns {boolean}
     */
    /**
     * Checks if two block values or types form a valid match for the current game mode.
     * @param {BlockModel} b1 
     * @param {BlockModel} b2 
     * @returns {boolean}
     */
    isMatch(b1, b2) {
        if (!b1 || !b2) return false;
        // Wildcard blocks pair with anything
        if (b1.type === 'wild' || b2.type === 'wild') return true;

        const mode = this.mode || 'sum10';
        if (mode === 'sum20') {
            return Number(b1.value) + Number(b2.value) === 20;
        } else if (mode === 'shapes' || mode === 'alphabet') {
            return String(b1.value).toUpperCase() === String(b2.value).toUpperCase();
        } else {
            // Default sum10
            return Number(b1.value) + Number(b2.value) === 10;
        }
    }

    /**
     * Helper to generate a matching pair for the current mode.
     * @returns {[number|string, number|string]}
     */
    _generatePair() {
        const mode = this.mode || 'sum10';
        if (mode === 'sum20') {
            const v1 = Math.floor(Math.random() * 19) + 1;
            return [v1, 20 - v1];
        } else if (mode === 'shapes') {
            const SHAPES = [
                'circle', 'triangle', 'square', 'diamond', 'star',
                'hexagon', 'crescent', 'pentagon', 'cross', 'ring',
                'octagon', 'heart', 'clover', 'infinity', 'spiral',
                'hourglass', 'teardrop', 'shield', 'compass', 'rhombus',
                'triskelion', 'prism', 'pillar', 'vortex'
            ];
            const s = SHAPES[Math.floor(Math.random() * SHAPES.length)];
            return [s, s];
        } else if (mode === 'alphabet') {
            const idx = Math.floor(Math.random() * 26);
            const char = String.fromCharCode(65 + idx);
            return [char, char];
        } else {
            const v1 = Math.floor(Math.random() * 9) + 1;
            return [v1, 10 - v1];
        }
    }

    /**
     * Checks if there is at least one playable move right now:
     * - Any active bomb (can always be detonated)
     * - Any unblocked Wildcard paired with any unblocked block that can slide out jointly
     * - Any pair of blocks matching mode rules that can be paired AND can both slide out jointly
     * @returns {boolean}
     */
    hasAnyValidMove() {
        const active = Array.from(this.blocks.values());
        if (active.length <= 1) return true; // Cleared or final block ready to be tapped out

        // If a bomb exists, it's always an available tactical move
        if (active.some((b) => b.type === 'bomb')) return true;

        // Check every pair of active blocks
        for (let i = 0; i < active.length; i++) {
            for (let j = i + 1; j < active.length; j++) {
                const b1 = active[i];
                const b2 = active[j];

                // 1. Must be eligible for pairing (adjacent, or endgame <= 2, or isolated)
                if (!this.canBlocksBePaired(b1, b2)) continue;

                // 2. Must form a valid match based on mode
                if (!this.isMatch(b1, b2)) continue;

                // 3. Both blocks must have an unobstructed slide path when considering each other
                const exit1 = this.canBlockSlideOut(b1, b2);
                const exit2 = this.canBlockSlideOut(b2, b1);
                if (exit1.canExit && exit2.canExit) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Shuffles values among remaining blocks to break deadlocks and guarantee
     * that at least one clear exit pair can be paired and matches current mode rules.
     */
    shuffleDeadlock() {
        const active = Array.from(this.blocks.values()).filter((b) => b.type === 'normal');
        if (active.length < 2) return;

        // Find blocks that have an exit path
        const clearBlocks = active.filter((b) => this.canBlockSlideOut(b).canExit);

        const pairedIds = new Set();
        let paired = false;

        // 1. First priority: find two unblocked blocks that can mutually pair AND both slide out jointly
        for (let i = 0; i < clearBlocks.length; i++) {
            for (let j = i + 1; j < clearBlocks.length; j++) {
                const b1 = clearBlocks[i];
                const b2 = clearBlocks[j];
                if (this.canBlocksBePaired(b1, b2)) {
                    const exit1 = this.canBlockSlideOut(b1, b2);
                    const exit2 = this.canBlockSlideOut(b2, b1);
                    if (exit1.canExit && exit2.canExit) {
                        const [v1, v2] = this._generatePair();
                        b1.value = v1;
                        b2.value = v2;
                        pairedIds.add(b1.id);
                        pairedIds.add(b2.id);
                        paired = true;
                        break;
                    }
                }
            }
            if (paired) break;
        }

        // 2. If no pair of already-clear blocks can exit jointly, find ANY pair of blocks that can be paired
        // and both slide out jointly
        if (!paired) {
            for (let i = 0; i < active.length; i++) {
                for (let j = i + 1; j < active.length; j++) {
                    const b1 = active[i];
                    const b2 = active[j];
                    if (this.canBlocksBePaired(b1, b2)) {
                        const exit1 = this.canBlockSlideOut(b1, b2);
                        const exit2 = this.canBlockSlideOut(b2, b1);
                        if (exit1.canExit && exit2.canExit) {
                            const [v1, v2] = this._generatePair();
                            b1.value = v1;
                            b2.value = v2;
                            pairedIds.add(b1.id);
                            pairedIds.add(b2.id);
                            paired = true;
                            break;
                        }
                    }
                }
                if (paired) break;
            }
        }

        // 3. Fallback: If still not paired, pair a clear block with another unblocked or distant block
        if (!paired && clearBlocks.length > 0) {
            const b1 = clearBlocks[0];
            const preferSpaced = (this.mode === 'shapes' || this.mode === 'alphabet');
            let candidates = active.filter(b => b.id !== b1.id);
            if (preferSpaced) {
                const neighbors = this.getNeighborBlocks(b1.id);
                const nonNeighbors = candidates.filter(b => !neighbors.has(b));
                if (nonNeighbors.length > 0) candidates = nonNeighbors;
            }
            if (candidates.length > 0) {
                const b2 = candidates[0];
                const [v1, v2] = this._generatePair();
                b1.value = v1;
                b2.value = v2;
                pairedIds.add(b1.id);
                pairedIds.add(b2.id);
                paired = true;
            }
        }

        // 4. Force pair any two active blocks if all else fails
        if (!paired && active.length >= 2) {
            const b1 = active[0];
            const b2 = active[1];
            const [v1, v2] = this._generatePair();
            b1.value = v1;
            b2.value = v2;
            pairedIds.add(b1.id);
            pairedIds.add(b2.id);
            paired = true;
        }

        // 5. Shuffle values of remaining active blocks in pairs matching current mode rules
        // For shapes/alphabet mode, use balanced pool & spatial penalty to keep them well spread out
        const remainingNormal = active.filter((b) => !pairedIds.has(b.id));
        if (this.mode === 'shapes' || this.mode === 'alphabet') {
            const SHAPES = [
                'circle', 'triangle', 'square', 'diamond', 'star',
                'hexagon', 'crescent', 'pentagon', 'cross', 'ring',
                'octagon', 'heart', 'clover', 'infinity', 'spiral',
                'hourglass', 'teardrop', 'shield', 'compass', 'rhombus',
                'triskelion', 'prism', 'pillar', 'vortex'
            ];
            const half = Math.floor(remainingNormal.length / 2);
            const pool = [];
            if (this.mode === 'shapes') {
                for (let i = 0; i < half; i++) {
                    const s = SHAPES[i % SHAPES.length];
                    pool.push([s, s]);
                }
            } else {
                const LETTERS = [];
                for (let c = 65; c <= 90; c++) LETTERS.push(String.fromCharCode(c));
                for (let i = 0; i < half; i++) {
                    const char = LETTERS[i % LETTERS.length];
                    pool.push([char, char]);
                }
            }
            for (let i = pool.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [pool[i], pool[j]] = [pool[j], pool[i]];
            }

            // Pair remaining blocks with farthest non-touching partners
            const subPaired = [];
            const subUsed = new Set();
            for (const b1 of remainingNormal) {
                if (subUsed.has(b1.id)) continue;
                const neighbors = this.getNeighborBlocks(b1.id);
                const candidates = remainingNormal.filter(b2 => b2.id !== b1.id && !subUsed.has(b2.id) && !neighbors.has(b2));
                let partner = null;
                if (candidates.length > 0) {
                    candidates.sort((a, b) => {
                        const distA = Math.hypot(a.gridX - b1.gridX, (a.gridY - b1.gridY) * 1.5, a.gridZ - b1.gridZ);
                        const distB = Math.hypot(b.gridX - b1.gridX, (b.gridY - b1.gridY) * 1.5, b.gridZ - b1.gridZ);
                        return distB - distA;
                    });
                    partner = candidates[0];
                } else {
                    partner = remainingNormal.find(b2 => b2.id !== b1.id && !subUsed.has(b2.id));
                }
                if (partner) {
                    subUsed.add(b1.id);
                    subUsed.add(partner.id);
                    subPaired.push([b1, partner]);
                }
            }

            // Assign values to pairs minimizing proximity penalty
            for (const [b1, b2] of subPaired) {
                let bestIdx = 0;
                let minPenalty = Infinity;
                for (let i = 0; i < pool.length; i++) {
                    const [cand1, cand2] = pool[i];
                    let penalty = 0;
                    for (const other of active) {
                        if (!other.value || (other.value !== cand1 && other.value !== cand2)) continue;
                        const d1 = Math.hypot(other.gridX - b1.gridX, other.gridY - b1.gridY, other.gridZ - b1.gridZ);
                        const d2 = Math.hypot(other.gridX - b2.gridX, other.gridY - b2.gridY, other.gridZ - b2.gridZ);
                        if (d1 < 1.8) penalty += 5000;
                        else if (d1 < 2.9) penalty += 400;
                        if (d2 < 1.8) penalty += 5000;
                        else if (d2 < 2.9) penalty += 400;
                    }
                    if (penalty < minPenalty) {
                        minPenalty = penalty;
                        bestIdx = i;
                        if (penalty === 0) break;
                    }
                }
                const [v1, v2] = pool.splice(bestIdx, 1)[0];
                b1.value = v1;
                b2.value = v2;
            }
        } else {
            for (let i = 0; i < remainingNormal.length - 1; i += 2) {
                const [v1, v2] = this._generatePair();
                remainingNormal[i].value = v1;
                remainingNormal[i + 1].value = v2;
            }
        }
        // If an odd block remains, make it a wildcard so every normal block is 100% paired
        if (remainingNormal.length % 2 === 1) {
            const oddBlock = remainingNormal[remainingNormal.length - 1];
            oddBlock.type = 'wild';
            oddBlock.value = '★';
        }
    }

    /**
     * Clears all blocks and resets the grid.
     */
    clear() {
        this.blocks.clear();
        this.voxelMap.clear();
    }
}
