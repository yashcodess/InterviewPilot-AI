import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  TrendingUp,
  AlertCircle,
  Clock,
  BookOpen,
  Loader2,
  CheckCircle,
  Briefcase,
  ChevronRight,
  ChevronDown,
  Hammer,
  GraduationCap
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { analyzeCareerGap } from '../services/gemini';
import type { CareerGapAnalysis } from '../services/gemini';
import { AtsCard } from './AtsCard';

interface CareerInsightsProps {
  apiKey: string;
  activeRecord: { interview: any; evaluation: any; gapAnalysis?: any } | null;
  history: Array<{ interview: any; evaluation: any; gapAnalysis?: any }>;
  onUpdateRecord: (id: string, updatedRecord: any) => void;
}

export function CareerInsights({ apiKey, activeRecord, history, onUpdateRecord }: CareerInsightsProps) {
  const navigate = useNavigate();
  
  // Selection state
  const [selectedRecordId, setSelectedRecordId] = useState<string>(activeRecord?.interview?.id || '');
  
  // Find current record
  const currentRecord = history.find(item => item && item.interview && item.interview.id === selectedRecordId) || activeRecord;

  // Analysis states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Comparing Resume to Interview...');
  const [errorText, setErrorText] = useState('');
  const [expandedWeek, setExpandedWeek] = useState<number | null>(1);

  // Sync selected record on activeRecord update
  useEffect(() => {
    if (activeRecord && !selectedRecordId) {
      setSelectedRecordId(activeRecord.interview.id);
    }
  }, [activeRecord]);

  const runGapAnalysis = async (record: any) => {
    if (!apiKey) {
      setErrorText('Please configure your Gemini API Key in Settings first.');
      return;
    }

    setIsAnalyzing(true);
    setLoadingMsg('Comparing Resume to Interview...');
    setErrorText('');

    const statusSteps = [
      'Analyzing Technical Gaps...',
      'Formulating Roadmap...',
      'Compiling Career Recommendations...'
    ];
    let stepIndex = 0;
    const msgTimer = setInterval(() => {
      if (stepIndex < statusSteps.length) {
        setLoadingMsg(statusSteps[stepIndex]);
        stepIndex++;
      }
    }, 1500);

    try {
      // Get resume analysis if exists
      let resumeAnalysis: any = null;
      const cache = window.localStorage.getItem('interviewpilot_resume_analysis');
      if (cache) {
        try {
          const parsed = JSON.parse(cache);
          if (record.interview.setup.resumeText && parsed.analysis) {
            resumeAnalysis = parsed.analysis;
          }
        } catch (e) {
          console.warn('Failed to parse cached resume analysis', e);
        }
      }

      const gapAnalysis = await analyzeCareerGap(
        apiKey,
        record.interview.setup.role,
        resumeAnalysis,
        record.interview.transcript,
        record.evaluation
      );

      // Save into record
      const updatedRecord = {
        ...record,
        gapAnalysis
      };

      onUpdateRecord(record.interview.id, updatedRecord);
    } catch (err: any) {
      console.error('Gap analysis failed:', err);
      setErrorText(err.message || 'Gemini gap analysis failed. Please verify your API key connection.');
    } finally {
      clearInterval(msgTimer);
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (currentRecord && !currentRecord.gapAnalysis && !isAnalyzing && !errorText && apiKey) {
      runGapAnalysis(currentRecord);
    }
  }, [selectedRecordId, currentRecord, apiKey]);

  if (!currentRecord) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center text-text-secondary mb-6">
          <TrendingUp className="w-8 h-8 stroke-[1.5]" />
        </div>
        <h3 className="text-xl font-semibold font-display tracking-tight text-text-bright">
          Career Insights
        </h3>
        <p className="text-sm text-text-secondary mt-2 text-center leading-relaxed">
          Complete a mock interview session to unlock tailored career gap analysis and structured technical roadmaps.
        </p>
        <Button onClick={() => navigate('/setup')} className="mt-8">
          Setup Mock Interview
        </Button>
      </div>
    );
  }

  const gap: CareerGapAnalysis | undefined = currentRecord.gapAnalysis;

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Career Insights</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-text-bright">
            Career Gap Analysis
          </h1>
          <p className="text-sm text-text-secondary">
            Intelligent roadmap matching candidate scorecard against target job requirements.
          </p>
        </div>

        {/* Interview Selector / Comparison dropdown */}
        {history.length > 1 && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-text-secondary font-semibold uppercase tracking-wider shrink-0 select-none">
              Compare Session:
            </label>
            <select
              value={selectedRecordId}
              onChange={(e) => {
                setSelectedRecordId(e.target.value);
                setErrorText('');
              }}
              className="px-3.5 py-2 text-xs bg-card border border-input-border rounded-lg text-text focus:outline-none focus:border-primary transition-all font-semibold cursor-pointer"
            >
              {history.filter(r => r && r.interview && r.interview.setup).map((record) => (
                <option key={record.interview.id} value={record.interview.id}>
                  {record.interview.setup.role || 'Mock Session'} ({record.interview.timestamp ? new Date(record.interview.timestamp).toLocaleDateString() : 'Recent'})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {isAnalyzing ? (
        <div className="p-12 rounded-2xl border border-input-border bg-card/10 flex flex-col items-center justify-center text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <div>
            <h4 className="font-semibold text-text uppercase tracking-wider text-xs">{loadingMsg}</h4>
            <p className="text-xs text-text-secondary mt-1">Gemini AI is processing your portfolio and mock interview results...</p>
          </div>
        </div>
      ) : errorText ? (
        <div className="p-8 rounded-2xl border border-red-950/30 bg-red-950/5 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <div>
            <h4 className="font-bold text-text">Analysis Error</h4>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed max-w-md mx-auto">{errorText}</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => runGapAnalysis(currentRecord)} className="text-red-300 border-red-950/40">
            Retry Analysis
          </Button>
        </div>
      ) : !gap ? (
        <div className="p-8 rounded-2xl border border-input-border text-center space-y-4 bg-card/10">
          <AlertCircle className="w-8 h-8 text-text-secondary mx-auto" />
          <div>
            <h4 className="font-bold text-text">Gemini Connection Required</h4>
            <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto">
              Please enter your Gemini API Key in Settings to trigger Career Gap Analysis and customized weekly learning roadmaps.
            </p>
          </div>
          <Button size="sm" onClick={() => navigate('/settings')}>
            Configure API Key
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Readiness Scores & advice */}
          <div className="space-y-6 lg:col-span-1">
            {/* Overall readiness card */}
            <Card className="flex flex-col items-center justify-center text-center relative overflow-hidden p-8 hover:border-border transition-all duration-300">
              <span className="text-[10px] font-bold text-primary tracking-widest uppercase">Job Readiness</span>
              
              <div className="relative mt-6 flex items-center justify-center">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="50"
                    className="stroke-slate-850"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <motion.circle
                    cx="64"
                    cy="64"
                    r="50"
                    className="stroke-blue-500"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 50}
                    initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 50 - (gap.overallReadiness / 100) * 2 * Math.PI * 50 }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="font-display text-4xl font-extrabold text-text-bright">
                    {gap.overallReadiness}%
                  </span>
                  <span className="text-[9px] text-text-secondary uppercase tracking-widest font-bold mt-0.5">Readiness</span>
                </div>
              </div>

              <div className="mt-6 flex flex-col items-center gap-1">
                <Badge variant="primary" className="bg-primary/10 text-primary border-primary/20 font-bold uppercase tracking-wider text-[10px]">
                  Job Fit: {gap.jobFit}
                </Badge>
                <span className="text-[10px] text-text-secondary font-semibold mt-1">Targeting: {currentRecord.interview.setup.role}</span>
              </div>
            </Card>

            {/* Sub-scores breakdown */}
            <Card className="hover:border-border transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-350">Dimensions Scorecard</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                {/* Tech score */}
                <div className="space-y-1">
                  <div className="flex justify-between text-text-secondary font-semibold">
                    <span>Technical Readiness</span>
                    <span className="font-mono text-text">{gap.scores?.technicalReadiness || 0}%</span>
                  </div>
                  <div className="w-full bg-card border border-input-border h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full animate-none" style={{ width: `${gap.scores?.technicalReadiness || 0}%` }} />
                  </div>
                </div>

                {/* Comm score */}
                <div className="space-y-1">
                  <div className="flex justify-between text-text-secondary font-semibold">
                    <span>Communication Readiness</span>
                    <span className="font-mono text-text">{gap.scores?.communicationReadiness || 0}%</span>
                  </div>
                  <div className="w-full bg-card border border-input-border h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full animate-none" style={{ width: `${gap.scores?.communicationReadiness || 0}%` }} />
                  </div>
                </div>

                {/* Portfolio strength */}
                <div className="space-y-1">
                  <div className="flex justify-between text-text-secondary font-semibold">
                    <span>Portfolio Strength</span>
                    <span className="font-mono text-text">{gap.scores?.portfolioStrength || 0}%</span>
                  </div>
                  <div className="w-full bg-card border border-input-border h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full animate-none" style={{ width: `${gap.scores?.portfolioStrength || 0}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Career advice */}
            <Card className="hover:border-border transition-all duration-300 border-primary/10">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-primary">
                  <Briefcase className="w-4.5 h-4.5" />
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-blue-300">Coach Career Advice</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-text-secondary leading-relaxed font-medium">
                {gap.careerAdvice}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Missing skills, roadmap, project recommendations */}
          <div className="space-y-6 lg:col-span-2">
            {/* Missing Skills */}
            <Card className="hover:border-border transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Identified Skill Gaps</CardTitle>
                <CardDescription className="text-xs">Core competencies you are missing or struggled with for this role</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {gap.missingSkills && gap.missingSkills.length > 0 ? (
                  gap.missingSkills.map((item, index) => {
                    let badgeColor = 'bg-rose-500/10 text-rose-450 border-rose-500/20';
                    if (item.importance === 'Medium') badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                    if (item.importance === 'Low') badgeColor = 'bg-slate-550/10 text-text-secondary border-slate-550/20';
                    
                    return (
                      <div key={index} className="flex flex-col sm:flex-row gap-2.5 p-3 rounded-xl border border-input-border bg-card/20 animate-none">
                        <div className="flex items-center justify-between gap-2 shrink-0 sm:w-28 sm:flex-col sm:items-start">
                          <span className="text-xs font-bold text-text">{item.skill}</span>
                          <Badge variant="secondary" className={`text-[9px] py-0.5 tracking-wider font-bold ${badgeColor}`}>
                            {item.importance} Priority
                          </Badge>
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed sm:border-l sm:border-input-border sm:pl-3.5 flex items-center">
                          {item.reason}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-text-secondary text-xs font-medium">
                    No critical skill gaps identified! You are fully prepared for this role.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Roadmap Timeline */}
            <Card className="hover:border-border transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Personalized Learning Roadmap</CardTitle>
                <CardDescription className="text-xs">Structured 4-week learning curve targeting your weak zones</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative pl-6 border-l border-input-border space-y-6">
                  {gap.learningRoadmap.map((module) => {
                    const isExpanded = expandedWeek === module.week;
                    return (
                      <div key={module.week} className="relative">
                        {/* Bullet */}
                        <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border border-border flex items-center justify-center text-[8px] font-bold font-mono transition-all ${
                          isExpanded
                            ? 'bg-primary border-primary text-slate-950 shadow-md shadow-blue-500/20 scale-110'
                            : 'bg-card border-input-border text-text-secondary'
                        }`}>
                          {module.week}
                        </div>

                        <div className="space-y-2">
                          <button
                            onClick={() => setExpandedWeek(isExpanded ? null : module.week)}
                            className="w-full flex items-center justify-between text-left hover:text-primary transition-colors cursor-pointer"
                          >
                            <div>
                              <h4 className="text-sm font-bold text-text">
                                Week {module.week}: {module.title}
                              </h4>
                              <p className="text-[10px] text-text-secondary font-semibold mt-0.5 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-text-secondary" />
                                Est. {module.estimatedHours} study hours
                              </p>
                            </div>
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-text-secondary" /> : <ChevronRight className="w-4 h-4 text-text-secondary" />}
                          </button>

                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.25 }}
                                className="overflow-hidden space-y-3.5 pt-2 pl-1.5 text-xs text-text-secondary"
                              >
                                {/* Topics */}
                                <div className="space-y-1">
                                  <p className="font-semibold text-slate-350">Core Topics</p>
                                  <ul className="list-disc pl-4 space-y-0.75 text-text-secondary">
                                    {module.topics.map((t, idx) => <li key={idx}>{t}</li>)}
                                  </ul>
                                </div>

                                {/* Practice tasks */}
                                <div className="space-y-1.5">
                                  <p className="font-semibold text-slate-350">Practice Tasks</p>
                                  <div className="space-y-1">
                                    {module.practiceTasks.map((task, idx) => (
                                      <div key={idx} className="flex gap-2 p-2 rounded bg-card/40 border border-input-border/60 leading-relaxed text-text-secondary">
                                        <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                                        <span>{task}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Recommended resources */}
                                {module.resources && module.resources.length > 0 && (
                                  <div className="space-y-1">
                                    <p className="font-semibold text-slate-350">Recommended Documentation</p>
                                    <div className="flex flex-wrap gap-2 pt-0.5">
                                      {module.resources.map((url, idx) => {
                                        let label = 'Documentation';
                                        if (url.includes('react.dev') || url.includes('reactjs')) label = 'React Docs';
                                        else if (url.includes('developer.mozilla.org') || url.includes('mdn')) label = 'MDN Web Docs';
                                        else if (url.includes('freecodecamp')) label = 'FreeCodeCamp';
                                        else if (url.includes('roadmap.sh')) label = 'Roadmap.sh';
                                        else if (url.includes('microsoft')) label = 'MS Learn';
                                        else if (url.includes('oracle')) label = 'Oracle Docs';
                                        else if (url.includes('tensorflow')) label = 'TensorFlow';
                                        
                                        return (
                                          <a
                                            key={idx}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 px-2.5 py-1 border border-input-border bg-background rounded-lg text-[10px] text-primary hover:text-blue-300 font-semibold transition-all hover:bg-card"
                                          >
                                            <BookOpen className="w-3 h-3" />
                                            {label}
                                          </a>
                                        );
                                      })}
                                    </div>
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

            {/* Project Recommendations & Certifications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Projects */}
              <Card className="hover:border-border transition-all duration-300 border-emerald-500/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 text-emerald-450">
                    <Hammer className="w-4.5 h-4.5" />
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-emerald-350">Recommended Projects</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3.5 text-xs text-text-secondary leading-relaxed font-semibold">
                    {gap.projectRecommendations.map((proj, idx) => (
                      <li key={idx} className="flex gap-2.5 items-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                        <span>{proj}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Certifications */}
              <Card className="hover:border-border transition-all duration-300 border-indigo-500/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <GraduationCap className="w-5 h-5" />
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-indigo-300">Recommended Certifications</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3.5 text-xs text-text-secondary leading-relaxed font-semibold">
                    {gap.certificationRecommendations && gap.certificationRecommendations.length > 0 ? (
                      gap.certificationRecommendations.map((cert, idx) => (
                        <li key={idx} className="flex gap-2.5 items-start">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                          <span>{cert}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-text-secondary font-medium">None recommended for this setup.</li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Career Tools Section */}
            <div className="space-y-4 pt-6 border-t border-border/40 no-print">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-355">Career Tools</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AtsCard />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
