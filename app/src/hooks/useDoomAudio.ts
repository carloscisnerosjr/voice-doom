"use client";

import { useRef, useCallback, useEffect } from 'react';

interface UseDoomAudioReturn {
  playMusic: (track: string) => void;
  stopMusic: () => void;
  playSound: (sound: string, volume?: number) => void;
  playFootstep: () => void;
  playShoot: () => void;
  setMusicVolume: (volume: number) => void;
  setSFXVolume: (volume: number) => void;
}

export function useDoomAudio(): UseDoomAudioReturn {
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const musicVolumeRef = useRef(0.3);
  const sfxVolumeRef = useRef(0.7);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (musicRef.current) {
        musicRef.current.pause();
        musicRef.current.src = '';
      }
    };
  }, []);

  const playMusic = useCallback((track: string) => {
    try {
      console.log('[DoomAudio] Playing music:', track);
      
      // Stop current music
      if (musicRef.current) {
        musicRef.current.pause();
        musicRef.current.src = '';
      }

      // Create new audio instance
      const audio = new Audio(`/audio/music/${track}`);
      audio.loop = true;
      audio.volume = musicVolumeRef.current;
      
      // Handle errors
      audio.onerror = (e) => {
        console.warn(`[DoomAudio] Failed to load music: ${track}`, e);
      };

      // Play the audio
      audio.play().then(() => {
        console.log('[DoomAudio] Music started successfully');
      }).catch(error => {
        console.warn('[DoomAudio] Music playback failed:', error);
      });

      musicRef.current = audio;
    } catch (error) {
      console.warn('[DoomAudio] Error playing music:', error);
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
      // Try different audio formats and paths
      const audioSources = [
        `/audio/sfx/${sound}.mp3`,
        `/audio/sfx/${sound}.wav`,
        `/audio/sfx/${sound}`, // In case extension is included
      ];

      const tryPlayAudio = (srcIndex: number) => {
        if (srcIndex >= audioSources.length) {
          console.warn(`[DoomAudio] Failed to load sound: ${sound} from any source`);
          return;
        }

        const audio = new Audio(audioSources[srcIndex]);
        audio.volume = sfxVolumeRef.current * volume;
        
        audio.onerror = () => {
          // Try next source
          tryPlayAudio(srcIndex + 1);
        };

        audio.play().then(() => {
          console.log(`[DoomAudio] Played sound: ${sound} from ${audioSources[srcIndex]}`);
        }).catch(error => {
          console.warn(`[DoomAudio] Sound playback failed for ${audioSources[srcIndex]}:`, error);
          tryPlayAudio(srcIndex + 1);
        });
      };

      tryPlayAudio(0);
    } catch (error) {
      console.warn('[DoomAudio] Error playing sound:', sound, error);
    }
  }, []);

  // Specific sound effects
  const playFootstep = useCallback(() => {
    // Try authentic sounds first, fallback to generic
    const footstepSounds = ['footstep', 'step', 'walk'];
    playSound(footstepSounds[Math.floor(Math.random() * footstepSounds.length)], 0.4);
  }, [playSound]);

  const playShoot = useCallback(() => {
    // Try different weapon sounds
    const shootSounds = ['pistol', 'shoot', 'fire', 'gun'];
    playSound(shootSounds[Math.floor(Math.random() * shootSounds.length)], 0.8);
  }, [playSound]);

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
    playFootstep,
    playShoot,
    setMusicVolume,
    setSFXVolume,
  };
}