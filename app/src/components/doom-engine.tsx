"use client";

import { useEffect, useRef, useState } from 'react';
import { Card } from "@/components/ui/card";

interface Player {
  x: number;
  y: number;
  angle: number;
  speed: number;
}

interface GameState {
  player: Player;
  keys: { [key: string]: boolean };
}

export function DoomEngine() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState>({
    player: { x: 5, y: 5, angle: 0, speed: 0.1 },
    keys: {}
  });
  
  const [isRunning, setIsRunning] = useState(false);
  const animationFrameRef = useRef<number>();

  // Simple 2D map (1 = wall, 0 = empty)
  const map = [
    [1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,0,1,1,0,1],
    [1,0,1,0,0,0,0,1,0,1],
    [1,0,0,0,1,1,0,0,0,1],
    [1,0,0,0,1,1,0,0,0,1],
    [1,0,1,0,0,0,0,1,0,1],
    [1,0,1,1,0,0,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1]
  ];

  const rayCast = (playerX: number, playerY: number, rayAngle: number) => {
    const rayDirX = Math.cos(rayAngle);
    const rayDirY = Math.sin(rayAngle);
    
    let distance = 0;
    const step = 0.02;
    const maxDistance = 20;
    
    while (distance < maxDistance) {
      const testX = playerX + rayDirX * distance;
      const testY = playerY + rayDirY * distance;
      
      const mapX = Math.floor(testX);
      const mapY = Math.floor(testY);
      
      // Check bounds
      if (mapX < 0 || mapX >= map[0].length || mapY < 0 || mapY >= map.length) {
        return distance;
      }
      
      // Check for wall
      if (map[mapY][mapX] === 1) {
        return distance;
      }
      
      distance += step;
    }
    
    return maxDistance;
  };

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { player } = gameStateRef.current;
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas with sky color
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, width, height / 2);
    
    // Draw floor
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, height / 2, width, height / 2);
    
    // Draw walls using raycasting
    const fov = Math.PI / 3; // 60 degrees
    const numRays = width / 2; // Reduce rays for better performance
    
    for (let i = 0; i < numRays; i++) {
      const rayAngle = player.angle - fov / 2 + (fov * i) / numRays;
      const distance = rayCast(player.x, player.y, rayAngle);
      
      if (distance < 20) {
        // Calculate wall height based on distance
        const wallHeight = Math.min(height, height / (distance * 0.5));
        const wallTop = (height - wallHeight) / 2;
        
        // Draw wall slice - make it wider for visibility
        const sliceWidth = width / numRays;
        const brightness = Math.max(0.2, 1 - distance / 15);
        const color = Math.floor(brightness * 200);
        
        ctx.fillStyle = `rgb(${color}, ${Math.floor(color * 0.8)}, ${Math.floor(color * 0.6)})`;
        ctx.fillRect(i * sliceWidth, wallTop, sliceWidth + 1, wallHeight);
      }
    }
    
    // Draw minimap
    const mapScale = 20;
    const mapOffsetX = 10;
    const mapOffsetY = 10;
    
    // Draw map
    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[y].length; x++) {
        ctx.fillStyle = map[y][x] === 1 ? '#ffffff' : '#444444';
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
      mapOffsetX + player.x * mapScale - 2,
      mapOffsetY + player.y * mapScale - 2,
      4,
      4
    );
    
    // Draw player direction
    ctx.strokeStyle = '#ff0000';
    ctx.beginPath();
    ctx.moveTo(
      mapOffsetX + player.x * mapScale,
      mapOffsetY + player.y * mapScale
    );
    ctx.lineTo(
      mapOffsetX + player.x * mapScale + Math.cos(player.angle) * 15,
      mapOffsetY + player.y * mapScale + Math.sin(player.angle) * 15
    );
    ctx.stroke();
  };

  const gameLoop = () => {
    const { player, keys } = gameStateRef.current;
    
    // Handle movement
    if (keys['ArrowUp'] || keys['KeyW']) {
      const newX = player.x + Math.cos(player.angle) * player.speed;
      const newY = player.y + Math.sin(player.angle) * player.speed;
      
      if (map[Math.floor(newY)][Math.floor(newX)] === 0) {
        player.x = newX;
        player.y = newY;
      }
    }
    
    if (keys['ArrowDown'] || keys['KeyS']) {
      const newX = player.x - Math.cos(player.angle) * player.speed;
      const newY = player.y - Math.sin(player.angle) * player.speed;
      
      if (map[Math.floor(newY)][Math.floor(newX)] === 0) {
        player.x = newX;
        player.y = newY;
      }
    }
    
    if (keys['ArrowLeft'] || keys['KeyA']) {
      player.angle -= 0.05;
    }
    
    if (keys['ArrowRight'] || keys['KeyD']) {
      player.angle += 0.05;
    }
    
    render();
    
    if (isRunning) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;
    
    // Initial render
    render();
    
    const handleKeyDown = (e: KeyboardEvent) => {
      gameStateRef.current.keys[e.code] = true;
      e.preventDefault();
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      gameStateRef.current.keys[e.code] = false;
      e.preventDefault();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRunning) {
      gameLoop();
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [isRunning]);

  const startGame = () => {
    setIsRunning(true);
  };

  const stopGame = () => {
    setIsRunning(false);
  };

  return (
    <Card className="h-full flex flex-col items-center justify-center bg-black text-white overflow-hidden">
      {!isRunning ? (
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold mb-4">DOOM</h2>
          <p className="text-xl">Basic 3D Engine</p>
          <p className="text-sm text-gray-400">Use WASD or Arrow Keys to move</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded transition-colors"
          >
            START GAME
          </button>
        </div>
      ) : (
        <div className="relative w-full h-full flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="border border-gray-600 max-w-full max-h-full"
            tabIndex={0}
          />
          <button
            onClick={stopGame}
            className="absolute top-4 right-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded transition-colors text-sm"
          >
            STOP
          </button>
        </div>
      )}
    </Card>
  );
}