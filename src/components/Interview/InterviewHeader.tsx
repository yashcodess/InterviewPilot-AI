import React from 'react';
import { Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface InterviewHeaderProps {
  currentIndex: number;
  totalQuestions: number;
  timeLeft: number;
  totalElapsed: number;
  currentElapsed: number;
  isTimeCritical: boolean;
  formatTime: (sec: number) => string;
}

export function InterviewHeader({
  currentIndex,
  totalQuestions,
  timeLeft,
  totalElapsed,
  currentElapsed,
  isTimeCritical,
  formatTime
}: InterviewHeaderProps) {
  const progressValue = ((currentIndex + 1) / totalQuestions) * 100;

  return (
    <div className="flex flex-col gap-4 mb-6 select-none no-print">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div className="flex flex-col gap-1 w-full sm:w-2/3">
          <div className="flex justify-between text-xs text-text-secondary font-semibold">
            <span>Question {currentIndex + 1} of {totalQuestions}</span>
            <span>{Math.round(progressValue)}% Completed</span>
          </div>
          
          <div className="w-full bg-input-border border border-border/40 rounded-full h-2 overflow-hidden mt-1">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progressValue}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Remaining Time */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-xs font-bold transition-all duration-300 ${
            isTimeCritical 
              ? 'bg-red-950/30 border-red-500/40 text-red-400 animate-pulse' 
              : 'bg-card border-input-border text-slate-355'
          }`}>
            <Clock className={`w-3.5 h-3.5 ${isTimeCritical ? 'text-red-400' : 'text-text-secondary'}`} />
            <span>{timeLeft}s left</span>
          </div>

          {/* Total Elapsed */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-card border-slate-855 text-slate-355 font-mono text-xs font-semibold">
            <span>{formatTime(totalElapsed)} elapsed</span>
          </div>

          {/* Current Question Elapsed */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-card border-slate-855 text-slate-355 font-mono text-xs font-semibold">
            <span>{formatTime(currentElapsed)} this question</span>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Legends */}
      <div className="bg-card/45 border border-border/40 rounded-xl p-3 select-none text-[10px] text-text-secondary flex flex-wrap gap-x-6 gap-y-2 justify-center items-center">
        <span className="font-semibold text-text uppercase tracking-wider text-[9px] mr-2">Shortcuts:</span>
        <div className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-slate-900 border border-border/80 rounded text-text font-mono">Space</kbd> Start/Stop Mic</div>
        <div className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-slate-900 border border-border/80 rounded text-text font-mono">Ctrl + Enter</kbd> Next Question</div>
        <div className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-slate-900 border border-border/80 rounded text-text font-mono">Esc</kbd> Stop Voice</div>
        <div className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-slate-900 border border-border/80 rounded text-text font-mono">P</kbd> Pause Timers</div>
        <div className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-slate-900 border border-border/80 rounded text-text font-mono">R</kbd> Restart</div>
        <div className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-slate-900 border border-border/80 rounded text-text font-mono">M</kbd> Mute AI</div>
        <div className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-slate-900 border border-border/80 rounded text-text font-mono">F</kbd> Fullscreen</div>
      </div>
    </div>
  );
}
