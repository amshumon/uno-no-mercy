import { useCallback } from 'react';

export function useSound() {
  const unlockAudio = useCallback(() => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    } catch (e) {
        // Silent fail
    }
  }, []);

  const playBeep = useCallback((freq = 440, type: OscillatorType = 'sine', duration = 100, vol = 0.1) => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioCtx.state === 'suspended') return; // Wait for unlock
        
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = type;
        oscillator.frequency.value = freq;
        
        gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (duration / 1000));
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + (duration / 1000));
    } catch (e) {
        // Silent fail
    }
  }, []);

  const playCard = useCallback(() => {
     playBeep(600, 'triangle', 60, 0.1);
     if (navigator.vibrate) navigator.vibrate(20);
  }, [playBeep]);

  const drawCard = useCallback(() => {
     playBeep(400, 'sine', 150, 0.05);
     if (navigator.vibrate) navigator.vibrate(10);
  }, [playBeep]);

  const turnNotify = useCallback(() => {
     playBeep(880, 'sine', 100, 0.1);
     setTimeout(() => playBeep(1108, 'sine', 150, 0.1), 80);
     if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
  }, [playBeep]);

  const winGame = useCallback(() => {
     const freqs = [523, 659, 783, 1046]; // C major chord
     freqs.forEach((f, i) => {
         setTimeout(() => playBeep(f, 'sine', 500, 0.1), i * 150);
     });
     if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 500]);
  }, [playBeep]);
  
  const errorSound = useCallback(() => {
     playBeep(150, 'sawtooth', 200, 0.2);
     if (navigator.vibrate) navigator.vibrate([200, 100]);
  }, [playBeep]);

  const fartSound = useCallback(() => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(100, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {}
  }, []);

  const winPotSound = useCallback(() => {
    [523, 659, 783, 1046].forEach((f, i) => {
        setTimeout(() => playBeep(f, 'sine', 100, 0.1), i * 100);
    });
  }, [playBeep]);

  const sadTrombone = useCallback(() => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 1.0);
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.0);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 1.0);
    } catch (e) {}
  }, []);

  return { playCard, drawCard, winGame, errorSound, turnNotify, unlockAudio, fartSound, winPotSound, sadTrombone };
}
