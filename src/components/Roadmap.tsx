import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  ArrowLeft,
  ExternalLink,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  ListTodo,
  BookmarkCheck
} from 'lucide-react';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

interface RoadmapProps {
  activeRecord: { interview: any; evaluation: any } | null;
}

export function Roadmap({ activeRecord }: RoadmapProps) {
  const navigate = useNavigate();
  const [expandedWeek, setExpandedWeek] = useState<number | null>(0);

  if (!activeRecord) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center text-text-secondary mb-6">
          <BookOpen className="w-8 h-8 stroke-[1.5]" />
        </div>
        <h3 className="text-xl font-semibold font-display tracking-tight text-text-bright">No Active Roadmap</h3>
        <p className="text-sm text-text-secondary mt-2 text-center leading-relaxed">
          Please complete a mock interview session first to generate a personalized study roadmap.
        </p>
        <Button onClick={() => navigate('/setup')} className="mt-8">
          Start Interview Setup
        </Button>
      </div>
    );
  }

  const { interview, evaluation } = activeRecord;
  const roadmap = evaluation.roadmap || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="max-w-3xl mx-auto py-8 px-4"
    >
      <div className="mb-8 flex flex-col gap-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text transition-colors max-w-fit cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </button>
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-text-bright flex items-center gap-2 select-none">
            <BookOpen className="w-7 h-7 text-primary" />
            AI Study Roadmap
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            4-Week structured study syllabus generated from weaknesses identified during your mock interview.
          </p>
        </div>
      </div>

      {roadmap.length === 0 ? (
        <Card className="text-center py-10">
          <CardContent className="flex flex-col items-center gap-3">
            <HelpCircle className="w-12 h-12 text-text-secondary" />
            <p className="text-sm text-text-secondary">
              No specific study paths were recommended. This usually means you scored exceptionally well across all sections!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {roadmap.map((item: any, idx: number) => {
            const isExpanded = expandedWeek === idx;
            const weekTitle = item.week || `Week ${idx + 1}: Study Guide`;
            
            return (
              <Card
                key={idx}
                className="overflow-hidden border border-border hover:border-border/80 transition-all select-none"
              >
                <div
                  onClick={() => setExpandedWeek(isExpanded ? null : idx)}
                  className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-card/10 transition-colors"
                >
                  <div className="flex flex-col gap-1 w-10/12">
                    <span className="text-[9px] font-bold text-primary uppercase tracking-widest">
                      Module Week {idx + 1}
                    </span>
                    <h3 className="text-base font-bold text-text-bright font-display tracking-tight leading-snug">
                      {weekTitle}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant="secondary" className="text-[10px] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-text-secondary" />
                      {item.estimatedStudyTime || '6 hours'}
                    </Badge>
                    <div className="w-8 h-8 rounded-lg bg-card border border-input-border flex items-center justify-center text-text-secondary">
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <div className="p-5 pt-0 border-t border-slate-900/60 bg-background/20 space-y-5 text-left">
                        {item.topics && item.topics.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
                              Topics Covered
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {item.topics.map((topic: string, tIdx: number) => (
                                <Badge key={tIdx} variant="secondary" className="bg-card border-input-border/60 text-slate-350 text-[10px]">
                                  {topic}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                          {item.learningGoals && item.learningGoals.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Learning Goals
                              </span>
                              <ul className="space-y-1.5 text-xs text-slate-350 leading-relaxed pl-1">
                                {item.learningGoals.map((goal: string, gIdx: number) => (
                                  <li key={gIdx} className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                                    <span>{goal}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {item.practiceTasks && item.practiceTasks.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1">
                                <ListTodo className="w-3.5 h-3.5 text-primary" /> Practice Tasks
                              </span>
                              <ul className="space-y-1.5 text-xs text-slate-350 leading-relaxed pl-1">
                                {item.practiceTasks.map((task: string, tIdx: number) => (
                                  <li key={tIdx} className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded bg-card border border-border shrink-0 mt-1.5" />
                                    <span>{task}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {item.resources && item.resources.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-slate-900/60">
                            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1">
                              <BookmarkCheck className="w-3.5 h-3.5 text-primary" /> Recommended Study References
                            </span>
                            <div className="flex flex-col gap-1.5">
                              {item.resources.map((res: string, rIdx: number) => {
                                const isUrl = res.startsWith('http://') || res.startsWith('https://');
                                return (
                                  <div key={rIdx} className="flex items-center gap-2 text-xs">
                                    {isUrl ? (
                                      <a
                                        href={res}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:text-blue-300 hover:underline flex items-center gap-1 font-mono text-[10px]"
                                      >
                                        {res} <ExternalLink className="w-3 h-3" />
                                      </a>
                                    ) : (
                                      <span className="text-text-secondary font-mono text-[10px]">{res}</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}