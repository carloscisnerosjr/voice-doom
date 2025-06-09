"use client";

import { useState, useRef, useCallback } from 'react';
import { Enemy, Sprite } from '@/components/doom-sprites';

interface Player {
  x: number;
  y: number;
  angle: number;
  speed: number;
  health: number;
  armor: number;
  weapon: string;
  ammo: { [key: string]: number };
}

interface GameItem extends Sprite {
  type: 'healthpack' | 'ammo' | 'armor' | 'weapon';
  value: number;
  collected: boolean;
}

interface GameState {
  player: Player;
  enemies: Enemy[];
  items: GameItem[];
  score: number;
  level: number;
}

export function useDoomGameState() {
  const [gameState, setGameState] = useState<GameState>({
    player: {
      x: 1.5,
      y: 1.5,
      angle: 0,
      speed: 0.03,
      health: 100,
      armor: 0,
      weapon: 'pistol',
      ammo: { pistol: 50, shotgun: 20 }
    },
    enemies: [],
    items: [],
    score: 0,
    level: 1
  });

  const lastEnemyUpdateRef = useRef<number>(0);

  // Initialize level with enemies and items
  const initializeLevel = useCallback((levelNumber: number = 1) => {
    const enemies: Enemy[] = [];
    const items: GameItem[] = [];

    // Place enemies in strategic locations
    const enemyPositions = [
      { x: 8, y: 3, type: 'imp' as const },
      { x: 12, y: 7, type: 'zombieman' as const },
      { x: 6, y: 9, type: 'imp' as const },
      { x: 10, y: 5, type: 'zombieman' as const },
      { x: 4, y: 6, type: 'imp' as const },
    ];

    enemyPositions.forEach((pos, index) => {
      enemies.push({
        x: pos.x,
        y: pos.y,
        texture: pos.type,
        width: 0.8,
        height: 0.8,
        type: pos.type,
        health: pos.type === 'imp' ? 60 : 40,
        angle: Math.random() * Math.PI * 2,
        state: 'idle'
      });
    });

    // Place items
    const itemPositions = [
      { x: 3, y: 8, type: 'healthpack' as const, value: 25 },
      { x: 9, y: 2, type: 'ammo' as const, value: 20 },
      { x: 13, y: 9, type: 'armor' as const, value: 50 },
      { x: 5, y: 4, type: 'healthpack' as const, value: 10 },
      { x: 11, y: 8, type: 'ammo' as const, value: 15 },
    ];

    itemPositions.forEach((pos, index) => {
      items.push({
        x: pos.x,
        y: pos.y,
        texture: pos.type,
        width: 0.5,
        height: 0.5,
        type: pos.type,
        value: pos.value,
        collected: false
      });
    });

    setGameState(prev => ({
      ...prev,
      enemies,
      items,
      level: levelNumber
    }));
  }, []);

  // Update enemy AI
  const updateEnemies = useCallback((playerX: number, playerY: number, deltaTime: number) => {
    const now = Date.now();
    if (now - lastEnemyUpdateRef.current < 100) return; // Update 10 times per second
    lastEnemyUpdateRef.current = now;

    setGameState(prev => ({
      ...prev,
      enemies: prev.enemies.map(enemy => {
        if (enemy.health <= 0) {
          return { ...enemy, state: 'dead' as const };
        }

        // Calculate distance to player
        const dx = playerX - enemy.x;
        const dy = playerY - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Simple AI: move towards player if close
        if (distance < 4 && distance > 1) {
          const moveSpeed = 0.01;
          const angle = Math.atan2(dy, dx);
          
          return {
            ...enemy,
            x: enemy.x + Math.cos(angle) * moveSpeed,
            y: enemy.y + Math.sin(angle) * moveSpeed,
            angle: angle,
            state: 'walking' as const
          };
        } else if (distance <= 1) {
          // Attack if very close
          return {
            ...enemy,
            state: 'attacking' as const
          };
        } else {
          // Idle or random movement
          return {
            ...enemy,
            state: 'idle' as const
          };
        }
      })
    }));
  }, []);

  // Check item collection
  const checkItemCollection = useCallback((playerX: number, playerY: number) => {
    setGameState(prev => {
      const newItems = prev.items.map(item => {
        if (item.collected) return item;

        const dx = playerX - item.x;
        const dy = playerY - item.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 0.5) {
          // Collect item
          return { ...item, collected: true };
        }
        return item;
      });

      // Apply collected item effects
      let newPlayer = { ...prev.player };
      const newlyCollected = newItems.filter((item, index) => 
        item.collected && !prev.items[index].collected
      );

      newlyCollected.forEach(item => {
        switch (item.type) {
          case 'healthpack':
            newPlayer.health = Math.min(100, newPlayer.health + item.value);
            break;
          case 'armor':
            newPlayer.armor = Math.min(100, newPlayer.armor + item.value);
            break;
          case 'ammo':
            newPlayer.ammo.pistol += item.value;
            break;
        }
      });

      return {
        ...prev,
        items: newItems,
        player: newPlayer,
        score: prev.score + (newlyCollected.length * 10)
      };
    });
  }, []);

  // Shoot weapon
  const shootWeapon = useCallback((playerX: number, playerY: number, playerAngle: number) => {
    setGameState(prev => {
      const currentWeapon = prev.player.weapon;
      const currentAmmo = prev.player.ammo[currentWeapon];

      if (currentAmmo <= 0) return prev; // No ammo

      // Check for enemy hits
      const newEnemies = prev.enemies.map(enemy => {
        if (enemy.health <= 0) return enemy;

        // Simple line-of-sight check
        const dx = enemy.x - playerX;
        const dy = enemy.y - playerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angleToEnemy = Math.atan2(dy, dx);
        const angleDiff = Math.abs(angleToEnemy - playerAngle);

        // Hit if enemy is close and in front of player
        if (distance < 8 && angleDiff < 0.3) {
          const damage = currentWeapon === 'shotgun' ? 30 : 10;
          return {
            ...enemy,
            health: enemy.health - damage
          };
        }
        return enemy;
      });

      // Reduce ammo
      const newAmmo = { ...prev.player.ammo };
      newAmmo[currentWeapon] -= 1;

      return {
        ...prev,
        enemies: newEnemies,
        player: {
          ...prev.player,
          ammo: newAmmo
        }
      };
    });
  }, []);

  // Switch weapon
  const switchWeapon = useCallback((weapon: string) => {
    setGameState(prev => ({
      ...prev,
      player: {
        ...prev.player,
        weapon
      }
    }));
  }, []);

  // Get visible sprites (enemies and items) for rendering
  const getVisibleSprites = useCallback((): Sprite[] => {
    const sprites: Sprite[] = [];

    // Add alive enemies
    gameState.enemies.forEach(enemy => {
      if (enemy.health > 0) {
        sprites.push(enemy);
      }
    });

    // Add uncollected items
    gameState.items.forEach(item => {
      if (!item.collected) {
        sprites.push(item);
      }
    });

    return sprites;
  }, [gameState.enemies, gameState.items]);

  return {
    gameState,
    initializeLevel,
    updateEnemies,
    checkItemCollection,
    shootWeapon,
    switchWeapon,
    getVisibleSprites
  };
}