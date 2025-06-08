import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { VoiceControls } from "@/components/voice-controls";
import { DoomRaycastEngine } from "@/components/doom-raycast-engine";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 border-b">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Voice Controlled Doom</h1>
            <p className="text-muted-foreground">Play Doom using voice commands</p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Game Area - Upper Section */}
      <div className="flex-1 p-4">
        <div className="w-full h-full min-h-[70vh]">
          <DoomRaycastEngine />
        </div>
      </div>

      {/* Voice Controls - Lower Section */}
      <div className="border-t bg-muted/50 p-4">
        <div className="max-w-7xl mx-auto">
          <VoiceControls />
        </div>
      </div>
    </div>
  );
}