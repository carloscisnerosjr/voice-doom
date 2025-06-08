"use client";

import { useRef, useCallback, useEffect } from 'react';

interface UseAudioReturn {
  playMusic: (track: string, loop?: boolean) => void;
  stopMusic: () => void;
  playSound: (sound: string, volume?: number) => void;
  setMusicVolume: (volume: number) => void;
  setSFXVolume: (volume: number) => void;
}

export function useAudio(): UseAudioReturn {
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const musicVolumeRef = useRef(0.3);
  const sfxVolumeRef = useRef(0.5);

  useEffect(() => {
    // Cleanup audio on unmount
    return () => {
      if (musicRef.current) {
        musicRef.current.pause();
        musicRef.current.src = '';
      }
    };
  }, []);

  const playMusic = useCallback((track: string, loop: boolean = true) => {
    try {
      // Stop current music
      if (musicRef.current) {
        musicRef.current.pause();
        musicRef.current.src = '';
      }

      // Create new audio instance
      const audio = new Audio(`/audio/music/${track}`);
      audio.loop = loop;
      audio.volume = musicVolumeRef.current;
      
      // Handle errors
      audio.onerror = () => {
        console.warn(`[Audio] Failed to load music: ${track}`);
      };

      // Play the audio
      audio.play().catch(error => {
        console.warn('[Audio] Music playback failed:', error);
      });

      musicRef.current = audio;
    } catch (error) {
      console.warn('[Audio] Error playing music:', error);
    }
  }, []);

  const stopMusic = useCallback(() => {
    if (musicRef.current) {
      musicRef.current.pause();
      musicRef.current.src = '';
      musicRef.current = null;
    }
  }, []);

  const playSound = useCallback((sound: string, volume: number = 1) => {
    try {
      const audio = new Audio(`/audio/sfx/${sound}`);
      audio.volume = sfxVolumeRef.current * volume;
      
      audio.onerror = () => {
        console.warn(`[Audio] Failed to load sound: ${sound}`);
      };

      audio.play().catch(error => {
        console.warn('[Audio] Sound playback failed:', error);
      });
    } catch (error) {
      console.warn('[Audio] Error playing sound:', error);
    }
  }, []);

  const setMusicVolume = useCallback((volume: number) => {
    musicVolumeRef.current = Math.max(0, Math.min(1, volume));
    if (musicRef.current) {
      musicRef.current.volume = musicVolumeRef.current;
    }
  }, []);

  const setSFXVolume = useCallback((volume: number) => {
    sfxVolumeRef.current = Math.max(0, Math.min(1, volume));
  }, []);

  return {
    playMusic,
    stopMusic,
    playSound,
    setMusicVolume,
    setSFXVolume,
  };
}