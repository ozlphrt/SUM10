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

        // Footprint voxels are the lowest Y slice of the block
        const footprint = [];
        if (block.orientation === 'Y') {
            footprint.push({ x: block.gridX, y: block.gridY, z: block.gridZ });
        } else {
            footprint.push(...block.getOccupiedVoxels());
        }

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
     * Checks if a block has an unobstructed path to slide out of the tower
     * along its assigned escape direction.
     * @param {BlockModel} block 
     * @returns {{canExit: boolean, stepsToExit: number}}
     */
    canBlockSlideOut(block) {
        const dir = block.direction;
        if (!dir || (dir.x === 0 && dir.y === 0 && dir.z === 0)) {
            return { canExit: false, stepsToExit: 0 };
        }

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
     * Clears all blocks and resets the grid.
     */
    clear() {
        this.blocks.clear();
        this.voxelMap.clear();
    }
}
