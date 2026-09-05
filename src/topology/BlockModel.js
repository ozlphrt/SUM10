/**
 * BlockModel: Represents a single, double, or triple cell block in 3D grid space.
 * Topology matches the Jarrows coordinate conventions.
 */
export class BlockModel {
    /**
     * @param {Object} options
     * @param {string|number} options.id - Unique block identifier
     * @param {number} options.value - Number on the block (1 to 9)
     * @param {number} options.length - Number of cells: 1 (single), 2 (double), or 3 (triple)
     * @param {'X'|'Z'|'Y'} options.orientation - 'X' (horizontal along X), 'Z' (horizontal along Z), 'Y' (vertical along Y)
     * @param {number} options.gridX - Starting X grid index
     * @param {number} options.gridY - Starting Y grid layer (0 = base ground)
     * @param {number} options.gridZ - Starting Z grid index
     * @param {{x: number, y: number, z: number}} [options.direction] - Sliding / escape direction
     * @param {'normal'|'bomb'|'wild'} [options.type='normal'] - Special block type
     */
    constructor({
        id,
        value,
        length = 1,
        orientation = 'X',
        gridX = 0,
        gridY = 0,
        gridZ = 0,
        direction = { x: 1, y: 0, z: 0 },
        type = 'normal'
    }) {
        this.id = id;
        this.value = value;
        this.length = Math.max(1, Math.min(3, length));
        this.orientation = orientation;
        this.gridX = gridX;
        this.gridY = gridY;
        this.gridZ = gridZ;
        this.direction = { ...direction };
        this.type = type; // 'normal', 'bomb', or 'wild'

        // State flags
        this.isRemoved = false;
        this.isSelected = false;
    }

    get isVertical() {
        return this.orientation === 'Y';
    }

    /**
     * Returns an array of discrete {x, y, z} grid coordinates occupied by this block.
     * @returns {Array<{x: number, y: number, z: number}>}
     */
    getOccupiedVoxels() {
        const voxels = [];
        for (let i = 0; i < this.length; i++) {
            if (this.orientation === 'X') {
                voxels.push({ x: this.gridX + i, y: this.gridY, z: this.gridZ });
            } else if (this.orientation === 'Z') {
                voxels.push({ x: this.gridX, y: this.gridY, z: this.gridZ + i });
            } else {
                // Vertical ('Y')
                voxels.push({ x: this.gridX, y: this.gridY + i, z: this.gridZ });
            }
        }
        return voxels;
    }

    /**
     * Calculates the geometric center of the block in 3D world space.
     * Centers the grid at (0, 0, 0) on the XZ plane.
     * @param {number} gridSize 
     * @param {number} cellSize 
     * @returns {{x: number, y: number, z: number}}
     */
    getWorldCenter(gridSize, cellSize = 1.0) {
        const halfGrid = (gridSize - 1) / 2;
        let cx = (this.gridX - halfGrid) * cellSize;
        let cy = (this.gridY + 0.5) * cellSize;
        let cz = (this.gridZ - halfGrid) * cellSize;

        if (this.orientation === 'X') {
            cx += ((this.length - 1) / 2) * cellSize;
        } else if (this.orientation === 'Z') {
            cz += ((this.length - 1) / 2) * cellSize;
        } else if (this.orientation === 'Y') {
            cy += ((this.length - 1) / 2) * cellSize;
        }

        return { x: cx, y: cy, z: cz };
    }

    /**
     * Calculates the dimensional size of the block in world units.
     * @param {number} cellSize 
     * @returns {{width: number, height: number, depth: number}}
     */
    getWorldDimensions(cellSize = 1.0) {
        if (this.orientation === 'X') {
            return { width: this.length * cellSize, height: cellSize, depth: cellSize };
        } else if (this.orientation === 'Z') {
            return { width: cellSize, height: cellSize, depth: this.length * cellSize };
        } else {
            return { width: cellSize, height: this.length * cellSize, depth: cellSize };
        }
    }
}
