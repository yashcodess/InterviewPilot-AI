import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Settings as SettingsIcon, AlertCircle, Upload, FileText, Trash2, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/Card';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { Badge } from './ui/Badge';
import { extractTextFromPdf, extractTextFromTxt, extractTextFromDocx } from '../utils/resumeParser';
import { analyzeResume } from '../services/gemini';
import type { ResumeAnalysisResult } from '../services/gemini';
import { useSettings } from '../contexts/SettingsContext';

interface InterviewSetupProps {
  apiKey: string;
  onStartInterview: (setup: {
    role: string;
    category: string;
    difficulty: string;
    length: number;
    company: string;
    resumeText?: string;
  }) => void;
}

const ROLES = [
  { value: 'Software Engineer', label: 'Software Engineer' },
  { value: 'Frontend Developer', label: 'Frontend Developer' },
  { value: 'Backend Developer', label: 'Backend Developer' },
  { value: 'Full Stack Developer', label: 'Full Stack Developer' },
  { value: 'Java Developer', label: 'Java Developer' },
  { value: 'Python Developer', label: 'Python Developer' },
  { value: 'AI/ML Engineer', label: 'AI/ML Engineer' },
  { value: 'Data Analyst', label: 'Data Analyst' },
  { value: 'HR Interview', label: 'HR Interview' },
];

const CATEGORIES = [
  { value: 'Technical Theory', label: 'Technical Theory' },
  { value: 'Behavioral', label: 'Behavioral' },
  { value: 'Resume Based', label: 'Resume Based' },
  { value: 'Code Interview', label: 'Code Interview' }
];

const COMPANIES = [
  { value: 'Generic', label: 'Generic Coding' },
  { value: 'Google', label: 'Google Round' },
  { value: 'Amazon', label: 'Amazon Round' },
  { value: 'Microsoft', label: 'Microsoft Round' },
  { value: 'Meta', label: 'Meta Round' },
  { value: 'TCS', label: 'TCS Round' },
  { value: 'Infosys', label: 'Infosys Round' },
  { value: 'Accenture', label: 'Accenture Round' }
];

const DIFFICULTIES = [
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Advanced', label: 'Advanced' },
];

const LENGTHS = [
  { value: '5', label: '5 Questions' },
  { value: '10', label: '10 Questions' },
  { value: '15', label: '15 Questions' },
];

export function InterviewSetup({ apiKey, onStartInterview }: InterviewSetupProps) {
  const { preferences } = useSettings();
  const navigate = useNavigate();
  const [role, setRole] = useState(ROLES[0].value);
  const [category, setCategory] = useState(CATEGORIES[0].value);
  const [difficulty, setDifficulty] = useState(DIFFICULTIES[0].value);
  const [company, setCompany] = useState(COMPANIES[0].value);
  const [length, setLength] = useState(() => (preferences?.defaultQuestionsCount || 5).toString());

  // Resume states
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [fileName, setFileName] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [parseError, setParseError] = useState('');

  // Resume analysis states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisMsg, setAnalysisMsg] = useState('Analyzing Resume...');
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysisResult | null>(null);

  // Restore analysis from local cache on mount
  useEffect(() => {
    const cache = window.localStorage.getItem('interviewpilot_resume_analysis');
    if (cache) {
      try {
        const parsed = JSON.parse(cache);
        if (parsed.fileName && parsed.analysis) {
          setFileName(parsed.fileName);
          setResumeText(parsed.resumeText || '');
          setAnalysisResult(parsed.analysis);
        }
      } catch (e) {
        console.warn('Failed to parse cached resume analysis', e);
      }
    }
  }, []);

  const processFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'txt' && ext !== 'docx') {
      setParseError('Unsupported file type. Please upload a PDF, DOCX or TXT document.');
      return;
    }
    
    // File size safety block (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setParseError('File size exceeds the 5MB limit. Please upload a smaller document.');
      return;
    }

    // Check local cache
    const cache = window.localStorage.getItem('interviewpilot_resume_analysis');
    if (cache) {
      try {
        const parsed = JSON.parse(cache);
        if (parsed.fileName === file.name && parsed.analysis) {
          setFileName(file.name);
          setResumeText(parsed.resumeText || '');
          setAnalysisResult(parsed.analysis);
          setParseError('');
          return;
        }
      } catch (e) {
        console.warn('Failed to parse cached resume analysis', e);
      }
    }

    setIsParsing(true);
    setParseProgress(20);
    setFileName(file.name);
    setParseError('');
    setAnalysisResult(null);
    
    let text = '';
    try {
      setParseProgress(50);
      if (ext === 'pdf') {
        text = await extractTextFromPdf(file);
      } else if (ext === 'docx') {
        text = await extractTextFromDocx(file);
      } else {
        text = await extractTextFromTxt(file);
      }
      setParseProgress(85);
      setResumeText(text);
      setParseProgress(100);
    } catch (err: any) {
      console.error('Local parsing failed:', err);
      setParseError(err.message || 'Failed to extract text from the selected document.');
      setFileName('');
      setResumeText('');
      setIsParsing(false);
      return;
    }

    setIsParsing(false);

    // Call Gemini AI analysis
    if (!apiKey) {
      setParseError('Gemini API Key is required to analyze your resume. Please configure it in Settings.');
      setFileName('');
      setResumeText('');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisMsg('Analyzing Resume...');
    
    const statusSteps = [
      'Extracting Skills...',
      'Identifying Projects...',
      'Preparing Interview...'
    ];
    let stepIndex = 0;
    const msgTimer = setInterval(() => {
      if (stepIndex < statusSteps.length) {
        setAnalysisMsg(statusSteps[stepIndex]);
        stepIndex++;
      }
    }, 1500);

    try {
      const analysis = await analyzeResume(apiKey, text);
      setAnalysisResult(analysis);
      
      // Save to localStorage
      window.localStorage.setItem('interviewpilot_resume_analysis', JSON.stringify({
        fileName: file.name,
        resumeText: text,
        analysis
      }));
    } catch (err: any) {
      console.error('Resume analysis failed:', err);
      setParseError(err.message || 'Gemini resume analysis failed. Please test your API connection.');
      setFileName('');
      setResumeText('');
    } finally {
      clearInterval(msgTimer);
      setIsAnalyzing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleStart = () => {
    if (!apiKey) {
      alert('Please configure your Gemini API Key in Settings first.');
      navigate('/settings');
      return;
    }
    // Always clear any previous active session to start a brand new interview
    window.localStorage.removeItem('interviewpilot_active_session');
    
    onStartInterview({
      role,
      category,
      difficulty,
      length: parseInt(length, 10),
      company,
      resumeText: resumeText || undefined,
    });
    navigate('/interview');
  };

  const handleRemoveResume = () => {
    setFileName('');
    setResumeText('');
    setParseError('');
    setAnalysisResult(null);
    window.localStorage.removeItem('interviewpilot_resume_analysis');
  };

  // Compute total skills parsed
  const totalSkillsCount = analysisResult
    ? Object.values(analysisResult.skills).reduce((acc, curr) => acc + (Array.isArray(curr) ? curr.length : 0), 0)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="max-w-2xl mx-auto py-8 px-4"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display tracking-tight text-text-bright">Setup Mock Interview</h1>
        <p className="text-sm text-text-secondary mt-1">Configure your mock session parameters to match your targeted interview environment.</p>
      </div>

      {!apiKey && (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-3 text-amber-250 items-start">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Gemini API Key Required</h4>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              To generate intelligent questions and perform evaluation analysis, you must provide your own Gemini API Key. 
              Your key is saved locally in your browser.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/settings')}
              className="mt-3 text-amber-200 border-amber-500/35 hover:bg-amber-500/10"
            >
              <SettingsIcon className="w-3.5 h-3.5 mr-1.5" /> Configure Key
            </Button>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Session Configurations</CardTitle>
          <CardDescription>Select the job target and parameters for our AI mock interviewer.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Select
              label="Target Job Role"
              options={ROLES}
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
            <Select
              label="Interview Category"
              options={CATEGORIES}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          {category === 'Code Interview' && (
            <div className="grid grid-cols-1 gap-5">
              <Select
                label="Target Company Round"
                options={COMPANIES}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-none">
            <Select
              label="Difficulty Level"
              options={DIFFICULTIES}
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            />
            <Select
              label="Number of Questions"
              options={LENGTHS}
              value={length}
              onChange={(e) => setLength(e.target.value)}
            />
          </div>

          {/* Local Resume Upload Zone */}
          <div className="space-y-2.5 mt-5 pt-5 border-t border-slate-900/60">
            <label className="text-xs font-semibold text-text-secondary tracking-wide uppercase block">
              Optional: Upload Resume
            </label>
            <p className="text-[11px] text-text-secondary leading-relaxed mb-2.5">
              Provide your resume to customize mock interview questions tailored directly to your professional experiences.
            </p>

            {fileName ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-primary/20 bg-primary/5 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-primary shrink-0 animate-pulse" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-text truncate">{fileName}</p>
                      <p className="text-[10px] text-emerald-450 font-medium">Text successfully extracted locally</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <label className="text-[10px] font-bold text-text-secondary hover:text-text px-2.5 py-1.5 border border-border rounded-lg cursor-pointer bg-card/60 hover:bg-slate-800 transition-all select-none">
                      Replace
                      <input
                        type="file"
                        accept=".pdf,.txt"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) processFile(file);
                        }}
                        className="hidden"
                      />
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveResume}
                      className="p-1.5 rounded-lg text-text-secondary hover:text-red-405 border border-transparent hover:border-red-950/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Resume Analysis Summary Card */}
                {analysisResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="border-primary/20 bg-card/40">
                      <CardHeader className="pb-3 border-b border-input-border">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-sm font-semibold text-text-bright">
                              {analysisResult.candidateName || 'Candidate Profile'}
                            </CardTitle>
                            <CardDescription className="text-[11px] text-text-secondary mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5">
                              {analysisResult.email && <span>{analysisResult.email}</span>}
                              {analysisResult.phone && <span>• {analysisResult.phone}</span>}
                            </CardDescription>
                          </div>
                          <Badge variant="primary" className="bg-primary/10 text-primary border-primary/20 font-bold tracking-wide text-[10px]">
                            {analysisResult.experienceLevel}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="py-4.5 space-y-4 text-xs">
                        <div className="grid grid-cols-3 gap-3 text-center bg-card/50 p-3 rounded-xl border border-input-border">
                          <div>
                            <p className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">Skills Found</p>
                            <p className="text-base font-bold text-text mt-0.5">{totalSkillsCount}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">Projects</p>
                            <p className="text-base font-bold text-text mt-0.5">{analysisResult.projects?.length || 0}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">Certifications</p>
                            <p className="text-base font-bold text-text mt-0.5">{analysisResult.certifications?.length || 0}</p>
                          </div>
                        </div>

                        {/* Top Skills */}
                        <div className="space-y-1.5">
                          <p className="font-semibold text-text-secondary">Top Skills Identified</p>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              ...(analysisResult.skills?.languages || []),
                              ...(analysisResult.skills?.frameworks || []),
                              ...(analysisResult.skills?.libraries || []),
                            ].slice(0, 8).map((skill, index) => (
                              <Badge key={index} variant="secondary" className="text-[10px] font-medium py-0.5 px-2 bg-card border border-border text-slate-350">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Recommended Focus */}
                        {analysisResult.recommendedInterviewFocus && analysisResult.recommendedInterviewFocus.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="font-semibold text-text-secondary">Recommended Interview Focus</p>
                            <div className="flex flex-wrap gap-1.5">
                              {analysisResult.recommendedInterviewFocus.map((focus, index) => (
                                <Badge key={index} variant="primary" className="text-[10px] font-semibold py-0.5 px-2 bg-primary/10 text-primary border-primary/25">
                                  {focus}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>
            ) : isParsing || isAnalyzing ? (
              <div className="p-5 rounded-xl border border-input-border bg-card/20 space-y-3">
                <div className="flex justify-between items-center text-[10px] font-mono text-text-secondary">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    {isAnalyzing ? analysisMsg.toUpperCase() : 'EXTRACTING TEXT LOCALLY...'}
                  </span>
                  <span className="font-bold text-primary">
                    {isAnalyzing ? '...' : `${parseProgress}%`}
                  </span>
                </div>
                <div className="w-full bg-card border border-input-border h-1.5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: isAnalyzing ? '100%' : `${parseProgress}%` }}
                    transition={isAnalyzing ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
                  />
                </div>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                  isDragging
                    ? 'border-primary bg-primary/5 shadow-md shadow-primary/5'
                    : 'border-input-border hover:border-border bg-card/10'
                }`}
              >
                <Upload className={`w-8 h-8 mx-auto mb-3 transition-colors ${isDragging ? 'text-primary' : 'text-text-secondary'}`} />
                <p className="text-xs text-slate-350">
                  Drag & drop your resume here, or{' '}
                  <label className="text-primary font-semibold cursor-pointer hover:underline select-none">
                    browse files
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) processFile(file);
                      }}
                      className="hidden"
                    />
                  </label>
                </p>
                <p className="text-[10px] text-text-secondary mt-1.5">Supports PDF, DOCX, and TXT documents. Maximum size 5MB.</p>
              </div>
            )}

            {parseError && (
              <div className="flex gap-2.5 p-3.5 rounded-xl border border-red-950/45 bg-red-950/5 text-xs text-red-300 items-start mt-2.5">
                <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-red-500" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-text">Parsing Error</p>
                  <p className="text-[11px] text-text-secondary leading-relaxed">{parseError}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex justify-between items-center bg-card/15">
          <div className="flex gap-2">
            <Badge variant="primary">{difficulty}</Badge>
            <Badge variant="secondary">{length} Questions</Badge>
          </div>
          <Button onClick={handleStart} className="flex items-center gap-2">
            <Play className="w-4 h-4 fill-current" />
            Start Mock Interview
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}