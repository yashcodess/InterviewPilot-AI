import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Code } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { CodeToolbar } from './CodeToolbar';
import { CodeEditor } from './CodeEditor';
import { ResultPanel } from './ResultPanel';
import { getStarterCode } from '../../services/codeTemplate';
import type { CodingQuestion, InterviewQuestion } from '../../types/interview';
import { executeCode } from '../../services/judge0';

interface CodeInterviewProps {
  currentIndex: number;
  rawQuestion: InterviewQuestion;
  _category: string;
  difficulty: string;
  company: string;
  currentAnswer: string;
  setCurrentAnswer: (val: string) => void;
  isFullscreen: boolean;
  onFullscreenToggle: () => void;
  triggerToast: (msg: string) => void;
  onExecutionStatusChange?: (hasRun: boolean, success: boolean) => void;
}

export function CodeInterview({
  currentIndex,
  rawQuestion,
  _category,
  difficulty,
  company,
  currentAnswer,
  setCurrentAnswer,
  isFullscreen,
  onFullscreenToggle,
  triggerToast,
  onExecutionStatusChange
}: CodeInterviewProps) {
  // Local IDE preferences states
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    return window.localStorage.getItem('interviewpilot_ide_lang') || 'javascript';
  });
  const [editorTheme, setEditorTheme] = useState<string>(() => {
    return window.localStorage.getItem('interviewpilot_ide_theme') || 'vs-dark';
  });
  const [fontSize, setFontSize] = useState<number>(() => {
    return Number(window.localStorage.getItem('interviewpilot_ide_font_size')) || 14;
  });
  const [wordWrap, setWordWrap] = useState<'on' | 'off'>(() => {
    return (window.localStorage.getItem('interviewpilot_ide_word_wrap') as any) || 'on';
  });

  // Simulator compile console states
  const [consoleOutput, setConsoleOutput] = useState<string>('');
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [hasRunCode, setHasRunCode] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [runSuccess, setRunSuccess] = useState<boolean>(false);

  // Safe question parser stubs
  const parseQuestion = (raw: InterviewQuestion): CodingQuestion => {
    if (typeof raw === 'object' && raw !== null) {
      return {
        id: raw.id || 'challenge',
        title: raw.title || 'Coding Challenge',
        difficulty: raw.difficulty || (difficulty as any) || 'Intermediate',
        description: raw.description || '',
        constraints: Array.isArray(raw.constraints) ? raw.constraints : [],
        examples: Array.isArray(raw.examples) ? raw.examples : [],
        expectedSkills: Array.isArray(raw.expectedSkills) ? raw.expectedSkills : [],
        functionName: raw.functionName || 'solve',
        estimatedTime: raw.estimatedTime || 30,
        topic: raw.topic || 'Algorithms',
        companyTags: Array.isArray(raw.companyTags) ? raw.companyTags : [company || 'Generic'],
        hiddenTestCases: Array.isArray(raw.hiddenTestCases) ? raw.hiddenTestCases : []
      };
    }
    try {
      const parsed = JSON.parse(raw);
      if (parsed.problemTitle || parsed.title) {
        return {
          id: parsed.id || 'challenge',
          title: parsed.problemTitle || parsed.title || 'Coding Challenge',
          difficulty: parsed.difficulty || (difficulty as any) || 'Intermediate',
          description: parsed.problemDescription || parsed.description || raw,
          constraints: Array.isArray(parsed.constraints) ? parsed.constraints : [],
          examples: Array.isArray(parsed.examples) ? parsed.examples : [],
          expectedSkills: Array.isArray(parsed.expectedSkills) ? parsed.expectedSkills : [],
          functionName: parsed.functionName || 'solve',
          estimatedTime: parsed.estimatedTime || 30,
          topic: parsed.topic || 'Algorithms',
          companyTags: Array.isArray(parsed.companyTags) ? parsed.companyTags : [company || 'Generic'],
          hiddenTestCases: Array.isArray(parsed.hiddenTestCases) ? parsed.hiddenTestCases : []
        };
      }
    } catch {
      // Fallback
    }

    // Default template if parse fails
    return {
      id: 'challenge',
      title: 'Optimal Subarray Finder',
      difficulty: (difficulty as any) || 'Intermediate',
      description: typeof raw === 'string' ? raw : 'Write an optimal solution to solve the given coding logic problem.',
      constraints: ['Time complexity should be O(N)', 'Space complexity should be O(1)'],
      examples: [
        { input: 'nums = [1, -2, 3, 4]', output: '7', explanation: 'Subarray [3, 4] has the maximum sum of 7.' }
      ],
      expectedSkills: ['Dynamic Programming', 'Arrays'],
      functionName: 'maxSubArray',
      estimatedTime: 25,
      topic: 'Dynamic Programming',
      companyTags: [company || 'Generic'],
      hiddenTestCases: [
        { input: '[]', expectedOutput: '0', description: 'Empty array handling' }
      ]
    };
  };

  const parsedQuestion = parseQuestion(rawQuestion);

  // Auto load/inject starter template on lang/problem mount
  useEffect(() => {
    if (!currentAnswer) {
      const template = getStarterCode(selectedLanguage, parsedQuestion.functionName || 'solve', parsedQuestion.title);
      setCurrentAnswer(template);
    }
  }, [currentIndex, selectedLanguage]);
  // Reset console and run flags on question switch, and abort any pending executions
  useEffect(() => {
    setConsoleOutput('');
    setIsCompiling(false);
    setHasRunCode(false);
    setRunSuccess(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [currentIndex]);
  if (!rawQuestion) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] bg-card/25 border border-border rounded-2xl p-6 text-center select-none w-full col-span-full">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
        <p className="text-sm text-text-secondary font-medium animate-pulse">Initializing coding workspace and test stubs...</p>
      </div>
    );
  }

  // Persist IDE preferences
  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    window.localStorage.setItem('interviewpilot_ide_lang', lang);
    const template = getStarterCode(lang, parsedQuestion.functionName || 'solve', parsedQuestion.title);
    setCurrentAnswer(template);
    triggerToast(`Language switched to ${lang.toUpperCase()}`);
  };

  const handleThemeChange = (theme: string) => {
    setEditorTheme(theme);
    window.localStorage.setItem('interviewpilot_ide_theme', theme);
  };

  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    window.localStorage.setItem('interviewpilot_ide_font_size', size.toString());
  };

  const handleWordWrapToggle = () => {
    const next = wordWrap === 'on' ? 'off' : 'on';
    setWordWrap(next);
    window.localStorage.setItem('interviewpilot_ide_word_wrap', next);
  };

  const handleReset = () => {
    if (window.confirm('Reset code to starter template? All current edits will be lost.')) {
      const template = getStarterCode(selectedLanguage, parsedQuestion.functionName || 'solve', parsedQuestion.title);
      setCurrentAnswer(template);
      triggerToast('Starter code restored');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentAnswer);
    triggerToast('Code copied to clipboard');
  };

  const handleDownload = () => {
    const extensions: Record<string, string> = {
      javascript: 'js',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      c: 'c'
    };
    const ext = extensions[selectedLanguage] || 'txt';
    const blob = new Blob([currentAnswer], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${parsedQuestion.title.replace(/\s+/g, '')}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast('Solution file downloaded');
  };



  const handleRunCode = async () => {
    // Abort previous execution if somehow still running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsCompiling(true);
    setHasRunCode(true);
    setConsoleOutput('Compiling and running code against Judge0 servers...\n');
    
    try {
      const stdin = parsedQuestion.examples?.[0]?.input || '';
      const result = await executeCode(currentAnswer, selectedLanguage, stdin, controller.signal);
      
      // If code execution finishes but is already aborted, do nothing
      if (controller.signal.aborted) return;
      
      setIsCompiling(false);
      
      let output = `> Language: ${selectedLanguage.toUpperCase()}\n`;
      output += `> Status: ${result.status.description}\n`;
      output += `> Execution Time: ${result.time || '0.00'}s\n`;
      output += `> Memory Usage: ${result.memory ? (result.memory / 1024).toFixed(2) : '0.00'} MB\n\n`;

      if (result.compile_output) {
        output += `[Compiler Output]\n${result.compile_output}\n`;
      }
      if (result.stdout) {
        output += `[Standard Output]\n${result.stdout}\n`;
      }
      if (result.stderr) {
        output += `[Standard Error]\n${result.stderr}\n`;
      }
      if (result.message) {
        output += `[System Message]\n${result.message}\n`;
      }
      
      if (!result.compile_output && !result.stdout && !result.stderr && !result.message) {
        output += `(No console output returned)\n`;
      }
      
      setConsoleOutput(output);
      
      const success = result.status.id === 3;
      setRunSuccess(success);
      onExecutionStatusChange?.(true, success);
      
      if (success) {
        triggerToast('Code executed successfully');
      } else {
        triggerToast(`Execution failed: ${result.status.description}`);
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        if (import.meta.env.DEV) {
          console.log('[Judge0] Execution aborted.');
        }
        return;
      }
      setIsCompiling(false);
      setRunSuccess(false);
      onExecutionStatusChange?.(true, false);
      
      let errMsg = e.message || String(e);
      if (errMsg.includes('Failed to fetch') || errMsg.includes('network') || errMsg.includes('NetworkError')) {
        errMsg = 'Network connection error. Please verify you are online and that the Judge0 execution server is accessible.';
      } else if (errMsg.includes('401') || errMsg.includes('Unauthorized') || errMsg.includes('API key') || errMsg.includes('403')) {
        errMsg = 'Authorization failed. The Judge0 API key provided is invalid or has expired.';
      } else if (errMsg.includes('503') || errMsg.includes('Unavailable') || errMsg.includes('502') || errMsg.includes('554')) {
        errMsg = 'The Judge0 compilation service is currently overloaded, unavailable, or rate-limited. Please try again in a few seconds.';
      } else if (errMsg.includes('timeout') || errMsg.includes('Timeout')) {
        errMsg = 'The execution timed out. Your code exceeded the maximum allowed run time.';
      }
      
      setConsoleOutput(`> Code Execution Failed:\n${errMsg}`);
      triggerToast('Code execution failed');
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
      {/* Left panel: Problem details */}
      <div className="lg:col-span-5 space-y-4 flex flex-col h-full">
        <Card className="flex-1 flex flex-col min-h-[450px]">
          <CardHeader className="pb-3 border-b border-border/40 select-none">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary" className="bg-primary/10 text-primary border-primary/20">
                {parsedQuestion.companyTags?.[0] || company || 'Generic'} Coding Round
              </Badge>
              <Badge variant="secondary" className="text-[10px] font-medium bg-card text-text-secondary border-border/80">
                {parsedQuestion.difficulty}
              </Badge>
              <Badge variant="secondary" className="text-[10px] font-medium bg-card text-text-secondary border-border/80">
                {parsedQuestion.topic}
              </Badge>
              <Badge variant="secondary" className="text-[10px] font-medium bg-card text-text-secondary border-border/80">
                {parsedQuestion.estimatedTime} min
              </Badge>
            </div>
            <CardTitle className="text-xl font-semibold font-display tracking-tight text-text-bright mt-3 leading-snug flex items-center gap-2">
              <Code className="w-5 h-5 text-primary shrink-0" />
              {parsedQuestion.title}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 p-5 overflow-y-auto leading-relaxed text-sm text-text-secondary space-y-4 select-text">
            {/* Description */}
            <div className="whitespace-pre-line text-xs leading-relaxed text-slate-300">
              {parsedQuestion.description}
            </div>

            {/* Examples */}
            {parsedQuestion.examples && parsedQuestion.examples.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-border/40 select-none">
                <h4 className="text-xs font-bold text-text-bright uppercase tracking-wide">Examples</h4>
                {parsedQuestion.examples.map((ex, idx) => (
                  <div key={idx} className="bg-slate-950/20 border border-border/60 rounded-xl p-3 text-xs space-y-1.5 font-mono">
                    <p><strong className="text-text">Input:</strong> <span className="text-slate-350">{ex.input}</span></p>
                    <p><strong className="text-text">Output:</strong> <span className="text-slate-350">{ex.output}</span></p>
                    {ex.explanation && (
                      <p className="text-[10px] text-text-secondary font-sans mt-1">
                        <strong className="text-text">Explanation:</strong> {ex.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Constraints */}
            {parsedQuestion.constraints && parsedQuestion.constraints.length > 0 && (
              <div className="space-y-1.5 pt-3 border-t border-border/40 select-none">
                <h4 className="text-xs font-bold text-text-bright uppercase tracking-wide">Constraints</h4>
                <ul className="list-disc pl-4 space-y-0.5 text-xs text-text-secondary font-mono">
                  {parsedQuestion.constraints.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right panel: Monaco workspace */}
      <div className="lg:col-span-7 flex flex-col h-full min-h-[450px]">
        <CodeToolbar
          selectedLanguage={selectedLanguage}
          onLanguageChange={handleLanguageChange}
          editorTheme={editorTheme}
          onThemeChange={handleThemeChange}
          fontSize={fontSize}
          onFontSizeChange={handleFontSizeChange}
          wordWrap={wordWrap}
          onWordWrapToggle={handleWordWrapToggle}
          onReset={handleReset}
          onCopy={handleCopy}
          onDownload={handleDownload}
          isFullscreen={isFullscreen}
          onFullscreenToggle={onFullscreenToggle}
        />
        
        <CodeEditor
          value={currentAnswer}
          onChange={(val) => {
            const nextAnswer = val || '';
            setCurrentAnswer(nextAnswer);
            if (hasRunCode) {
              setHasRunCode(false);
              onExecutionStatusChange?.(false, false);
            }
          }}
          language={selectedLanguage}
          theme={editorTheme}
          fontSize={fontSize}
          wordWrap={wordWrap}
        />

        <ResultPanel
          consoleOutput={consoleOutput}
          isCompiling={isCompiling}
          hasRunCode={hasRunCode}
          hiddenTestCases={parsedQuestion.hiddenTestCases}
          success={runSuccess}
        />

        {/* Bottom panel console submit action */}
        <div className="flex justify-end items-center bg-card border-t border-border/60 px-4 py-2.5 rounded-b-xl select-none no-print">
          <Button
            size="sm"
            onClick={handleRunCode}
            disabled={isCompiling}
            className="flex items-center gap-1.5 text-xs px-4"
          >
            <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
            Run Code
          </Button>
        </div>
      </div>
    </div>
  );
}
