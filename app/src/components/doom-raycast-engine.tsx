"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAudioSynthesizer } from './audio-synthesizer';
import { useWadLoader } from './wad-loader';
import { useDoomAudio } from '@/hooks/useDoomAudio';
import { useDoomSprites, Sprite } from './doom-sprites';
import { useDoomGameState } from '@/hooks/useDoomGameState';

interface Player {
  x: number;
  y: number;
  angle: number;
  speed: number;
}

interface RayHit {
  distance: number;
  wallType: number;
  hitX: number;
  hitY: number;
  isVertical: boolean;
}

export function DoomRaycastEngine() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Use game state player instead of separate ref
  const player = gameState.player;
  
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const animationFrameRef = useRef<number>();
  const lastStepTimeRef = useRef<number>(0);
  const lastShootTimeRef = useRef<number>(0);
  const musicStopFunctionRef = useRef<(() => void) | null>(null);
  const ambientStopFunctionRef = useRef<(() => void) | null>(null);

  const { playDoomStyleMusic, playAmbientHum, stopAllSounds } = useAudioSynthesizer();
  const { loadMapData, getAvailableSounds, isLoading: wadLoading, error: wadError } = useWadLoader();
  const { playMusic, stopMusic, playSound, playFootstep, playShoot } = useDoomAudio();
  const { createWeaponSprite, createEnemySprite, createItemSprite, createWallTexture, weapons } = useDoomSprites();
  const { gameState, initializeLevel, updateEnemies, checkItemCollection, shootWeapon, switchWeapon, getVisibleSprites } = useDoomGameState();
  
  const [wadLoaded, setWadLoaded] = useState(false);
  const [availableSounds, setAvailableSounds] = useState<string[]>([]);
  const [weaponSprites, setWeaponSprites] = useState<{ [key: string]: string }>({});
  const [wallTextures, setWallTextures] = useState<{ [key: number]: string }>({});

  // Play authentic Doom sounds
  const playDoomSound = useCallback((soundName: string, volume: number = 0.5) => {
    try {
      const audio = new Audio(`/audio/extracted/${soundName}.wav`);
      audio.volume = volume;
      audio.play().catch(error => {
        console.warn('[Doom] Sound playback failed:', soundName, error);
        // Fallback to synthesized sound
        playFootstep();
      });
    } catch (error) {
      console.warn('[Doom] Error playing sound:', soundName, error);
      playFootstep();
    }
  }, [playFootstep]);

  // Enhanced maze with different wall types
  const maze = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,2,2,0,0,3,3,3,3,0,0,2,2,0,1],
    [1,0,2,0,0,0,0,0,0,0,0,0,0,2,0,1],
    [1,0,0,0,0,1,1,0,0,1,1,0,0,0,0,1],
    [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
    [1,0,3,0,0,0,0,0,4,0,0,0,0,3,0,1],
    [1,0,3,0,0,0,0,4,4,4,0,0,0,3,0,1],
    [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
    [1,0,0,0,0,1,1,0,0,1,1,0,0,0,0,1],
    [1,0,2,0,0,0,0,0,0,0,0,0,0,2,0,1],
    [1,0,2,2,0,0,3,3,3,3,0,0,2,2,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  ];

  const WALL_COLORS = {
    1: '#8B4513', // Brown brick
    2: '#666666', // Gray metal  
    3: '#AA0000', // Red panels
    4: '#004400'  // Green tech
  };

  // DDA Raycasting algorithm (more accurate than our previous approach)
  const castRay = useCallback((startX: number, startY: number, rayAngle: number): RayHit => {
    const rayDirX = Math.cos(rayAngle);
    const rayDirY = Math.sin(rayAngle);
    
    const mapX = Math.floor(startX);
    const mapY = Math.floor(startY);
    
    const deltaDistX = Math.abs(1 / rayDirX);
    const deltaDistY = Math.abs(1 / rayDirY);
    
    let stepX: number;
    let stepY: number;
    let sideDistX: number;
    let sideDistY: number;
    
    if (rayDirX < 0) {
      stepX = -1;
      sideDistX = (startX - mapX) * deltaDistX;
    } else {
      stepX = 1;
      sideDistX = (mapX + 1.0 - startX) * deltaDistX;
    }
    
    if (rayDirY < 0) {
      stepY = -1;
      sideDistY = (startY - mapY) * deltaDistY;
    } else {
      stepY = 1;
      sideDistY = (mapY + 1.0 - startY) * deltaDistY;
    }
    
    let hit = false;
    let side = 0; // 0 = X-side, 1 = Y-side
    let currentMapX = mapX;
    let currentMapY = mapY;
    
    // DDA algorithm
    while (!hit) {
      if (sideDistX < sideDistY) {
        sideDistX += deltaDistX;
        currentMapX += stepX;
        side = 0;
      } else {
        sideDistY += deltaDistY;
        currentMapY += stepY;
        side = 1;
      }
      
      if (currentMapX < 0 || currentMapX >= maze[0].length || 
          currentMapY < 0 || currentMapY >= maze.length ||
          maze[currentMapY][currentMapX] > 0) {
        hit = true;
      }
    }
    
    let distance: number;
    if (side === 0) {
      distance = (currentMapX - startX + (1 - stepX) / 2) / rayDirX;
    } else {
      distance = (currentMapY - startY + (1 - stepY) / 2) / rayDirY;
    }
    
    const wallType = (currentMapX < 0 || currentMapX >= maze[0].length || 
                     currentMapY < 0 || currentMapY >= maze.length) 
                     ? 1 : maze[currentMapY][currentMapX];
    
    return {
      distance: Math.abs(distance),
      wallType,
      hitX: startX + distance * rayDirX,
      hitY: startY + distance * rayDirY,
      isVertical: side === 0
    };
  }, [maze]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.warn('[DoomRaycast] Render called but no canvas');
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('[DoomRaycast] Render called but no context');
      return;
    }
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear with sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height / 2);
    gradient.addColorStop(0, '#330000');
    gradient.addColorStop(1, '#110000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height / 2);
    
    // Floor
    ctx.fillStyle = '#222222';
    ctx.fillRect(0, height / 2, width, height / 2);
    
    // Raycasting
    const fov = Math.PI / 3; // 60 degrees
    const numRays = width;
    
    for (let x = 0; x < numRays; x++) {
      const cameraX = 2 * x / numRays - 1; // X coordinate in camera space
      const rayAngle = player.angle + Math.atan(cameraX * Math.tan(fov / 2));
      
      const hit = castRay(player.x, player.y, rayAngle);
      
      // Calculate wall height
      const perpWallDist = hit.distance * Math.cos(rayAngle - player.angle); // Fix fisheye
      const wallHeight = height / perpWallDist;
      
      // Calculate wall top and bottom
      const wallTop = Math.max(0, (height - wallHeight) / 2);
      const wallBottom = Math.min(height, (height + wallHeight) / 2);
      
      // Wall shading based on distance and orientation
      const baseColor = WALL_COLORS[hit.wallType as keyof typeof WALL_COLORS] || '#666666';
      const shadingFactor = Math.max(0.2, 1 - hit.distance / 10);
      const orientationShading = hit.isVertical ? 1 : 0.7; // Make horizontal walls darker
      
      // Parse color and apply shading
      const r = parseInt(baseColor.slice(1, 3), 16);
      const g = parseInt(baseColor.slice(3, 5), 16);
      const b = parseInt(baseColor.slice(5, 7), 16);
      
      const shadedR = Math.floor(r * shadingFactor * orientationShading);
      const shadedG = Math.floor(g * shadingFactor * orientationShading);
      const shadedB = Math.floor(b * shadingFactor * orientationShading);
      
      ctx.fillStyle = `rgb(${shadedR}, ${shadedG}, ${shadedB})`;
      ctx.fillRect(x, wallTop, 1, wallBottom - wallTop);
    }
    
    // Render sprites (enemies and items)
    const sprites = getVisibleSprites();
    const spritesWithDistance = sprites.map(sprite => {
      const dx = sprite.x - player.x;
      const dy = sprite.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return { ...sprite, distance };
    }).sort((a, b) => b.distance - a.distance); // Back to front

    spritesWithDistance.forEach(sprite => {
      // Calculate sprite position on screen
      const dx = sprite.x - player.x;
      const dy = sprite.y - player.y;
      const angle = Math.atan2(dy, dx) - player.angle;
      
      // Only render if sprite is in front of player
      if (Math.abs(angle) < Math.PI / 2) {
        const spriteScreenX = (width / 2) * (1 + Math.tan(angle) / Math.tan(fov / 2));
        const spriteHeight = height / sprite.distance * 0.5;
        const spriteWidth = spriteHeight * (sprite.width || 1);
        
        if (spriteScreenX > -spriteWidth && spriteScreenX < width + spriteWidth) {
          // Draw simple colored rectangle for now (will be replaced with actual sprites)
          let spriteColor = '#FF0000'; // Default red
          
          if (sprite.texture === 'imp') spriteColor = '#8B4513'; // Brown
          else if (sprite.texture === 'zombieman') spriteColor = '#556B2F'; // Olive
          else if (sprite.texture === 'healthpack') spriteColor = '#00FF00'; // Green
          else if (sprite.texture === 'ammo') spriteColor = '#FFFF00'; // Yellow
          else if (sprite.texture === 'armor') spriteColor = '#0000FF'; // Blue
          
          ctx.fillStyle = spriteColor;
          const spriteTop = (height - spriteHeight) / 2;
          ctx.fillRect(
            spriteScreenX - spriteWidth / 2,
            spriteTop,
            spriteWidth,
            spriteHeight
          );
          
          // Add simple face for enemies
          if (sprite.texture === 'imp' || sprite.texture === 'zombieman') {
            ctx.fillStyle = '#FF0000'; // Red eyes
            const eyeSize = spriteWidth / 8;
            ctx.fillRect(spriteScreenX - spriteWidth/4, spriteTop + spriteHeight/4, eyeSize, eyeSize);
            ctx.fillRect(spriteScreenX + spriteWidth/8, spriteTop + spriteHeight/4, eyeSize, eyeSize);
          }
        }
      }
    });
    
    // Simple minimap
    const mapScale = 8;
    const mapOffsetX = 10;
    const mapOffsetY = 10;
    
    // Draw minimap background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(mapOffsetX - 2, mapOffsetY - 2, maze[0].length * mapScale + 4, maze.length * mapScale + 4);
    
    // Draw maze on minimap
    for (let y = 0; y < maze.length; y++) {
      for (let x = 0; x < maze[y].length; x++) {
        const wallType = maze[y][x];
        if (wallType > 0) {
          ctx.fillStyle = WALL_COLORS[wallType as keyof typeof WALL_COLORS] || '#666666';
        } else {
          ctx.fillStyle = '#444444';
        }
        ctx.fillRect(
          mapOffsetX + x * mapScale,
          mapOffsetY + y * mapScale,
          mapScale,
          mapScale
        );
      }
    }
    
    // Draw player on minimap
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(
      mapOffsetX + player.x * mapScale - 1,
      mapOffsetY + player.y * mapScale - 1,
      3,
      3
    );
    
    // Draw player direction line
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(
      mapOffsetX + player.x * mapScale,
      mapOffsetY + player.y * mapScale
    );
    ctx.lineTo(
      mapOffsetX + player.x * mapScale + Math.cos(player.angle) * 10,
      mapOffsetY + player.y * mapScale + Math.sin(player.angle) * 10
    );
    ctx.stroke();
    
    // Draw weapon sprite at bottom center
    const weaponSprite = weaponSprites[player.weapon];
    if (weaponSprite) {
      const weaponImg = new Image();
      weaponImg.src = weaponSprite;
      if (weaponImg.complete) {
        const weaponWidth = 200;
        const weaponHeight = 150;
        ctx.drawImage(
          weaponImg,
          width / 2 - weaponWidth / 2,
          height - weaponHeight,
          weaponWidth,
          weaponHeight
        );
      }
    }
    
    // Draw HUD
    const hudHeight = 60;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, height - hudHeight, width, hudHeight);
    
    // Health bar
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(20, height - 40, 100, 20);
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(20, height - 40, (player.health / 100) * 100, 20);
    
    // Armor bar
    ctx.fillStyle = '#0000FF';
    ctx.fillRect(140, height - 40, 100, 20);
    ctx.fillStyle = '#00FFFF';
    ctx.fillRect(140, height - 40, (player.armor / 100) * 100, 20);
    
    // Text info
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px monospace';
    ctx.fillText(`Health: ${player.health}`, 20, height - 45);
    ctx.fillText(`Armor: ${player.armor}`, 140, height - 45);
    ctx.fillText(`Weapon: ${player.weapon}`, 280, height - 45);
    ctx.fillText(`Ammo: ${player.ammo[player.weapon] || 0}`, 280, height - 25);
    ctx.fillText(`Score: ${gameState.score}`, 450, height - 45);
    ctx.fillText(`Level: ${gameState.level}`, 450, height - 25);
    
  }, [castRay, getVisibleSprites, player, gameState, weaponSprites]);

  const checkCollision = useCallback((x: number, y: number): boolean => {
    const mapX = Math.floor(x);
    const mapY = Math.floor(y);
    
    if (mapX < 0 || mapX >= maze[0].length || mapY < 0 || mapY >= maze.length) {
      return true;
    }
    
    return maze[mapY][mapX] > 0;
  }, [maze]);

  const gameLoop = useCallback(() => {
    if (!isRunning) return;
    
    const keys = keysRef.current;
    
    let moved = false;
    let newPlayerState = { ...player };
    
    // Movement
    if (keys['KeyW'] || keys['ArrowUp']) {
      const newX = newPlayerState.x + Math.cos(newPlayerState.angle) * newPlayerState.speed;
      const newY = newPlayerState.y + Math.sin(newPlayerState.angle) * newPlayerState.speed;
      if (!checkCollision(newX, newY)) {
        newPlayerState.x = newX;
        newPlayerState.y = newY;
        moved = true;
      }
    }
    
    if (keys['KeyS'] || keys['ArrowDown']) {
      const newX = newPlayerState.x - Math.cos(newPlayerState.angle) * newPlayerState.speed;
      const newY = newPlayerState.y - Math.sin(newPlayerState.angle) * newPlayerState.speed;
      if (!checkCollision(newX, newY)) {
        newPlayerState.x = newX;
        newPlayerState.y = newY;
        moved = true;
      }
    }
    
    // Rotation
    if (keys['KeyA'] || keys['ArrowLeft']) {
      newPlayerState.angle -= 0.03;
    }
    
    if (keys['KeyD'] || keys['ArrowRight']) {
      newPlayerState.angle += 0.03;
    }
    
    // Shooting
    if (keys['Space']) {
      const now = Date.now();
      if (now - lastShootTimeRef.current > 500) { // Prevent rapid fire
        shootWeapon(newPlayerState.x, newPlayerState.y, newPlayerState.angle);
        playShoot(); // Use new audio system
        lastShootTimeRef.current = now;
      }
    }
    
    // Weapon switching
    if (keys['Digit1']) {
      switchWeapon('pistol');
    }
    if (keys['Digit2'] && player.ammo.shotgun > 0) {
      switchWeapon('shotgun');
    }
    
    // Footstep sounds - use new audio system
    if (moved) {
      const now = Date.now();
      if (now - lastStepTimeRef.current > 350) {
        playFootstep(); // Use new audio system with fallbacks
        lastStepTimeRef.current = now;
      }
    }
    
    // Update game state
    updateEnemies(newPlayerState.x, newPlayerState.y, 16); // ~60fps
    checkItemCollection(newPlayerState.x, newPlayerState.y);
    
    render();
    
    if (isRunning) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
  }, [isRunning, checkCollision, render, playFootstep, shootWeapon, switchWeapon, updateEnemies, checkItemCollection]);

  // Load WAD file data
  const loadWadData = useCallback(async () => {
    try {
      console.log('[DoomRaycast] Starting WAD data loading...');
      
      // Load available sounds from WAD
      console.log('[DoomRaycast] Getting available sounds...');
      const sounds = await getAvailableSounds('/wad/doom.wad');
      console.log('[DoomRaycast] Sounds loaded:', sounds.length);
      setAvailableSounds(sounds);
      console.log('[DoomRaycast] Available sounds:', sounds.slice(0, 10)); // Log first 10
      
      // Try to load E1M1 map data
      console.log('[DoomRaycast] Loading E1M1 map data...');
      const mapData = await loadMapData('/wad/doom.wad', 'E1M1');
      if (mapData) {
        console.log('[DoomRaycast] Loaded E1M1 map:', {
          vertices: mapData.vertices.length,
          linedefs: mapData.linedefs.length,
          sectors: mapData.sectors.length
        });
        // TODO: Convert map data to our maze format
      } else {
        console.log('[DoomRaycast] No map data loaded');
      }
      
      setWadLoaded(true);
      console.log('[DoomRaycast] WAD data loaded successfully');
      
    } catch (error) {
      console.warn('[DoomRaycast] WAD loading failed:', error);
      setWadLoaded(false);
    }
  }, [getAvailableSounds, loadMapData]);

  const initializeEngine = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = 800;
    canvas.height = 600;
    
    console.log('[DoomRaycast] Engine initialized');
    
    // Initialize weapon sprites
    const pistolSprite = createWeaponSprite('pistol');
    const shotgunSprite = createWeaponSprite('shotgun');
    setWeaponSprites({
      pistol: pistolSprite,
      shotgun: shotgunSprite
    });
    
    // Initialize wall textures
    const brickTexture = createWallTexture('brick');
    const metalTexture = createWallTexture('metal');
    const hellTexture = createWallTexture('hell');
    setWallTextures({
      1: brickTexture,
      2: metalTexture,
      3: hellTexture,
      4: metalTexture
    });
    
    // Initialize level with enemies and items
    initializeLevel(1);
    
    // Load WAD data asynchronously (non-blocking)
    loadWadData().catch(error => {
      console.warn('[DoomRaycast] WAD loading failed but game continues:', error);
    });
    
    // Start audio
    try {
      // Try to play background music from files first
      playMusic('e1m1.mp3'); // Will fallback to e1m1.wav, etc.
      
      // Backup ambient sound
      ambientStopFunctionRef.current = playAmbientHum();
    } catch (error) {
      console.warn('[DoomRaycast] Audio failed:', error);
    }
    
    setIsInitialized(true);
    render(); // Initial render
    console.log('[DoomRaycast] Engine initialization complete');
  }, [render, playMusic, playAmbientHum, loadWadData, createWeaponSprite, createWallTexture, initializeLevel]);

  // Key handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      e.preventDefault();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Game loop effect
  useEffect(() => {
    if (isRunning && isInitialized) {
      gameLoop();
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [isRunning, isInitialized, gameLoop]);

  const startGame = () => {
    console.log('[DoomRaycast] Starting game...');
    console.log('[DoomRaycast] Canvas ref available?', !!canvasRef.current);
    setIsRunning(true);
    
    // Use setTimeout to ensure canvas is mounted
    setTimeout(() => {
      if (!isInitialized) {
        console.log('[DoomRaycast] Initializing engine...');
        initializeEngine();
      }
    }, 100);
  };

  const stopGame = () => {
    console.log('[DoomRaycast] Stopping game...');
    
    // Stop all audio
    stopMusic(); // Stop file-based music
    if (ambientStopFunctionRef.current) {
      ambientStopFunctionRef.current();
      ambientStopFunctionRef.current = null;
    }
    stopAllSounds(); // Stop synthesized sounds
    
    setIsRunning(false);
  };

  return (
    <div className="h-full w-full bg-black text-white rounded-lg overflow-hidden border">
      {!isRunning ? (
        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
          <h2 className="text-4xl font-bold mb-4">DOOM</h2>
          <p className="text-xl">Complete Doom Game with Enemies & Items!</p>
          <div className="text-sm text-gray-400 space-y-1">
            <p>WASD/Arrow Keys: Move & Turn</p>
            <p>Spacebar: Shoot enemies</p>
            <p>1/2: Switch weapons (Pistol/Shotgun)</p>
            <p>Collect items: Health (green), Ammo (yellow), Armor (blue)</p>
            <p>Enemies: Imps (brown), Zombies (olive) with red eyes</p>
            {wadLoading && <p className="text-yellow-400">Loading WAD assets...</p>}
            {wadLoaded && <p className="text-green-400">✓ WAD assets loaded</p>}
            {wadError && <p className="text-red-400">⚠ WAD loading failed</p>}
          </div>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded transition-colors"
          >
            START GAME
          </button>
        </div>
      ) : (
        <div className="relative w-full h-full">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ imageRendering: 'pixelated' }}
          />
          <button
            onClick={stopGame}
            className="absolute top-4 right-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded transition-colors text-sm z-10"
          >
            STOP
          </button>
        </div>
      )}
    </div>
  );
}