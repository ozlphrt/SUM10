import './style.css';
import { TopologyGenerator } from './topology/TopologyGenerator.js';
import { TowerRenderer } from './render/TowerRenderer.js';
import { sound } from './audio/SoundEffects.js';

class Sum10Game {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.levelElem = document.getElementById('val-level');
        this.scoreElem = document.getElementById('val-score');
        this.remainingElem = document.getElementById('val-remaining');
        this.slot1Elem = document.getElementById('slot-1');
        this.slot2Elem = document.getElementById('slot-2');
        this.toastElem = document.getElementById('toast-msg');
        this.btnNewGame = document.getElementById('btn-new-game');
        this.btnShuffle = document.getElementById('btn-shuffle');

        this.currentLevel = 1;
        this.score = 0;
        this.topology = null;
        this.selectedBlock = null;
        this.isProcessingMatch = false;

        // Combo multiplier state
        this.comboCount = 0;
        this.lastMatchTime = 0;
        this.COMBO_WINDOW_MS = 4000;

        this.renderer = new TowerRenderer(this.container, {
            onBlockClick: (block) => this.handleBlockClick(block)
        });

        this.btnNewGame.addEventListener('click', () => {
            this.currentLevel = 1;
            this.score = 0;
            this.startLevel(this.currentLevel);
        });

        this.btnShuffle.addEventListener('click', () => this.handleShuffle());

        this.startLevel(this.currentLevel);
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
        this._updateSelectionUI(null, null);
        if (this.btnShuffle) this.btnShuffle.style.display = 'none';

        const config = TopologyGenerator.getLevelConfig(level);
        const generator = new TopologyGenerator(config);

        this.topology = generator.generate();
        this.renderer.setTopology(this.topology);
        this.renderer.applyLevelTheme(level);

        this.updateStats();
        this.showToast(`🏰 Level ${level} — Find pairs summing to 10!`, 2200);
        this._checkDeadlock();
    }

    _checkDeadlock() {
        if (!this.topology || this.topology.blocks.size === 0) return;
        const hasMove = this.topology.hasAnyValidMove();
        if (!hasMove) {
            if (this.btnShuffle) this.btnShuffle.style.display = 'flex';
            this.showToast('⚠️ No unblocked pairs left! Tap Shuffle to break deadlock.', 4000);
        } else {
            if (this.btnShuffle) this.btnShuffle.style.display = 'none';
        }
    }

    handleShuffle() {
        if (!this.topology || this.isProcessingMatch) return;
        sound.playExplosion();
        this.renderer.shakeCamera(0.5, 600);
        this.topology.shuffleDeadlock();
        this.renderer.setTopology(this.topology);
        if (this.btnShuffle) this.btnShuffle.style.display = 'none';
        this.showToast('🌋 Tower Quake! Blocks reshuffled with new clear pairs!', 2500);
    }

    updateStats() {
        if (this.levelElem) this.levelElem.textContent = String(this.currentLevel);
        if (this.scoreElem) this.scoreElem.textContent = String(this.score);
        if (this.remainingElem) this.remainingElem.textContent = String(this.topology.blocks.size);
    }

    _updateSelectionUI(val1 = null, val2 = null) {
        if (this.slot1Elem) {
            this.slot1Elem.textContent = val1 !== null ? val1 : '?';
            this.slot1Elem.classList.toggle('filled', val1 !== null);
        }
        if (this.slot2Elem) {
            this.slot2Elem.textContent = val2 !== null ? val2 : '?';
            this.slot2Elem.classList.toggle('filled', val2 !== null);
        }
    }

    handleBlockClick(block) {
        if (this.isProcessingMatch || block.isRemoved) return;

        // SPECIAL: If clicking a BOMB block, offer instant detonation!
        if (block.type === 'bomb') {
            this._detonateBomb(block);
            return;
        }

        // Clicking the already selected block deselects it
        if (this.selectedBlock && this.selectedBlock.id === block.id) {
            this.renderer.setBlockSelected(block.id, false);
            this.selectedBlock = null;
            this._updateSelectionUI(null, null);
            sound.playSelect();
            return;
        }

        // First block selected
        if (!this.selectedBlock) {
            this.selectedBlock = block;
            this.renderer.setBlockSelected(block.id, true);
            const displayVal = block.type === 'wild' ? '★' : block.value;
            this._updateSelectionUI(displayVal, null);
            sound.playSelect();
            if (block.type === 'wild') {
                this.showToast('🌟 Wildcard selected! Tap ANY block to match!');
            } else {
                const needed = 10 - block.value;
                this.showToast(`Selected [${block.value}]. Tap a [${needed}] or [★]!`);
            }
            return;
        }

        // Second block selected -> evaluate sum
        const first = this.selectedBlock;
        const second = block;
        this.renderer.setBlockSelected(second.id, true);

        const firstDisp = first.type === 'wild' ? '★' : first.value;
        const secondDisp = second.type === 'wild' ? '★' : second.value;
        this._updateSelectionUI(firstDisp, secondDisp);

        // Check if either is a Wildcard block (Wildcard pairs with anything)
        const isWildMatch = first.type === 'wild' || second.type === 'wild';
        const sum = isWildMatch ? 10 : first.value + second.value;

        if (sum === 10) {
            // Check if BOTH blocks have a clear exit path out of the tower
            const exitFirst = this.topology.canBlockSlideOut(first);
            const exitSecond = this.topology.canBlockSlideOut(second);

            if (!exitFirst.canExit || !exitSecond.canExit) {
                sound.playMismatch();
                if (!exitFirst.canExit && !exitSecond.canExit) {
                    this.showToast('🚫 Both blocks are blocked! Clear their exit paths first.');
                    this.renderer.shakeBlock(first.id);
                    this.renderer.shakeBlock(second.id);
                } else if (!exitFirst.canExit) {
                    this.showToast(`🚫 Block [${firstDisp}] is obstructed! Clear its path first.`);
                    this.renderer.shakeBlock(first.id);
                } else {
                    this.showToast(`🚫 Block [${secondDisp}] is obstructed! Clear its path first.`);
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
                sound.playMatch(this.comboCount);
            }

            if (this.comboCount > 1) {
                this.showToast(`🔥 COMBO x${this.comboCount}! +${pointsEarned} PTS!`, 2000);
            } else {
                this.showToast(`✨ ${firstDisp} + ${secondDisp} = 10! +${pointsEarned} PTS`, 1600);
            }

            setTimeout(() => {
                sound.playWhoosh();
                this.renderer.flyOutBlocks([first.id, second.id]);
                this.topology.removeBlock(first.id);
                this.topology.removeBlock(second.id);

                this.score += pointsEarned;
                this.selectedBlock = null;
                this._updateSelectionUI(null, null);
                this.updateStats();

                // Downward Gravity Fall (Jarrows style)
                setTimeout(() => {
                    const fallen = this.topology.settleGravity();
                    if (fallen.length > 0) {
                        this.renderer.animateFallingBlocks(fallen, this.topology.cellSize, () => {
                            sound.playLandThud();
                            this.isProcessingMatch = false;
                            this._checkDeadlock();
                        });
                    } else {
                        this.isProcessingMatch = false;
                        this._checkDeadlock();
                    }
                }, 150);

                if (this.topology.blocks.size === 0) {
                    this.score += 500; // Level clear bonus
                    this.showToast(`🎉 LEVEL ${this.currentLevel} CLEARED! +500 Bonus!`, 3500);
                    setTimeout(() => {
                        this.startLevel(this.currentLevel + 1);
                    }, 2500);
                }
            }, 300);
        } else {
            // MISMATCH
            sound.playMismatch();
            this.showToast(`❌ ${first.value} + ${second.value} = ${sum} (Need 10)`);
            this.renderer.shakeBlock(first.id);
            this.renderer.shakeBlock(second.id);

            setTimeout(() => {
                this.renderer.setBlockSelected(first.id, false);
                this.renderer.setBlockSelected(second.id, false);
                this.selectedBlock = null;
                this._updateSelectionUI(null, null);
            }, 400);
        }
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
                });
            } else {
                this.isProcessingMatch = false;
                this._checkDeadlock();
            }
        }, 200);

        if (this.topology.blocks.size === 0) {
            this.score += 500;
            this.showToast(`🎉 LEVEL ${this.currentLevel} CLEARED! +500 Bonus!`, 3500);
            setTimeout(() => {
                this.startLevel(this.currentLevel + 1);
            }, 2500);
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new Sum10Game();
});
