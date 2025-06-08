"use client";

import { useEffect, useRef, useState } from 'react';
import { Card } from "@/components/ui/card";
import * as THREE from 'three';
import { useAudioSynthesizer } from './audio-synthesizer';

interface Player {
  position: THREE.Vector3;
  direction: number;
  speed: number;
}

export function DoomEngine3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const playerRef = useRef<Player>({
    position: new THREE.Vector3(1.5, 0.5, 1.5),
    direction: 0,
    speed: 0.05
  });
  
  const [isRunning, setIsRunning] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const animationFrameRef = useRef<number>();
  const lastStepTimeRef = useRef<number>(0);
  const musicStopFunctionRef = useRef<(() => void) | null>(null);
  const ambientStopFunctionRef = useRef<(() => void) | null>(null);

  // Audio system
  const { playDoomStyleMusic, playFootstep, playAmbientHum, stopAllSounds } = useAudioSynthesizer();

  // Maze layout (1 = wall, 0 = empty)
  const maze = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,1,1,0,1,1,0,1],
    [1,0,1,0,0,0,0,0,0,0,0,0,1,0,1],
    [1,0,0,0,1,1,0,1,0,1,1,0,0,0,1],
    [1,0,1,0,1,0,0,1,0,0,1,0,1,0,1],
    [1,0,1,0,0,0,1,1,1,0,0,0,1,0,1],
    [1,0,0,0,1,0,0,0,0,0,1,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  ];

  const initializeScene = () => {
    console.log('[DoomEngine3D] Initializing scene...');
    if (!mountRef.current) {
      console.error('[DoomEngine3D] Mount ref not available');
      return;
    }

    // Scene with Doom-style atmosphere
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x110000); // Dark red background
    scene.fog = new THREE.Fog(0x220000, 2, 15); // Red-tinted fog
    sceneRef.current = scene;
    console.log('[DoomEngine3D] Scene created');

    // Camera
    const camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
    camera.position.copy(playerRef.current.position);
    cameraRef.current = camera;
    console.log('[DoomEngine3D] Camera created at position:', camera.position);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    const width = Math.max(800, mountRef.current.clientWidth || 800);
    const height = Math.max(500, mountRef.current.clientHeight || 500);
    renderer.setSize(width, height);
    renderer.setClearColor(0x222222);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    console.log('[DoomEngine3D] Renderer created with size:', width, 'x', height);
    
    // Update camera aspect ratio
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    // Doom-style lighting
    const ambientLight = new THREE.AmbientLight(0x331111, 0.4); // Dark red ambient
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xff6666, 0.8); // Red-tinted light
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Add some point lights for atmosphere
    const pointLight1 = new THREE.PointLight(0xff4444, 0.6, 10);
    pointLight1.position.set(3, 1, 3);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x4444ff, 0.5, 8);
    pointLight2.position.set(8, 1, 8);
    scene.add(pointLight2);

    // Create procedural textures for Doom-style look
    const createBrickTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const context = canvas.getContext('2d')!;
      
      // Base brick color
      context.fillStyle = '#8B4513';
      context.fillRect(0, 0, 64, 64);
      
      // Mortar lines
      context.fillStyle = '#654321';
      context.fillRect(0, 16, 64, 2);
      context.fillRect(0, 48, 64, 2);
      context.fillRect(16, 0, 2, 16);
      context.fillRect(48, 16, 2, 16);
      context.fillRect(16, 32, 2, 16);
      context.fillRect(48, 48, 2, 16);
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1, 1);
      return texture;
    };

    const createMetalTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const context = canvas.getContext('2d')!;
      
      // Metal base
      context.fillStyle = '#666666';
      context.fillRect(0, 0, 32, 32);
      
      // Rivets and panels
      context.fillStyle = '#888888';
      context.fillRect(4, 4, 2, 2);
      context.fillRect(26, 4, 2, 2);
      context.fillRect(4, 26, 2, 2);
      context.fillRect(26, 26, 2, 2);
      
      context.fillStyle = '#555555';
      context.fillRect(0, 15, 32, 2);
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      return texture;
    };

    // Create maze geometry and materials
    const wallGeometry = new THREE.BoxGeometry(1, 2, 1);
    const brickTexture = createBrickTexture();
    const metalTexture = createMetalTexture();
    
    const wallMaterial = new THREE.MeshPhongMaterial({ 
      map: brickTexture,
      color: 0xaaaaaa,
      shininess: 10
    });
    
    const metalWallMaterial = new THREE.MeshPhongMaterial({
      map: metalTexture,
      color: 0x888888,
      shininess: 30
    });
    
    // Create floor texture
    const createFloorTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const context = canvas.getContext('2d')!;
      
      // Metal floor pattern
      context.fillStyle = '#333333';
      context.fillRect(0, 0, 64, 64);
      
      // Grid lines
      context.fillStyle = '#222222';
      for (let i = 0; i < 64; i += 16) {
        context.fillRect(i, 0, 1, 64);
        context.fillRect(0, i, 64, 1);
      }
      
      // Some wear marks
      context.fillStyle = '#444444';
      context.fillRect(10, 10, 20, 2);
      context.fillRect(30, 40, 15, 1);
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(4, 4);
      return texture;
    };

    const floorGeometry = new THREE.PlaneGeometry(maze[0].length, maze.length);
    const floorTexture = createFloorTexture();
    const floorMaterial = new THREE.MeshPhongMaterial({ 
      map: floorTexture,
      color: 0x666666,
      shininess: 15
    });
    
    // Floor
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1;
    floor.position.x = maze[0].length / 2 - 0.5;
    floor.position.z = maze.length / 2 - 0.5;
    floor.receiveShadow = true;
    scene.add(floor);

    // Ceiling with tech panels
    const ceilingMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x222222,
      shininess: 20
    });
    const ceiling = new THREE.Mesh(floorGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 1;
    ceiling.position.x = maze[0].length / 2 - 0.5;
    ceiling.position.z = maze.length / 2 - 0.5;
    scene.add(ceiling);

    // Walls with variety
    let wallCount = 0;
    for (let row = 0; row < maze.length; row++) {
      for (let col = 0; col < maze[row].length; col++) {
        if (maze[row][col] === 1) {
          // Use different materials for variety
          const material = (row + col) % 3 === 0 ? metalWallMaterial : wallMaterial;
          const wall = new THREE.Mesh(wallGeometry, material);
          wall.position.set(col, 0, row);
          wall.castShadow = true;
          wall.receiveShadow = true;
          scene.add(wall);
          wallCount++;
          
          // Add some wall details randomly
          if (Math.random() > 0.8) {
            const detail = new THREE.Mesh(
              new THREE.BoxGeometry(0.8, 0.2, 0.1),
              new THREE.MeshPhongMaterial({ color: 0xff4444, emissive: 0x440000 })
            );
            detail.position.set(col, 0.5, row + 0.45);
            scene.add(detail);
          }
        }
      }
    }
    console.log('[DoomEngine3D] Created', wallCount, 'walls');

    // Add to DOM
    mountRef.current.appendChild(renderer.domElement);
    console.log('[DoomEngine3D] Canvas added to DOM');
    
    // Start audio atmosphere
    console.log('[DoomEngine3D] Starting audio...');
    try {
      musicStopFunctionRef.current = playDoomStyleMusic();
      ambientStopFunctionRef.current = playAmbientHum();
    } catch (error) {
      console.warn('[DoomEngine3D] Audio initialization failed:', error);
    }
    
    setIsInitialized(true);
    console.log('[DoomEngine3D] Initialization complete');
  };

  const checkCollision = (newPosition: THREE.Vector3): boolean => {
    const x = Math.floor(newPosition.x);
    const z = Math.floor(newPosition.z);
    
    if (x < 0 || x >= maze[0].length || z < 0 || z >= maze.length) {
      return true; // Collision with boundaries
    }
    
    return maze[z][x] === 1; // Collision with wall
  };

  const gameLoop = () => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current) {
      console.warn('[DoomEngine3D] Game loop called but references not ready');
      return;
    }

    const player = playerRef.current;
    const camera = cameraRef.current;
    const keys = keysRef.current;

    // Handle movement
    const moveVector = new THREE.Vector3();
    
    if (keys['KeyW'] || keys['ArrowUp']) {
      moveVector.z -= player.speed;
    }
    if (keys['KeyS'] || keys['ArrowDown']) {
      moveVector.z += player.speed;
    }
    if (keys['KeyA'] || keys['ArrowLeft']) {
      player.direction -= 0.05;
    }
    if (keys['KeyD'] || keys['ArrowRight']) {
      player.direction += 0.05;
    }

    // Apply rotation to movement
    moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), player.direction);
    
    // Check collision before moving
    const newPosition = player.position.clone().add(moveVector);
    if (!checkCollision(newPosition)) {
      const wasMoving = moveVector.length() > 0;
      player.position.copy(newPosition);
      
      // Play footstep sounds
      if (wasMoving) {
        const now = Date.now();
        if (now - lastStepTimeRef.current > 400) { // Footstep every 400ms
          playFootstep();
          lastStepTimeRef.current = now;
        }
      }
    }

    // Update camera
    camera.position.copy(player.position);
    camera.rotation.y = player.direction;

    // Render
    rendererRef.current.render(sceneRef.current, camera);

    if (isRunning) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
  };

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
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRunning && !isInitialized && mountRef.current) {
      console.log('[DoomEngine3D] Mount ref available, initializing scene...');
      initializeScene();
    }
  }, [isRunning, isInitialized]);

  useEffect(() => {
    if (isRunning && isInitialized) {
      gameLoop();
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [isRunning, isInitialized]);

  const startGame = () => {
    console.log('[DoomEngine3D] Starting game...');
    console.log('[DoomEngine3D] Mount ref available?', !!mountRef.current);
    setIsRunning(true);
    console.log('[DoomEngine3D] Game started');
  };

  const stopGame = () => {
    console.log('[DoomEngine3D] Stopping game...');
    
    // Stop all audio
    if (musicStopFunctionRef.current) {
      musicStopFunctionRef.current();
      musicStopFunctionRef.current = null;
    }
    if (ambientStopFunctionRef.current) {
      ambientStopFunctionRef.current();
      ambientStopFunctionRef.current = null;
    }
    stopAllSounds();
    
    setIsRunning(false);
  };

  return (
    <div className="h-full w-full bg-black text-white rounded-lg overflow-hidden border">
      {!isRunning ? (
        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
          <h2 className="text-4xl font-bold mb-4">DOOM 3D</h2>
          <p className="text-xl">Three.js 3D Engine</p>
          <p className="text-sm text-gray-400">Use WASD or Arrow Keys to move</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded transition-colors"
          >
            START GAME
          </button>
        </div>
      ) : (
        <div className="relative w-full h-full">
          <div 
            ref={mountRef} 
            className="w-full h-full min-h-[500px]"
            style={{ minHeight: '500px' }}
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