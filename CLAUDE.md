# Voice Controlled Doom Gameplay

A voice-controlled Doom game implementation featuring dual AI agents - one for voice processing and another for movement control.

## Project Structure

- **Voice Agent**: Handles speech-to-speech communication for game commands
- **Movement Agent**: Processes voice commands and translates to game movement
- **Game Engine**: Browser-based Doom implementation

## Key Technologies

- **Frontend Framework**: Next.js with React
- **Styling**: Tailwind CSS
- OpenAI Voice Agents API
- Browser-based game rendering
- Speech-to-speech processing
- Vercel (deployment platform)
- Vercel AI SDK (if needed)
- shadcn components
- minimal UI design with light and dark themes

## Application Design

- **Single Page Layout**: Complete game experience on one web page
- **Upper Section**: Doom game display and gameplay area
- **Lower Section**: Voice input interface with microphone controls
- **Voice Commands**: Real-time speech recognition for game control

## Reference Documentation

Doom game specs
- https://github.com/mkloubert/the-gitfather-blog--doom-mapviewer-with-nextjs/blob/main/docs/uds.1666.txt

A doom clone example
- https://medium.com/front-end-world/can-typescript-run-doom-a-journey-into-typescript-types-and-the-impossible-48c9b105265d
- https://nicholas.carlini.com/writing/2019/javascript-doom-clone-13k.html

- [OpenAI Voice Agents Guide](https://platform.openai.com/docs/guides/voice-agents?voice-agent-architecture=speech-to-speech)
- [OpenAI Agents JS SDK](https://openai.github.io/openai-agents-js/)

## Development Plan

### Phase 1: Project Foundation
- Set up Next.js project with Tailwind CSS and shadcn/ui
- Create responsive layout (game area top, voice controls bottom)
- Implement light/dark theme switching
- **Test**: Verify layout renders correctly on different screen sizes

### Phase 2: Voice Input System
- Implement microphone access and audio recording
- Create voice control UI with record/stop buttons
- Add audio visualization feedback
- **Test**: Record and playback audio successfully

### Phase 3: Game Integration
- Research and integrate browser-based Doom engine
- Implement basic game rendering in designated area
- Add keyboard controls for initial testing
- **Test**: Game runs and responds to keyboard input

### Phase 4: Speech Recognition
- Integrate OpenAI Voice Agents API
- Implement speech-to-text conversion
- Define basic voice commands (move, turn, shoot, etc.)
- **Test**: Voice commands are accurately transcribed

### Phase 5: Command Processing
- Map voice commands to game actions
- Implement movement agent logic
- Create command validation and error handling
- **Test**: Commands trigger correct game responses

### Phase 6: Full Integration
- Connect voice input to game controls end-to-end
- Implement real-time command processing
- Add feedback for successful/failed commands
- **Test**: Complete voice-to-game control flow

### Phase 7: Polish & Deployment
- Add loading states and error handling
- Implement user feedback and help system
- Deploy to Vercel and test production functionality
- **Test**: Production deployment works correctly

## Development Commands

*Commands will be added as the project develops*

## Git Workflow

- Main branch: `main`
- Current branch: `movement-agent`