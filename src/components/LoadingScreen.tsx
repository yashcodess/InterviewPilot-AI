import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Check, Cpu, ShieldCheck } from 'lucide-react';

interface LoadingScreenProps {
  startup?: boolean;
  onComplete?: () => void;
  message?: string;
  subMessage?: string;
}

export function LoadingScreen({ startup = false, onComplete, message, subMessage }: LoadingScreenProps) {
  // Non-startup mode: Standard quick loader
  if (!startup) {
    const isCustom = !!message;
    const messages = [
      'Initializing InterviewPilot AI...',
      'Preparing Interview Session...',
      'Generating AI Questions...',
      'Analyzing Job Requirements...',
      'Ready.'
    ];

    const [index, setIndex] = useState(0);

    useEffect(() => {
      if (isCustom || index >= messages.length - 1) return;

      const timer = setTimeout(() => {
        setIndex((prev) => prev + 1);
      }, 1200);

      return () => clearTimeout(timer);
    }, [index, isCustom]);

    const activeMessage = isCustom ? message : messages[index];
    const activeSubMessage = isCustom ? subMessage : (index === messages.length - 1 ? 'Prepare to speak or write your answers.' : 'Please wait while we formulate the interview environment.');
    const isFinished = !isCustom && index === messages.length - 1;

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 select-none">
        <div className="relative flex items-center justify-center mb-8">
          {/* Glowing background halo */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.15, 0.25, 0.15],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute w-24 h-24 rounded-full bg-primary blur-xl pointer-events-none"
          />
          
          {/* Spinner/Check container */}
          <motion.div
            animate={isFinished ? { rotate: 0 } : { rotate: 360 }}
            transition={isFinished ? { duration: 0.4 } : {
              duration: 1.3,
              repeat: Infinity,
              ease: 'linear',
            }}
            className={`relative flex items-center justify-center w-14 h-14 rounded-full border bg-background/90 transition-colors ${
              isFinished ? 'text-emerald-500 border-emerald-500/30' : 'text-primary border-border'
            }`}
          >
            {isFinished ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 250, damping: 15 }}
              >
                <Check className="w-6 h-6 stroke-[3]" />
              </motion.div>
            ) : (
              <Loader2 className="w-6 h-6 stroke-[1.8] animate-spin" />
            )}
          </motion.div>
        </div>

        <div className="h-20 flex flex-col items-center justify-start max-w-sm w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMessage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="text-center"
            >
              <h3 className={`text-lg font-bold font-display tracking-tight transition-colors ${
                isFinished ? 'text-emerald-450' : 'text-text-bright'
              }`}>
                {activeMessage}
              </h3>

              <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                {activeSubMessage}
              </p>
              
              {/* Show progress markers for sequential load */}
              {!isCustom && (
                <div className="flex justify-center gap-1.5 mt-5">
                  {messages.map((_, mIdx) => (
                    <div
                      key={mIdx}
                      className={`h-0.75 rounded-full transition-all duration-300 ${
                        mIdx < index
                          ? 'w-3.5 bg-emerald-500/75'
                          : mIdx === index
                          ? 'w-5 bg-primary'
                          : 'w-1.5 bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Startup Mode: Cinematic JARVIS experience
  const progressValues = [0, 12, 26, 41, 58, 74, 89, 100];
  const statusMessages = [
    'Initializing AI Engine...',
    'Loading Interview Models...',
    'Preparing Voice Recognition...',
    'Connecting Gemini AI...',
    'Loading Dashboard...',
    'System Ready.'
  ];

  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => {
        if (prev >= progressValues.length - 1) {
          clearInterval(timer);
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 350);
          return prev;
        }
        return prev + 1;
      });
    }, 380);

    return () => clearInterval(timer);
  }, []);

  const progress = progressValues[step];
  const activeStatus = statusMessages[Math.min(step, statusMessages.length - 1)];

  // Text splitting for glows
  const firstName = 'YASH'.split('');
  const lastName = 'MOHITE'.split('');

  const [isDarkMode] = useState(() => {
    return window.localStorage.getItem('interviewpilot_theme') !== 'light';
  });

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-between p-10 select-none overflow-hidden font-display no-print text-text transition-colors duration-300">
      {/* Background radial glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-colors duration-300"
        style={{
          background: isDarkMode
            ? 'radial-gradient(circle at center, rgba(37,99,235,0.06) 0%, var(--background) 70%)'
            : 'radial-gradient(circle at center, rgba(37,99,235,0.12) 0%, var(--background) 70%)'
        }}
      />

      {/* Floating particles */}
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary/30 blur-[0.5px]"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -120 - Math.random() * 100],
            opacity: [0, 0.7, 0],
            scale: [0.6, 1.4, 0.6]
          }}
          transition={{
            duration: 2.5 + Math.random() * 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: Math.random() * 2
          }}
        />
      ))}

      {/* Blue scanning line */}
      <motion.div
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        className="absolute left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent pointer-events-none"
      />

      {/* Top Header metadata info */}
      <div className="w-full max-w-lg flex justify-between items-center text-[10px] text-text-secondary font-mono tracking-wider opacity-60">
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-primary animate-pulse" />
          <span>INTERVIEWPILOT OS v1.2.4</span>
        </div>
        <span>SECURE BOOT // ACTIVE</span>
      </div>

      {/* Center HUD Dials and Name Reveal */}
      <div className="relative flex items-center justify-center w-full h-full my-auto">
        {/* Outer dotted HUD ring */}
        <motion.div
          animate={progress >= 80 ? { rotate: 360 } : { rotate: 180 }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          className="absolute w-80 h-80 rounded-full border border-dashed border-primary/10 flex items-center justify-center pointer-events-none"
        />

        {/* Inner rotating HUD dial */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="absolute w-72 h-72 rounded-full border border-dotted border-blue-400/20 pointer-events-none"
        />

        {/* Third border track */}
        <div className="absolute w-60 h-60 rounded-full border border-primary/5 pointer-events-none" />

        {/* Text container */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          {/* Yash Mohite text */}
          <div className="flex flex-col items-center select-none">
            {/* First Name letters */}
            <div className="flex gap-1.5 text-4xl sm:text-5xl font-black tracking-widest text-text-bright font-display">
              {firstName.map((letter, i) => (
                <motion.span
                  key={i}
                  animate={progress >= 20 ? {
                    opacity: 1,
                    textShadow: progress >= 40 
                      ? (isDarkMode ? '0 0 15px rgba(37,99,235,0.7)' : '0 0 15px rgba(37,99,235,0.45)') 
                      : 'none'
                  } : { opacity: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  {letter}
                </motion.span>
              ))}
            </div>

            {/* Last Name letters */}
            <div className="flex gap-1.5 text-4xl sm:text-5xl font-black tracking-widest text-text-bright font-display mt-1">
              {lastName.map((letter, i) => (
                <motion.span
                  key={i}
                  animate={progress >= 20 ? {
                    opacity: 1,
                    textShadow: progress >= 40 
                      ? (isDarkMode ? '0 0 15px rgba(37,99,235,0.7)' : '0 0 15px rgba(37,99,235,0.45)') 
                      : 'none'
                  } : { opacity: 0 }}
                  transition={{ delay: 0.3 + (i * 0.08) }}
                >
                  {letter}
                </motion.span>
              ))}
            </div>

            {/* Subtext creator tag */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={progress >= 40 ? { opacity: 0.6 } : { opacity: 0 }}
              className="text-[10px] sm:text-xs font-semibold text-text-secondary uppercase tracking-widest mt-4 font-mono"
            >
              Creator of InterviewPilot AI
            </motion.p>
          </div>

          {/* SYSTEM READY status bar */}
          <div className="h-6 mt-6 flex items-center justify-center">
            <AnimatePresence>
              {progress === 100 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1.5 px-3 py-0.75 bg-primary/10 border border-primary/35 rounded-md text-[10px] text-primary font-bold uppercase tracking-widest select-none"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  SYSTEM READY
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Laser scan line overlay across text */}
        {progress >= 60 && progress < 80 && (
          <motion.div
            animate={{ left: ['-10%', '110%'] }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            className="absolute z-20 top-[40%] w-24 h-20 bg-primary/15 blur-lg pointer-events-none"
          />
        )}
      </div>

      {/* Bottom Status bar and progress indicators */}
      <div className="w-full max-w-md flex flex-col gap-3 font-mono text-xs select-none">
        {/* Dynamic status labels */}
        <div className="flex justify-between items-center text-[10px] text-text-secondary uppercase tracking-wider font-semibold">
          <span className="animate-pulse">{activeStatus}</span>
          <span className="font-bold text-primary">{progress}%</span>
        </div>

        {/* Progress tracks */}
        <div className="w-full h-1 bg-card border border-input-border rounded-full overflow-hidden relative">
          <motion.div
            className="h-full bg-primary shadow-[0_0_8px_rgba(37,99,235,0.8)] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
}