"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, MicOff, Square, AlertCircle, Play } from "lucide-react";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";

export function VoiceControls() {
  const {
    isRecording,
    audioLevel,
    error,
    startRecording,
    stopRecording,
    requestPermission,
  } = useVoiceRecording();

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);

  useEffect(() => {
    // Check for microphone permission on component mount
    checkPermission();
  }, []);

  const checkPermission = async () => {
    const permitted = await requestPermission();
    setHasPermission(permitted);
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      const audioBlob = await stopRecording();
      if (audioBlob) {
        setRecordedAudio(audioBlob);
      }
    } else {
      if (!hasPermission) {
        const permitted = await requestPermission();
        setHasPermission(permitted);
        if (!permitted) return;
      }
      await startRecording();
    }
  };

  const playRecordedAudio = () => {
    if (recordedAudio) {
      const audioUrl = URL.createObjectURL(recordedAudio);
      const audio = new Audio(audioUrl);
      audio.play();
      
      // Clean up the URL after playing
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
    }
  };

  const AudioVisualizer = () => {
    const bars = Array.from({ length: 20 }, (_, i) => {
      const height = Math.max(0.1, audioLevel + Math.random() * 0.3);
      return (
        <div
          key={i}
          className="bg-blue-500 rounded-full transition-all duration-100"
          style={{
            height: `${height * 100}%`,
            width: '3px',
          }}
        />
      );
    });

    return (
      <div className="flex items-end justify-center gap-1 h-12 w-32">
        {isRecording ? bars : (
          <div className="text-xs text-muted-foreground">Ready to record</div>
        )}
      </div>
    );
  };

  if (hasPermission === false) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-red-600">Microphone Access Required</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Please allow microphone access to use voice commands
            </p>
          </div>
          <Button onClick={checkPermission} variant="outline">
            Request Permission
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="text-center space-y-4">
        <h3 className="text-lg font-semibold">Voice Commands</h3>
        
        {/* Audio Visualizer */}
        <AudioVisualizer />
        
        {/* Recording Button */}
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleToggleRecording}
            className={`rounded-full w-16 h-16 transition-all ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
            disabled={hasPermission === null}
          >
            {isRecording ? (
              <Square className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </Button>
        </div>
        
        {/* Status */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {isRecording 
              ? "Recording... Click to stop" 
              : "Click the microphone to start voice control"
            }
          </p>
          
          {error && (
            <p className="text-sm text-red-500 flex items-center justify-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {error}
            </p>
          )}
          
          {recordedAudio && !isRecording && (
            <div className="space-y-2">
              <p className="text-sm text-green-600">
                ✓ Audio recorded successfully ({Math.round(recordedAudio.size / 1024)}KB)
              </p>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={playRecordedAudio}
                className="gap-2"
              >
                <Play className="w-3 h-3" />
                Play Recording
              </Button>
            </div>
          )}
        </div>
        
        {/* Command Examples */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
          <div className="p-2 bg-background rounded border">Move forward</div>
          <div className="p-2 bg-background rounded border">Turn left</div>
          <div className="p-2 bg-background rounded border">Turn right</div>
          <div className="p-2 bg-background rounded border">Shoot</div>
        </div>
      </div>
    </Card>
  );
}