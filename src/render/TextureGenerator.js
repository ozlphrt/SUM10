import * as THREE from 'three';

// Cache generated textures by value and dimensions to avoid duplicate canvas creation
const textureCache = new Map();

// Curated Scandinavian Tactile Pastel palette for numbers 1 to 9
export const NUMBER_COLORS = {
    1: { bg: '#a7f3d0', border: '#6ee7b7', text: '#065f46' }, // Soft Mint
    2: { bg: '#fecdd3', border: '#fda4af', text: '#9f1239' }, // Gentle Rose
    3: { bg: '#fef08a', border: '#fde047', text: '#854d0e' }, // Warm Buttercup
    4: { bg: '#bae6fd', border: '#7dd3fc', text: '#0369a1' }, // Powder Blue
    5: { bg: '#e9d5ff', border: '#d8b4fe', text: '#6b21a8' }, // Soft Lilac
    6: { bg: '#fed7aa', border: '#fdba74', text: '#9a3412' }, // Pale Apricot
    7: { bg: '#99f6e4', border: '#5eead4', text: '#115e59' }, // Seafoam
    8: { bg: '#fbcfe8', border: '#f472b6', text: '#831843' }, // Soft Orchid
    9: { bg: '#c7d2fe', border: '#a5b4fc', text: '#3730a3' }  // Periwinkle
};

/**
 * Creates or retrieves a procedural tactile pastel canvas texture with the block's number and exit direction.
 * Supports special types: 'bomb' and 'wild'.
 * @param {number} value - Number from 1 to 9
 * @param {number} length - Block length (1, 2, or 3 cells)
 * @param {'X'|'Z'|'Y'} orientation
 * @param {{x: number, y: number, z: number}} [direction]
 * @param {'normal'|'bomb'|'wild'} [type='normal']
 * @returns {THREE.CanvasTexture}
 */
export function getBlockTexture(value, length = 1, orientation = 'X', direction = { x: 1, y: 0, z: 0 }, type = 'normal') {
    const dirKey = `${direction.x}_${direction.y}_${direction.z}`;
    const key = `${type}_${value}_${length}_${orientation}_${dirKey}`;
    if (textureCache.has(key)) return textureCache.get(key);

    const canvas = document.createElement('canvas');
    const width = 256;
    const height = 256;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (type === 'bomb') {
        // TACTILE MUTED TERRACOTTA BOMB
        ctx.fillStyle = '#fca5a5';
        ctx.fillRect(0, 0, width, height);

        // Soft matte border
        ctx.lineWidth = 14;
        ctx.strokeStyle = '#f87171';
        ctx.strokeRect(7, 7, width - 14, height - 14);

        // Inset soft disc
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 68, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#f87171';
        ctx.stroke();

        ctx.font = '72px "Segoe UI Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💣', width / 2, height / 2 + 4);
    } else if (type === 'wild') {
        // TACTILE CREAM & GOLDEN CHAMPAGNE WILDCARD
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#fef9c3');
        grad.addColorStop(1, '#fde047');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        ctx.lineWidth = 14;
        ctx.strokeStyle = '#facc15';
        ctx.strokeRect(7, 7, width - 14, height - 14);

        // Central soft inset star badge
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 68, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#eab308';
        ctx.stroke();

        ctx.fillStyle = '#ca8a04';
        ctx.font = 'bold 88px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', width / 2, height / 2 + 2);
    } else {
        // TACTILE PASTEL MINIMAL 1-9 BLOCK
        const palette = NUMBER_COLORS[value] || NUMBER_COLORS[1];

        // Base pastel matte fill
        ctx.fillStyle = palette.bg;
        ctx.fillRect(0, 0, width, height);

        // Soft outer bevel border
        ctx.lineWidth = 14;
        ctx.strokeStyle = palette.border;
        ctx.strokeRect(7, 7, width - 14, height - 14);

        // Debossed central circular inset with subtle tactile drop shadow
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 70, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.stroke();

        // High-contrast, elegant typography
        ctx.fillStyle = palette.text;
        ctx.font = '800 100px "Outfit", "Inter", -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 1; // Subtle letterpress emboss effect
        ctx.fillText(String(value), width / 2, height / 2 - 4);
        ctx.shadowOffsetY = 0;
    }

    // Bidirectional double-headed arrow icon indicating sliding along long axis
    ctx.save();
    ctx.translate(width / 2, height - 34);

    const angle = (orientation === 'Z') ? Math.PI / 2 : 0;
    ctx.rotate(angle);

    const arrowColor = (type === 'normal' && NUMBER_COLORS[value]) ? NUMBER_COLORS[value].text : '#475569';
    ctx.fillStyle = arrowColor;
    ctx.globalAlpha = 0.55;

    ctx.beginPath();
    // Right arrowhead (+ direction)
    ctx.moveTo(16, 0);
    ctx.lineTo(9, -6);
    ctx.lineTo(9, -2.5);
    // Shaft connecting arrows
    ctx.lineTo(-9, -2.5);
    // Left arrowhead (- direction)
    ctx.lineTo(-9, -6);
    ctx.lineTo(-16, 0);
    ctx.lineTo(-9, 6);
    ctx.lineTo(-9, 2.5);
    // Shaft return
    ctx.lineTo(9, 2.5);
    // Right arrowhead return
    ctx.lineTo(9, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    textureCache.set(key, texture);
    return texture;
}
