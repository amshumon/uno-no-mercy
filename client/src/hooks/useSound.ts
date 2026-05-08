import { Howl } from 'howler';
import { useCallback, useRef, useEffect } from 'react';

// For this project we will simulate sounds with simple web audio oscillator beeps
// since we don't have actual sound files available in the directory.
export function useSound() {
  const playBeep = useCallback((freq = 440, type = 'sine', duration = 100, vol = 0.1) => {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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
        console.error("Audio play failed", e);
    }
  }, []);

  const playCard = useCallback(() => {
     playBeep(600, 'triangle', 80, 0.2);
     if (navigator.vibrate) navigator.vibrate(50);
  }, [playBeep]);

  const drawCard = useCallback(() => {
     playBeep(400, 'sine', 100, 0.1);
     if (navigator.vibrate) navigator.vibrate(30);
  }, [playBeep]);

  const winGame = useCallback(() => {
     playBeep(800, 'square', 200, 0.2);
     setTimeout(() => playBeep(1000, 'square', 400, 0.2), 200);
     if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
  }, [playBeep]);
  
  const errorSound = useCallback(() => {
     playBeep(200, 'sawtooth', 150, 0.3);
     if (navigator.vibrate) navigator.vibrate([100, 100, 100]);
  }, [playBeep]);

  return { playCard, drawCard, winGame, errorSound };
}
