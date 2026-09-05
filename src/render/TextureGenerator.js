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
 * Creates or retrieves a procedural tactile pastel canvas texture with a single centered number
 * across the entire block face, plus subtle dashed cell segmentation dividers.
 * Supports special types: 'bomb' and 'wild'.
 * @param {number} value - Number from 1 to 9
 * @param {number} [cellsW=1] - Face width in cells (1, 2, or 3)
 * @param {number} [cellsH=1] - Face height in cells (1, 2, or 3)
 * @param {'X'|'Z'} [orientation='X']
 * @param {{x: number, y: number, z: number}} [direction]
 * @param {'normal'|'bomb'|'wild'} [type='normal']
 * @returns {THREE.CanvasTexture}
 */
export function getBlockTexture(value, cellsW = 1, cellsH = 1, orientation = 'X', direction = { x: 1, y: 0, z: 0 }, type = 'normal') {
    const dirKey = `${direction.x}_${direction.y}_${direction.z}`;
    const key = `${type}_${value}_${cellsW}x${cellsH}_${orientation}_${dirKey}`;
    if (textureCache.has(key)) return textureCache.get(key);

    const canvas = document.createElement('canvas');
    const width = 256 * cellsW;
    const height = 256 * cellsH;
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
        // TACTILE PASTEL MINIMAL 1-9 BLOCK (Single Centered Number)
        const palette = NUMBER_COLORS[value] || NUMBER_COLORS[1];

        // Base pastel matte fill across entire block
        ctx.fillStyle = palette.bg;
        ctx.fillRect(0, 0, width, height);

        // Soft outer perimeter bevel border
        ctx.lineWidth = 14;
        ctx.strokeStyle = palette.border;
        ctx.strokeRect(7, 7, width - 14, height - 14);

        // Subtle dashed unit cell divider lines
        if (cellsW > 1) {
            ctx.strokeStyle = palette.border;
            ctx.lineWidth = 3;
            for (let i = 1; i < cellsW; i++) {
                const x = i * 256;
                ctx.setLineDash([8, 8]);
                ctx.beginPath();
                ctx.moveTo(x, 14);
                ctx.lineTo(x, height - 14);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
        if (cellsH > 1) {
            ctx.strokeStyle = palette.border;
            ctx.lineWidth = 3;
            for (let i = 1; i < cellsH; i++) {
                const y = i * 256;
                ctx.setLineDash([8, 8]);
                ctx.beginPath();
                ctx.moveTo(14, y);
                ctx.lineTo(width - 14, y);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }

        // Single centered debossed circular badge
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 72, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.stroke();

        // Single centered large number
        ctx.fillStyle = palette.text;
        ctx.font = '800 106px "Outfit", "Inter", -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 1;
        ctx.fillText(String(value), width / 2, height / 2 - 4);
        ctx.shadowOffsetY = 0;
    }

    // Single centered bidirectional double-headed arrow icon
    ctx.save();
    let arrowX = width / 2;
    let arrowY = height - 34;
    let angle = 0;

    if (cellsH > cellsW) {
        // Vertical face along Z
        angle = Math.PI / 2;
        arrowX = width / 2;
        arrowY = height / 2 + 104;
    } else {
        // Horizontal face along X or square
        angle = (orientation === 'Z' && cellsW === 1 && cellsH === 1) ? Math.PI / 2 : 0;
    }

    ctx.translate(arrowX, arrowY);
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
