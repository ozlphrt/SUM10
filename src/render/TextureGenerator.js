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
    } else if (typeof value === 'string' && ['circle', 'triangle', 'square', 'diamond', 'star', 'hexagon'].includes(value)) {
        // LUXURY JEWELED RUNIC EMBLEMS (High-detail layered geometry, metallic sheen, facet depth)
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

        // 2. Shape Theme Palettes (Deep Obsidian/Sapphire/Emerald/Ruby/Amber/Amethyst Luxury Gradients)
        const SHAPE_PALETTES = {
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
                main: ['#f43f5e', '#be123c', '#881337'],
                glow: 'rgba(244, 63, 94, 0.45)',
                accent: '#fecdd3',
                name: 'Ruby Crest'
            }
        };

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
            // RUBY CREST: Honeycomb faceted medallion with concentric inscribed hex and core shield
            const hexR = 60;
            const hexGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, hexR);
            hexGrad.addColorStop(0, '#fb7185');
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
    if (cellsW === 1 && cellsH === 1) {
        // 4-way omnidirectional molded arrow indicator for single-cell blocks
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
