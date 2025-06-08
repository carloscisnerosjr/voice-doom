# Doom Audio Assets

## Music Directory (`/public/audio/music/`)
Place your Doom music files here. The game will automatically try these formats:
- `e1m1.mp3` - Main background music for E1M1
- `e1m1.wav` - Alternative format
- `doom-music.mp3` - Generic background music
- `background.mp3` - Fallback music

## Sound Effects Directory (`/public/audio/sfx/`)
Place your Doom sound effects here. The game will look for:

### Weapon Sounds:
- `pistol.mp3` / `pistol.wav` - Pistol firing
- `shotgun.mp3` / `shotgun.wav` - Shotgun firing  
- `shoot.mp3` / `shoot.wav` - Generic shooting
- `fire.mp3` / `fire.wav` - Alternative firing sound
- `gun.mp3` / `gun.wav` - Generic gun sound

### Movement Sounds:
- `footstep.mp3` / `footstep.wav` - Footstep sounds
- `step.mp3` / `step.wav` - Alternative footstep
- `walk.mp3` / `walk.wav` - Walking sound

### Other Effects:
- `door.mp3` / `door.wav` - Door opening/closing
- `pickup.mp3` / `pickup.wav` - Item pickup
- `hit.mp3` / `hit.wav` - Impact sounds

## Audio System Features:
- **Multi-format support**: Automatically tries .mp3, .wav, and files without extensions
- **Fallback system**: If specific sounds aren't found, tries alternative names
- **Volume control**: Different volumes for music vs sound effects
- **Error handling**: Gracefully handles missing files

## Usage:
1. Drop your audio files into the appropriate directories
2. Use common names (like those listed above) for automatic detection
3. The game will try multiple formats and fallback to synthesized sounds if needed

## Supported Formats:
- MP3 (recommended for music)
- WAV (recommended for sound effects)
- OGG (browser dependent)
- M4A (browser dependent)