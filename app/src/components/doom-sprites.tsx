"use client";

import { useCallback } from 'react';

export interface Sprite {
  x: number;
  y: number;
  texture: string;
  width: number;
  height: number;
  distance?: number;
}

export interface Enemy extends Sprite {
  type: 'imp' | 'demon' | 'zombieman';
  health: number;
  angle: number;
  state: 'idle' | 'walking' | 'attacking' | 'dead';
}

export interface Weapon {
  name: string;
  sprite: string;
  damage: number;
  fireRate: number;
  ammo: number;
}

export function useDoomSprites() {
  
  // Create procedural weapon sprites
  const createWeaponSprite = useCallback((weapon: string): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 150;
    const ctx = canvas.getContext('2d')!;
    
    if (weapon === 'pistol') {
      // Draw pistol sprite
      ctx.fillStyle = '#444444';
      ctx.fillRect(80, 60, 40, 80);
      
      // Barrel
      ctx.fillStyle = '#666666';
      ctx.fillRect(85, 30, 30, 40);
      
      // Handle
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(75, 100, 20, 40);
      
      // Muzzle flash (when firing)
      ctx.fillStyle = '#FFFF00';
      ctx.fillRect(90, 20, 20, 15);
      
      // Highlight
      ctx.fillStyle = '#888888';
      ctx.fillRect(82, 62, 3, 30);
      
    } else if (weapon === 'shotgun') {
      // Draw shotgun sprite
      ctx.fillStyle = '#5D4E37';
      ctx.fillRect(60, 50, 80, 20);
      
      // Barrel
      ctx.fillStyle = '#2F2F2F';
      ctx.fillRect(55, 45, 90, 10);
      
      // Stock
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(130, 55, 40, 25);
      
      // Pump
      ctx.fillStyle = '#444444';
      ctx.fillRect(90, 70, 25, 15);
    }
    
    return canvas.toDataURL();
  }, []);

  // Create enemy sprites
  const createEnemySprite = useCallback((enemyType: string, state: string = 'idle'): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    
    if (enemyType === 'imp') {
      // Brown imp-like creature
      ctx.fillStyle = '#8B4513';
      
      // Body
      ctx.fillRect(20, 30, 24, 30);
      
      // Head
      ctx.fillStyle = '#A0522D';
      ctx.fillRect(24, 15, 16, 20);
      
      // Eyes (red)
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(27, 20, 3, 3);
      ctx.fillRect(34, 20, 3, 3);
      
      // Arms
      ctx.fillStyle = '#8B4513';
      if (state === 'attacking') {
        ctx.fillRect(10, 25, 12, 8);
        ctx.fillRect(42, 25, 12, 8);
      } else {
        ctx.fillRect(15, 35, 8, 15);
        ctx.fillRect(41, 35, 8, 15);
      }
      
      // Legs
      ctx.fillRect(22, 55, 6, 9);
      ctx.fillRect(36, 55, 6, 9);
      
    } else if (enemyType === 'zombieman') {
      // Gray zombie soldier
      ctx.fillStyle = '#556B2F';
      
      // Body (uniform)
      ctx.fillRect(22, 30, 20, 28);
      
      // Head
      ctx.fillStyle = '#DEB887';
      ctx.fillRect(25, 18, 14, 16);
      
      // Eyes
      ctx.fillStyle = '#000000';
      ctx.fillRect(28, 22, 2, 2);
      ctx.fillRect(34, 22, 2, 2);
      
      // Rifle
      ctx.fillStyle = '#2F2F2F';
      ctx.fillRect(15, 32, 12, 3);
      
      // Legs
      ctx.fillStyle = '#556B2F';
      ctx.fillRect(24, 55, 6, 9);
      ctx.fillRect(34, 55, 6, 9);
    }
    
    return canvas.toDataURL();
  }, []);

  // Create item sprites
  const createItemSprite = useCallback((itemType: string): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    
    if (itemType === 'healthpack') {
      // Red cross health pack
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(4, 4, 24, 24);
      
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(12, 8, 8, 16);
      ctx.fillRect(8, 12, 16, 8);
      
    } else if (itemType === 'ammo') {
      // Ammo clip
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(8, 10, 16, 12);
      
      ctx.fillStyle = '#B8860B';
      ctx.fillRect(10, 8, 4, 16);
      ctx.fillRect(18, 8, 4, 16);
      
    } else if (itemType === 'armor') {
      // Green armor vest
      ctx.fillStyle = '#228B22';
      ctx.fillRect(6, 8, 20, 20);
      
      ctx.fillStyle = '#32CD32';
      ctx.fillRect(8, 10, 6, 6);
      ctx.fillRect(18, 10, 6, 6);
      ctx.fillRect(8, 18, 16, 6);
    }
    
    return canvas.toDataURL();
  }, []);

  // Create wall textures
  const createWallTexture = useCallback((wallType: string): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    
    if (wallType === 'brick') {
      // Red brick wall
      ctx.fillStyle = '#8B0000';
      ctx.fillRect(0, 0, 64, 64);
      
      // Mortar lines
      ctx.fillStyle = '#696969';
      for (let y = 0; y < 64; y += 16) {
        ctx.fillRect(0, y, 64, 2);
      }
      for (let x = 0; x < 64; x += 32) {
        ctx.fillRect(x, 0, 2, 64);
      }
      
      // Offset every other row
      ctx.fillRect(16, 16, 2, 16);
      ctx.fillRect(48, 32, 2, 16);
      
    } else if (wallType === 'metal') {
      // Tech wall with panels
      ctx.fillStyle = '#2F4F4F';
      ctx.fillRect(0, 0, 64, 64);
      
      // Panel lines
      ctx.fillStyle = '#708090';
      ctx.fillRect(0, 20, 64, 2);
      ctx.fillRect(0, 42, 64, 2);
      ctx.fillRect(20, 0, 2, 64);
      ctx.fillRect(42, 0, 2, 64);
      
      // Rivets
      ctx.fillStyle = '#C0C0C0';
      for (let x = 8; x < 64; x += 24) {
        for (let y = 8; y < 64; y += 24) {
          ctx.fillRect(x, y, 2, 2);
        }
      }
      
    } else if (wallType === 'hell') {
      // Hellish red wall
      ctx.fillStyle = '#8B0000';
      ctx.fillRect(0, 0, 64, 64);
      
      // Organic texture
      ctx.fillStyle = '#A52A2A';
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * 64;
        const y = Math.random() * 64;
        const size = Math.random() * 8 + 2;
        ctx.fillRect(x, y, size, size);
      }
      
      // Glowing veins
      ctx.fillStyle = '#FF4500';
      ctx.fillRect(10, 0, 2, 64);
      ctx.fillRect(35, 0, 1, 64);
      ctx.fillRect(52, 0, 2, 64);
    }
    
    return canvas.toDataURL();
  }, []);

  // Weapon data
  const weapons: { [key: string]: Weapon } = {
    pistol: {
      name: 'Pistol',
      sprite: 'pistol',
      damage: 10,
      fireRate: 500, // ms between shots
      ammo: 50
    },
    shotgun: {
      name: 'Shotgun', 
      sprite: 'shotgun',
      damage: 30,
      fireRate: 800,
      ammo: 20
    }
  };

  return {
    createWeaponSprite,
    createEnemySprite,
    createItemSprite,
    createWallTexture,
    weapons
  };
}