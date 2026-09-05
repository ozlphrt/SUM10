import './style.css';
import { TopologyGenerator } from './topology/TopologyGenerator.js';
import { TowerRenderer } from './render/TowerRenderer.js';
import { sound } from './audio/SoundEffects.js';

class Sum10Game {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.scoreElem = document.getElementById('val-score');
        this.remainingElem = document.getElementById('val-remaining');
        this.slot1Elem = document.getElementById('slot-1');
        this.slot2Elem = document.getElementById('slot-2');
        this.toastElem = document.getElementById('toast-msg');
        this.btnNewGame = document.getElementById('btn-new-game');

        this.generator = new TopologyGenerator({
            targetPairCount: 12, // 24 blocks
            gridSize: 5
        });

        this.topology = null;
        this.selectedBlock = null;
        this.score = 0;
        this.isProcessingMatch = false;

        this.renderer = new TowerRenderer(this.container, {
            onBlockClick: (block) => this.handleBlockClick(block)
        });

        this.btnNewGame.addEventListener('click', () => this.startNewGame());

        this.startNewGame();
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

    startNewGame() {
        this.selectedBlock = null;
        this.isProcessingMatch = false;
        this._updateSelectionUI(null, null);

        this.topology = this.generator.generate();
        this.renderer.setTopology(this.topology);

        this.updateStats();
        this.showToast('🎯 Find two blocks summing to 10!');
    }

    updateStats() {
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
            this._updateSelectionUI(block.value, null);
            sound.playSelect();
            const needed = 10 - block.value;
            this.showToast(`Selected [${block.value}]. Tap a [${needed}]!`);
            return;
        }

        // Second block selected -> evaluate sum
        const first = this.selectedBlock;
        const second = block;
        this.renderer.setBlockSelected(second.id, true);
        this._updateSelectionUI(first.value, second.value);

        const sum = first.value + second.value;

        if (sum === 10) {
            // MATCH!
            this.isProcessingMatch = true;
            sound.playMatch();
            this.showToast(`✨ ${first.value} + ${second.value} = 10! Blocks flying out!`);

            setTimeout(() => {
                sound.playWhoosh();
                this.renderer.flyOutBlocks([first.id, second.id]);
                this.topology.removeBlock(first.id);
                this.topology.removeBlock(second.id);

                this.score += 100;
                this.selectedBlock = null;
                this.isProcessingMatch = false;
                this._updateSelectionUI(null, null);
                this.updateStats();

                if (this.topology.blocks.size === 0) {
                    this.showToast('🎉 TOWER CLEARED! Spectacular job!', 4000);
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
}

window.addEventListener('DOMContentLoaded', () => {
    new Sum10Game();
});
