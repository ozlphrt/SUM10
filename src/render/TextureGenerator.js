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

// 2. Shape Theme Palettes (Deep Obsidian/Sapphire/Emerald/Amber/Amethyst/Platinum/Cyan Luxury Gradients)
export const SHAPE_PALETTES = {
    circle: {
        main: ['#3b82f6', '#1d4ed8', '#0f172a'],
        glow: 'rgba(59, 130, 246, 0.45)',
        accent: '#93c5fd',
        name: 'Celestial Orb'
    },
    triangle: {
        main: ['#10b981', '#047857', '#064e3b'],
        glow: 'rgba(16, 185, 129, 0.45)',
        accent: '#6ee7b7',
        name: 'Emerald Prism'
    },
    square: {
        main: ['#8b5cf6', '#6d28d9', '#4c1d95'],
        glow: 'rgba(139, 92, 246, 0.45)',
        accent: '#c4b5fd',
        name: 'Amethyst Vault'
    },
    diamond: {
        main: ['#06b6d4', '#0891b2', '#164e63'],
        glow: 'rgba(6, 182, 212, 0.45)',
        accent: '#a5f3fc',
        name: 'Cyan Diamond'
    },
    star: {
        main: ['#f59e0b', '#d97706', '#78350f'],
        glow: 'rgba(245, 158, 11, 0.50)',
        accent: '#fde68a',
        name: 'Solar Star'
    },
    hexagon: {
        main: ['#64748b', '#475569', '#1e293b'],
        glow: 'rgba(100, 116, 139, 0.45)',
        accent: '#cbd5e1',
        name: 'Platinum Crest'
    },
    crescent: {
        main: ['#38bdf8', '#0284c7', '#082f49'],
        glow: 'rgba(56, 189, 248, 0.50)',
        accent: '#e0f2fe',
        name: 'Lunar Crescent'
    },
    pentagon: {
        main: ['#14b8a6', '#0f766e', '#134e4a'],
        glow: 'rgba(20, 184, 166, 0.45)',
        accent: '#99f6e4',
        name: 'Aegis Shield'
    },
    cross: {
        main: ['#475569', '#334155', '#0f172a'],
        glow: 'rgba(71, 85, 105, 0.50)',
        accent: '#94a3b8',
        name: 'Nordic Cross'
    },
    ring: {
        main: ['#eab308', '#ca8a04', '#713f12'],
        glow: 'rgba(234, 179, 8, 0.50)',
        accent: '#fef08a',
        name: 'Eternity Ring'
    },
    octagon: {
        main: ['#0284c7', '#0369a1', '#0c4a6e'],
        glow: 'rgba(2, 132, 199, 0.45)',
        accent: '#bae6fd',
        name: 'Cobalt Octagon'
    },
    heart: {
        main: ['#6366f1', '#4f46e5', '#312e81'],
        glow: 'rgba(99, 102, 241, 0.45)',
        accent: '#c7d2fe',
        name: 'Indigo Heart'
    },
    clover: {
        main: ['#059669', '#047857', '#064e3b'],
        glow: 'rgba(5, 150, 105, 0.45)',
        accent: '#a7f3d0',
        name: 'Verdant Clover'
    },
    infinity: {
        main: ['#7c3aed', '#6d28d9', '#2e1065'],
        glow: 'rgba(124, 58, 237, 0.45)',
        accent: '#ddd6fe',
        name: 'Infinity Loop'
    },
    spiral: {
        main: ['#0ea5e9', '#0284c7', '#075985'],
        glow: 'rgba(14, 165, 233, 0.45)',
        accent: '#bae6fd',
        name: 'Mystic Spiral'
    },
    hourglass: {
        main: ['#d97706', '#b45309', '#451a03'],
        glow: 'rgba(217, 119, 6, 0.45)',
        accent: '#fde68a',
        name: 'Chrono Hourglass'
    },
    teardrop: {
        main: ['#2563eb', '#1d4ed8', '#1e3a8a'],
        glow: 'rgba(37, 99, 235, 0.45)',
        accent: '#bfdbfe',
        name: 'Azure Teardrop'
    },
    shield: {
        main: ['#334155', '#1e293b', '#0f172a'],
        glow: 'rgba(51, 65, 85, 0.50)',
        accent: '#cbd5e1',
        name: 'Obsidian Shield'
    },
    compass: {
        main: ['#d97706', '#92400e', '#451a03'],
        glow: 'rgba(217, 119, 6, 0.45)',
        accent: '#fde68a',
        name: 'Runic Compass'
    },
    rhombus: {
        main: ['#0d9488', '#0f766e', '#115e59'],
        glow: 'rgba(13, 148, 136, 0.45)',
        accent: '#99f6e4',
        name: 'Teal Rhombus'
    },
    triskelion: {
        main: ['#4f46e5', '#4338ca', '#1e1b4b'],
        glow: 'rgba(79, 70, 229, 0.45)',
        accent: '#c7d2fe',
        name: 'Celtic Triskelion'
    },
    prism: {
        main: ['#0284c7', '#0369a1', '#075985'],
        glow: 'rgba(2, 132, 199, 0.45)',
        accent: '#e0f2fe',
        name: 'Ice Prism'
    },
    pillar: {
        main: ['#475569', '#334155', '#1e293b'],
        glow: 'rgba(71, 85, 105, 0.45)',
        accent: '#e2e8f0',
        name: 'Nordic Pillar'
    },
    vortex: {
        main: ['#10b981', '#059669', '#022c22'],
        glow: 'rgba(16, 185, 129, 0.45)',
        accent: '#a7f3d0',
        name: 'Emerald Vortex'
    }
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
export function getBlockTexture(value, cellsW = 1, cellsH = 1, orientation = 'X', direction = { x: 1, y: 0, z: 0 }, type = 'normal', isTopFace = false) {
    const dirKey = `${direction.x}_${direction.y}_${direction.z}`;
    const key = `${type}_${value}_${cellsW}x${cellsH}_${orientation}_${dirKey}_${isTopFace ? 'top' : 'side'}`;
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

    ctx.save();

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
    } else if (typeof value === 'string' && [
        'circle', 'triangle', 'square', 'diamond', 'star',
        'hexagon', 'crescent', 'pentagon', 'cross', 'ring',
        'octagon', 'heart', 'clover', 'infinity', 'spiral',
        'hourglass', 'teardrop', 'shield', 'compass', 'rhombus',
        'triskelion', 'prism', 'pillar', 'vortex'
    ].includes(value)) {
        // LUXURY JEWELED RUNIC EMBLEMS (24 High-detail layered geometric medallions, metallic sheen, facet depth)
        const cx = width / 2;
        const cy = height / 2;

        // 1. Outer Inset Medallion Well with Subtle Bevel
        ctx.beginPath();
        ctx.arc(cx, cy, 84, 0, Math.PI * 2);
        const wellGrad = ctx.createRadialGradient(cx - 15, cy - 20, 20, cx, cy, 84);
        wellGrad.addColorStop(0, '#f8fafc');
        wellGrad.addColorStop(0.85, '#f1f5f9');
        wellGrad.addColorStop(1, '#e2e8f0');
        ctx.fillStyle = wellGrad;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#cbd5e1';
        ctx.stroke();

        // Delicate concentric decorative ring
        ctx.beginPath();
        ctx.arc(cx, cy, 78, 0, Math.PI * 2);
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
        ctx.stroke();

        const theme = SHAPE_PALETTES[value] || SHAPE_PALETTES.circle;

        // Shadow & ambient glow beneath emblem
        ctx.shadowColor = theme.glow;
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 4;

        if (value === 'circle') {
            // LAYERED CELESTIAL ORB: Outer engraved ring + Inner dimensional gradient sphere + Orbital ring
            // Primary Sphere
            const orbGrad = ctx.createRadialGradient(cx - 18, cy - 20, 6, cx, cy, 58);
            orbGrad.addColorStop(0, '#60a5fa');
            orbGrad.addColorStop(0.45, theme.main[0]);
            orbGrad.addColorStop(0.85, theme.main[1]);
            orbGrad.addColorStop(1, theme.main[2]);

            ctx.beginPath();
            ctx.arc(cx, cy, 56, 0, Math.PI * 2);
            ctx.fillStyle = orbGrad;
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;

            // Specular Glint
            const glint = ctx.createRadialGradient(cx - 18, cy - 20, 0, cx - 18, cy - 20, 26);
            glint.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
            glint.addColorStop(0.5, 'rgba(255, 255, 255, 0.25)');
            glint.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.beginPath();
            ctx.arc(cx - 18, cy - 20, 26, 0, Math.PI * 2);
            ctx.fillStyle = glint;
            ctx.fill();

            // Concentric Golden/Silver Core Ring
            ctx.beginPath();
            ctx.arc(cx, cy, 32, 0, Math.PI * 2);
            ctx.lineWidth = 3.5;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
            ctx.stroke();

            // Center Pip
            ctx.beginPath();
            ctx.arc(cx, cy, 10, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();

        } else if (value === 'triangle') {
            // EMERALD PRISM: Multi-faceted 3D triangular pyramid with facet shading
            const top = { x: cx, y: cy - 62 };
            const br = { x: cx + 58, y: cy + 46 };
            const bl = { x: cx - 58, y: cy + 46 };
            const centerPt = { x: cx, y: cy + 4 };

            // Left Facet
            const leftGrad = ctx.createLinearGradient(bl.x, bl.y, top.x, top.y);
            leftGrad.addColorStop(0, theme.main[1]);
            leftGrad.addColorStop(1, '#34d399');
            ctx.beginPath();
            ctx.moveTo(top.x, top.y);
            ctx.lineTo(centerPt.x, centerPt.y);
            ctx.lineTo(bl.x, bl.y);
            ctx.closePath();
            ctx.fillStyle = leftGrad;
            ctx.fill();

            // Right Facet (Darker shading)
            const rightGrad = ctx.createLinearGradient(centerPt.x, centerPt.y, br.x, br.y);
            rightGrad.addColorStop(0, '#059669');
            rightGrad.addColorStop(1, theme.main[2]);
            ctx.beginPath();
            ctx.moveTo(top.x, top.y);
            ctx.lineTo(br.x, br.y);
            ctx.lineTo(centerPt.x, centerPt.y);
            ctx.closePath();
            ctx.fillStyle = rightGrad;
            ctx.fill();

            // Bottom Facet
            const bottomGrad = ctx.createLinearGradient(bl.x, bl.y, br.x, br.y);
            bottomGrad.addColorStop(0, '#10b981');
            bottomGrad.addColorStop(1, '#047857');
            ctx.beginPath();
            ctx.moveTo(bl.x, bl.y);
            ctx.lineTo(centerPt.x, centerPt.y);
            ctx.lineTo(br.x, br.y);
            ctx.closePath();
            ctx.fillStyle = bottomGrad;
            ctx.fill();

            // Gold/Silver Facet Ridge Lines
            ctx.beginPath();
            ctx.moveTo(top.x, top.y); ctx.lineTo(bl.x, bl.y); ctx.lineTo(br.x, br.y); ctx.closePath();
            ctx.moveTo(top.x, top.y); ctx.lineTo(centerPt.x, centerPt.y);
            ctx.moveTo(bl.x, bl.y); ctx.lineTo(centerPt.x, centerPt.y);
            ctx.moveTo(br.x, br.y); ctx.lineTo(centerPt.x, centerPt.y);
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.80)';
            ctx.stroke();

            // Inner Floating Triangle Glyph
            ctx.beginPath();
            ctx.moveTo(cx, cy - 22);
            ctx.lineTo(cx + 20, cy + 18);
            ctx.lineTo(cx - 20, cy + 18);
            ctx.closePath();
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

        } else if (value === 'square') {
            // AMETHYST VAULT: Rotated square in square with rich royal purple gem bevels
            const s = 54;
            const sqGrad = ctx.createLinearGradient(cx - s, cy - s, cx + s, cy + s);
            sqGrad.addColorStop(0, '#a78bfa');
            sqGrad.addColorStop(0.4, theme.main[0]);
            sqGrad.addColorStop(1, theme.main[2]);

            // Outer Rounded Square
            ctx.beginPath();
            ctx.roundRect(cx - s, cy - s, s * 2, s * 2, 14);
            ctx.fillStyle = sqGrad;
            ctx.fill();

            // Bevel highlight border
            ctx.lineWidth = 3.5;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
            ctx.stroke();

            // Inner Inset Rotated Square (Diamond orientation)
            const is = 32;
            ctx.beginPath();
            ctx.moveTo(cx, cy - is);
            ctx.lineTo(cx + is, cy);
            ctx.lineTo(cx, cy + is);
            ctx.lineTo(cx - is, cy);
            ctx.closePath();
            ctx.fillStyle = 'rgba(15, 23, 42, 0.40)';
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

            // Central Core Pip
            ctx.beginPath();
            ctx.roundRect(cx - 9, cy - 9, 18, 18, 4);
            ctx.fillStyle = '#ffffff';
            ctx.fill();

        } else if (value === 'diamond') {
            // CYAN BRILLIANT DIAMOND: Gemological brilliant facet structure
            const dw = 52;
            const dh = 65;

            // Outer Diamond Contour
            const diaGrad = ctx.createLinearGradient(cx, cy - dh, cx, cy + dh);
            diaGrad.addColorStop(0, '#67e8f9');
            diaGrad.addColorStop(0.5, theme.main[0]);
            diaGrad.addColorStop(1, theme.main[2]);

            ctx.beginPath();
            ctx.moveTo(cx, cy - dh);
            ctx.lineTo(cx + dw, cy);
            ctx.lineTo(cx, cy + dh);
            ctx.lineTo(cx - dw, cy);
            ctx.closePath();
            ctx.fillStyle = diaGrad;
            ctx.fill();

            // Facet Shading & Cross-bracing
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.stroke();

            // Inner Facet Kite
            const idw = 26;
            const idh = 34;
            ctx.beginPath();
            ctx.moveTo(cx, cy - idh);
            ctx.lineTo(cx + idw, cy);
            ctx.lineTo(cx, cy + idh);
            ctx.lineTo(cx - idw, cy);
            ctx.closePath();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.fill();
            ctx.stroke();

            // Connecting facet rays
            ctx.beginPath();
            ctx.moveTo(cx, cy - dh); ctx.lineTo(cx, cy - idh);
            ctx.moveTo(cx + dw, cy); ctx.lineTo(cx + idw, cy);
            ctx.moveTo(cx, cy + dh); ctx.lineTo(cx, cy + idh);
            ctx.moveTo(cx - dw, cy); ctx.lineTo(cx - idw, cy);
            ctx.lineWidth = 2;
            ctx.stroke();

        } else if (value === 'star') {
            // SOLAR STAR OF POWER: 8-point faceted compass star with golden aura
            const outerR = 64;
            const innerR = 26;
            const points = 8;
            let rot = (Math.PI / 2) * 3;
            const step = Math.PI / points;

            // Background Star Fill with Gold Radiant Gradient
            const starGrad = ctx.createRadialGradient(cx, cy, 8, cx, cy, outerR);
            starGrad.addColorStop(0, '#fef08a');
            starGrad.addColorStop(0.4, theme.main[0]);
            starGrad.addColorStop(1, theme.main[2]);

            ctx.beginPath();
            ctx.moveTo(cx, cy - outerR);
            for (let i = 0; i < points; i++) {
                let x = cx + Math.cos(rot) * outerR;
                let y = cy + Math.sin(rot) * outerR;
                ctx.lineTo(x, y);
                rot += step;
                x = cx + Math.cos(rot) * innerR;
                y = cy + Math.sin(rot) * innerR;
                ctx.lineTo(x, y);
                rot += step;
            }
            ctx.lineTo(cx, cy - outerR);
            ctx.closePath();
            ctx.fillStyle = starGrad;
            ctx.fill();

            // Crisp Rim & Facet Rays to every tip
            ctx.lineWidth = 2.8;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

            ctx.beginPath();
            for (let i = 0; i < points; i++) {
                const angle = (Math.PI / (points / 2)) * i - Math.PI / 2;
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
            }
            ctx.lineWidth = 1.8;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.70)';
            ctx.stroke();

            // Golden Center Jewel Core
            ctx.beginPath();
            ctx.arc(cx, cy, 14, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#d97706';
            ctx.stroke();

        } else if (value === 'hexagon') {
            // PLATINUM CREST: Honeycomb faceted medallion with concentric inscribed hex and core shield
            const hexR = 60;
            const hexGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, hexR);
            hexGrad.addColorStop(0, '#94a3b8');
            hexGrad.addColorStop(0.5, theme.main[0]);
            hexGrad.addColorStop(1, theme.main[2]);

            // Outer Hexagon
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i - Math.PI / 6;
                const hx = cx + hexR * Math.cos(angle);
                const hy = cy + hexR * Math.sin(angle);
                if (i === 0) ctx.moveTo(hx, hy);
                else ctx.lineTo(hx, hy);
            }
            ctx.closePath();
            ctx.fillStyle = hexGrad;
            ctx.fill();
            ctx.lineWidth = 3.5;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.stroke();

            // Inner Hexagon
            const inHexR = 34;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i - Math.PI / 6;
                const hx = cx + inHexR * Math.cos(angle);
                const hy = cy + inHexR * Math.sin(angle);
                if (i === 0) ctx.moveTo(hx, hy);
                else ctx.lineTo(hx, hy);
            }
            ctx.closePath();
            ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
            ctx.fill();
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

            // Radial Spokes from Center to Hex Vertices
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i - Math.PI / 6;
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx + hexR * Math.cos(angle), cy + hexR * Math.sin(angle));
            }
            ctx.lineWidth = 1.6;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.60)';
            ctx.stroke();

            // Center Ruby Gem
            ctx.beginPath();
            ctx.arc(cx, cy, 11, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();

        } else if (value === 'crescent') {
            // LUNAR CRESCENT: Dimensional glowing celestial crescent moon
            const moonGrad = ctx.createLinearGradient(cx - 50, cy - 50, cx + 50, cy + 50);
            moonGrad.addColorStop(0, '#7dd3fc');
            moonGrad.addColorStop(0.5, theme.main[0]);
            moonGrad.addColorStop(1, theme.main[2]);

            ctx.save();
            ctx.beginPath();
            ctx.arc(cx - 6, cy, 58, 0, Math.PI * 2);
            ctx.fillStyle = moonGrad;
            ctx.fill();

            // Subtract inner sphere to form crescent
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(cx + 26, cy - 10, 48, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Metallic Edge Rim
            ctx.beginPath();
            ctx.arc(cx - 6, cy, 58, -Math.PI * 0.42, Math.PI * 0.48);
            ctx.lineWidth = 3.5;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.90)';
            ctx.stroke();

            // Accompanying tiny star diamond
            ctx.beginPath();
            const sx = cx + 22;
            const sy = cy - 4;
            ctx.moveTo(sx, sy - 14);
            ctx.lineTo(sx + 10, sy);
            ctx.lineTo(sx, sy + 14);
            ctx.lineTo(sx - 10, sy);
            ctx.closePath();
            ctx.fillStyle = '#ffffff';
            ctx.fill();

        } else if (value === 'pentagon') {
            // AEGIS SHIELD (Pentagon): 5-sided heraldic guardian prism
            const pentR = 60;
            const pentGrad = ctx.createLinearGradient(cx, cy - pentR, cx, cy + pentR);
            pentGrad.addColorStop(0, '#2dd4bf');
            pentGrad.addColorStop(0.5, theme.main[0]);
            pentGrad.addColorStop(1, theme.main[2]);

            // Outer Pentagon
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
                const px = cx + pentR * Math.cos(angle);
                const py = cy + pentR * Math.sin(angle);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fillStyle = pentGrad;
            ctx.fill();
            ctx.lineWidth = 3.5;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.stroke();

            // Inner Inset Pentagon
            const inPentR = 34;
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
                const px = cx + inPentR * Math.cos(angle);
                const py = cy + inPentR * Math.sin(angle);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
            ctx.fill();
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

            // Facet ridge lines to center
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx + pentR * Math.cos(angle), cy + pentR * Math.sin(angle));
            }
            ctx.lineWidth = 1.6;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.60)';
            ctx.stroke();

            // Center Diamond Core
            ctx.beginPath();
            ctx.arc(cx, cy, 10, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();

        } else if (value === 'cross') {
            // NORDIC CROSS: 4-way heraldic titanium cross with flared beveled arms
            const armL = 58;
            const armW = 16;
            const flare = 26;

            const crossGrad = ctx.createRadialGradient(cx, cy, 6, cx, cy, armL);
            crossGrad.addColorStop(0, '#64748b');
            crossGrad.addColorStop(0.5, theme.main[0]);
            crossGrad.addColorStop(1, theme.main[2]);

            ctx.beginPath();
            // Top arm
            ctx.moveTo(cx - armW, cy - armW);
            ctx.lineTo(cx - flare, cy - armL);
            ctx.lineTo(cx + flare, cy - armL);
            ctx.lineTo(cx + armW, cy - armW);
            // Right arm
            ctx.lineTo(cx + armL, cy - flare);
            ctx.lineTo(cx + armL, cy + flare);
            ctx.lineTo(cx + armW, cy + armW);
            // Bottom arm
            ctx.lineTo(cx + flare, cy + armL);
            ctx.lineTo(cx - flare, cy + armL);
            ctx.lineTo(cx - armW, cy + armW);
            // Left arm
            ctx.lineTo(cx - armL, cy + flare);
            ctx.lineTo(cx - armL, cy - flare);
            ctx.closePath();

            ctx.fillStyle = crossGrad;
            ctx.fill();
            ctx.lineWidth = 3.5;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.90)';
            ctx.stroke();

            // Inner Accent Rhombus
            ctx.beginPath();
            ctx.moveTo(cx, cy - 20);
            ctx.lineTo(cx + 20, cy);
            ctx.lineTo(cx, cy + 20);
            ctx.lineTo(cx - 20, cy);
            ctx.closePath();
            ctx.fillStyle = '#ffffff';
            ctx.fill();

        } else if (value === 'ring') {
            // ETERNITY RING: Interlocking concentric golden hoops with bezel jewels
            const ringR = 56;
            const ringThick = 18;

            const ringGrad = ctx.createRadialGradient(cx, cy, ringR - ringThick, cx, cy, ringR);
            ringGrad.addColorStop(0, '#fef08a');
            ringGrad.addColorStop(0.5, theme.main[0]);
            ringGrad.addColorStop(1, theme.main[2]);

            // Outer Donut Hoop
            ctx.beginPath();
            ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
            ctx.arc(cx, cy, ringR - ringThick, 0, Math.PI * 2, true);
            ctx.fillStyle = ringGrad;
            ctx.fill();

            // Crisp Rim Lines
            ctx.beginPath();
            ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(cx, cy, ringR - ringThick, 0, Math.PI * 2);
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.stroke();

            // 4 Cardinal Pearl Pips on Ring
            for (let i = 0; i < 4; i++) {
                const angle = (Math.PI / 2) * i;
                const dist = ringR - ringThick / 2;
                const px = cx + dist * Math.cos(angle);
                const py = cy + dist * Math.sin(angle);
                ctx.beginPath();
                ctx.arc(px, py, 6, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
            }

            // Central Floating Core Pip
            ctx.beginPath();
            ctx.arc(cx, cy, 14, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#ca8a04';
            ctx.stroke();

        } else if (value === 'octagon') {
            // COBALT OCTAGON: 8-sided faceted imperial stop gem
            const octR = 60;
            const octGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, octR);
            octGrad.addColorStop(0, '#38bdf8');
            octGrad.addColorStop(0.5, theme.main[0]);
            octGrad.addColorStop(1, theme.main[2]);

            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI / 4) * i - Math.PI / 8;
                const ox = cx + octR * Math.cos(angle);
                const oy = cy + octR * Math.sin(angle);
                if (i === 0) ctx.moveTo(ox, oy);
                else ctx.lineTo(ox, oy);
            }
            ctx.closePath();
            ctx.fillStyle = octGrad;
            ctx.fill();
            ctx.lineWidth = 3.5;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.stroke();

            // Inner Octagon Inset
            const inR = 32;
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI / 4) * i - Math.PI / 8;
                const ox = cx + inR * Math.cos(angle);
                const oy = cy + inR * Math.sin(angle);
                if (i === 0) ctx.moveTo(ox, oy);
                else ctx.lineTo(ox, oy);
            }
            ctx.closePath();
            ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

            // Core Pearl
            ctx.beginPath();
            ctx.arc(cx, cy, 9, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();

        } else if (value === 'heart') {
            // INDIGO HEART: Bevelled royal gem heart
            const heartGrad = ctx.createLinearGradient(cx, cy - 50, cx, cy + 50);
            heartGrad.addColorStop(0, '#818cf8');
            heartGrad.addColorStop(0.5, theme.main[0]);
            heartGrad.addColorStop(1, theme.main[2]);

            ctx.beginPath();
            ctx.moveTo(cx, cy + 46);
            ctx.bezierCurveTo(cx - 65, cy + 10, cx - 65, cy - 45, cx, cy - 18);
            ctx.bezierCurveTo(cx + 65, cy - 45, cx + 65, cy + 10, cx, cy + 46);
            ctx.closePath();
            ctx.fillStyle = heartGrad;
            ctx.fill();
            ctx.lineWidth = 3.5;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.stroke();

            // Inner Core Accent
            ctx.beginPath();
            ctx.moveTo(cx, cy + 22);
            ctx.bezierCurveTo(cx - 30, cy + 4, cx - 30, cy - 22, cx, cy - 8);
            ctx.bezierCurveTo(cx + 30, cy - 22, cx + 30, cy + 4, cx, cy + 22);
            ctx.closePath();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.30)';
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

        } else if (value === 'clover') {
            // VERDANT CLOVER: 4-leaf heraldic talisman
            const r = 26;
            const dist = 22;
            const offsets = [
                { x: 0, y: -dist },
                { x: dist, y: 0 },
                { x: 0, y: dist },
                { x: -dist, y: 0 }
            ];

            const cloverGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 58);
            cloverGrad.addColorStop(0, '#34d399');
            cloverGrad.addColorStop(0.6, theme.main[0]);
            cloverGrad.addColorStop(1, theme.main[2]);

            for (const off of offsets) {
                ctx.beginPath();
                ctx.arc(cx + off.x, cy + off.y, r, 0, Math.PI * 2);
                ctx.fillStyle = cloverGrad;
                ctx.fill();
                ctx.lineWidth = 2.5;
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.80)';
                ctx.stroke();
            }

            // Center Gold Diamond
            ctx.beginPath();
            ctx.moveTo(cx, cy - 14);
            ctx.lineTo(cx + 14, cy);
            ctx.lineTo(cx, cy + 14);
            ctx.lineTo(cx - 14, cy);
            ctx.closePath();
            ctx.fillStyle = '#ffffff';
            ctx.fill();

        } else if (value === 'infinity') {
            // INFINITY LOOP: Figure-8 mobius strip
            ctx.save();
            ctx.translate(cx, cy);
            const infGrad = ctx.createLinearGradient(-50, 0, 50, 0);
            infGrad.addColorStop(0, '#a855f7');
            infGrad.addColorStop(0.5, theme.main[0]);
            infGrad.addColorStop(1, theme.main[2]);

            // Left loop
            ctx.beginPath();
            ctx.arc(-26, 0, 24, 0, Math.PI * 2);
            ctx.lineWidth = 14;
            ctx.strokeStyle = infGrad;
            ctx.stroke();

            // Right loop
            ctx.beginPath();
            ctx.arc(26, 0, 24, 0, Math.PI * 2);
            ctx.lineWidth = 14;
            ctx.strokeStyle = infGrad;
            ctx.stroke();

            // Outer highlight rims
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-26, 0, 31, 0, Math.PI * 2);
            ctx.arc(-26, 0, 17, 0, Math.PI * 2);
            ctx.arc(26, 0, 31, 0, Math.PI * 2);
            ctx.arc(26, 0, 17, 0, Math.PI * 2);
            ctx.stroke();

            // Center core
            ctx.beginPath();
            ctx.arc(0, 0, 7, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.restore();

        } else if (value === 'spiral') {
            // MYSTIC SPIRAL: Archimedean celestial spiral galaxy
            const spiralGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 60);
            spiralGrad.addColorStop(0, '#38bdf8');
            spiralGrad.addColorStop(0.5, theme.main[0]);
            spiralGrad.addColorStop(1, theme.main[2]);

            ctx.beginPath();
            ctx.arc(cx, cy, 58, 0, Math.PI * 2);
            ctx.fillStyle = spiralGrad;
            ctx.fill();
            ctx.lineWidth = 3.5;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.stroke();

            // Intertwined spirals
            ctx.beginPath();
            for (let a = 0; a < Math.PI * 4; a += 0.1) {
                const r = 8 + a * 3.6;
                const x = cx + r * Math.cos(a);
                const y = cy + r * Math.sin(a);
                if (a === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.lineWidth = 3.5;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(cx, cy, 10, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();

        } else if (value === 'hourglass') {
            // CHRONO HOURGLASS: Double triangular time facet
            const hgGrad = ctx.createLinearGradient(cx, cy - 56, cx, cy + 56);
            hgGrad.addColorStop(0, '#fbbf24');
            hgGrad.addColorStop(0.5, theme.main[0]);
            hgGrad.addColorStop(1, theme.main[2]);

            ctx.beginPath();
            ctx.moveTo(cx - 42, cy - 54);
            ctx.lineTo(cx + 42, cy - 54);
            ctx.lineTo(cx, cy);
            ctx.lineTo(cx + 42, cy + 54);
            ctx.lineTo(cx - 42, cy + 54);
            ctx.lineTo(cx, cy);
            ctx.closePath();
            ctx.fillStyle = hgGrad;
            ctx.fill();
            ctx.lineWidth = 3.5;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

            // Inner chambers
            ctx.beginPath();
            ctx.arc(cx, cy - 28, 14, 0, Math.PI * 2);
            ctx.arc(cx, cy + 28, 14, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

            // Center waist jewel
            ctx.beginPath();
            ctx.arc(cx, cy, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();

        } else if (value === 'teardrop') {
            // AZURE TEARDROP: Polished pendeloque droplet gem
            const tearGrad = ctx.createLinearGradient(cx, cy - 60, cx, cy + 55);
            tearGrad.addColorStop(0, '#60a5fa');
            tearGrad.addColorStop(0.5, theme.main[0]);
            tearGrad.addColorStop(1, theme.main[2]);

            ctx.beginPath();
            ctx.moveTo(cx, cy - 58);
            ctx.bezierCurveTo(cx + 56, cy - 6, cx + 48, cy + 52, cx, cy + 54);
            ctx.bezierCurveTo(cx - 48, cy + 52, cx - 56, cy - 6, cx, cy - 58);
            ctx.closePath();
            ctx.fillStyle = tearGrad;
            ctx.fill();
            ctx.lineWidth = 3.5;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.90)';
            ctx.stroke();

            // Inner Facet Tear
            ctx.beginPath();
            ctx.moveTo(cx, cy - 28);
            ctx.bezierCurveTo(cx + 26, cy, cx + 22, cy + 28, cx, cy + 30);
            ctx.bezierCurveTo(cx - 22, cy + 28, cx - 26, cy, cx, cy - 28);
            ctx.closePath();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.30)';
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

        } else if (value === 'shield') {
            // OBSIDIAN SHIELD: Nordic heraldic kite shield with chevrons
            const shGrad = ctx.createLinearGradient(cx, cy - 58, cx, cy + 58);
            shGrad.addColorStop(0, '#64748b');
            shGrad.addColorStop(0.5, theme.main[0]);
            shGrad.addColorStop(1, theme.main[2]);

            ctx.beginPath();
            ctx.moveTo(cx - 45, cy - 52);
            ctx.lineTo(cx + 45, cy - 52);
            ctx.lineTo(cx + 45, cy);
            ctx.bezierCurveTo(cx + 45, cy + 36, cx + 22, cy + 56, cx, cy + 62);
            ctx.bezierCurveTo(cx - 22, cy + 56, cx - 45, cy + 36, cx - 45, cy);
            ctx.closePath();
            ctx.fillStyle = shGrad;
            ctx.fill();
            ctx.lineWidth = 3.5;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.stroke();

            // Chevron Cross
            ctx.beginPath();
            ctx.moveTo(cx, cy - 52);
            ctx.lineTo(cx, cy + 62);
            ctx.moveTo(cx - 45, cy - 10);
            ctx.lineTo(cx + 45, cy - 10);
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

            // Center Boss
            ctx.beginPath();
            ctx.arc(cx, cy - 10, 11, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();

        } else if (value === 'compass') {
            // RUNIC COMPASS: 4-pointed mariner compass star inside circular rim
            ctx.beginPath();
            ctx.arc(cx, cy, 58, 0, Math.PI * 2);
            const compGrad = ctx.createRadialGradient(cx, cy, 8, cx, cy, 58);
            compGrad.addColorStop(0, '#fde68a');
            compGrad.addColorStop(0.5, theme.main[0]);
            compGrad.addColorStop(1, theme.main[2]);
            ctx.fillStyle = compGrad;
            ctx.fill();
            ctx.lineWidth = 3.5;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

            // Compass Needles
            const needleR = 52;
            const needleW = 14;
            const needleDirs = [
                { x: 0, y: -needleR },
                { x: needleR, y: 0 },
                { x: 0, y: needleR },
                { x: -needleR, y: 0 }
            ];

            ctx.fillStyle = '#ffffff';
            for (const d of needleDirs) {
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                const perpX = -d.y / needleR * needleW;
                const perpY = d.x / needleR * needleW;
                ctx.lineTo(cx + perpX, cy + perpY);
                ctx.lineTo(cx + d.x, cy + d.y);
                ctx.closePath();
                ctx.fill();
            }

            // Center Golden Ring
            ctx.beginPath();
            ctx.arc(cx, cy, 12, 0, Math.PI * 2);
            ctx.fillStyle = theme.main[0];
            ctx.fill();
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

        } else if (value === 'rhombus') {
            // TEAL RHOMBUS: 60-degree skewed parallelogram gem
            const rw = 52;
            const rh = 40;
            const skew = 22;

            const rhomGrad = ctx.createLinearGradient(cx - rw, cy - rh, cx + rw, cy + rh);
            rhomGrad.addColorStop(0, '#2dd4bf');
            rhomGrad.addColorStop(0.5, theme.main[0]);
            rhomGrad.addColorStop(1, theme.main[2]);

            ctx.beginPath();
            ctx.moveTo(cx - rw + skew, cy - rh);
            ctx.lineTo(cx + rw, cy - rh);
            ctx.lineTo(cx + rw - skew, cy + rh);
            ctx.lineTo(cx - rw, cy + rh);
            ctx.closePath();
            ctx.fillStyle = rhomGrad;
            ctx.fill();
            ctx.lineWidth = 3.5;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.90)';
            ctx.stroke();

            // Inner Rhombus
            const irw = 26;
            const irh = 20;
            const iskew = 11;
            ctx.beginPath();
            ctx.moveTo(cx - irw + iskew, cy - irh);
            ctx.lineTo(cx + irw, cy - irh);
            ctx.lineTo(cx + irw - iskew, cy + irh);
            ctx.lineTo(cx - irw, cy + irh);
            ctx.closePath();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.30)';
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

            // Center pearl
            ctx.beginPath();
            ctx.arc(cx, cy, 9, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();

        } else if (value === 'triskelion') {
            // CELTIC TRISKELION: 3-armed spiral vortex
            const triGrad = ctx.createRadialGradient(cx, cy, 6, cx, cy, 58);
            triGrad.addColorStop(0, '#818cf8');
            triGrad.addColorStop(0.5, theme.main[0]);
            triGrad.addColorStop(1, theme.main[2]);

            ctx.beginPath();
            ctx.arc(cx, cy, 58, 0, Math.PI * 2);
            ctx.fillStyle = triGrad;
            ctx.fill();
            ctx.lineWidth = 3.5;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.stroke();

            // 3 spiral arms
            for (let i = 0; i < 3; i++) {
                const angle = (Math.PI * 2 / 3) * i - Math.PI / 2;
                const armX = cx + 26 * Math.cos(angle);
                const armY = cy + 26 * Math.sin(angle);
                ctx.beginPath();
                ctx.arc(armX, armY, 18, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
                ctx.fill();
                ctx.lineWidth = 2.5;
                ctx.strokeStyle = '#ffffff';
                ctx.stroke();
            }

            ctx.beginPath();
            ctx.arc(cx, cy, 10, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();

        } else if (value === 'prism') {
            // ICE PRISM: Trapezoidal perspective 3D crystal prism
            const pw = 48;
            const ph = 54;

            const prismGrad = ctx.createLinearGradient(cx - pw, cy, cx + pw, cy);
            prismGrad.addColorStop(0, '#38bdf8');
            prismGrad.addColorStop(0.5, theme.main[0]);
            prismGrad.addColorStop(1, theme.main[2]);

            ctx.beginPath();
            ctx.moveTo(cx - pw * 0.5, cy - ph);
            ctx.lineTo(cx + pw * 0.5, cy - ph);
            ctx.lineTo(cx + pw, cy + ph);
            ctx.lineTo(cx - pw, cy + ph);
            ctx.closePath();
            ctx.fillStyle = prismGrad;
            ctx.fill();
            ctx.lineWidth = 3.5;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.90)';
            ctx.stroke();

            // Facet split line down middle
            ctx.beginPath();
            ctx.moveTo(cx, cy - ph);
            ctx.lineTo(cx, cy + ph);
            ctx.moveTo(cx - pw * 0.5, cy - ph);
            ctx.lineTo(cx, cy);
            ctx.moveTo(cx + pw * 0.5, cy - ph);
            ctx.lineTo(cx, cy);
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(cx, cy, 10, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();

        } else if (value === 'pillar') {
            // NORDIC PILLAR: Classic stone colosseum column medallion
            const pilGrad = ctx.createLinearGradient(cx - 40, cy, cx + 40, cy);
            pilGrad.addColorStop(0, '#94a3b8');
            pilGrad.addColorStop(0.5, theme.main[0]);
            pilGrad.addColorStop(1, theme.main[2]);

            // Outer capital top & base
            ctx.beginPath();
            ctx.roundRect(cx - 44, cy - 54, 88, 22, 6);
            ctx.roundRect(cx - 44, cy + 32, 88, 22, 6);
            // 3 vertical flutes
            ctx.roundRect(cx - 36, cy - 32, 20, 64, 4);
            ctx.roundRect(cx - 10, cy - 32, 20, 64, 4);
            ctx.roundRect(cx + 16, cy - 32, 20, 64, 4);
            ctx.fillStyle = pilGrad;
            ctx.fill();
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

        } else if (value === 'vortex') {
            // EMERALD VORTEX: 3 orbital atomic rings with radiant green nucleus
            const vortGrad = ctx.createRadialGradient(cx, cy, 8, cx, cy, 58);
            vortGrad.addColorStop(0, '#6ee7b7');
            vortGrad.addColorStop(0.5, theme.main[0]);
            vortGrad.addColorStop(1, theme.main[2]);

            ctx.beginPath();
            ctx.arc(cx, cy, 58, 0, Math.PI * 2);
            ctx.fillStyle = vortGrad;
            ctx.fill();
            ctx.lineWidth = 3.5;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.stroke();

            // 3 rotated ellipse orbits
            for (let i = 0; i < 3; i++) {
                const angle = (Math.PI / 3) * i;
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(angle);
                ctx.beginPath();
                ctx.ellipse(0, 0, 48, 18, 0, 0, Math.PI * 2);
                ctx.lineWidth = 2.5;
                ctx.strokeStyle = '#ffffff';
                ctx.stroke();
                ctx.restore();
            }

            // Central nucleus
            ctx.beginPath();
            ctx.arc(cx, cy, 12, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
        }

        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
    } else {
        // PURE MINIMAL WHITE DOMINO (Debossed Dark Charcoal Numeral or Letter)
        // Subtle central debossed circular dish (classic domino spinner / pip well)
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 74, 0, Math.PI * 2);
        ctx.fillStyle = '#f8fafc';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#e2e8f0';
        ctx.stroke();

        // High-contrast engraved dark charcoal numeral or letter
        const valStr = String(value);
        ctx.fillStyle = '#0f172a';
        // Dynamically scale font size: 2-digit numbers fit comfortably inside pip dish
        if (valStr.length >= 2) {
            ctx.font = '900 88px "Outfit", "Inter", -apple-system, sans-serif';
        } else {
            ctx.font = '900 114px "Outfit", "Inter", -apple-system, sans-serif';
        }
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.22)';
        ctx.shadowBlur = 1;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 1.5;
        ctx.fillText(valStr, width / 2, height / 2 - 4);
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 0;
    }

    // Directional molded indicator arrows
    if ((cellsW === 1 && cellsH === 1) || orientation === 'Y') {
        // 4-way omnidirectional molded arrow indicator for single-cell and vertical blocks (free horizontal sliding)
        ctx.save();
        ctx.translate(width / 2, height - 32);
        ctx.fillStyle = '#64748b';
        ctx.globalAlpha = 0.55;

        // Draw neat 4-way directional cross with 4 arrowheads (+X, -X, +Z, -Z)
        const arm = 13;
        const head = 5;
        const stem = 2.5;

        ctx.beginPath();
        // +X (Right tip)
        ctx.moveTo(arm, 0);
        ctx.lineTo(arm - head, -stem - 2.5);
        ctx.lineTo(arm - head, -stem);
        // Up arm (-Z)
        ctx.lineTo(stem, -stem);
        ctx.lineTo(stem, -(arm - head));
        ctx.lineTo(stem + 2.5, -(arm - head));
        ctx.lineTo(0, -arm); // Top tip
        ctx.lineTo(-stem - 2.5, -(arm - head));
        ctx.lineTo(-stem, -(arm - head));
        ctx.lineTo(-stem, -stem);
        // Left arm (-X)
        ctx.lineTo(-(arm - head), -stem);
        ctx.lineTo(-(arm - head), -stem - 2.5);
        ctx.lineTo(-arm, 0); // Left tip
        ctx.lineTo(-(arm - head), stem + 2.5);
        ctx.lineTo(-(arm - head), stem);
        // Down arm (+Z)
        ctx.lineTo(-stem, stem);
        ctx.lineTo(-stem, arm - head);
        ctx.lineTo(-stem - 2.5, arm - head);
        ctx.lineTo(0, arm); // Bottom tip
        ctx.lineTo(stem + 2.5, arm - head);
        ctx.lineTo(stem, arm - head);
        ctx.lineTo(stem, stem);
        // Back to Right (+X)
        ctx.lineTo(arm - head, stem);
        ctx.lineTo(arm - head, stem + 2.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    } else {
        // Bidirectional molded indicator arrow for multi-cell blocks along long axis
        ctx.save();
        let arrowX = width / 2;
        let arrowY = height - 34;
        let angle = (cellsH > cellsW) ? Math.PI / 2 : 0;

        if (cellsH > cellsW) {
            arrowY = height / 2 + 104;
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
    }

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
