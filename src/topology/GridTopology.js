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

        // Footprint voxels are all occupied voxels since blocks are horizontal (height 1)
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
    _checkSlideInDirection(block, dir) {
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
                    // Obstructed by another block
                    if (occupantId && occupantId !== block.id) {
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
        // Single cell blocks can move all four horizontal directions (+X, -X, +Z, -Z), upon availability.
        // Multi-cell blocks move strictly along their long axis.
        const axisDirs = (block.length === 1)
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
            ...this._checkSlideInDirection(block, dir)
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
    hasAnyValidMove() {
        const active = Array.from(this.blocks.values());
        if (active.length === 0) return true; // Cleared

        // If a bomb exists, it's always an available tactical move
        if (active.some((b) => b.type === 'bomb')) return true;

        // Filter blocks that currently have clear exit paths
        const clearBlocks = active.filter((b) => this.canBlockSlideOut(b).canExit);
        if (clearBlocks.length < 2) return false;

        // Check if any two clear blocks are adjacent and form a valid match
        for (let i = 0; i < clearBlocks.length; i++) {
            for (let j = i + 1; j < clearBlocks.length; j++) {
                const b1 = clearBlocks[i];
                const b2 = clearBlocks[j];
                // Both must be physically adjacent in 3D
                if (this.areBlocksAdjacent(b1, b2)) {
                    if (b1.type === 'wild' || b2.type === 'wild') return true;
                    if (b1.value + b2.value === 10) return true;
                }
            }
        }

        return false;
    }

    /**
     * Shuffles values among remaining blocks to break deadlocks and guarantee
     * that at least one clear exit pair is adjacent and sums to 10.
     */
    shuffleDeadlock() {
        const active = Array.from(this.blocks.values()).filter((b) => b.type === 'normal');
        if (active.length < 2) return;

        // Find clear exit blocks
        const clearBlocks = Array.from(this.blocks.values()).filter((b) => this.canBlockSlideOut(b).canExit && b.type === 'normal');

        // Look for an adjacent pair among clear blocks
        let paired = false;
        for (let i = 0; i < clearBlocks.length; i++) {
            for (let j = i + 1; j < clearBlocks.length; j++) {
                if (this.areBlocksAdjacent(clearBlocks[i], clearBlocks[j])) {
                    const v1 = Math.floor(Math.random() * 9) + 1;
                    clearBlocks[i].value = v1;
                    clearBlocks[j].value = 10 - v1;
                    paired = true;
                    break;
                }
            }
            if (paired) break;
        }

        // If no two clear blocks are currently adjacent, link a clear block with its adjacent neighbor
        if (!paired && clearBlocks.length > 0) {
            const b1 = clearBlocks[0];
            const neighbors = Array.from(this.getNeighborBlocks(b1.id)).filter((n) => n.type === 'normal');
            if (neighbors.length > 0) {
                const b2 = neighbors[0];
                const v1 = Math.floor(Math.random() * 9) + 1;
                b1.value = v1;
                b2.value = 10 - v1;
            }
        }

        // Shuffle values of remaining active blocks in adjacent pairs
        const remainingNormal = active.filter((b) => !clearBlocks.slice(0, 2).includes(b));
        for (let i = 0; i < remainingNormal.length - 1; i += 2) {
            const v1 = Math.floor(Math.random() * 9) + 1;
            const v2 = 10 - v1;
            remainingNormal[i].value = v1;
            remainingNormal[i + 1].value = v2;
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
