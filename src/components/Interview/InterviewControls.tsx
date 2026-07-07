import React from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize, Minimize, Power } from 'lucide-react';
import { Button } from '../ui/Button';

interface InterviewControlsProps {
  isPaused: boolean;
  isMuted: boolean;
  isFullscreen: boolean;
  setIsPaused: React.Dispatch<React.SetStateAction<boolean>>;
  setIsMuted: React.Dispatch<React.SetStateAction<boolean>>;
  handleRestartClick: () => void;
  handleEndInterviewClick: () => void;
  toggleFullscreen: () => void;
  triggerToast: (msg: string) => void;
  stopSpeaking: () => void;
  stopListening: () => void;
}

export function InterviewControls({
  isPaused,
  isMuted,
  isFullscreen,
  setIsPaused,
  setIsMuted,
  handleRestartClick,
  handleEndInterviewClick,
  toggleFullscreen,
  triggerToast,
  stopSpeaking,
  stopListening
}: InterviewControlsProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-card/85 backdrop-blur-md border border-border/80 px-4 py-2 rounded-full shadow-2xl flex items-center gap-4 transition-all duration-300 hover:border-primary/45 no-print">
      <button
        onClick={() => {
          setIsPaused(p => {
            const next = !p;
            triggerToast(next ? 'Interview Paused' : 'Interview Resumed');
            if (next) {
              stopSpeaking();
              stopListening();
            }
            return next;
          });
        }}
        title={isPaused ? "Resume Interview (P)" : "Pause Interview (P)"}
        className="p-2 rounded-full hover:bg-slate-800 text-text hover:text-text-bright transition-all cursor-pointer"
      >
        {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-amber-400" />}
      </button>

      <button
        onClick={handleRestartClick}
        title="Restart Interview (R)"
        className="p-2 rounded-full hover:bg-slate-800 text-text hover:text-text-bright transition-all cursor-pointer"
      >
        <RotateCcw className="w-4 h-4 text-blue-400" />
      </button>

      <button
        onClick={() => {
          setIsMuted(m => {
            const next = !m;
            triggerToast(next ? 'Voice Muted' : 'Voice Unmuted');
            if (next) stopSpeaking();
            return next;
          });
        }}
        title={isMuted ? "Unmute AI Voice (M)" : "Mute AI Voice (M)"}
        className="p-2 rounded-full hover:bg-slate-800 text-text hover:text-text-bright transition-all cursor-pointer"
      >
        {isMuted ? <VolumeX className="w-4 h-4 text-rose-400 animate-pulse" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
      </button>

      <button
        onClick={toggleFullscreen}
        title="Toggle Fullscreen (F)"
        className="p-2 rounded-full hover:bg-slate-800 text-text hover:text-text-bright transition-all cursor-pointer"
      >
        {isFullscreen ? <Minimize className="w-4 h-4 text-primary" /> : <Maximize className="w-4 h-4 text-primary" />}
      </button>

      <div className="w-px h-6 bg-border/60" />

      <Button
        variant="danger"
        size="sm"
        onClick={handleEndInterviewClick}
        className="px-4 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold"
      >
        <Power className="w-3.5 h-3.5" />
        End Session
      </Button>
    </div>
  );
}
