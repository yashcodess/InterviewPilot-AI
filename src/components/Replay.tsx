import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  Printer,
  Clock,
  FileText,
  TrendingUp,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';
import { triggerPrint } from '../utils/export';

interface ReplayProps {
  activeRecord: { interview: any; evaluation: any } | null;
}

export function Replay({ activeRecord }: ReplayProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  if (!activeRecord || !activeRecord.interview || !activeRecord.evaluation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center text-text-secondary mb-6">
          <BookOpen className="w-8 h-8 stroke-[1.5]" />
        </div>
        <h3 className="text-xl font-semibold font-display tracking-tight text-text-bright">No Replay Available</h3>
        <p className="text-sm text-text-secondary mt-2 text-center leading-relaxed">
          Please complete a mock interview session to unlock detailed step-by-step session replays.
        </p>
        <Button onClick={() => navigate('/setup')} className="mt-8">
          Start Interview Setup
        </Button>
      </div>
    );
  }

  const { interview, evaluation } = activeRecord;
  const timesTaken = interview.timesTaken || [];

  // Filter transcript based on query
  const filteredTranscript = (interview.transcript || []).map((item: any, idx: number) => ({
    ...item,
    originalIndex: idx
  })).filter((item: any) => {
    const qText = getQuestionText(item.question).toLowerCase();
    const aText = (item.answer || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return qText.includes(query) || aText.includes(query);
  });

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-450 border-emerald-500/20 bg-emerald-500/5';
    if (score < 60) return 'text-rose-455 border-rose-500/20 bg-rose-500/5';
    return 'text-primary border-primary/20 bg-primary/5';
  };

  const getScoreDotColor = (score: number) => {
    if (score >= 85) return 'bg-emerald-500 border-emerald-450 shadow-[0_0_8px_rgba(16,185,129,0.3)]';
    if (score < 60) return 'bg-rose-550 border-rose-450 shadow-[0_0_8px_rgba(239,68,68,0.3)]';
    return 'bg-primary border-primary shadow-[0_0_8px_rgba(59,130,246,0.3)]';
  };

  function getQuestionText(raw: any): string {
    if (typeof raw === 'object' && raw !== null) {
      return `${raw.title || 'Coding Challenge'} - ${raw.description}`;
    }
    if (typeof raw !== 'string') return '';
    try {
      const parsed = JSON.parse(raw);
      if (parsed.problemTitle || parsed.title) {
        return `${parsed.problemTitle || parsed.title} - ${parsed.description}`;
      }
    } catch {
      // Fallback
    }
    return raw;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="max-w-4xl mx-auto py-10 px-4"
    >
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-8 no-print">
        <div className="space-y-1">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </button>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-text-bright mt-2">
            Interview Session Replay
          </h1>
          <p className="text-sm text-text-secondary">
            Timeline walkthrough of your target {interview.setup.role} interview.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Button variant="outline" size="sm" onClick={triggerPrint} className="flex items-center gap-2">
            <Printer className="w-4 h-4" /> Export Replay PDF
          </Button>
        </div>
      </div>

      {/* Search filters */}
      <div className="mb-8 no-print">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions or your answers..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Timeline Section */}
      <div className="relative pl-6 sm:pl-8 border-l border-input-border space-y-10 py-2">
        {filteredTranscript.length === 0 ? (
          <div className="text-center py-10 text-text-secondary text-sm no-print">
            No matching questions or answers found.
          </div>
        ) : (
          filteredTranscript.map((item: any) => {
            const idx = item.originalIndex;
            const timeElapsed = timesTaken[idx] || 0;
            const wordCount = item.answer ? item.answer.trim().split(/\s+/).length : 0;

            // Extract question evaluation from AI scorecard
            const qEval = evaluation.questionEvaluations?.find((e: any) => e.questionIndex === idx) || {
              score: evaluation.overallScore, // fallback
              feedback: evaluation.improvementTips?.[idx % evaluation.improvementTips.length] || 'Solid response quality.',
              confidence: evaluation.scores.confidence >= 80 ? 'High' : 'Medium'
            };

            const score = qEval.score;

            return (
              <div key={idx} className="relative group page-break-inside-avoid">
                {/* Dotted indicator timeline line bullets */}
                <div className={`absolute -left-[32px] sm:-left-[40px] top-1.5 h-5 w-5 rounded-full border-4 border-slate-950 flex items-center justify-center text-[8px] font-bold text-slate-950 select-none z-10 transition-all cursor-default ${getScoreDotColor(score)}`}>
                  {idx + 1}
                </div>

                <div className="space-y-4">
                  {/* Card Container */}
                  <Card className="hover:border-border transition-all duration-300">
                    <CardHeader className="pb-3 border-b border-border">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Question {idx + 1}</span>
                          <h3 className="text-base font-bold text-text-bright font-display leading-snug tracking-tight">
                            {getQuestionText(item.question)}
                          </h3>
                        </div>
                        <Badge variant="primary" className={`shrink-0 text-[10px] py-1 px-2.5 font-mono font-bold uppercase ${getScoreColor(score)}`}>
                          Score: {score}/100
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="py-4 space-y-4 text-xs">
                      {/* Meta information */}
                      <div className="flex flex-wrap gap-4 text-text-secondary font-semibold select-none border-b border-slate-900/40 pb-3">
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {timeElapsed} seconds</span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> {wordCount} words</span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Confidence: {qEval.confidence}</span>
                      </div>

                      {/* Candidate Answer */}
                      <div className="space-y-1.5">
                        <p className="font-bold text-slate-455 uppercase text-[9px] tracking-wider select-none">Your Response</p>
                        {interview.category === 'Code Interview' ? (
                          <pre className="text-text bg-slate-950 p-4 rounded-lg border border-slate-900/60 leading-relaxed font-mono overflow-x-auto text-[11px] whitespace-pre select-text">
                            <code>{item.answer || '(No code submitted)'}</code>
                          </pre>
                        ) : (
                          <p className="text-text bg-background/40 p-3 rounded-lg border border-slate-900/60 leading-relaxed font-semibold italic">
                            "{item.answer || '(No answer provided)'}"
                          </p>
                        )}
                      </div>

                      {/* Follow-up question if answered */}
                      {item.followUp && (
                        <div className="mt-4 p-4 rounded-xl border border-blue-950/30 bg-blue-950/5 space-y-3">
                          <div>
                            <span className="text-[9px] font-bold uppercase text-primary tracking-wider select-none">Follow-up Challenge</span>
                            <p className="text-sm font-bold text-text mt-1 leading-snug">{item.followUp.question}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="font-semibold text-text-secondary text-[9px] tracking-wider select-none">Your Response</p>
                            <p className="text-slate-350 italic pl-3.5 border-l-2 border-border leading-relaxed">
                              "{item.followUp.answer || '(No answer provided)'}"
                            </p>
                          </div>
                        </div>
                      )}

                      {/* AI Feedback */}
                      <div className="mt-4 pt-4 border-t border-border space-y-2">
                        <div className="flex items-center gap-1.5 text-primary select-none">
                          <Sparkles className="w-4 h-4 animate-pulse" />
                          <span className="text-[9px] font-bold uppercase tracking-wider">Recruiter Evaluation</span>
                        </div>
                        <p className="text-text-secondary leading-relaxed font-medium">
                          {qEval.feedback}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* printable report overlay (only displays when printing) */}
      <div className="hidden print:block mt-12 pt-6 border-t border-slate-200 text-center text-[10px] text-text-secondary">
        Generated by InterviewPilot AI. Walkthrough transcript generated on {new Date(interview.timestamp).toLocaleDateString()}.
      </div>
    </motion.div>
  );
}
