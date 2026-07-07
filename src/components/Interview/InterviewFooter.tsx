import React from 'react';
import { ArrowLeft, ArrowRight, ChevronsRight, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';

interface InterviewFooterProps {
  currentIndex: number;
  totalQuestions: number;
  isListening: boolean;
  handlePrev: () => void;
  handleSkip: () => void;
  handleNext: () => void;
  handleFinish: () => void;
}

export function InterviewFooter({
  currentIndex,
  totalQuestions,
  isListening,
  handlePrev,
  handleSkip,
  handleNext,
  handleFinish
}: InterviewFooterProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t border-border/40 select-none no-print">
      <div className="flex gap-2 w-full sm:w-auto">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentIndex === 0 || isListening}
          className="flex items-center gap-1.5 flex-1 sm:flex-none justify-center"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </Button>
        <Button
          variant="ghost"
          onClick={handleSkip}
          disabled={isListening}
          className="flex items-center gap-1.5 text-text-secondary hover:text-slate-205 flex-1 sm:flex-none justify-center"
        >
          Skip
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex gap-3 w-full sm:w-auto justify-end">
        {currentIndex < totalQuestions - 1 ? (
          <Button
            onClick={handleNext}
            disabled={isListening}
            className="flex items-center gap-1.5 w-full sm:w-auto justify-center"
          >
            Next Question
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleFinish}
            disabled={isListening}
            variant="primary"
            className="bg-emerald-600 hover:bg-emerald-500 border-emerald-500/30 flex items-center gap-1.5 text-white w-full sm:w-auto justify-center"
          >
            <CheckCircle className="w-4 h-4" />
            Finish Interview
          </Button>
        )}
      </div>
    </div>
  );
}
