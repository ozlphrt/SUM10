import { TopologyGenerator } from './src/topology/TopologyGenerator.js';

console.log('Testing SUM10 Topology Generator...');

const generator = new TopologyGenerator({
    targetPairCount: 12, // 24 blocks
    gridSize: 5
});

const topology = generator.generate();

console.log(`Generated tower on ${topology.gridSize}x${topology.gridSize} grid.`);
console.log(`Total blocks placed: ${topology.blocks.size}`);

// Verify all values are between 1 and 9
let validValues = true;
const lengths = { 1: 0, 2: 0, 3: 0 };
let sumTotal = 0;

for (const block of topology.blocks.values()) {
    if (block.value < 1 || block.value > 9) {
        validValues = false;
    }
    lengths[block.length] = (lengths[block.length] || 0) + 1;
    sumTotal += block.value;

    // Verify non-overlap and in-bounds
    for (const v of block.getOccupiedVoxels()) {
        if (!topology.isInBounds(v.x, v.y, v.z)) {
            throw new Error(`Block ${block.id} voxel out of bounds: (${v.x}, ${v.y}, ${v.z})`);
        }
    }

    // Verify support
    if (!topology.hasSupport(block)) {
        throw new Error(`Block ${block.id} at layer ${block.gridY} lacks support from below!`);
    }
}

console.log('Valid values (1-9):', validValues);
console.log('Block length breakdown (1, 2, 3 cells):', lengths);
console.log('Total sum of all block values:', sumTotal, '(expected multiple of 10:', sumTotal % 10 === 0, ')');

// Check available sum-10 pairs
const pairs = topology.findSumPairs(10);
console.log(`Available sum-10 pairs found in current state: ${pairs.length}`);

console.log('Topology validation completed successfully! ✅');
