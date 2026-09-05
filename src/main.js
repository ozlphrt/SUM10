import './style.css';
import { TopologyGenerator } from './topology/TopologyGenerator.js';
import { TowerRenderer } from './render/TowerRenderer.js';
import { sound } from './audio/SoundEffects.js';

class Sum10Game {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.levelElem = document.getElementById('val-level');
        this.scoreElem = document.getElementById('val-score');
        this.bestElem = document.getElementById('val-best');
        this.remainingElem = document.getElementById('val-remaining');
        this.slot1Elem = document.getElementById('slot-1');
        this.slot2Elem = document.getElementById('slot-2');
        this.toastElem = document.getElementById('toast-msg');
        this.btnRetry = document.getElementById('btn-retry');
        this.btnShuffle = document.getElementById('btn-shuffle');
        this.btnBarShuffle = document.getElementById('btn-bar-shuffle');
        this.btnSound = document.getElementById('btn-sound');
        this.iconSound = document.getElementById('icon-sound');
        this.btnTheme = document.getElementById('btn-theme');
        this.iconTheme = document.getElementById('icon-theme');
        this.pillLevel = document.getElementById('pill-level');
        this.modalLevel = document.getElementById('modal-level-select');
        this.btnCloseModal = document.getElementById('btn-close-modal');
        this.levelGrid = document.getElementById('level-grid');

        // Mode Selector Elements
        this.pillMode = document.getElementById('pill-mode');
        this.valModeIcon = document.getElementById('val-mode-icon');
        this.valModeName = document.getElementById('val-mode-name');
        this.modalMode = document.getElementById('modal-mode-select');
        this.btnCloseModeModal = document.getElementById('btn-close-mode-modal');
        this.eqOp1 = document.getElementById('eq-op-1');
        this.eqOp2 = document.getElementById('eq-op-2');
        this.eqTarget = document.getElementById('eq-target');

        // Quote Banner Elements for Letters Mode
        this.quoteBanner = document.getElementById('letters-quote-banner');
        this.quoteProgress = document.getElementById('quote-progress');
        this.quoteTextContainer = document.getElementById('quote-text-container');
        this.quoteAuthor = document.getElementById('quote-author');

        // Current active game mode ('numbers', 'letters', 'shapes')
        this.gameMode = (function() {
            try {
                let saved = localStorage.getItem('sum10_game_mode') || 'numbers';
                if (saved === 'sum10' || saved === 'sum20') saved = 'numbers';
                if (saved === 'alphabet') saved = 'letters';
                return saved;
            } catch (_) {
                return 'numbers';
            }
        })();

        this.movesElem = document.getElementById('val-moves');

        // Level Complete Overlay elements
        this.modalComplete = document.getElementById('modal-level-complete');
        this.completeTitle = document.getElementById('complete-title');
        this.completeSubtitle = document.getElementById('complete-subtitle');
        this.completeStarsElem = document.getElementById('complete-stars');
        this.completeRatingLabel = document.getElementById('complete-rating-label');
        this.completeValMoves = document.getElementById('complete-val-moves');
        this.completeValCombo = document.getElementById('complete-val-combo');
        this.completeValBonus = document.getElementById('complete-val-bonus');
        this.completeValScore = document.getElementById('complete-val-score');
        this.btnCompleteNext = document.getElementById('btn-complete-next');
        this.btnCompleteReplay = document.getElementById('btn-complete-replay');
        this.currentShapeName = 'Nordic Monolith';

        if (this.btnCompleteNext) {
            this.btnCompleteNext.addEventListener('click', () => {
                if (this.modalComplete) this.modalComplete.style.display = 'none';
                this.startLevel(this.currentLevel + 1);
            });
        }
        if (this.btnCompleteReplay) {
            this.btnCompleteReplay.addEventListener('click', () => {
                if (this.modalComplete) this.modalComplete.style.display = 'none';
                this.startLevel(this.currentLevel);
            });
        }

        // Camera View Controls
        this.btnCamAlign = document.getElementById('btn-cam-align');
        this.btnCamLeft = document.getElementById('btn-cam-left');
        this.btnCamRight = document.getElementById('btn-cam-right');

        if (this.btnCamAlign) {
            this.btnCamAlign.addEventListener('click', () => {
                this.renderer.snapCameraToNearestAngle();
                this.showToast('🎯 View aligned', 1000);
            });
        }
        if (this.btnCamLeft) {
            this.btnCamLeft.addEventListener('click', () => {
                this.renderer.rotateCamera90(-1);
            });
        }
        if (this.btnCamRight) {
            this.btnCamRight.addEventListener('click', () => {
                this.renderer.rotateCamera90(1);
            });
        }

        if (this.iconSound) {
            this.iconSound.textContent = sound.getIcon();
        }
        if (this.btnSound) {
            this.btnSound.title = `Audio: ${sound.getLabel()} (Click to cycle)`;
            this.btnSound.addEventListener('click', () => {
                sound.cycleMode();
                if (this.iconSound) {
                    this.iconSound.textContent = sound.getIcon();
                }
                this.btnSound.title = `Audio: ${sound.getLabel()} (Click to cycle)`;
                this.showToast(`${sound.getIcon()} Audio: ${sound.getLabel()}`, 1400);
            });
        }

        // Theme toggle (Scandinavian Light vs Slate Obsidian Dark)
        this.isDarkTheme = (function() {
            try {
                return localStorage.getItem('sum10_theme') === 'dark';
            } catch (_) {
                return false;
            }
        })();

        if (this.btnTheme) {
            this.btnTheme.addEventListener('click', () => {
                this.isDarkTheme = !this.isDarkTheme;
                try {
                    localStorage.setItem('sum10_theme', this.isDarkTheme ? 'dark' : 'light');
                } catch (_) {}
                this._applyTheme(this.isDarkTheme);
                sound.playSelect(1);
                this.showToast(this.isDarkTheme ? '🌙 Obsidian Dark Mode' : '☀️ Scandinavian Light Mode', 1200);
            });
        }

        // Retry current level (doesn't reset level progress)
        if (this.btnRetry) {
            this.btnRetry.addEventListener('click', () => {
                this.startLevel(this.currentLevel);
                this.showToast(`↺ Restarted Level ${this.currentLevel}`);
            });
        }

        // Open/close level select modal
        if (this.pillLevel) {
            this.pillLevel.addEventListener('click', () => this._openLevelModal());
        }
        if (this.btnCloseModal) {
            this.btnCloseModal.addEventListener('click', () => this._closeLevelModal());
        }
        if (this.modalLevel) {
            this.modalLevel.addEventListener('click', (e) => {
                if (e.target === this.modalLevel) this._closeLevelModal();
            });
        }

        // Open/close mode select modal
        if (this.pillMode) {
            this.pillMode.addEventListener('click', () => this._openModeModal());
        }
        if (this.btnCloseModeModal) {
            this.btnCloseModeModal.addEventListener('click', () => this._closeModeModal());
        }
        if (this.modalMode) {
            this.modalMode.addEventListener('click', (e) => {
                if (e.target === this.modalMode) this._closeModeModal();
            });
            // Wire mode card selection clicks
            const cards = this.modalMode.querySelectorAll('.mode-card');
            cards.forEach((card) => {
                card.addEventListener('click', () => {
                    const targetMode = card.getAttribute('data-mode');
                    if (targetMode) {
                        this.setGameMode(targetMode);
                        this._closeModeModal();
                    }
                });
            });
        }

        // Progress & High Score state loaded from localStorage
        const saved = this._loadProgress();
        // Allow user to test any level up to 100
        this.highestLevel = Math.max(100, saved.highestLevel || 1);
        this.currentLevel = 100; // Jump directly to Level 100 for testing
        this.score = saved.score || 0;
        this.highScore = saved.highScore || 0;
        this.starsByLevel = saved.starsByLevel || {};

        this.topology = null;
        this.selectedBlock = null;
        this.isProcessingMatch = false;

        // Level moves & par tracking for star rating
        this.movesCount = 0;
        this.parMoves = 10;
        this.levelMatchesCount = 0;
        this.levelMaxCombo = 1;

        // Combo multiplier state
        this.comboCount = 0;
        this.lastMatchTime = 0;
        this.COMBO_WINDOW_MS = 4000;

        this.renderer = new TowerRenderer(this.container, {
            onBlockClick: (block) => this.handleBlockClick(block),
            onBackgroundClick: () => this.handleBackgroundClick()
        });

        this._applyTheme(this.isDarkTheme);

        if (this.btnShuffle) {
            this.btnShuffle.addEventListener('click', () => this.handleShuffle());
        }
        if (this.btnBarShuffle) {
            this.btnBarShuffle.addEventListener('click', () => this.handleShuffle());
        }

        this.startLevel(this.currentLevel);
    }

    _applyTheme(isDark) {
        document.body.classList.toggle('dark-theme', isDark);
        if (this.iconTheme) {
            this.iconTheme.textContent = isDark ? '☀️' : '🌙';
        }
        if (this.renderer) {
            this.renderer.setTheme(isDark);
        }
    }

    _loadProgress() {
        try {
            const data = localStorage.getItem('sum10_progress');
            return data ? JSON.parse(data) : {};
        } catch (_) {
            return {};
        }
    }

    _saveProgress() {
        try {
            this.highScore = Math.max(this.highScore, this.score);
            this.highestLevel = Math.max(this.highestLevel, this.currentLevel);
            localStorage.setItem('sum10_progress', JSON.stringify({
                currentLevel: this.currentLevel,
                score: this.score,
                highScore: this.highScore,
                highestLevel: this.highestLevel,
                starsByLevel: this.starsByLevel
            }));
        } catch (_) {}
    }

    _openLevelModal() {
        if (!this.modalLevel || !this.levelGrid) return;
        this.levelGrid.innerHTML = '';

        for (let lvl = 1; lvl <= this.highestLevel; lvl++) {
            const btn = document.createElement('button');
            btn.className = `level-btn ${lvl === this.currentLevel ? 'current' : ''}`;
            btn.type = 'button';
            const earned = this.starsByLevel[lvl] || 0;
            const starsHtml = `<span class="level-btn-stars">
                <span class="${earned >= 1 ? 'star-active' : ''}">★</span>
                <span class="${earned >= 2 ? 'star-active' : ''}">★</span>
                <span class="${earned >= 3 ? 'star-active' : ''}">★</span>
            </span>`;
            btn.innerHTML = `<span class="level-btn-num">Lvl ${lvl}</span>${starsHtml}`;
            btn.addEventListener('click', () => {
                this.startLevel(lvl);
                this._closeLevelModal();
            });
            this.levelGrid.appendChild(btn);
        }

        this.modalLevel.style.display = 'flex';
    }

    _closeLevelModal() {
        if (this.modalLevel) this.modalLevel.style.display = 'none';
    }

    _openModeModal() {
        if (!this.modalMode) return;
        const cards = this.modalMode.querySelectorAll('.mode-card');
        cards.forEach((card) => {
            const m = card.getAttribute('data-mode');
            card.classList.toggle('active', m === this.gameMode);
        });
        this.modalMode.style.display = 'flex';
    }

    _closeModeModal() {
        if (this.modalMode) this.modalMode.style.display = 'none';
    }

    setGameMode(mode) {
        if (this.gameMode === mode) return;
        this.gameMode = mode;
        try {
            localStorage.setItem('sum10_game_mode', mode);
        } catch (_) {}

        this._updateModePill();
        sound.playSelect(1);
        this.startLevel(1); // Start clean level 1 for new mode
    }

    _updateModePill() {
        const targetSum = 9 + (this.currentLevel || 1);
        const MODE_INFO = {
            numbers: { icon: '🔢', name: `SUM ${targetSum}`, target: String(targetSum), op1: '+', op2: '=' },
            letters: { icon: '🔤', name: 'LETTERS', target: 'QUOTE', op1: '+', op2: '➔' },
            shapes: { icon: '🔷', name: 'SHAPES', target: 'MATCH', op1: '=', op2: '➔' }
        };
        const info = MODE_INFO[this.gameMode] || MODE_INFO.numbers;
        if (this.valModeIcon) this.valModeIcon.textContent = info.icon;
        if (this.valModeName) this.valModeName.textContent = info.name;
        if (this.eqOp1) this.eqOp1.textContent = info.op1;
        if (this.eqOp2) this.eqOp2.textContent = info.op2;
        if (this.eqTarget) this.eqTarget.textContent = info.target;
    }

    renderQuoteBanner() {
        if (!this.quoteBanner) return;

        if (this.gameMode !== 'letters' || !this.topology || !this.topology.sentenceData) {
            this.quoteBanner.style.display = 'none';
            return;
        }

        const data = this.topology.sentenceData;
        this.quoteBanner.style.display = 'flex';

        if (this.quoteAuthor) {
            this.quoteAuthor.textContent = data.author ? `— ${data.author}` : '';
        }

        const totalPairs = data.pairs ? data.pairs.length : 0;
        const matchedCount = data.matchedPairIds ? data.matchedPairIds.size : 0;
        if (this.quoteProgress) {
            this.quoteProgress.textContent = `${matchedCount} / ${totalPairs} PAIRS`;
        }

        if (this.quoteTextContainer) {
            this.quoteTextContainer.innerHTML = '';
            // Map each character of the raw quote to a span or space
            const quote = data.quote;
            const matchedPairSet = data.matchedPairIds || new Set();

            for (let i = 0; i < quote.length; i++) {
                const char = quote[i];
                if (char === ' ') {
                    const space = document.createElement('span');
                    space.className = 'quote-space';
                    this.quoteTextContainer.appendChild(space);
                } else {
                    const span = document.createElement('span');
                    span.className = 'quote-char';
                    span.textContent = char;
                    span.setAttribute('data-char-index', i);

                    // Find if this character belongs to any pair
                    const pair = data.pairs.find(p => p.index1 === i || p.index2 === i);
                    if (pair) {
                        span.setAttribute('data-pair-id', pair.pairId);
                        if (matchedPairSet.has(pair.pairId)) {
                            span.classList.add('revealed');
                        }
                    }

                    this.quoteTextContainer.appendChild(span);
                }
            }
        }
    }

    revealQuotePair(pairId) {
        if (!this.quoteBanner || !this.topology || !this.topology.sentenceData) return;
        const data = this.topology.sentenceData;
        if (!data.matchedPairIds) data.matchedPairIds = new Set();
        data.matchedPairIds.add(pairId);

        const totalPairs = data.pairs ? data.pairs.length : 0;
        const matchedCount = data.matchedPairIds.size;
        if (this.quoteProgress) {
            this.quoteProgress.textContent = `${matchedCount} / ${totalPairs} PAIRS`;
        }

        const charSpans = this.quoteBanner.querySelectorAll(`.quote-char[data-pair-id="${pairId}"]`);
        charSpans.forEach(span => {
            span.classList.add('revealed', 'just-revealed');
            setTimeout(() => span.classList.remove('just-revealed'), 700);
        });
    }

    showToast(message, duration = 1800) {
        if (!this.toastElem) return;
        this.toastElem.textContent = message;
        this.toastElem.classList.add('show');
        clearTimeout(this._toastTimeout);
        this._toastTimeout = setTimeout(() => {
            this.toastElem.classList.remove('show');
        }, duration);
    }

    startLevel(level = 1) {
        this.currentLevel = level;
        this.selectedBlock = null;
        this.isProcessingMatch = false;
        this.levelMatchesCount = 0;
        this.levelMaxCombo = 1;
        this._updateModePill();
        this._updateSelectionUI(null, null);
        if (this.btnShuffle) this.btnShuffle.style.display = 'none';
        if (this.modalComplete) this.modalComplete.style.display = 'none';

        const config = TopologyGenerator.getLevelConfig(level);
        const generator = new TopologyGenerator(config);

        this.topology = generator.generate({ mode: this.gameMode, level });
        this.currentShapeName = config.shapeName;
        this.movesCount = 0;
        this.parMoves = Math.ceil(this.topology.blocks.size / 2);
        this.levelMatchesCount = 0;
        this.levelMaxCombo = 1;

        this.renderer.setTopology(this.topology);
        this.renderer.applyLevelTheme(level);

        this.updateStats();
        this.renderQuoteBanner();

        const targetSum = 9 + level;
        const modeLabel = {
            numbers: `SUM ${targetSum}`,
            letters: 'Paragraph Decryption',
            shapes: 'Runic Shapes'
        }[this.gameMode] || `SUM ${targetSum}`;
        this.showToast(`Level ${level} • ${config.shapeName} [${modeLabel}]`, 2400);
        this._checkDeadlock();
    }

    _checkDeadlock() {
        if (!this.topology || this.topology.blocks.size === 0) return;
        const hasMove = this.topology.hasAnyValidMove();
        if (!hasMove) {
            if (this.btnShuffle) this.btnShuffle.style.display = 'flex';
            this.showToast('⚠️ No moves left — tap Shake Tower!', 3500);
        } else {
            if (this.btnShuffle) this.btnShuffle.style.display = 'none';
        }
    }

    handleShuffle() {
        if (!this.topology || this.isProcessingMatch) return;

        // Clear any half-selected block before shaking
        if (this.selectedBlock) {
            this.renderer.setBlockSelected(this.selectedBlock.id, false);
            this.selectedBlock = null;
            this.renderer.hideExitBeam();
            this._updateSelectionUI(null, null);
        }

        // Animate clicked button
        [this.btnBarShuffle, this.btnShuffle].forEach(btn => {
            if (btn) {
                btn.classList.add('btn-shaking');
                setTimeout(() => btn.classList.remove('btn-shaking'), 450);
            }
        });

        // Apply shake penalties (+1 move penalty, -150 PTS score deduction, reset active combo)
        const PENALTY_SCORE = 150;
        this.movesCount += 1;
        this.score = Math.max(0, this.score - PENALTY_SCORE);
        this.comboCount = 1;
        this.updateStats();

        sound.playShuffle();
        this.renderer.shakeTower(460);
        this.topology.shuffleDeadlock();
        this.renderer.updateBlockValues(this.topology);
        if (this.btnShuffle) this.btnShuffle.style.display = 'none';

        this.showToast('📳 Tower Shaken! -150 PTS (+1 Move Penalty)', 2600);
    }

    updateStats() {
        if (this.levelElem) this.levelElem.textContent = String(this.currentLevel);
        if (this.scoreElem) this.scoreElem.textContent = String(this.score);
        if (this.bestElem) this.bestElem.textContent = String(Math.max(this.highScore, this.score));
        if (this.movesElem) this.movesElem.textContent = `${this.movesCount}/${this.parMoves}`;
        if (this.remainingElem) this.remainingElem.textContent = String(this.topology.blocks.size);
        this._saveProgress();
    }

    _updateSelectionUI(firstBlock = null, secondBlock = null) {
        const eqPill = document.getElementById('zen-equation');
        if (!firstBlock) {
            if (eqPill) eqPill.classList.remove('active');
            if (this.slot1Elem) this.slot1Elem.textContent = '?';
            if (this.slot2Elem) this.slot2Elem.textContent = '?';
        } else {
            if (eqPill) eqPill.classList.add('active');
            const formatVal = (v) => {
                if (typeof v === 'string') {
                    const SHAPE_ICONS = {
                        circle: '●',
                        triangle: '▲',
                        square: '■',
                        diamond: '◆',
                        star: '★',
                        hexagon: '⬣',
                        crescent: '🌙',
                        pentagon: '⬟',
                        cross: '✚',
                        ring: '◎',
                        octagon: '🛑',
                        heart: '🩶',
                        clover: '☘️',
                        infinity: '∞',
                        spiral: '🌀',
                        hourglass: '⏳',
                        teardrop: '💧',
                        shield: '🛡️',
                        compass: '🧭',
                        rhombus: '◇',
                        triskelion: '☸',
                        prism: '⏢',
                        pillar: '🏛️',
                        vortex: '⚛'
                    };
                    return SHAPE_ICONS[v] || v;
                }
                return String(v);
            };

            const val1 = firstBlock.value;
            const val2 = secondBlock ? secondBlock.value : null;

            if (this.slot1Elem) this.slot1Elem.textContent = formatVal(val1);
            if (this.slot2Elem) {
                if (val2 !== null) {
                    this.slot2Elem.textContent = formatVal(val2);
                } else if (val1 === '★') {
                    this.slot2Elem.textContent = '★';
                } else if (this.gameMode === 'shapes' && typeof val1 === 'string') {
                    this.slot2Elem.textContent = formatVal(val1);
                } else if (this.gameMode === 'letters' && firstBlock && this.topology?.sentenceData) {
                    // Show target consecutive partner letter from quote if available
                    const sData = this.topology.sentenceData;
                    const pair = sData.pairs.find(p => p.pairId === firstBlock.pairId);
                    if (pair) {
                        const targetChar = (firstBlock.value === pair.char1) ? pair.char2 : pair.char1;
                        this.slot2Elem.textContent = targetChar;
                    } else {
                        this.slot2Elem.textContent = '?';
                    }
                } else if (typeof val1 === 'number') {
                    // Numbers mode: targetSum complement
                    const targetSum = this.topology?.targetSum || (9 + this.currentLevel);
                    this.slot2Elem.textContent = Math.max(1, targetSum - val1);
                } else {
                    this.slot2Elem.textContent = '?';
                }
            }
        }
    }

    handleBackgroundClick() {
        if (this.selectedBlock && !this.isProcessingMatch) {
            const block = this.selectedBlock;
            const blockId = block?.id;
            const blockLen = block?.length || 1;
            this.selectedBlock = null;
            if (blockId) {
                this.renderer.setBlockSelected(blockId, false);
            }
            this.renderer.hideExitBeam();
            this._updateSelectionUI(null, null);
            sound.playSelect(blockLen);
        }
    }

    handleBlockClick(block) {
        if (this.isProcessingMatch || !block || block.isRemoved) return;

        // SPECIAL: If clicking a BOMB block, offer instant detonation!
        if (block.type === 'bomb') {
            this.renderer.hideExitBeam();
            this._detonateBomb(block);
            return;
        }

        // SPECIAL: If only 1 block is left on the board (e.g. wildcard or after bomb detonation),
        // clicking it immediately launches it out as a victory clear!
        if (this.topology.blocks.size === 1) {
            this.isProcessingMatch = true;
            this.renderer.hideExitBeam();
            this.renderer.setBlockSelected(block.id, true);
            sound.playWildChime();
            this.showToast('✨ Final Block Cleared! +150 PTS', 1500);

            setTimeout(() => {
                sound.playFlick(block.length || 1);
                this.renderer.flyOutBlocks([block.id]);
                this.topology.removeBlock(block.id);
                this.selectedBlock = null;
                this._updateSelectionUI(null, null);
                this.renderer.clearAllHighlights();
                this.isProcessingMatch = false;
                this.score += 150;
                this.updateStats();
                this._showLevelCompleteModal();
            }, 80);
            return;
        }

        // Clicking the already selected block deselects it
        if (this.selectedBlock && this.selectedBlock.id === block.id) {
            const blockId = block.id;
            const blockLen = block.length || 1;
            this.selectedBlock = null;
            this.renderer.setBlockSelected(blockId, false);
            this.renderer.hideExitBeam();
            this._updateSelectionUI(null, null);
            sound.playSelect(blockLen);
            return;
        }

        // First block selected
        if (!this.selectedBlock) {
            // Evaluate clear escape direction so drawer nudge matches available exit
            this.topology.canBlockSlideOut(block);
            this.selectedBlock = block;
            this.renderer.setBlockSelected(block.id, true);
            const displayVal = block.type === 'wild' ? '★' : block.value;
            this._updateSelectionUI(displayVal, null);
            sound.playSelect(block.length);
            return;
        }

        const first = this.selectedBlock;
        const second = block;

        // Check if the two blocks can be paired (adjacent, or isolated without neighbors, or endgame with <= 2 blocks)
        const canPair = this.topology.canBlocksBePaired(first, second);
        if (!canPair) {
            this.renderer.setBlockSelected(first.id, false);
            this.topology.canBlockSlideOut(second);
            this.selectedBlock = second;
            this.renderer.setBlockSelected(second.id, true);
            const displayVal = second.type === 'wild' ? '★' : second.value;
            this._updateSelectionUI(displayVal, null);
            sound.playSelect(second.length);
            return;
        }

        // Partner tapped -> evaluate pair
        this.renderer.hideExitBeam();
        this.renderer.setBlockSelected(second.id, true);
        this.movesCount++;
        this.updateStats();

        const firstDisp = first.type === 'wild' ? '★' : first.value;
        const secondDisp = second.type === 'wild' ? '★' : second.value;
        this._updateSelectionUI(firstDisp, secondDisp);

        // Check if either is a Wildcard block or matches current mode rules
        const isWildMatch = first.type === 'wild' || second.type === 'wild';
        const isModeMatch = this.topology.isMatch(first, second);

        if (isModeMatch) {
            // Check if BOTH blocks have a clear exit path out of the tower
            const exitFirst = this.topology.canBlockSlideOut(first, second);
            const exitSecond = this.topology.canBlockSlideOut(second, first);

            if (!exitFirst.canExit || !exitSecond.canExit) {
                sound.playMismatch();
                if (!exitFirst.canExit && !exitSecond.canExit) {
                    this.showToast('🚫 Path blocked — clear exit route');
                    this.renderer.shakeBlock(first.id);
                    this.renderer.shakeBlock(second.id);
                } else if (!exitFirst.canExit) {
                    this.showToast(`🚫 Block [${firstDisp}] is obstructed`);
                    this.renderer.shakeBlock(first.id);
                } else {
                    this.showToast(`🚫 Block [${secondDisp}] is obstructed`);
                    this.renderer.shakeBlock(second.id);
                }

                setTimeout(() => {
                    this.renderer.setBlockSelected(first.id, false);
                    this.renderer.setBlockSelected(second.id, false);
                    this.selectedBlock = null;
                    this._updateSelectionUI(null, null);
                    this._checkDeadlock();
                }, 500);
                return;
            }

            // Both have clear paths: MATCH & FLY OUT!
            this.isProcessingMatch = true;

            // Calculate combo streak within 4-second window
            const now = performance.now();
            if (now - this.lastMatchTime <= this.COMBO_WINDOW_MS) {
                this.comboCount++;
            } else {
                this.comboCount = 1;
            }
            this.lastMatchTime = now;

            const basePoints = isWildMatch ? 150 : 100;
            const pointsEarned = basePoints * this.comboCount;

            if (isWildMatch) {
                sound.playWildChime();
            } else {
                sound.playMatch(this.comboCount, first.length, second.length);
            }

            const currentTargetSum = this.topology?.targetSum || (9 + this.currentLevel);
            const matchToastMsg = (function(mode) {
                if (isWildMatch) return `★ Wildcard Match! +${pointsEarned} PTS`;
                if (mode === 'shapes') return `✨ ${firstDisp} = ${secondDisp}! +${pointsEarned} PTS`;
                if (mode === 'letters') return `✨ Pair [${firstDisp} & ${secondDisp}] Unlocked! +${pointsEarned} PTS`;
                return `✨ ${firstDisp} + ${secondDisp} = ${currentTargetSum}! +${pointsEarned} PTS`;
            })(this.gameMode);

            if (this.comboCount > 1) {
                this.showToast(`🔥 COMBO x${this.comboCount}! +${pointsEarned} PTS!`, 2000);
            } else {
                this.showToast(matchToastMsg, 1600);
            }

            // In letters mode, reveal the matched letters in the paragraph ribbon
            if (this.gameMode === 'letters') {
                const pId = first.pairId !== undefined ? first.pairId : second.pairId;
                if (pId !== undefined && pId !== null) {
                    this.revealQuotePair(pId);
                }
            }

            setTimeout(() => {
                sound.playFlick(Math.max(first.length, second.length));
                this.renderer.flyOutBlocks([first.id, second.id]);
                this.topology.removeBlock(first.id);
                this.topology.removeBlock(second.id);

                // Instantly clear selections, equation pill, and any residual block highlights
                this.selectedBlock = null;
                this._updateSelectionUI(null, null);
                this.renderer.clearAllHighlights();

                // Enable new selections right away so player is never locked out
                this.isProcessingMatch = false;

                this.score += pointsEarned;
                this.updateStats();

                // Downward Gravity Fall
                setTimeout(() => {
                    const fallen = this.topology.settleGravity();
                    if (fallen.length > 0) {
                        this.renderer.animateFallingBlocks(fallen, this.topology.cellSize, () => {
                            sound.playLandThud(fallen[0]?.block?.length || 1);
                            this._checkDeadlock();
                            if (this.topology.blocks.size > 0) {
                                this.renderer.fitCameraToBlocks({ animate: true, duration: 650 });
                            }
                        });
                    } else {
                        this._checkDeadlock();
                        if (this.topology.blocks.size > 0) {
                            this.renderer.fitCameraToBlocks({ animate: true, duration: 650 });
                        }
                    }
                }, 40);

                this.levelMatchesCount++;
                this.levelMaxCombo = Math.max(this.levelMaxCombo, this.comboCount);

                if (this.topology.blocks.size === 0) {
                    this._showLevelCompleteModal();
                }
            }, 40);
        } else {
            // MISMATCH: Shake both, unselect the first block, and select the second block as the new active selection
            sound.playMismatch();
            const currentTargetSum = this.topology?.targetSum || (9 + this.currentLevel);
            const mismatchMsg = (function(mode) {
                if (mode === 'shapes') return `❌ Shapes do not match`;
                if (mode === 'letters') return `❌ Not consecutive in paragraph (Need partner for ${first.value})`;
                return `❌ ${first.value} + ${second.value} = ${Number(first.value) + Number(second.value)} (Need ${currentTargetSum})`;
            })(this.gameMode);
            this.showToast(mismatchMsg, 1700);

            // Fully unselect and unhighlight the first block
            this.renderer.setBlockSelected(first.id, false);
            this.renderer.shakeBlock(first.id);

            // Select and highlight the second block as the new active block
            this.topology.canBlockSlideOut(second);
            this.selectedBlock = second;
            this.renderer.shakeBlock(second.id, () => {
                // Ensure second block remains in its elevated selected position after shaking
                if (this.selectedBlock && this.selectedBlock.id === second.id) {
                    this.renderer.setBlockSelected(second.id, true);
                }
            });
            this.renderer.setBlockSelected(second.id, true);

            const secondDisplayVal = second.type === 'wild' ? '★' : second.value;
            this._updateSelectionUI(secondDisplayVal, null);
        }
    }

    _showLevelCompleteModal() {
        sound.playLevelComplete();

        // Calculate efficiency stars based on par moves
        let stars = 1;
        let starBonus = 150;
        let ratingText = '⭐ 1 STAR • PERSISTENT SOLVER!';

        if (this.movesCount <= this.parMoves) {
            stars = 3;
            starBonus = 600;
            ratingText = '⭐⭐⭐ 3 STARS • MASTER STRATEGIST!';
        } else if (this.movesCount <= this.parMoves + 3) {
            stars = 2;
            starBonus = 350;
            ratingText = '⭐⭐ 2 STARS • SHARP TACTICIAN!';
        }

        this.starsByLevel[this.currentLevel] = Math.max(this.starsByLevel[this.currentLevel] || 0, stars);
        this.score += starBonus;
        this.highestLevel = Math.max(this.highestLevel, this.currentLevel + 1);
        this._saveProgress();
        this.updateStats();

        if (this.completeStarsElem) {
            this.completeStarsElem.innerHTML = `
                <span class="star-icon ${stars >= 1 ? 'active' : ''}">★</span>
                <span class="star-icon ${stars >= 2 ? 'active' : ''}">★</span>
                <span class="star-icon ${stars >= 3 ? 'active' : ''}">★</span>
            `;
        }
        if (this.completeRatingLabel) {
            this.completeRatingLabel.textContent = ratingText;
        }
        if (this.completeTitle) {
            this.completeTitle.textContent = `Level ${this.currentLevel} Cleared!`;
        }
        if (this.completeSubtitle) {
            this.completeSubtitle.textContent = `Magnificent! You dismantled the ${this.currentShapeName}!`;
        }
        if (this.completeValMoves) {
            this.completeValMoves.textContent = `${this.movesCount} / Par ${this.parMoves}`;
        }
        if (this.completeValCombo) {
            this.completeValCombo.textContent = `${this.levelMaxCombo}x`;
        }
        if (this.completeValBonus) {
            this.completeValBonus.textContent = `+${starBonus}`;
        }
        if (this.completeValScore) {
            this.completeValScore.textContent = String(this.score);
        }

        setTimeout(() => {
            if (this.modalComplete) {
                this.modalComplete.style.display = 'flex';
            }
        }, 600);
    }

    _detonateBomb(bombBlock) {
        this.isProcessingMatch = true;
        sound.playExplosion();
        this.renderer.shakeCamera(0.45, 500);
        this.showToast('💥 BOMB DETONATED! Clearing adjacent blocks!', 2000);

        // Find all adjacent neighboring blocks within blast radius
        const neighbors = Array.from(this.topology.getNeighborBlocks(bombBlock.id));
        const allToBlast = [bombBlock, ...neighbors];

        const idsToBlast = allToBlast.map((b) => b.id);

        this.renderer.flyOutBlocks(idsToBlast);
        idsToBlast.forEach((id) => this.topology.removeBlock(id));

        this.score += 50 * allToBlast.length;
        if (this.selectedBlock) {
            this.renderer.setBlockSelected(this.selectedBlock.id, false);
            this.selectedBlock = null;
        }
        this._updateSelectionUI(null, null);
        this.updateStats();

        // Gravity settle after explosion
        setTimeout(() => {
            const fallen = this.topology.settleGravity();
            if (fallen.length > 0) {
                this.renderer.animateFallingBlocks(fallen, this.topology.cellSize, () => {
                    sound.playLandThud();
                    this.isProcessingMatch = false;
                    this._checkDeadlock();
                    if (this.topology.blocks.size > 0) {
                        this.renderer.fitCameraToBlocks({ animate: true, duration: 650 });
                    }
                });
            } else {
                this.isProcessingMatch = false;
                this._checkDeadlock();
                if (this.topology.blocks.size > 0) {
                    this.renderer.fitCameraToBlocks({ animate: true, duration: 650 });
                }
            }
        }, 60);

        if (this.topology.blocks.size === 0) {
            this._showLevelCompleteModal();
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new Sum10Game();
});
