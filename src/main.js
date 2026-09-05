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
        this.btnSound = document.getElementById('btn-sound');
        this.iconSound = document.getElementById('icon-sound');
        this.btnTheme = document.getElementById('btn-theme');
        this.iconTheme = document.getElementById('icon-theme');
        this.pillLevel = document.getElementById('pill-level');
        this.modalLevel = document.getElementById('modal-level-select');
        this.btnCloseModal = document.getElementById('btn-close-modal');
        this.levelGrid = document.getElementById('level-grid');

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

        // Progress & High Score state loaded from localStorage
        const saved = this._loadProgress();
        this.currentLevel = saved.currentLevel || 1;
        this.score = saved.score || 0;
        this.highScore = saved.highScore || 0;
        this.highestLevel = saved.highestLevel || 1;
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
        this._updateSelectionUI(null, null);
        if (this.btnShuffle) this.btnShuffle.style.display = 'none';
        if (this.modalComplete) this.modalComplete.style.display = 'none';

        const config = TopologyGenerator.getLevelConfig(level);
        const generator = new TopologyGenerator(config);

        this.topology = generator.generate();
        this.currentShapeName = config.shapeName;
        this.movesCount = 0;
        this.parMoves = Math.ceil(this.topology.blocks.size / 2);
        this.levelMatchesCount = 0;
        this.levelMaxCombo = 1;

        this.renderer.setTopology(this.topology);
        this.renderer.applyLevelTheme(level);

        this.updateStats();
        this.showToast(`Level ${level} • ${config.shapeName}`, 2000);
        this._checkDeadlock();
    }

    _checkDeadlock() {
        if (!this.topology || this.topology.blocks.size === 0) return;
        const hasMove = this.topology.hasAnyValidMove();
        if (!hasMove) {
            if (this.btnShuffle) this.btnShuffle.style.display = 'flex';
            this.showToast('⚠️ No moves left — tap Shuffle!', 3500);
        } else {
            if (this.btnShuffle) this.btnShuffle.style.display = 'none';
        }
    }

    handleShuffle() {
        if (!this.topology || this.isProcessingMatch) return;
        sound.playShuffle();
        this.renderer.shakeTower(420);
        this.topology.shuffleDeadlock();
        this.renderer.updateBlockValues(this.topology);
        if (this.btnShuffle) this.btnShuffle.style.display = 'none';
        this.showToast('🌋 Tower Quake! Blocks reshuffled with new clear pairs!', 2500);
    }

    updateStats() {
        if (this.levelElem) this.levelElem.textContent = String(this.currentLevel);
        if (this.scoreElem) this.scoreElem.textContent = String(this.score);
        if (this.bestElem) this.bestElem.textContent = String(Math.max(this.highScore, this.score));
        if (this.movesElem) this.movesElem.textContent = `${this.movesCount}/${this.parMoves}`;
        if (this.remainingElem) this.remainingElem.textContent = String(this.topology.blocks.size);
        this._saveProgress();
    }

    _updateSelectionUI(val1 = null, val2 = null) {
        const eqPill = document.getElementById('zen-equation');
        if (val1 === null) {
            if (eqPill) eqPill.classList.remove('active');
            if (this.slot1Elem) this.slot1Elem.textContent = '?';
            if (this.slot2Elem) this.slot2Elem.textContent = '?';
        } else {
            if (eqPill) eqPill.classList.add('active');
            if (this.slot1Elem) this.slot1Elem.textContent = val1;
            if (this.slot2Elem) {
                if (val2 !== null) {
                    this.slot2Elem.textContent = val2;
                } else if (typeof val1 === 'number') {
                    // Show complement needed (e.g. 7 needs 3)
                    this.slot2Elem.textContent = 10 - val1;
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

        // If player taps a block that is not adjacent to the first selection,
        // seamlessly switch selection to the newly clicked block as the new active block!
        const isAdjacent = this.topology.areBlocksAdjacent(first, second);
        if (!isAdjacent) {
            this.renderer.setBlockSelected(first.id, false);
            this.topology.canBlockSlideOut(second);
            this.selectedBlock = second;
            this.renderer.setBlockSelected(second.id, true);
            const displayVal = second.type === 'wild' ? '★' : second.value;
            this._updateSelectionUI(displayVal, null);
            sound.playSelect(second.length);
            return;
        }

        // Adjacent partner tapped -> evaluate pair
        this.renderer.hideExitBeam();
        this.renderer.setBlockSelected(second.id, true);
        this.movesCount++;
        this.updateStats();

        const firstDisp = first.type === 'wild' ? '★' : first.value;
        const secondDisp = second.type === 'wild' ? '★' : second.value;
        this._updateSelectionUI(firstDisp, secondDisp);

        // Check if either is a Wildcard block (Wildcard pairs with anything)
        const isWildMatch = first.type === 'wild' || second.type === 'wild';
        const sum = isWildMatch ? 10 : first.value + second.value;

        if (sum === 10) {
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

            if (this.comboCount > 1) {
                this.showToast(`🔥 COMBO x${this.comboCount}! +${pointsEarned} PTS!`, 2000);
            } else {
                this.showToast(`✨ ${firstDisp} + ${secondDisp} = 10! +${pointsEarned} PTS`, 1600);
            }

            setTimeout(() => {
                sound.playFlick(Math.max(first.length, second.length));
                this.renderer.flyOutBlocks([first.id, second.id]);
                this.topology.removeBlock(first.id);
                this.topology.removeBlock(second.id);

                this.score += pointsEarned;
                this.selectedBlock = null;
                this._updateSelectionUI(null, null);
                this.updateStats();

                // Rapid Downward Gravity Fall
                setTimeout(() => {
                    const fallen = this.topology.settleGravity();
                    if (fallen.length > 0) {
                        this.renderer.animateFallingBlocks(fallen, this.topology.cellSize, () => {
                            sound.playLandThud(fallen[0]?.block?.length || 1);
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
            this.showToast(`❌ ${first.value} + ${second.value} = ${sum} (Need 10)`, 1600);

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
