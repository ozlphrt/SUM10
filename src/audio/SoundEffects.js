/**
 * Procedural Web Audio synthesizer for tactile UI and game feedback.
 * No external sound files or assets required.
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

    playSelect() {
        if (!this.enabled) return;
        this._ensureAudio();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Mallet transient click (wooden strike)
        const oscClick = this.ctx.createOscillator();
        const gainClick = this.ctx.createGain();
        oscClick.type = 'triangle';
        oscClick.frequency.setValueAtTime(1200, now);
        oscClick.frequency.exponentialRampToValueAtTime(300, now + 0.02);
        gainClick.gain.setValueAtTime(0.18, now);
        gainClick.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
        oscClick.connect(gainClick);
        gainClick.connect(this.ctx.destination);
        oscClick.start(now);
        oscClick.stop(now + 0.02);

        // Warm wooden marimba body resonance
        const oscBody = this.ctx.createOscillator();
        const gainBody = this.ctx.createGain();
        oscBody.type = 'sine';
        oscBody.frequency.setValueAtTime(540, now);
        oscBody.frequency.exponentialRampToValueAtTime(420, now + 0.06);
        gainBody.gain.setValueAtTime(0.24, now);
        gainBody.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        oscBody.connect(gainBody);
        gainBody.connect(this.ctx.destination);
        oscBody.start(now);
        oscBody.stop(now + 0.06);
    }

    playMatch(combo = 1) {
        if (!this.enabled) return;
        this._ensureAudio();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Pitch scales gently with combo streak
        const pitchMult = 1.0 + Math.min(0.8, (combo - 1) * 0.15);
        const glassChord = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

        glassChord.forEach((f0, idx) => {
            const freq = f0 * pitchMult;
            const t = now + idx * 0.045;

            // Fundamental glass bell resonance
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.22, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.45);

            // Crystalline overtone (inharmonic glass vibration mode at 2.76x)
            const oscGlass = this.ctx.createOscillator();
            const gainGlass = this.ctx.createGain();
            oscGlass.type = 'sine';
            oscGlass.frequency.setValueAtTime(freq * 2.76, t);
            gainGlass.gain.setValueAtTime(0.08, t);
            gainGlass.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
            oscGlass.connect(gainGlass);
            gainGlass.connect(this.ctx.destination);
            oscGlass.start(t);
            oscGlass.stop(t + 0.25);
        });
    }

    playMismatch() {
        if (!this.enabled) return;
        this._ensureAudio();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Gentle double hollow woodblock tap
        [0, 0.08].forEach((delay, i) => {
            const t = now + delay;
            const freq = i === 0 ? 260 : 200;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.7, t + 0.07);

            gain.gain.setValueAtTime(0.18, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.07);
        });
    }

    playWhoosh() {
        if (!this.enabled) return;
        this._ensureAudio();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Organic wooden drawer glide
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.25);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(480, now);
        filter.frequency.exponentialRampToValueAtTime(140, now + 0.25);
        filter.Q.setValueAtTime(2.5, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);
    }

    playLandThud() {
        if (!this.enabled) return;
        this._ensureAudio();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Muted ceramic/wood landing thud
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.1);

        gain.gain.setValueAtTime(0.32, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.1);
    }

    playExplosion() {
        if (!this.enabled) return;
        this._ensureAudio();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        const bufferSize = this.ctx.sampleRate * 0.35;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.09));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(700, now);
        filter.frequency.exponentialRampToValueAtTime(50, now + 0.35);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.55, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);
    }

    playWildChime() {
        if (!this.enabled) return;
        this._ensureAudio();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const glassNotes = [587.33, 739.99, 880.00, 1174.66, 1479.98]; // D5, F#5, A5, D6, F#6

        glassNotes.forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const t = now + i * 0.035;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, t);
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.35);
        });
    }

    playLevelComplete() {
        if (!this.enabled) return;
        this._ensureAudio();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const arpeggio = [523.25, 659.25, 783.99, 987.77, 1046.50, 1318.51]; // C5, E5, G5, B5, C6, E6

        arpeggio.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const t = now + idx * 0.075;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.22, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.65);
        });
    }
}

export const sound = new SoundEffects();
