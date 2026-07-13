// frontend/lib/audio-annunciator.ts
// Industrial Audio Siren & Speech Synthesizer for Sentinel X

let audioCtx: AudioContext | null = null;
let sirenOsc1: OscillatorNode | null = null;
let sirenOsc2: OscillatorNode | null = null;
let sirenGain: GainNode | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioCtx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/** Play industrial dual-tone siren (880Hz / 440Hz pulse) */
export function playIndustrialSiren(durationMs: number = 4000): void {
  try {
    const ctx = getAudioContext();
    stopAudioAlert();

    sirenOsc1 = ctx.createOscillator();
    sirenOsc2 = ctx.createOscillator();
    sirenGain = ctx.createGain();

    // Dual tone frequency
    sirenOsc1.type = 'sawtooth';
    sirenOsc1.frequency.setValueAtTime(880, ctx.currentTime);

    sirenOsc2.type = 'sine';
    sirenOsc2.frequency.setValueAtTime(440, ctx.currentTime);

    // Pulse modulation
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 4;
    lfo.connect(sirenOsc1.frequency);
    lfo.start();

    sirenGain.gain.setValueAtTime(0.15, ctx.currentTime);
    sirenGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

    sirenOsc1.connect(sirenGain);
    sirenOsc2.connect(sirenGain);
    sirenGain.connect(ctx.destination);

    sirenOsc1.start();
    sirenOsc2.start();

    setTimeout(() => {
      stopAudioAlert();
    }, durationMs);
  } catch (e) {
    console.warn('AudioContext not allowed or unsupported:', e);
  }
}

/** Announce clear voice alert using SpeechSynthesis */
export function announceSafetyAlert(text: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Zira') || v.name.includes('David'))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Speech synthesis error:', e);
  }
}

/** Stop all siren and speech audio */
export function stopAudioAlert(): void {
  try {
    if (sirenOsc1) {
      sirenOsc1.stop();
      sirenOsc1.disconnect();
      sirenOsc1 = null;
    }
    if (sirenOsc2) {
      sirenOsc2.stop();
      sirenOsc2.disconnect();
      sirenOsc2 = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  } catch (e) {
    // Ignore cleanup errors
  }
}
