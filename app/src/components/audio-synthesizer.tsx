"use client";

import { useRef, useCallback } from 'react';

export function useAudioSynthesizer() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSoundsRef = useRef<Set<OscillatorNode>>(new Set());

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  };

  const playDoomStyleMusic = useCallback(() => {
    const audioContext = getAudioContext();
    
    // Create a dark, industrial background track
    const createDoomTrack = () => {
      const gainNode = audioContext.createGain();
      gainNode.connect(audioContext.destination);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

      // Bass drone
      const bassOsc = audioContext.createOscillator();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(55, audioContext.currentTime); // Low A
      bassOsc.connect(gainNode);
      bassOsc.start();

      // Add some distortion with a filter
      const filter = audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, audioContext.currentTime);
      filter.Q.setValueAtTime(15, audioContext.currentTime);
      bassOsc.disconnect();
      bassOsc.connect(filter);
      filter.connect(gainNode);

      // Rhythmic industrial sounds
      const playIndustrialHit = () => {
        const hitGain = audioContext.createGain();
        hitGain.connect(audioContext.destination);
        hitGain.gain.setValueAtTime(0.15, audioContext.currentTime);
        hitGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);

        const hitOsc = audioContext.createOscillator();
        hitOsc.type = 'square';
        hitOsc.frequency.setValueAtTime(110, audioContext.currentTime);
        hitOsc.frequency.exponentialRampToValueAtTime(55, audioContext.currentTime + 0.1);
        hitOsc.connect(hitGain);
        hitOsc.start();
        hitOsc.stop(audioContext.currentTime + 0.3);
      };

      // Play industrial hits rhythmically
      const scheduleHits = () => {
        playIndustrialHit();
        setTimeout(scheduleHits, 800 + Math.random() * 400);
      };
      
      scheduleHits();
      currentSoundsRef.current.add(bassOsc);

      return () => {
        bassOsc.stop();
        currentSoundsRef.current.delete(bassOsc);
      };
    };

    return createDoomTrack();
  }, []);

  const playFootstep = useCallback(() => {
    const audioContext = getAudioContext();
    
    const gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);

    // Metal footstep sound
    const osc = audioContext.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150 + Math.random() * 50, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, audioContext.currentTime + 0.1);
    
    const filter = audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, audioContext.currentTime);
    filter.Q.setValueAtTime(10, audioContext.currentTime);
    
    osc.connect(filter);
    filter.connect(gainNode);
    osc.start();
    osc.stop(audioContext.currentTime + 0.2);
  }, []);

  const playAmbientHum = useCallback(() => {
    const audioContext = getAudioContext();
    
    const gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
    gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);

    // Low frequency ambient hum
    const osc = audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(40, audioContext.currentTime);
    
    // Add some modulation for spookiness
    const lfo = audioContext.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.1, audioContext.currentTime);
    
    const lfoGain = audioContext.createGain();
    lfoGain.gain.setValueAtTime(5, audioContext.currentTime);
    
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    
    osc.connect(gainNode);
    lfo.start();
    osc.start();
    
    currentSoundsRef.current.add(osc);
    currentSoundsRef.current.add(lfo);

    return () => {
      osc.stop();
      lfo.stop();
      currentSoundsRef.current.delete(osc);
      currentSoundsRef.current.delete(lfo);
    };
  }, []);

  const stopAllSounds = useCallback(() => {
    currentSoundsRef.current.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // Oscillator might already be stopped
      }
    });
    currentSoundsRef.current.clear();
  }, []);

  return {
    playDoomStyleMusic,
    playFootstep,
    playAmbientHum,
    stopAllSounds,
  };
}