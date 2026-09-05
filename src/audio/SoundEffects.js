/**
 * Tactile ASMR Clicky Sound Engine for SUM10.
 * Purely physical, acoustic, and mechanical clicks, snaps, and tile taps.
 * Zero video-game synth bells or arcade chimes.
 */
class SoundEffects {
    constructor() {
        this.ctx = null;
        this.enabled = (function() {
            try {
                return localStorage.getItem('sum10_audio') !== 'false';
            } catch (_) {
                return true;
            }
        })();
    }

    toggle() {
        this.enabled = !this.enabled;
        try {
            localStorage.setItem('sum10_audio', String(this.enabled));
        } catch (_) {}
        return this.enabled;
    }

    _ensureAudio() {
        if (!this.enabled) return;
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    /**
     * Core micro-click generator: synthesizes a crisp tactile mechanical impulse
     * + high-frequency friction snap (like a mechanical switch or ceramic tile impact).
     */
    _createClick(time, freq = 2400, duration = 0.016, volume = 0.35) {
        if (!this.ctx) return;

        // 1. Sharp physical impulse transient
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.25, time + duration);
        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + duration);

        // 2. Friction texture burst (dry micro-snap)
        const bufLen = Math.max(16, Math.floor(this.ctx.sampleRate * duration));
        const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.0035));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buf;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1400, time);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(volume * 0.65, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        noise.start(time);
    }

    /**
     * Block selection: crisp tactile switch click with pitch scaled to physical block length.
     * 1-cell: light crisp micro-tick, 2-cell: balanced click, 3-cell: deep solid clack.
     * @param {number} [length=1]
     */
    playSelect(length = 1) {
        if (!this.enabled) return;
        this._ensureAudio();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const freq = 2900 - (Math.min(3, Math.max(1, length)) - 1) * 550;
        this._createClick(now, freq, 0.015, 0.32);
    }

    /**
     * Pair match: satisfying tactile double-tile snap scaled to block physical weights.
     * @param {number} [combo=1]
     * @param {number} [len1=1]
     * @param {number} [len2=1]
     */
    playMatch(combo = 1, len1 = 1, len2 = 1) {
        if (!this.enabled) return;
        this._ensureAudio();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        const comboBonus = Math.min(350, (combo - 1) * 70);
        const freq1 = 2550 - (Math.min(3, Math.max(1, len1)) - 1) * 450 + comboBonus;
        const freq2 = 2900 - (Math.min(3, Math.max(1, len2)) - 1) * 450 + comboBonus;

        // First tile strike
        this._createClick(now, freq1, 0.018, 0.38);
        // Second tile lock snap (25ms later)
        this._createClick(now + 0.024, freq2, 0.016, 0.44);
    }

    /**
     * Finger flick impulse: sharp physical snap pop + fast dry air whoosh.
     * @param {number} [length=1]
     */
    playFlick(length = 1) {
        if (!this.enabled) return;
        this._ensureAudio();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        const len = Math.min(3, Math.max(1, length));
        const snapFreq = 3400 - (len - 1) * 450;
        const bodyFreq = 2000 - (len - 1) * 350;

        // Sharp physical finger-snap impulse
        this._createClick(now, snapFreq, 0.022, 0.52);
        this._createClick(now + 0.010, bodyFreq, 0.018, 0.36);

        // Fast dry air whoosh
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.12);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.025));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1100, now);
        filter.frequency.exponentialRampToValueAtTime(320, now + 0.12);
        filter.Q.setValueAtTime(1.8, now);
        const gainNoise = this.ctx.createGain();
        gainNoise.gain.setValueAtTime(0.28, now);
        gainNoise.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        noise.connect(filter);
        filter.connect(gainNoise);
        gainNoise.connect(this.ctx.destination);
        noise.start(now);
    }

    playWhoosh(length = 1) {
        this.playFlick(length);
    }

    /**
     * Mismatch: muted, dry double-tick / subtle friction tap. Zero harsh buzzers.
     */
    playMismatch() {
        if (!this.enabled) return;
        this._ensureAudio();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Muted low-frequency woodblock double tap
        this._createClick(now, 680, 0.016, 0.24);
        this._createClick(now + 0.042, 540, 0.016, 0.22);
    }

    /**
     * Gravity landing: dry solid ceramic tile tap settling flat on shelf.
     * @param {number} [length=1]
     */
    playLandThud(length = 1) {
        if (!this.enabled) return;
        this._ensureAudio();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        const len = Math.min(3, Math.max(1, length));
        const contactFreq = 1600 - (len - 1) * 300;
        const bodyFreq = 250 - (len - 1) * 45;

        // Sharp surface contact tick
        this._createClick(now, contactFreq, 0.016, 0.32);

        // Low solid shelf body tap
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(bodyFreq, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.032);
        gain.gain.setValueAtTime(0.26, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.032);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.032);
    }

    /**
     * Wildcard activation: 3 rapid precision ratchet micro-clicks (like a mechanical watch winding).
     */
    playWildChime() {
        if (!this.enabled) return;
        this._ensureAudio();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        [0, 0.032, 0.064].forEach((tOffset, i) => {
            this._createClick(now + tOffset, 2800 + i * 360, 0.014, 0.32);
        });
    }

    /**
     * Deadlock shuffle: crisp rapid cascade of physical tile shuffle clicks.
     */
    playShuffle() {
        if (!this.enabled) return;
        this._ensureAudio();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        for (let i = 0; i < 6; i++) {
            const t = now + i * 0.045;
            const freq = 1800 + Math.random() * 800;
            this._createClick(t, freq, 0.015, 0.32);
        }
    }

    /**
     * Level Complete: satisfying cascading domino clicks ending in a solid lock snap.
     */
    playLevelComplete() {
        if (!this.enabled) return;
        this._ensureAudio();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // 5 rapid cascading tactile clicks
        [0, 0.04, 0.08, 0.12, 0.17].forEach((t, i) => {
            this._createClick(now + t, 1900 + i * 320, 0.016, 0.34);
        });
        // Final solid latch snap
        this._createClick(now + 0.24, 3400, 0.024, 0.52);
        this._createClick(now + 0.25, 1500, 0.032, 0.38);
    }

    /**
     * Bomb explosion: punchy physical timber crack + rubble snap.
     */
    playExplosion() {
        if (!this.enabled) return;
        this._ensureAudio();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Heavy tactile impact crack
        this._createClick(now, 1600, 0.035, 0.58);
        this._createClick(now + 0.018, 920, 0.045, 0.48);

        const bufLen = Math.floor(this.ctx.sampleRate * 0.22);
        const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) {
            d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.04));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(460, now);
        filter.frequency.exponentialRampToValueAtTime(60, now + 0.22);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.48, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(now);
    }
}

export const sound = new SoundEffects();
