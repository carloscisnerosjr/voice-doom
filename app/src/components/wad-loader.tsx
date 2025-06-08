"use client";

import { useState, useCallback } from 'react';

interface WadLump {
  name: string;
  offset: number;
  size: number;
  data?: Uint8Array;
}

interface WadFile {
  header: {
    identification: string;
    numLumps: number;
    infotablesOffset: number;
  };
  lumps: WadLump[];
}

interface MapData {
  things: any[];
  linedefs: any[];
  sidedefs: any[];
  vertices: any[];
  sectors: any[];
}

export function useWadLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWadFile = useCallback(async (wadPath: string): Promise<WadFile | null> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('[WAD] Loading WAD file:', wadPath);
      
      const response = await fetch(wadPath);
      if (!response.ok) {
        throw new Error(`Failed to load WAD file: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      const dataView = new DataView(buffer);
      
      // Read WAD header
      const identification = new TextDecoder().decode(new Uint8Array(buffer, 0, 4));
      const numLumps = dataView.getUint32(4, true); // little endian
      const infotablesOffset = dataView.getUint32(8, true);

      console.log('[WAD] Header:', { identification, numLumps, infotablesOffset });

      // Read directory/lump info table
      const lumps: WadLump[] = [];
      for (let i = 0; i < numLumps; i++) {
        const lumpOffset = infotablesOffset + (i * 16);
        const offset = dataView.getUint32(lumpOffset, true);
        const size = dataView.getUint32(lumpOffset + 4, true);
        const nameBytes = new Uint8Array(buffer, lumpOffset + 8, 8);
        
        // Convert name bytes to string (null-terminated)
        let name = '';
        for (let j = 0; j < 8 && nameBytes[j] !== 0; j++) {
          name += String.fromCharCode(nameBytes[j]);
        }

        lumps.push({ name, offset, size });
      }

      console.log('[WAD] Loaded', lumps.length, 'lumps');
      
      return {
        header: { identification, numLumps, infotablesOffset },
        lumps
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error loading WAD';
      console.error('[WAD] Error:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const extractLumpData = useCallback(async (wadPath: string, lumpName: string): Promise<Uint8Array | null> => {
    try {
      const wadFile = await loadWadFile(wadPath);
      if (!wadFile) return null;

      const lump = wadFile.lumps.find(l => l.name === lumpName);
      if (!lump) {
        console.warn('[WAD] Lump not found:', lumpName);
        return null;
      }

      const response = await fetch(wadPath);
      const buffer = await response.arrayBuffer();
      
      return new Uint8Array(buffer, lump.offset, lump.size);
    } catch (err) {
      console.error('[WAD] Error extracting lump:', err);
      return null;
    }
  }, [loadWadFile]);

  const loadMapData = useCallback(async (wadPath: string, mapName: string): Promise<MapData | null> => {
    try {
      console.log('[WAD] Loading map:', mapName);
      
      const wadFile = await loadWadFile(wadPath);
      if (!wadFile) return null;

      // Find map marker
      const mapIndex = wadFile.lumps.findIndex(l => l.name === mapName);
      if (mapIndex === -1) {
        console.warn('[WAD] Map not found:', mapName);
        return null;
      }

      // Load map lumps (things, linedefs, sidedefs, vertices, sectors, etc.)
      const response = await fetch(wadPath);
      const buffer = await response.arrayBuffer();
      
      const loadMapLump = (name: string) => {
        const lump = wadFile.lumps.find(l => l.name === name);
        if (!lump || lump.size === 0) return new Uint8Array(0);
        return new Uint8Array(buffer, lump.offset, lump.size);
      };

      // Parse vertices
      const verticesData = loadMapLump('VERTEXES');
      const vertices = [];
      for (let i = 0; i < verticesData.length; i += 4) {
        const view = new DataView(verticesData.buffer, verticesData.byteOffset + i, 4);
        vertices.push({
          x: view.getInt16(0, true) / 65536.0, // Convert to float coordinates
          y: view.getInt16(2, true) / 65536.0
        });
      }

      // Parse sectors
      const sectorsData = loadMapLump('SECTORS');
      const sectors = [];
      for (let i = 0; i < sectorsData.length; i += 26) {
        const view = new DataView(sectorsData.buffer, sectorsData.byteOffset + i, 26);
        sectors.push({
          floorHeight: view.getInt16(0, true),
          ceilingHeight: view.getInt16(2, true),
          floorTexture: new TextDecoder().decode(new Uint8Array(sectorsData.buffer, sectorsData.byteOffset + i + 4, 8)).replace(/\0/g, ''),
          ceilingTexture: new TextDecoder().decode(new Uint8Array(sectorsData.buffer, sectorsData.byteOffset + i + 12, 8)).replace(/\0/g, ''),
          lightLevel: view.getInt16(20, true),
          special: view.getInt16(22, true),
          tag: view.getInt16(24, true)
        });
      }

      // Parse linedefs  
      const linedefsData = loadMapLump('LINEDEFS');
      const linedefs = [];
      for (let i = 0; i < linedefsData.length; i += 14) {
        const view = new DataView(linedefsData.buffer, linedefsData.byteOffset + i, 14);
        linedefs.push({
          startVertex: view.getUint16(0, true),
          endVertex: view.getUint16(2, true),
          flags: view.getUint16(4, true),
          special: view.getUint16(6, true),
          tag: view.getUint16(8, true),
          frontSidedef: view.getUint16(10, true),
          backSidedef: view.getUint16(12, true)
        });
      }

      console.log('[WAD] Map loaded:', {
        vertices: vertices.length,
        sectors: sectors.length,
        linedefs: linedefs.length
      });

      return {
        things: [], // TODO: Parse things if needed
        linedefs,
        sidedefs: [], // TODO: Parse sidedefs if needed  
        vertices,
        sectors
      };

    } catch (err) {
      console.error('[WAD] Error loading map:', err);
      return null;
    }
  }, [loadWadFile]);

  const getAvailableSounds = useCallback(async (wadPath: string): Promise<string[]> => {
    try {
      const wadFile = await loadWadFile(wadPath);
      if (!wadFile) return [];

      return wadFile.lumps
        .filter(lump => lump.name.startsWith('DS'))
        .map(lump => lump.name);
    } catch (err) {
      console.error('[WAD] Error getting sounds:', err);
      return [];
    }
  }, [loadWadFile]);

  return {
    loadWadFile,
    extractLumpData,
    loadMapData,
    getAvailableSounds,
    isLoading,
    error
  };
}