import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  RotateCcw,
  Pause
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/Card';

import { LoadingScreen } from './LoadingScreen';
import { ErrorScreen } from './ErrorScreen';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { generateFollowUpQuestion, generateNextQuestion, buildInterviewContext, evaluateAnswerOnTheFly, evaluateFinalInterview, generateAllCodingQuestions } from '../services/gemini';
import type { OnTheFlyEvaluation } from '../services/gemini';
import type { CodingQuestion, InterviewQuestion } from '../types/interview';
import { useSettings } from '../contexts/SettingsContext';
import { normalizeCodingQuestion, isCompletionResponse } from '../services/interviewUtils';

// Import newly refactored sub-components
import { InterviewHeader } from './Interview/InterviewHeader';
import { InterviewFooter } from './Interview/InterviewFooter';
import { InterviewControls } from './Interview/InterviewControls';
import { TextInterview } from './Interview/TextInterview';
import { CodeInterview } from './Interview/CodeInterview';

interface AIInterviewProps {
  apiKey: string;
  setup: {
    role: string;
    category: string;
    difficulty: string;
    length: number;
    company: string;
    resumeText?: string;
  } | null;
  onFinish: (result: { interview: any; evaluation: any }) => void;
}

export function AIInterview({ apiKey, setup, onFinish }: AIInterviewProps) {
  const navigate = useNavigate();
  const { preferences } = useSettings();
  const {
    isListening,
    finalTranscript,
    interimTranscript,
    isSupported: isMicSupported,
    hasPermissionError,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition();

  const {
    isPlaying: isSpeaking,
    isSupported: isSpeakerSupported,
    speak,
    stop: stopSpeaking
  } = useSpeechSynthesis();

  // Active states
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [timesTaken, setTimesTaken] = useState<number[]>([]);
  
  // Follow-up question state
  const [followUpQuestion, setFollowUpQuestion] = useState<string>('');
  const [followUpAnswer, setFollowUpAnswer] = useState<string>('');
  const [isFollowUpActive, setIsFollowUpActive] = useState(false);
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);

  // Status states
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState('Generating Questions...');
  const [errorStatus, setErrorStatus] = useState<number | string | null>(null);
  const [apiError, setApiError] = useState<any>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [localSetup, setLocalSetup] = useState<any>(setup);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [interviewContext, setInterviewContext] = useState<any>(null);
  const [onTheFlyEvals, setOnTheFlyEvals] = useState<OnTheFlyEvaluation[]>([]);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [pendingSession, setPendingSession] = useState<any>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [executionStatuses, setExecutionStatuses] = useState<Record<number, { hasRun: boolean; success: boolean }>>({});



  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Timer states
  const [timeLeft, setTimeLeft] = useState(() => preferences?.defaultDuration || 120);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [currentElapsed, setCurrentElapsed] = useState(0);
  const timerRef = useRef<any>(null);

  const getSpeakOptions = () => {
    let rate = 1.0;
    if (preferences?.speakingSpeed === 'slow') {
      rate = 0.8;
    } else if (preferences?.speakingSpeed === 'fast') {
      rate = 1.3;
    }
    return {
      rate,
      voiceGender: preferences?.voice || 'default'
    };
  };

  const prevIsListening = useRef(false);
  useEffect(() => {
    if (preferences?.autoSubmitSpeech && prevIsListening.current && !isListening) {
      const finalAnswer = isFollowUpActive ? followUpAnswer : currentAnswer;
      if (finalAnswer && finalAnswer.trim().length > 0) {
        const activeSetup = localSetup || setup;
        const maxQuestions = activeSetup?.length || 5;
        if (currentIndex < maxQuestions - 1) {
          handleNext();
        } else {
          handleFinish();
        }
      }
    }
    prevIsListening.current = isListening;
  }, [isListening, isFollowUpActive, followUpAnswer, currentAnswer, preferences?.autoSubmitSpeech, currentIndex]);

  // Sync transcription to textareas concurrently with typing
  useEffect(() => {
    if (isListening) {
      const mergedText = finalTranscript + (interimTranscript ? (finalTranscript ? ' ' : '') + interimTranscript : '');
      if (isFollowUpActive) {
        setFollowUpAnswer(mergedText);
      } else {
        setCurrentAnswer(mergedText);
      }
    }
  }, [finalTranscript, interimTranscript, isListening, isFollowUpActive]);

  // Load or restore session
  useEffect(() => {
    if (!apiKey) {
      navigate('/settings');
      return;
    }

    const savedSession = window.localStorage.getItem('interviewpilot_active_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (!setup || (parsed.setup.role === setup.role && parsed.setup.length === setup.length)) {
          setPendingSession(parsed);
          setShowResumeModal(true);
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.warn('Failed to parse saved session', e);
      }
    }

    if (setup) {
      setLocalSetup(setup);
      fetchQuestions();
    } else {
      navigate('/setup');
    }
  }, [setup, apiKey]);

  const handleResumeSession = () => {
    if (pendingSession) {
      setLocalSetup(pendingSession.setup);
      setQuestions(pendingSession.questions);
      setCurrentIndex(pendingSession.currentIndex);
      setAnswers(pendingSession.answers);
      setCurrentAnswer(pendingSession.answers[pendingSession.currentIndex] || '');
      setTimesTaken(pendingSession.timesTaken || new Array(pendingSession.questions.length).fill(0));
      if (pendingSession.followUpQuestion) {
        setFollowUpQuestion(pendingSession.followUpQuestion);
        setFollowUpAnswer(pendingSession.followUpAnswer || '');
        setIsFollowUpActive(true);
      }
      setTimeLeft(pendingSession.timeLeft || preferences?.defaultDuration || 120);
      setTotalElapsed(pendingSession.totalElapsed || 0);
      setCurrentElapsed(pendingSession.currentElapsed || 0);
      if (pendingSession.interviewContext) {
        setInterviewContext(pendingSession.interviewContext);
      }
      if (pendingSession.onTheFlyEvals) {
        setOnTheFlyEvals(pendingSession.onTheFlyEvals);
      }
      triggerToast('Interview Restored');
    }
    setShowResumeModal(false);
    setPendingSession(null);
  };

  const handleDiscardSession = () => {
    window.localStorage.removeItem('interviewpilot_active_session');
    setShowResumeModal(false);
    setPendingSession(null);
    if (setup) {
      setLocalSetup(setup);
      fetchQuestions();
    } else {
      navigate('/setup');
    }
  };

  const handleRestartClick = () => {
    if (window.confirm('Are you sure you want to restart this interview? All your current answers and progress in this session will be reset.')) {
      window.localStorage.removeItem('interviewpilot_active_session');
      triggerToast('Interview Restarted');
      window.location.reload();
    }
  };

  const handleEndInterviewClick = () => {
    if (window.confirm('Are you sure you want to end this interview now? We will generate the scorecard based on your answered questions so far.')) {
      handleFinish();
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
        triggerToast('Entered Fullscreen');
      }).catch((err) => {
        console.warn('Failed to enter fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
        triggerToast('Exited Fullscreen');
      }).catch((err) => {
        console.warn('Failed to exit fullscreen:', err);
      });
    }
  };

  // Prevent accidental navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (questions.length > 0 && !isSuccess && !isEvaluating) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave the mock interview? Your progress will be saved but you will exit the current session.';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [questions.length, isSuccess, isEvaluating]);

  // Automatically read question when loading finishes or navigates
  useEffect(() => {
    if (isLoading || errorStatus || questions.length === 0 || isSuccess || isPaused) return;

    const voiceEnabled = preferences?.autoPlayVoice;
    if (voiceEnabled && !isMuted) {
      const activeQuestion = questions[currentIndex];
      const activeText = isFollowUpActive 
        ? followUpQuestion 
        : (typeof activeQuestion === 'object' ? `${activeQuestion.title}. ${activeQuestion.description}` : activeQuestion);

      if (activeText) {
        const timer = setTimeout(() => {
          stopListening(); // Stop mic before speaking question
          speak(activeText, getSpeakOptions());
        }, 400);
        return () => {
          clearTimeout(timer);
          stopSpeaking();
        };
      }
    }
  }, [currentIndex, questions, followUpQuestion, isFollowUpActive, isLoading, errorStatus, isSuccess, isMuted, isPaused]);

  // Keyboard Shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.getAttribute('contenteditable') === 'true');
      
      // Ctrl + Enter should trigger even if in textarea!
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        const activeSetup = localSetup || setup;
        const maxQuestions = activeSetup?.length || 5;
        if (currentIndex < maxQuestions - 1) {
          handleNext();
        } else {
          handleFinish();
        }
        return;
      }

      if (isInput) return;

      switch (e.key.toLowerCase()) {
        case ' ': // Space bar
          e.preventDefault();
          handleToggleRecording();
          break;
        case 'escape':
          e.preventDefault();
          stopSpeaking();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          setIsMuted(prev => {
            const next = !prev;
            triggerToast(next ? 'Voice Muted' : 'Voice Unmuted');
            if (next) stopSpeaking();
            return next;
          });
          break;
        case 'p':
          e.preventDefault();
          setIsPaused(prev => {
            const next = !prev;
            triggerToast(next ? 'Interview Paused' : 'Interview Resumed');
            if (next) {
              stopSpeaking();
              stopListening();
            }
            return next;
          });
          break;
        case 'r':
          e.preventDefault();
          handleRestartClick();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isListening, isSpeaking, isMuted, isPaused, localSetup, setup, questions, currentAnswer, followUpAnswer]);

  // Timer Effect
  useEffect(() => {
    if (isLoading || errorStatus || isSuccess || isPaused) return;

    timerRef.current = setInterval(() => {
      setTotalElapsed((prev) => prev + 1);
      setCurrentElapsed((prev) => prev + 1);
      
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Proceed to next question automatically if time expires
          handleNext();
          return preferences?.defaultDuration || 120;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isLoading, errorStatus, isSuccess, isFollowUpActive, isPaused]);

  // Save progress to LocalStorage on every step
  useEffect(() => {
    if (questions.length === 0 || isLoading || isEvaluating || isSuccess) return;

    const sessionState = {
      setup: localSetup,
      questions,
      currentIndex,
      answers: [...answers.slice(0, currentIndex), currentAnswer, ...answers.slice(currentIndex + 1)],
      timesTaken: [...timesTaken.slice(0, currentIndex), currentElapsed, ...timesTaken.slice(currentIndex + 1)],
      followUpQuestion: isFollowUpActive ? followUpQuestion : null,
      followUpAnswer: isFollowUpActive ? followUpAnswer : null,
      timeLeft,
      totalElapsed,
      currentElapsed,
      interviewContext,
      onTheFlyEvals,
    };

    window.localStorage.setItem('interviewpilot_active_session', JSON.stringify(sessionState));
  }, [currentIndex, answers, currentAnswer, questions, followUpQuestion, followUpAnswer, isFollowUpActive, timeLeft, totalElapsed, currentElapsed, isLoading, localSetup, timesTaken, isEvaluating, isSuccess, interviewContext, onTheFlyEvals]);

  const fetchQuestions = async () => {
    const activeSetup = localSetup || setup;
    if (!activeSetup) return;
    setIsLoading(true);
    setErrorStatus(null);
    setApiError(null);
    setLoadingMsg('Generating tailored questions via Gemini...');

    let resumeAnalysis: any = undefined;
    const cache = window.localStorage.getItem('interviewpilot_resume_analysis');
    if (cache) {
      try {
        const parsed = JSON.parse(cache);
        if (activeSetup.resumeText && parsed.analysis) {
          resumeAnalysis = parsed.analysis;
        }
      } catch (e) {
        console.warn('Failed to parse resume analysis', e);
      }
    }

    try {
      if (activeSetup.category === 'Code Interview') {
        let attempts = 0;
        const maxAttempts = 2;
        let codingQuestions: CodingQuestion[] | null = null;
        let lastErr: any = null;

        while (attempts < maxAttempts) {
          try {
            if (attempts > 0) {
              setLoadingMsg('Unable to generate interview questions. Retrying...');
            }
            const rawList = await generateAllCodingQuestions(
              apiKey,
              activeSetup.role,
              activeSetup.difficulty,
              activeSetup.length,
              resumeAnalysis ? `${resumeAnalysis.experienceLevel} candidate. Skills: ${Object.values(resumeAnalysis.skills).flat().join(', ')}` : '',
              activeSetup.company
            );
            
            if (rawList.length !== activeSetup.length) {
              throw new Error(`Expected exactly ${activeSetup.length} questions, but got ${rawList.length}`);
            }
            
            const normalizedList = rawList.map(q => normalizeCodingQuestion(q, activeSetup.difficulty, activeSetup.company)).filter(Boolean) as CodingQuestion[];
            if (normalizedList.length !== activeSetup.length) {
              throw new Error(`Only ${normalizedList.length} of ${activeSetup.length} questions passed normalization`);
            }
            
            codingQuestions = normalizedList;
            break; // Success!
          } catch (e: any) {
            lastErr = e;
            attempts++;
          }
        }

        if (!codingQuestions) {
          console.error(`[fetchQuestions] Failed to preload coding questions after ${attempts} attempts:`, lastErr);
          setErrorStatus('generation-failed');
          setApiError(new Error("Unable to generate interview questions. Please try again."));
          setIsLoading(false);
          return;
        }

        setQuestions(codingQuestions);
        const initialContext = buildInterviewContext([], resumeAnalysis);
        setInterviewContext(initialContext);
        setAnswers(new Array(activeSetup.length).fill(''));
        setTimesTaken(new Array(activeSetup.length).fill(0));
      } else {
        const firstQ = await generateNextQuestion(
          apiKey,
          activeSetup.role,
          activeSetup.category,
          activeSetup.difficulty,
          1,
          activeSetup.length,
          [],
          resumeAnalysis,
          activeSetup.company
        );
        setQuestions([firstQ]);
        const initialContext = buildInterviewContext([], resumeAnalysis);
        setInterviewContext(initialContext);
        setAnswers(new Array(activeSetup.length).fill(''));
        setTimesTaken(new Array(activeSetup.length).fill(0));
      }

      setCurrentIndex(0);
      setCurrentAnswer('');
      setTimeLeft(preferences?.defaultDuration || 120);
      setTotalElapsed(0);
      setCurrentElapsed(0);
      setIsLoading(false);
    } catch (err: any) {
      setErrorStatus(err.status || 500);
      setApiError(err);
      setIsLoading(false);
    }
  };

  const handleSpeaker = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      stopListening(); // Stop mic before speaking question
      const activeQuestion = questions[currentIndex];
      const activeText = isFollowUpActive 
        ? followUpQuestion 
        : (typeof activeQuestion === 'object' ? `${activeQuestion.title}. ${activeQuestion.description}` : activeQuestion);

      if (!isMuted) {
        speak(activeText, getSpeakOptions());
      } else {
        triggerToast('Voice Muted - Unmute to Play');
      }
    }
  };

  const handleToggleRecording = () => {
    if (isListening) {
      stopListening();
    } else {
      stopSpeaking();
      const currentText = isFollowUpActive ? followUpAnswer : currentAnswer;
      startListening(currentText);
    }
  };

  const handleClearAnswer = () => {
    if (window.confirm('Are you sure you want to clear your current response?')) {
      resetTranscript();
      if (isFollowUpActive) {
        setFollowUpAnswer('');
      } else {
        setCurrentAnswer('');
      }
    }
  };

  // Follow-up question generation
  const handleTriggerFollowUp = async () => {
    if (!currentAnswer.trim()) {
      alert('Please provide an answer first before requesting a follow-up question.');
      return;
    }
    setIsGeneratingFollowUp(true);
    
    let resumeAnalysis: any = undefined;
    const cache = window.localStorage.getItem('interviewpilot_resume_analysis');
    const activeSetup = localSetup || setup;
    if (cache) {
      try {
        const parsed = JSON.parse(cache);
        if (activeSetup?.resumeText && parsed.analysis) {
          resumeAnalysis = parsed.analysis;
        }
      } catch (e) {
        console.warn('Failed to parse resume analysis for follow-up', e);
      }
    }

    try {
      const q = await generateFollowUpQuestion(
        apiKey,
        questions[currentIndex],
        currentAnswer,
        activeSetup?.difficulty || 'Intermediate',
        resumeAnalysis
      );
      if (q === 'NO_FOLLOW_UP') {
        alert("The AI coach determined that no follow-up is needed for this response. You can proceed to the next question.");
        setIsFollowUpActive(false);
      } else {
        setFollowUpQuestion(q);
        setFollowUpAnswer('');
        setIsFollowUpActive(true);
      }
    } catch (err) {
      console.error('Follow up generation failed', err);
      alert('Failed to generate follow-up. Continuing with normal flow.');
    } finally {
      setIsGeneratingFollowUp(false);
    }
  };

  const saveCurrentAnswer = () => {
    const updated = [...answers];
    updated[currentIndex] = currentAnswer;
    setAnswers(updated);
    return updated;
  };

  const saveCurrentTime = () => {
    const updated = [...timesTaken];
    updated[currentIndex] = currentElapsed;
    setTimesTaken(updated);
    return updated;
  };

  const loadNextQuestion = async (nextIndex: number) => {
    setIsLoading(true);
    setLoadingMsg('Formulating next question...');
    setErrorStatus(null);
    setApiError(null);
    
    const activeSetup = localSetup || setup;
    
    let resumeAnalysis: any = undefined;
    const cache = window.localStorage.getItem('interviewpilot_resume_analysis');
    if (cache) {
      try {
        const parsed = JSON.parse(cache);
        if (activeSetup?.resumeText && parsed.analysis) {
          resumeAnalysis = parsed.analysis;
        }
      } catch (e) {
        console.warn('Failed to parse resume analysis for next question', e);
      }
    }

    const currentAnswers = [...answers];
    currentAnswers[currentIndex] = currentAnswer;

    const currentTimes = [...timesTaken];
    currentTimes[currentIndex] = currentElapsed;

    const currentQuestion = questions[currentIndex];
    const currentAnswerText = currentAnswer;
    const currentFollowUp = isFollowUpActive && followUpQuestion ? {
      question: followUpQuestion,
      answer: followUpAnswer
    } : undefined;

    const transcriptSoFar = questions.slice(0, currentIndex).map((q, idx) => ({
      question: q,
      answer: currentAnswers[idx] || '',
      timeTaken: currentTimes[idx] || 0
    }));

    if (import.meta.env.DEV) {
      console.log(`[On-The-Fly Eval & Generation] Evaluating Q${currentIndex + 1} and formulating Q${nextIndex + 1}...`);
    }

    let attempts = 0;
    const maxAttempts = 2; // Initial try + 1 retry
    let nextQ: InterviewQuestion | null = null;
    let lastError: any = null;

    while (attempts < maxAttempts) {
      try {
        if (attempts > 0) {
          setLoadingMsg('Unable to generate the next coding problem. Retrying...');
          if (import.meta.env.DEV) {
            console.warn(`[loadNextQuestion] Retry attempt ${attempts} after validation failure...`);
          }
        }

        const evalResult = await evaluateAnswerOnTheFly(
          apiKey,
          activeSetup!,
          currentQuestion,
          currentAnswerText,
          currentIndex + 1,
          currentFollowUp,
          resumeAnalysis,
          transcriptSoFar
        );

        if (import.meta.env.DEV) {
          console.log(`[On-The-Fly Result] Q${currentIndex + 1} score: ${evalResult.technicalScore} | Next Q: "${evalResult.nextQuestion}"`);
        }
        
        // Save intermediate evaluation results on successful call
        if (attempts === 0) {
          setOnTheFlyEvals((prev) => [...prev, evalResult]);
        }

        const rawNextQ = evalResult.nextQuestion || "Thank you. Let's proceed to the next stage.";

        // If it is completion sentinel
        if (typeof rawNextQ === 'string' && isCompletionResponse(rawNextQ)) {
          if (import.meta.env.DEV) {
            console.log('[loadNextQuestion] Completion sentinel detected. Finishing interview...');
          }
          handleFinish();
          return;
        }

        if (activeSetup?.category === 'Code Interview') {
          let parsedObj: any = null;
          if (typeof rawNextQ === 'string') {
            try {
              const cleanJsonStr = rawNextQ.trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim();
              parsedObj = JSON.parse(cleanJsonStr);
            } catch (e) {
              console.warn("Failed to parse next coding question JSON string:", e);
            }
          } else {
            parsedObj = rawNextQ;
          }

          const normalized = normalizeCodingQuestion(parsedObj, activeSetup.difficulty, activeSetup.company);
          if (normalized) {
            nextQ = normalized;
            break; // Success!
          } else {
            throw new Error("Validation failed for next coding question");
          }
        } else {
          nextQ = rawNextQ;
          break; // Success!
        }
      } catch (err: any) {
        lastError = err;
        attempts++;
      }
    }

    if (!nextQ) {
      console.error(`[loadNextQuestion] Validation failed after ${attempts} attempts. Ending interview gracefully...`, lastError);
      handleFinish();
      return;
    }

    try {
      const updatedContext = buildInterviewContext([...transcriptSoFar, {
        question: currentQuestion,
        answer: currentAnswerText,
        followUp: currentFollowUp
      }], resumeAnalysis);
      
      setInterviewContext(updatedContext);
      setQuestions((prev) => [...prev, nextQ as InterviewQuestion]);
      setCurrentIndex(nextIndex);
      setCurrentAnswer('');
      setTimeLeft(preferences?.defaultDuration || 120);
      setCurrentElapsed(0);
      setIsLoading(false);
    } catch (err: any) {
      console.error(`[Gemini Failure] Failed to generate Q${nextIndex + 1}:`, err);
      setApiError(err);
      setErrorStatus('generation-failed');
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    stopSpeaking();
    stopListening();
    resetTranscript(); // Clear temporary speech buffers
    saveCurrentAnswer();
    saveCurrentTime();

    const activeSetup = localSetup || setup;
    const maxQuestions = activeSetup?.length || 5;

    if (activeSetup?.category === 'Code Interview') {
      const currentStatus = executionStatuses[currentIndex];
      if (currentStatus?.hasRun && !currentStatus.success) {
        triggerToast('Your code has compilation or runtime errors. Please resolve them before proceeding.');
        return;
      }
    }

    if (currentIndex < maxQuestions - 1) {
      // Clear follow-up state for next question
      setIsFollowUpActive(false);
      setFollowUpQuestion('');
      setFollowUpAnswer('');
      
      const nextIndex = currentIndex + 1;
      
      if (nextIndex >= questions.length) {
        await loadNextQuestion(nextIndex);
      } else {
        if (import.meta.env.DEV) {
          console.log(`[State Transition] Advancing to previously generated Q${nextIndex + 1}`);
        }
        setCurrentIndex(nextIndex);
        const nextAnswer = answers[nextIndex] || '';
        setCurrentAnswer(nextAnswer);
        setTimeLeft(preferences?.defaultDuration || 120);
        setCurrentElapsed(0);
      }
    }
  };

  const handlePrev = () => {
    stopSpeaking();
    stopListening();
    resetTranscript(); // Clear temporary speech buffers
    saveCurrentAnswer();
    saveCurrentTime();

    if (currentIndex > 0) {
      setIsFollowUpActive(false);
      setFollowUpQuestion('');
      setFollowUpAnswer('');

      if (import.meta.env.DEV) {
        console.log(`[State Transition] Returning to Q${currentIndex}`);
      }
      setCurrentIndex((prev) => prev - 1);
      const prevAnswer = answers[currentIndex - 1] || '';
      setCurrentAnswer(prevAnswer);
      setTimeLeft(preferences?.defaultDuration || 120);
      setCurrentElapsed(0);
    }
  };

  const handleSkip = async () => {
    stopSpeaking();
    stopListening();
    resetTranscript(); // Clear temporary speech buffers
    
    const updated = [...answers];
    updated[currentIndex] = '(Skipped Question)';
    setAnswers(updated);
    saveCurrentTime();

    const activeSetup = localSetup || setup;
    const maxQuestions = activeSetup?.length || 5;

    if (currentIndex < maxQuestions - 1) {
      setIsFollowUpActive(false);
      setFollowUpQuestion('');
      setFollowUpAnswer('');

      const nextIndex = currentIndex + 1;

      if (nextIndex >= questions.length) {
        await loadNextQuestion(nextIndex);
      } else {
        if (import.meta.env.DEV) {
          console.log(`[State Transition] Advancing to previously generated skipped Q${nextIndex + 1}`);
        }
        setCurrentIndex(nextIndex);
        const nextAnswer = answers[nextIndex] || '';
        setCurrentAnswer(nextAnswer);
        setTimeLeft(preferences?.defaultDuration || 120);
        setCurrentElapsed(0);
      }
    }
  };

  const handleFinish = async () => {
    if (isEvaluating) return;
    setIsEvaluating(true);
    stopSpeaking();
    stopListening();
    
    const activeSetup = localSetup || setup;
    if (activeSetup?.category === 'Code Interview') {
      const hasFailedQuestion = Object.values(executionStatuses).some((status) => {
        return status.hasRun && !status.success;
      });
      if (hasFailedQuestion) {
        setIsEvaluating(false);
        triggerToast('Please resolve compilation or runtime errors in your solutions before finishing.');
        return;
      }
    }

    const finalAnswers = saveCurrentAnswer();
    const finalTimes = saveCurrentTime();
    
    // Construct final transcript matching evaluation format
    const transcript = questions.map((q, idx) => {
      const item: any = { 
        question: q, 
        answer: finalAnswers[idx],
        timeTaken: finalTimes[idx] || 0
      };
      if (idx === currentIndex && isFollowUpActive && followUpQuestion) {
        item.followUp = { question: followUpQuestion, answer: followUpAnswer };
      }
      return item;
    });

    setIsLoading(true);
    setErrorStatus(null);
    setApiError(null);
    setLoadingMsg('Generating interview analysis...');

    let resumeAnalysis: any = undefined;
    const cache = window.localStorage.getItem('interviewpilot_resume_analysis');
    if (cache) {
      try {
        const parsed = JSON.parse(cache);
        if (activeSetup?.resumeText && parsed.analysis) {
          resumeAnalysis = parsed.analysis;
        }
      } catch (e) {
        console.warn('Failed to parse resume analysis for evaluation', e);
      }
    }

    try {
      let finalEvals = [...onTheFlyEvals];
      const maxQuestions = activeSetup?.length || 5;
      
      if (activeSetup?.category !== 'Code Interview' && finalEvals.length < maxQuestions) {
        if (import.meta.env.DEV) {
          console.log('[Final Step Eval] Generating evaluation for final answer...');
        }
        const currentQuestion = questions[currentIndex];
        const currentAnswerText = currentAnswer;
        const currentFollowUp = isFollowUpActive && followUpQuestion ? {
          question: followUpQuestion,
          answer: followUpAnswer
        } : undefined;

        const transcriptSoFar = questions.slice(0, currentIndex).map((q, idx) => ({
          question: q,
          answer: finalAnswers[idx] || '',
          timeTaken: finalTimes[idx] || 0
        }));

        try {
          const finalStepEval = await evaluateAnswerOnTheFly(
            apiKey,
            activeSetup!,
            currentQuestion,
            currentAnswerText,
            currentIndex + 1,
            currentFollowUp,
            resumeAnalysis,
            transcriptSoFar
          );
          finalEvals.push(finalStepEval);
          setOnTheFlyEvals(finalEvals);
        } catch (e) {
          console.warn('Failed to evaluate final step on the fly, proceeding to final eval with partial inputs', e);
        }
      }

      if (import.meta.env.DEV) {
        console.log(`[Final Evaluation] Triggering overall scorecard compilation with ${finalEvals.length} intermediate evaluations...`);
      }
      const evaluation = await evaluateFinalInterview(apiKey, activeSetup!, transcript, finalEvals, resumeAnalysis);
      
      const interviewRecord = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        setup: activeSetup,
        questions,
        answers: finalAnswers,
        timesTaken: finalTimes,
        totalDuration: finalTimes.reduce((a, b) => a + b, 0),
        transcript,
      };

      // Clear active session
      window.localStorage.removeItem('interviewpilot_active_session');

      setIsLoading(false);
      setIsSuccess(true);
      
      setTimeout(() => {
        onFinish({ interview: interviewRecord, evaluation });
        navigate('/dashboard');
      }, 1800);
    } catch (err: any) {
      console.error('Final evaluation failed:', err);
      setErrorStatus('evaluation-failed');
      setApiError(err);
      setIsLoading(false);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Format elapsed seconds into MM:SS
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center select-none no-print">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/35 flex items-center justify-center text-emerald-450 mb-6"
        >
          <CheckCircle className="w-8 h-8 stroke-[2.5]" />
        </motion.div>
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-2xl font-bold font-display tracking-tight text-text-bright"
        >
          Mock Interview Completed!
        </motion.h3>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.3 }}
          className="text-sm text-text-secondary mt-2 max-w-xs"
        >
          Generating your detailed performance scorecard and customized study roadmap...
        </motion.p>
      </div>
    );
  }
  
  if (isLoading) {
    if (loadingMsg.includes('Generating')) {
      return (
        <div className="max-w-3xl mx-auto py-8 px-4 animate-pulse select-none">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center mb-6">
            <div className="space-y-2">
              <div className="h-4.5 bg-card border border-input-border rounded w-44" />
              <div className="h-3 bg-card border border-input-border rounded w-60" />
            </div>
            <div className="h-7 bg-card border border-input-border rounded w-16" />
          </div>

          {/* Progress bar skeleton */}
          <div className="w-full bg-card border border-input-border h-2 rounded-full mb-8" />

          {/* Main Card Skeleton */}
          <Card className="border border-input-border/60 bg-card/10">
            <CardHeader className="space-y-2 pb-5 border-b border-input-border/60">
              <div className="h-3.5 bg-card border border-input-border rounded w-20" />
              <div className="space-y-1.5 pt-2">
                <div className="h-4 bg-card border border-input-border rounded w-full" />
                <div className="h-4 bg-card border border-input-border rounded w-5/6" />
              </div>
            </CardHeader>
            <CardContent className="py-6 space-y-6">
              {/* Textarea skeleton */}
              <div className="w-full h-36 bg-card border border-input-border rounded-xl" />

              {/* Mic / Controls skeleton */}
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <div className="h-9 w-24 bg-card border border-input-border rounded-lg" />
                  <div className="h-9 w-24 bg-card border border-input-border rounded-lg" />
                </div>
                <div className="h-9 w-32 bg-card border border-input-border rounded-lg" />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center bg-card/10">
              <div className="h-9 w-20 bg-card border border-input-border rounded-lg" />
              <div className="h-9 w-20 bg-card border border-input-border rounded-lg" />
            </CardFooter>
          </Card>
        </div>
      );
    }
    return <LoadingScreen message={loadingMsg} subMessage="Formulating interview environment and mapping parameters." />;
  }

  if (errorStatus) {
    return (
      <ErrorScreen
        status={errorStatus}
        error={apiError}
        onRetry={() => {
          if (loadingMsg.includes('Evaluating') || loadingMsg.includes('analysis')) {
            handleFinish();
          } else if (errorStatus === 'generation-failed') {
            loadNextQuestion(currentIndex + 1);
          } else {
            fetchQuestions();
          }
        }}
      />
    );
  }

  const maxQuestions = (localSetup || setup)?.length || 5;
  const isTimeCritical = timeLeft <= 15;

  const activeSetup = localSetup || setup;
  const isCode = activeSetup?.category === 'Code Interview';

  return (
    <div className={`${isCode ? 'max-w-7xl' : 'max-w-3xl'} mx-auto py-8 px-4`}>
      <InterviewHeader
        currentIndex={currentIndex}
        totalQuestions={maxQuestions}
        timeLeft={timeLeft}
        totalElapsed={totalElapsed}
        currentElapsed={currentElapsed}
        isTimeCritical={isTimeCritical}
        formatTime={formatTime}
      />

      {isCode ? (
        <CodeInterview
          currentIndex={currentIndex}
          rawQuestion={questions[currentIndex]}
          _category={activeSetup?.category || ''}
          difficulty={activeSetup?.difficulty || ''}
          company={activeSetup?.company || 'Generic'}
          currentAnswer={currentAnswer}
          setCurrentAnswer={setCurrentAnswer}
          isFullscreen={isFullscreen}
          onFullscreenToggle={toggleFullscreen}
          triggerToast={triggerToast}
          onExecutionStatusChange={(hasRun, success) => {
            setExecutionStatuses((prev) => ({
              ...prev,
              [currentIndex]: { hasRun, success }
            }));
          }}
        />
      ) : (
        <TextInterview
          currentIndex={currentIndex}
          question={typeof questions[currentIndex] === 'string' ? (questions[currentIndex] as string) : ''}
          category={activeSetup?.category || ''}
          difficulty={activeSetup?.difficulty || ''}
          currentAnswer={currentAnswer}
          setCurrentAnswer={setCurrentAnswer}
          isListening={isListening}
          isSpeaking={isSpeaking}
          isMicSupported={isMicSupported}
          isSpeakerSupported={isSpeakerSupported}
          hasPermissionError={hasPermissionError}
          handleSpeaker={handleSpeaker}
          stopSpeaking={stopSpeaking}
          handleToggleRecording={handleToggleRecording}
          handleClearAnswer={handleClearAnswer}
          handleTriggerFollowUp={handleTriggerFollowUp}
          isGeneratingFollowUp={isGeneratingFollowUp}
          isFollowUpActive={isFollowUpActive}
          followUpQuestion={followUpQuestion}
          followUpAnswer={followUpAnswer}
          setFollowUpAnswer={setFollowUpAnswer}
        />
      )}

      <InterviewFooter
        currentIndex={currentIndex}
        totalQuestions={maxQuestions}
        isListening={isListening}
        handlePrev={handlePrev}
        handleSkip={handleSkip}
        handleNext={handleNext}
        handleFinish={handleFinish}
      />

      <InterviewControls
        isPaused={isPaused}
        isMuted={isMuted}
        isFullscreen={isFullscreen}
        setIsPaused={setIsPaused}
        setIsMuted={setIsMuted}
        handleRestartClick={handleRestartClick}
        handleEndInterviewClick={handleEndInterviewClick}
        toggleFullscreen={toggleFullscreen}
        triggerToast={triggerToast}
        stopSpeaking={stopSpeaking}
        stopListening={stopListening}
      />

      {/* Paused Overlay Screen */}
      {isPaused && (
        <div className="fixed inset-0 z-35 flex flex-col items-center justify-center bg-background/95 backdrop-blur-md px-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/35 flex items-center justify-center text-amber-400 mx-auto animate-pulse">
              <Pause className="w-8 h-8 stroke-[2.5]" />
            </div>
            <h3 className="text-2xl font-bold font-display text-text-bright">Interview Paused</h3>
            <p className="text-sm text-text-secondary max-w-xs mx-auto">
              Timers are frozen. Press <kbd className="px-1.5 py-0.5 bg-slate-900 border border-border/80 rounded text-text font-mono">P</kbd> or click below to resume.
            </p>
            <Button
              onClick={() => {
                setIsPaused(false);
                triggerToast('Interview Resumed');
              }}
              className="mt-2"
            >
              Resume Interview
            </Button>
          </motion.div>
        </div>
      )}

      {/* Resume Previous Session Confirmation Modal */}
      {showResumeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md px-4">
          <Card className="max-w-md w-full shadow-2xl border-primary/20 bg-card">
            <CardHeader className="text-center pb-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 animate-bounce">
                <RotateCcw className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl text-text-bright">Resume Previous Interview?</CardTitle>
              <CardDescription className="text-sm text-text-secondary">
                We detected an unfinished interview session from your last visit.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center text-xs text-text-secondary leading-relaxed px-6 pb-6">
              You can resume exactly where you left off with all questions, answers, and timers preserved. Or you can discard it to start fresh.
            </CardContent>
            <CardFooter className="flex gap-3 justify-center bg-card/50 border-t border-border/40 p-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDiscardSession}
                className="w-1/2 border-border/80 text-text-secondary"
              >
                Discard
              </Button>
              <Button
                size="sm"
                onClick={handleResumeSession}
                className="w-1/2"
              >
                Resume
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Toast Alert popup */}
      {toastMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-primary/30 text-primary px-4 py-2 rounded-full shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}