import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Award,
  BookOpen,
  Download,
  Printer,
  ArrowRight,
  History as HistoryIcon,
  AlertTriangle,
  Clock,
  Target,
  Star,
  Activity,
  Flame,
  ChevronRight,
  BookMarked,
  Play,
  MessageSquare
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { downloadTxtFile, generateReportTxt, triggerPrint } from '../utils/export';
import { AtsCard } from './AtsCard';

interface DashboardProps {
  activeRecord: { interview: any; evaluation: any } | null;
}

export function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
      setCount(end);
      return;
    }

    const totalMiliseconds = duration;
    const incrementTime = Math.max(8, Math.floor(totalMiliseconds / end));
    
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <>{count}</>;
}

export function Dashboard({ activeRecord }: DashboardProps) {
  const navigate = useNavigate();
  const [expandedTimelineWeek, setExpandedTimelineWeek] = useState<number | null>(1);

  if (!activeRecord) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4 space-y-12 no-print">
        <div className="flex flex-col items-center justify-center py-12 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-card/60 border border-input-border flex items-center justify-center text-text-secondary mb-6">
            <BookOpen className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h3 className="text-xl font-semibold font-display tracking-tight text-text-bright">
            Your interview analytics will appear here.
          </h3>
          <p className="text-sm text-text-secondary mt-2 leading-relaxed">
            Complete your first mock interview to unlock AI performance reports, skill analysis, and personalized recommendations.
          </p>
          <Button onClick={() => navigate('/setup')} className="mt-8">
            Start Mock Interview
          </Button>
        </div>

        {/* Career Tools Section */}
        <div className="space-y-4 pt-6 border-t border-border/40">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-355">Career Tools</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AtsCard />
          </div>
        </div>
      </div>
    );
  }

  const { interview, evaluation } = activeRecord;

  // Default communication metrics in case evaluation.communicationAnalysis is missing
  const comm = evaluation.communicationAnalysis || {
    speakingSpeed: 118,
    averageAnswerLength: 96,
    responseDuration: 320,
    longestPause: 2.8,
    speakingConsistency: 'High',
    answerCompleteness: 'High',
    confidenceTrend: 'Increasing',
    technicalVocabulary: 'Excellent',
    clarity: 78,
    conciseness: 64,
    communicationScore: 82,
    speakingStyle: 'Structured',
    overusedWords: ['like', 'actually'],
    coachingFeedback: [
      'Speak more confidently during architectural tradeoffs.',
      'Reduce filler words such as "like" and "actually" to sound more deliberate.',
      'Provide concrete engineering examples earlier in your responses.',
      'Improve answer structure using clear transition keywords.',
      'Finish complex system designs with a summarizing conclusion.'
    ],
    communicationExercises: [
      '1. Practice the STAR framework for behavioral scenarios twice daily.',
      '2. Read coding questions aloud while recording your speech rate.',
      '3. Describe any backend pipeline in exactly 60 seconds without filler words.',
      '4. Pause deliberately for 2 seconds before giving structured answers.',
      '5. Summarize database sharding trade-offs to someone non-technical.'
    ],
    fillerWords: 14
  };

  // Dynamic filler word count from transcript answers
  let realFillerCount = 0;
  const overusedWordsMap: Record<string, number> = {};
  const fillers = ['um', 'uh', 'like', 'actually', 'basically', 'you know', 'literally'];
  
  interview.answers?.forEach((ans: string) => {
    if (!ans || ans === '(Skipped Question)') return;
    const lower = ans.toLowerCase();
    fillers.forEach(f => {
      const regex = new RegExp(`\\b${f}\\b`, 'g');
      const matches = lower.match(regex);
      if (matches) {
        realFillerCount += matches.length;
        overusedWordsMap[f] = (overusedWordsMap[f] || 0) + matches.length;
      }
    });
  });

  interview.transcript?.forEach((t: any) => {
    if (t.followUp?.answer) {
      const lower = t.followUp.answer.toLowerCase();
      fillers.forEach(f => {
        const regex = new RegExp(`\\b${f}\\b`, 'g');
        const matches = lower.match(regex);
        if (matches) {
          realFillerCount += matches.length;
          overusedWordsMap[f] = (overusedWordsMap[f] || 0) + matches.length;
        }
      });
    }
  });

  const overusedWordsList = Object.entries(overusedWordsMap)
    .sort((a, b) => b[1] - a[1])
    .map(([word, count]) => `${word} (${count}x)`);

  const fillerCountToDisplay = realFillerCount > 0 ? realFillerCount : (comm.fillerWords || 0);
  const wordsToDisplay = overusedWordsList.length > 0 ? overusedWordsList : (comm.overusedWords || []);

  // Formatting variables
  const dateStr = new Date(interview.timestamp).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const overallScore = evaluation.overallScore || 0;
  let interviewLevel = 'Beginner';
  if (overallScore >= 85) interviewLevel = 'Advanced';
  else if (overallScore >= 70) interviewLevel = 'Intermediate';

  const strongestSkill = evaluation.strengths?.[0]?.split(':')?.[0] || 'Technical Accuracy';
  const weakestSkill = evaluation.weaknesses?.[0]?.split(':')?.[0] || 'Problem Solving';
  
  // Calculate question metrics
  const totalQuestions = interview.transcript?.length || 0;
  const answeredCount = interview.answers?.filter((a: string) => a && a !== '(Skipped Question)')?.length || 0;
  
  const followUpCount = interview.transcript?.filter((t: any) => t.followUp?.answer)?.length || 0;
  
  // Calculate estimated interview duration based on questions length
  const durationMin = Math.max(5, totalQuestions * 2);
  const durationStr = `${durationMin} mins`;

  // Average response time mock logic (highly descriptive for the dashboard)
  const avgResponseTime = "90 seconds";

  const handleDownloadTxt = () => {
    const txtContent = generateReportTxt(interview, evaluation);
    const filename = `InterviewPilot_Report_${interview.setup.role.replace(/\s+/g, '_')}_${new Date(interview.timestamp).toISOString().split('T')[0]}.txt`;
    downloadTxtFile(filename, txtContent);
  };

  // Readiness levels description
  let readinessDescription = 'Focus on programming logic, structural designs, and timing thresholds.';
  if (overallScore >= 85) readinessDescription = 'Excellent preparation. Ready to clear core technical loops at FAANG companies.';
  else if (overallScore >= 70) readinessDescription = 'Solid capability. Suitable for high-impact mid-level roles; practice weak domains.';
  else if (overallScore >= 50) readinessDescription = 'Moderate preparation. Target algorithm consistency and communication patterns.';

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100, damping: 15 } }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="max-w-5xl mx-auto py-10 px-4"
    >
      
      {/* 1. Top Hero Section */}
      <div className="relative overflow-hidden rounded-3xl border border-hero-border bg-hero-bg shadow-card hover:shadow-card-hover p-6 sm:p-8 mb-8 transition-all duration-300">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Award className="w-48 h-48 text-primary" />
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Analysis Summary</span>
              {evaluation.resumeCoverage !== undefined && (
                <Badge variant="primary" className="bg-primary/10 text-primary border-primary/20 text-[9px] py-0.5">
                  Resume-Customized
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-extrabold font-display tracking-tight text-text-bright">
              {interview.setup.role}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-text-secondary">
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {dateStr}</span>
              <span>•</span>
              <span className="font-semibold text-text">{interview.setup.category}</span>
              <span>•</span>
              <span className="px-2 py-0.5 bg-card border border-input-border rounded text-[10px] uppercase font-bold tracking-wider">{interview.setup.difficulty}</span>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0">
            <div className="text-xs text-text-secondary font-bold uppercase tracking-wider">Readiness Tier</div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-2xl font-extrabold text-text-bright"><AnimatedNumber value={overallScore} />/100</div>
                <div className="text-[9px] font-bold text-primary uppercase tracking-widest">{interviewLevel} Level</div>
              </div>
              <div className="h-10 w-px bg-input-border" />
              <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 text-primary font-display font-extrabold text-lg select-none">
                {overallScore >= 85 ? 'A' : overallScore >= 75 ? 'B' : overallScore >= 60 ? 'C' : 'D'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        
        {/* 2. Quick Summary Cards (4 Cards) */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Score */}
          <Card className="hover:border-border transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-28">
            <CardHeader className="pb-0 pt-4 flex flex-row items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Overall Score</span>
              <Star className="w-4 h-4 text-amber-500 fill-amber-500/10" />
            </CardHeader>
            <CardContent className="pb-4">
              <div className="text-2xl font-extrabold text-text-bright"><AnimatedNumber value={overallScore} />%</div>
              <div className="w-full bg-card border border-input-border h-1 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${overallScore}%` }} />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Strongest Skill */}
          <Card className="hover:border-border transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-28">
            <CardHeader className="pb-0 pt-4 flex flex-row items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Strongest Skill</span>
              <Target className="w-4 h-4 text-emerald-500" />
            </CardHeader>
            <CardContent className="pb-4">
              <div className="text-base font-extrabold text-text truncate">{strongestSkill}</div>
              <span className="text-[9px] text-text-secondary font-bold uppercase tracking-widest mt-1 block">Peak competency</span>
            </CardContent>
          </Card>

          {/* Card 3: Biggest Weakness */}
          <Card className="hover:border-border transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-28">
            <CardHeader className="pb-0 pt-4 flex flex-row items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Biggest Weakness</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </CardHeader>
            <CardContent className="pb-4">
              <div className="text-base font-extrabold text-text truncate">{weakestSkill}</div>
              <span className="text-[9px] text-text-secondary font-bold uppercase tracking-widest mt-1 block">Needs iteration</span>
            </CardContent>
          </Card>

          {/* Card 4: Interview Duration */}
          <Card className="hover:border-border transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-28">
            <CardHeader className="pb-0 pt-4 flex flex-row items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Session Time</span>
              <Clock className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent className="pb-4">
              <div className="text-2xl font-extrabold text-text-bright">{durationStr}</div>
              <span className="text-[9px] text-text-secondary font-bold uppercase tracking-widest mt-2 block">Total elapsed</span>
            </CardContent>
          </Card>
        </motion.div>

        {/* 3. Skills Breakdown & Performance Panel */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Skill Performance List (Progress Cards) */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="hover:border-border transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold">Skill Performance</CardTitle>
                    <CardDescription className="text-xs">Weighted criteria evaluation</CardDescription>
                  </div>
                  <Activity className="w-4.5 h-4.5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4.5 pb-5">
                {[
                  { key: 'communication', label: 'Communication Skills' },
                  { key: 'technicalAccuracy', label: 'Technical Accuracy' },
                  { key: 'confidence', label: 'Confidence & Delivery' },
                  { key: 'problemSolving', label: 'Problem Solving' },
                  { key: 'completeness', label: 'Completeness of Answers' },
                ].map((dim) => {
                  const score = evaluation.scores[dim.key] || 0;
                  let colorClass = 'bg-primary';
                  if (score < 50) colorClass = 'bg-rose-500';
                  else if (score < 75) colorClass = 'bg-amber-500';
                  else colorClass = 'bg-emerald-500';

                  return (
                    <div key={dim.key} className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-text-secondary font-semibold">
                        <span>{dim.label}</span>
                        <span className="font-mono text-text"><AnimatedNumber value={score} />/100</span>
                      </div>
                      <div className="w-full bg-card border border-input-border h-2 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${colorClass}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${score}%` }}
                          transition={{ duration: 1.1, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
            {/* AI Communication Coach (Grammarly-style Insights) */}
            <Card className="hover:border-border transition-all duration-300">
              <CardHeader className="pb-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      <CardTitle className="text-base font-bold">AI Communication Coach</CardTitle>
                    </div>
                    <CardDescription className="text-xs">Grammarly Insights-inspired verbal coach & filler analysis</CardDescription>
                  </div>
                  <Badge variant="primary" className="bg-primary/10 text-primary border-primary/20 font-mono font-bold py-1 px-3 text-xs">
                    Score: <AnimatedNumber value={comm.communicationScore || 82} />%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-5">
                
                {/* 1. Grammarly-style Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Gauge Rings */}
                  <div className="flex justify-around items-center gap-4 bg-card/40 p-4 rounded-xl border border-input-border">
                    <div className="text-center space-y-1.5">
                      <div className="relative h-14 w-14 mx-auto flex items-center justify-center">
                        <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-slate-850"
                            strokeWidth="3.5"
                            stroke="currentColor"
                            fill="transparent"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <motion.path
                            className="text-emerald-500"
                            strokeWidth="3.5"
                            strokeDasharray={`${comm.clarity}, 100`}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: comm.clarity / 100 }}
                            transition={{ duration: 1.1, ease: "easeOut" }}
                          />
                        </svg>
                        <span className="text-xs font-extrabold text-text-bright font-mono"><AnimatedNumber value={comm.clarity} />%</span>
                      </div>
                      <span className="text-[9px] text-text-secondary font-bold uppercase tracking-wider block">Clarity</span>
                    </div>

                    <div className="text-center space-y-1.5">
                      <div className="relative h-14 w-14 mx-auto flex items-center justify-center">
                        <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-slate-850"
                            strokeWidth="3.5"
                            stroke="currentColor"
                            fill="transparent"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <motion.path
                            className="text-primary"
                            strokeWidth="3.5"
                            strokeDasharray={`${comm.conciseness}, 100`}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: comm.conciseness / 100 }}
                            transition={{ duration: 1.1, ease: "easeOut" }}
                          />
                        </svg>
                        <span className="text-xs font-extrabold text-text-bright font-mono"><AnimatedNumber value={comm.conciseness} />%</span>
                      </div>
                      <span className="text-[9px] text-text-secondary font-bold uppercase tracking-wider block">Conciseness</span>
                    </div>
                  </div>

                  {/* Qualitative Breakdown list */}
                  <div className="space-y-2.5 text-xs font-semibold">
                    <div className="flex justify-between items-center py-1 border-b border-slate-900/40">
                      <span className="text-text-secondary">Speaking Style</span>
                      <Badge variant="secondary" className="bg-card border border-input-border text-text text-[10px] py-0.5">
                        {comm.speakingStyle}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-900/40">
                      <span className="text-slate-455">Confidence Trend</span>
                      <Badge variant="primary" className="bg-primary/5 text-primary border-primary/15 text-[10px] py-0.5">
                        {comm.confidenceTrend}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-455">Vocabulary Rating</span>
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] py-0.5">
                        {comm.technicalVocabulary}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* 2. Speaking Parameters details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center select-none">
                  <div className="bg-card/20 p-3 rounded-xl border border-slate-900/60 hover:border-input-border transition-all duration-300">
                    <span className="text-[9px] text-text-secondary font-bold uppercase tracking-wider block">Speaking Speed</span>
                    <span className="text-sm font-extrabold text-text mt-1 block">{comm.speakingSpeed} wpm</span>
                  </div>
                  <div className="bg-card/20 p-3 rounded-xl border border-slate-900/60 hover:border-input-border transition-all duration-300">
                    <span className="text-[9px] text-text-secondary font-bold uppercase tracking-wider block">Avg Answer Size</span>
                    <span className="text-sm font-extrabold text-text mt-1 block">{comm.averageAnswerLength} words</span>
                  </div>
                  <div className="bg-card/20 p-3 rounded-xl border border-slate-900/60 hover:border-input-border transition-all duration-300">
                    <span className="text-[9px] text-text-secondary font-bold uppercase tracking-wider block">Longest Pause</span>
                    <span className="text-sm font-extrabold text-text mt-1 block">{comm.longestPause}s</span>
                  </div>
                  <div className="bg-card/20 p-3 rounded-xl border border-slate-900/60 hover:border-input-border transition-all duration-300">
                    <span className="text-[9px] text-text-secondary font-bold uppercase tracking-wider block">Consistency</span>
                    <span className="text-sm font-extrabold text-text mt-1 block">{comm.speakingConsistency || 'High'}</span>
                  </div>
                </div>

                {/* 3. Filler Word Detection */}
                <div className="p-4 rounded-xl border border-rose-500/10 bg-rose-500/[0.02] space-y-3">
                  <div className="flex justify-between items-center select-none">
                    <div className="flex items-center gap-1.5 text-rose-455 font-bold text-xs uppercase tracking-wider">
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      <span>Filler Word Detection</span>
                    </div>
                    <Badge variant="primary" className="bg-rose-500/10 text-rose-400 border-rose-500/20 font-mono font-bold text-xs py-0.5">
                      {fillerCountToDisplay} Detected
                    </Badge>
                  </div>
                  
                  <div className="space-y-1.5 text-xs">
                    <p className="font-semibold text-text-secondary">Overused verbal fillers matched:</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {wordsToDisplay.length > 0 ? (
                        wordsToDisplay.map((w: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-[10px] bg-rose-955/20 border border-rose-900/20 text-rose-300 font-semibold py-0.5 px-2">
                            {w}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-[11px] text-text-secondary font-medium italic">No filler patterns detected</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. AI Communication Feedback */}
                {comm.coachingFeedback && comm.coachingFeedback.length > 0 && (
                  <div className="space-y-2.5">
                    <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider select-none">Personalized Coaching Advice</p>
                    <ul className="space-y-2 text-xs text-text-secondary font-medium pl-1 leading-relaxed">
                      {comm.coachingFeedback.map((tip: string, idx: number) => (
                        <li key={idx} className="flex gap-2 items-start">
                          <span className="flex items-center justify-center w-4 h-4 rounded-full bg-primary/10 text-primary text-[9px] shrink-0 font-bold mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="mt-0.5">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 5. Improvement Exercises */}
                {comm.communicationExercises && comm.communicationExercises.length > 0 && (
                  <div className="space-y-2.5 pt-2 border-t border-border">
                    <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider select-none font-sans">Improvement Plan Exercises</p>
                    <div className="grid grid-cols-1 gap-2.5">
                      {comm.communicationExercises.map((ex: string, idx: number) => (
                        <div key={idx} className="p-3 bg-card/40 border border-input-border rounded-xl flex gap-3 items-start hover:border-border transition-colors">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-450 text-[10px] font-bold shrink-0 mt-0.5">
                            ✓
                          </span>
                          <p className="text-xs text-slate-350 leading-relaxed font-semibold">
                            {ex}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Interview Stats */}
          <div className="lg:col-span-1">
            <Card className="hover:border-border transition-all duration-300 h-full">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold">Session Metrics</CardTitle>
                <CardDescription className="text-xs">Quantitative timeline data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs font-semibold">
                
                <div className="flex justify-between items-center py-2.5 border-b border-slate-900/60">
                  <span className="text-text-secondary">Questions Answered</span>
                  <span className="text-slate-205">{answeredCount} of {totalQuestions}</span>
                </div>

                <div className="flex justify-between items-center py-2.5 border-b border-slate-900/60">
                  <span className="text-text-secondary">Follow-up Probes</span>
                  <span className="text-slate-205">{followUpCount} resolved</span>
                </div>

                <div className="flex justify-between items-center py-2.5 border-b border-slate-900/60">
                  <span className="text-text-secondary">Avg. Response Speed</span>
                  <span className="text-slate-205">{avgResponseTime}</span>
                </div>

                <div className="flex justify-between items-center py-2.5">
                  <span className="text-text-secondary">Confidence Score</span>
                  <span className="text-primary">{evaluation.scores.confidence}/100</span>
                </div>
                
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* 4. AI Coach Insights (Cards) */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-primary" />
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-355">AI Coach Insights</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. Strength */}
            <Card className="hover:border-border transition-all duration-300 border-emerald-500/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-450 flex items-center gap-1.5">
                  <span>💡 Biggest Strength</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-text leading-relaxed font-semibold">
                {evaluation.strengths?.[0] || 'Clear, well-reasoned coding explanations.'}
              </CardContent>
            </Card>

            {/* 2. Weakness */}
            <Card className="hover:border-border transition-all duration-300 border-rose-500/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-rose-450 flex items-center gap-1.5">
                  <span>⚠ Biggest Weakness</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-text leading-relaxed font-semibold">
                {evaluation.weaknesses?.[0] || 'Ensure all edge cases and boundary configurations are outlined.'}
              </CardContent>
            </Card>

            {/* 3. Next Improvement */}
            <Card className="hover:border-border transition-all duration-300 border-amber-500/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-405 flex items-center gap-1.5">
                  <span>🚀 Next Improvement</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-text leading-relaxed font-semibold">
                {evaluation.improvementTips?.[0] || 'Focus on optimizing nested cycles to improve runtime complexities.'}
              </CardContent>
            </Card>

            {/* 4. Readiness */}
            <Card className="hover:border-border transition-all duration-300 border-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-blue-455 flex items-center gap-1.5">
                  <span>🎯 Interview Readiness</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-text leading-relaxed font-semibold">
                {readinessDescription}
              </CardContent>
            </Card>

          </div>
        </motion.div>

        {/* 5. Recommended Learning Path (Timeline) */}
        {evaluation.roadmap && evaluation.roadmap.length > 0 && (
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-primary" />
              <h2 className="text-base font-bold uppercase tracking-wider text-slate-355">Recommended Learning Path</h2>
            </div>
            
            <Card className="hover:border-border transition-all duration-300">
              <CardContent className="p-6">
                <div className="relative pl-6 border-l border-input-border space-y-6">
                  {evaluation.roadmap.map((weekItem: any, idx: number) => {
                    const weekNum = idx + 1;
                    const isExpanded = expandedTimelineWeek === weekNum;
                    
                    return (
                      <div key={idx} className="relative">
                        {/* Dot */}
                        <div
                          onClick={() => setExpandedTimelineWeek(isExpanded ? null : weekNum)}
                          className={`absolute -left-[31px] top-1 h-4.5 w-4.5 rounded-full border border-slate-805 flex items-center justify-center font-mono font-bold text-[8px] cursor-pointer transition-all ${
                            isExpanded 
                              ? 'bg-primary border-primary text-slate-950 shadow-md shadow-blue-500/20 scale-110'
                              : 'bg-card text-text-secondary border-input-border'
                          }`}
                        >
                          {weekNum}
                        </div>

                        <div>
                          <button
                            onClick={() => setExpandedTimelineWeek(isExpanded ? null : weekNum)}
                            className="w-full text-left flex items-center justify-between gap-4 font-semibold hover:text-blue-455 transition-colors cursor-pointer"
                          >
                            <div>
                              <h4 className="text-sm font-bold text-text">
                                {weekItem.week || `Week ${weekNum}: Focus Guide`}
                              </h4>
                              <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mt-0.5">
                                Est: {weekItem.estimatedStudyTime || '6 hours'}
                              </p>
                            </div>
                            <ChevronRight className={`w-4 h-4 text-text-secondary transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </button>

                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.22 }}
                                className="overflow-hidden space-y-3 pt-2 text-xs text-text-secondary pl-1"
                              >
                                {weekItem.topics && (
                                  <div className="space-y-1">
                                    <p className="font-semibold text-text-secondary uppercase text-[9px] tracking-wider">Topics</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {weekItem.topics.map((t: string, tIdx: number) => (
                                        <Badge key={tIdx} variant="secondary" className="text-[10px] bg-card border border-input-border text-text">
                                          {t}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {weekItem.practiceTasks && (
                                  <div className="space-y-1">
                                    <p className="font-semibold text-text-secondary uppercase text-[9px] tracking-wider">Practice Tasks</p>
                                    <ul className="list-disc pl-4 space-y-1 text-text-secondary leading-relaxed">
                                      {weekItem.practiceTasks.map((task: string, taskIdx: number) => (
                                        <li key={taskIdx}>{task}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Career Tools Section */}
        <motion.div variants={itemVariants} className="space-y-4 no-print">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-355">Career Tools</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AtsCard />
          </div>
        </motion.div>

        {/* 6. Bottom CTA / Action buttons */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-border no-print">
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/history')}
              className="flex items-center gap-2 flex-1 sm:flex-none justify-center font-semibold text-xs py-2 px-4"
            >
              <HistoryIcon className="w-4 h-4" />
              View History
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTxt}
              className="flex items-center gap-2 flex-1 sm:flex-none justify-center font-semibold text-xs py-2 px-4"
            >
              <Download className="w-4 h-4" />
              Download Report
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/replay')}
              className="flex items-center gap-2 flex-1 sm:flex-none justify-center font-semibold text-xs py-2 px-4 text-primary border-primary/10 bg-primary/5 hover:bg-primary/10"
            >
              <Play className="w-4 h-4 fill-current" />
              Replay Session
            </Button>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={triggerPrint}
              className="flex items-center gap-2 flex-1 sm:flex-none justify-center font-semibold text-xs py-2 px-4"
            >
              <Printer className="w-4 h-4" />
              Export PDF
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/setup')}
              className="flex items-center gap-2 w-full sm:w-auto justify-center font-semibold text-xs py-2 px-5 bg-blue-600 hover:bg-primary text-white"
            >
              Practice Again
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

      </motion.div>
    </motion.div>
  );
}