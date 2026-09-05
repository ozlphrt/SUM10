import * as THREE from 'three';

// Cache generated textures by value and dimensions to avoid duplicate canvas creation
const textureCache = new Map();

// Curated palette of harmonious block colors for numbers 1 to 9
export const NUMBER_COLORS = {
    1: { bg: '#2563eb', border: '#3b82f6', text: '#ffffff' }, // Deep Blue
    2: { bg: '#059669', border: '#10b981', text: '#ffffff' }, // Emerald Green
    3: { bg: '#d97706', border: '#f59e0b', text: '#ffffff' }, // Amber Orange
    4: { bg: '#dc2626', border: '#ef4444', text: '#ffffff' }, // Ruby Red
    5: { bg: '#7c3aed', border: '#8b5cf6', text: '#ffffff' }, // Royal Violet
    6: { bg: '#0891b2', border: '#06b6d4', text: '#ffffff' }, // Cyan Teal
    7: { bg: '#db2777', border: '#ec4899', text: '#ffffff' }, // Magenta Rose
    8: { bg: '#4f46e5', border: '#6366f1', text: '#ffffff' }, // Indigo
    9: { bg: '#ea580c', border: '#f97316', text: '#ffffff' }  // Vivid Tangerine
};

/**
 * Creates or retrieves a procedural high-contrast canvas texture with the block's number and exit direction.
 * @param {number} value - Number from 1 to 9
 * @param {number} length - Block length (1, 2, or 3 cells)
 * @param {'X'|'Z'|'Y'} orientation
 * @param {{x: number, y: number, z: number}} [direction]
 * @returns {THREE.CanvasTexture}
 */
export function getBlockTexture(value, length = 1, orientation = 'X', direction = { x: 1, y: 0, z: 0 }) {
    const dirKey = `${direction.x}_${direction.y}_${direction.z}`;
    const key = `${value}_${length}_${orientation}_${dirKey}`;
    if (textureCache.has(key)) return textureCache.get(key);

    const canvas = document.createElement('canvas');
    const width = 256;
    const height = 256;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const palette = NUMBER_COLORS[value] || NUMBER_COLORS[1];

    // Background base
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, width, height);

    // Inner bevel border
    ctx.lineWidth = 12;
    ctx.strokeStyle = palette.border;
    ctx.strokeRect(6, 6, width - 12, height - 12);

    // Subtle radial gradient for depth
    const grad = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width / 1.5);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
    ctx.fillStyle = grad;
    ctx.fillRect(12, 12, width - 24, height - 24);

    // Circular badge behind the number
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 70, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.stroke();

    // Large crisp typography for number
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 96px "Outfit", "Inter", -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    ctx.fillText(String(value), width / 2, height / 2 - 6);

    // Subtle arrow icon indicating sliding direction
    ctx.save();
    ctx.translate(width / 2, height - 36);

    let angle = 0;
    if (orientation === 'X') {
        angle = direction.x > 0 ? 0 : Math.PI;
    } else if (orientation === 'Z') {
        angle = direction.z > 0 ? Math.PI / 2 : -Math.PI / 2;
    } else {
        angle = direction.x > 0 ? 0 : (direction.x < 0 ? Math.PI : (direction.z > 0 ? Math.PI / 2 : -Math.PI / 2));
    }
    ctx.rotate(angle);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-6, -8);
    ctx.lineTo(-6, -3);
    ctx.lineTo(-14, -3);
    ctx.lineTo(-14, 3);
    ctx.lineTo(-6, 3);
    ctx.lineTo(-6, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    textureCache.set(key, texture);
    return texture;
}
