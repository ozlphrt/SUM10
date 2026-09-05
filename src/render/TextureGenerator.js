import * as THREE from 'three';

// Cache generated textures by value and dimensions to avoid duplicate canvas creation
const textureCache = new Map();

// Pure Minimal White Shiny Plastic Domino Palette
export const DOMINO_THEME = {
    tileBase: '#ffffff',
    tileEdge: '#f4f4f5',
    tileBorder: '#e4e4e7',
    text: '#0f172a',
    groove: '#cbd5e1'
};

export const NUMBER_COLORS = {
    1: { bg: '#ffffff', border: '#e4e4e7', text: '#0f172a' },
    2: { bg: '#ffffff', border: '#e4e4e7', text: '#0f172a' },
    3: { bg: '#ffffff', border: '#e4e4e7', text: '#0f172a' },
    4: { bg: '#ffffff', border: '#e4e4e7', text: '#0f172a' },
    5: { bg: '#ffffff', border: '#e4e4e7', text: '#0f172a' },
    6: { bg: '#ffffff', border: '#e4e4e7', text: '#0f172a' },
    7: { bg: '#ffffff', border: '#e4e4e7', text: '#0f172a' },
    8: { bg: '#ffffff', border: '#e4e4e7', text: '#0f172a' },
    9: { bg: '#ffffff', border: '#e4e4e7', text: '#0f172a' }
};

/**
 * Creates or retrieves a procedural shiny domino plastic canvas texture
 * with molded divider grooves, debossed charcoal numerals, and specular highlight.
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

    // 1. Glossy White Domino Plastic Tile Body
    const bgGrad = ctx.createRadialGradient(
        width * 0.45, height * 0.45, Math.min(width, height) * 0.15,
        width * 0.5, height * 0.5, Math.max(width, height) * 0.75
    );
    bgGrad.addColorStop(0, '#ffffff');
    bgGrad.addColorStop(0.7, '#fafafa');
    bgGrad.addColorStop(1, '#f1f1f4');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Molded Domino Outer Border Inset
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#e4e4e7';
    ctx.strokeRect(4, 4, width - 8, height - 8);

    // 3. Molded Domino Cell Divider Grooves (for 2-cell and 3-cell blocks)
    if (cellsW > 1) {
        for (let i = 1; i < cellsW; i++) {
            const x = i * 256;
            // Recessed dark groove
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(x - 1, 8);
            ctx.lineTo(x - 1, height - 8);
            ctx.stroke();
            // Reflected highlight lip
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + 1, 8);
            ctx.lineTo(x + 1, height - 8);
            ctx.stroke();
        }
    }
    if (cellsH > 1) {
        for (let i = 1; i < cellsH; i++) {
            const y = i * 256;
            // Recessed dark groove
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(8, y - 1);
            ctx.lineTo(width - 8, y - 1);
            ctx.stroke();
            // Reflected highlight lip
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(8, y + 1);
            ctx.lineTo(width - 8, y + 1);
            ctx.stroke();
        }
    }

    if (type === 'bomb') {
        // SPECIAL DOMINO BOMB TILE (Charcoal & Metallic Crimson)
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 70, 0, Math.PI * 2);
        ctx.fillStyle = '#fee2e2';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ef4444';
        ctx.stroke();

        ctx.font = '76px "Segoe UI Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💣', width / 2, height / 2 + 4);
    } else if (type === 'wild') {
        // SPECIAL DOMINO WILDCARD TILE (Metallic Champagne Gold)
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 70, 0, Math.PI * 2);
        ctx.fillStyle = '#fef9c3';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#eab308';
        ctx.stroke();

        ctx.fillStyle = '#ca8a04';
        ctx.font = 'bold 92px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', width / 2, height / 2 + 2);
    } else {
        // PURE MINIMAL WHITE DOMINO (Debossed Dark Charcoal Numeral)
        // Subtle central debossed circular dish (classic domino spinner / pip well)
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 74, 0, Math.PI * 2);
        ctx.fillStyle = '#f8fafc';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#e2e8f0';
        ctx.stroke();

        // High-contrast engraved dark charcoal numeral
        ctx.fillStyle = '#0f172a';
        ctx.font = '900 114px "Outfit", "Inter", -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.22)';
        ctx.shadowBlur = 1;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 1.5;
        ctx.fillText(String(value), width / 2, height / 2 - 4);
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 0;
    }

    // Bidirectional molded indicator arrow
    ctx.save();
    let arrowX = width / 2;
    let arrowY = height - 34;
    let angle = 0;

    if (cellsH > cellsW) {
        angle = Math.PI / 2;
        arrowX = width / 2;
        arrowY = height / 2 + 104;
    } else {
        angle = (orientation === 'Z' && cellsW === 1 && cellsH === 1) ? Math.PI / 2 : 0;
    }

    ctx.translate(arrowX, arrowY);
    ctx.rotate(angle);

    ctx.fillStyle = '#64748b';
    ctx.globalAlpha = 0.50;

    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(9, -6);
    ctx.lineTo(9, -2.5);
    ctx.lineTo(-9, -2.5);
    ctx.lineTo(-9, -6);
    ctx.lineTo(-16, 0);
    ctx.lineTo(-9, 6);
    ctx.lineTo(-9, 2.5);
    ctx.lineTo(9, 2.5);
    ctx.lineTo(9, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 4. Polished Plastic Clearcoat Specular Sheen (simulated glossy light reflection across tile)
    const glossGrad = ctx.createLinearGradient(0, 0, width * 0.75, height * 0.75);
    glossGrad.addColorStop(0, 'rgba(255, 255, 255, 0.50)');
    glossGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.12)');
    glossGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
    ctx.fillStyle = glossGrad;
    ctx.fillRect(0, 0, width, height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    textureCache.set(key, texture);
    return texture;
}
