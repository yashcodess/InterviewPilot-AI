import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Mic,
  MicOff,
  Sparkles,
  Square,
  BadgeAlert,
  AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface TextInterviewProps {
  currentIndex: number;
  question: string;
  category: string;
  difficulty: string;
  currentAnswer: string;
  setCurrentAnswer: (val: string) => void;
  isListening: boolean;
  isSpeaking: boolean;
  isMicSupported: boolean;
  isSpeakerSupported: boolean;
  hasPermissionError: boolean;
  handleSpeaker: () => void;
  stopSpeaking: () => void;
  handleToggleRecording: () => void;
  handleClearAnswer: () => void;
  handleTriggerFollowUp: () => void;
  isGeneratingFollowUp: boolean;
  isFollowUpActive: boolean;
  followUpQuestion: string;
  followUpAnswer: string;
  setFollowUpAnswer: (val: string) => void;
}

export function TextInterview({
  currentIndex,
  question,
  category,
  difficulty,
  currentAnswer,
  setCurrentAnswer,
  isListening,
  isSpeaking,
  isMicSupported,
  isSpeakerSupported,
  hasPermissionError,
  handleSpeaker,
  stopSpeaking,
  handleToggleRecording,
  handleClearAnswer,
  handleTriggerFollowUp,
  isGeneratingFollowUp,
  isFollowUpActive,
  followUpQuestion,
  followUpAnswer,
  setFollowUpAnswer
}: TextInterviewProps) {
  return (
    <div className="space-y-6">
      {/* Permission Warning Card */}
      {hasPermissionError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="border-rose-950/45 bg-rose-950/5">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-rose-400">
                <BadgeAlert className="w-5 h-5 text-rose-500" />
                <CardTitle className="text-sm font-bold uppercase tracking-wider">Microphone Blocked</CardTitle>
              </div>
              <CardDescription className="text-rose-300">
                Permission to access your microphone was denied by the browser.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-text-secondary leading-relaxed space-y-1">
              <p>To enable dictation and voice response, please check your browser settings:</p>
              <ul className="list-disc pl-4 space-y-0.5 mt-1 font-mono text-[11px] text-text-secondary">
                <li>Click the padlock/settings icon in your browser URL bar.</li>
                <li>Toggle "Microphone" to <strong>Allow</strong>.</li>
                <li>Reload the page to re-test the connection.</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Browser Speech Recognition Warning */}
      {!isMicSupported && (
        <Card className="mb-6 border-yellow-950/45 bg-yellow-950/5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-yellow-450">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider">Voice Dictation Unsupported</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-xs text-text-secondary leading-relaxed">
            Your browser does not support the Web Speech API. Voice transcription is disabled. We recommend using Google Chrome, Microsoft Edge, or Safari for a full voice-driven experience.
          </CardContent>
        </Card>
      )}

      {/* Main Question Card */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1 w-11/12">
            <div className="flex items-center gap-2">
              <Badge variant="primary">{category}</Badge>
              <Badge variant="secondary">{difficulty}</Badge>
            </div>
            <h2 className="text-xl font-semibold font-display tracking-tight text-text-bright mt-2 leading-snug">
              {question}
            </h2>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {isSpeakerSupported && (
              <>
                <Button
                  variant="ghost"
                  onClick={handleSpeaker}
                  className={`p-2.5 rounded-lg shrink-0 ${
                    isSpeaking ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:text-text'
                  }`}
                  title="Speak Question"
                >
                  {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </Button>
                {isSpeaking && (
                  <Button
                    variant="ghost"
                    onClick={stopSpeaking}
                    className="p-2.5 rounded-lg text-text-secondary hover:text-red-400"
                    title="Stop Speaking"
                  >
                    <Square className="w-4 h-4 fill-current" />
                  </Button>
                )}
              </>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 mt-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-text-secondary tracking-wide uppercase">
              Candidate Response
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAnswer}
              disabled={isFollowUpActive || (!currentAnswer && !followUpAnswer)}
              className="text-text-secondary hover:text-red-405 text-xs px-2 py-1 h-auto"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Clear Answer
            </Button>
          </div>
          
          <div className="relative">
            <textarea
              className="w-full min-h-[160px] bg-card/60 border border-input-border rounded-xl p-4 text-sm text-text placeholder:text-text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-blue-500 transition-all duration-200 leading-relaxed resize-y"
              placeholder="Type your structured answer here, or click the mic to dictate your response..."
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              disabled={isFollowUpActive}
            />
            
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              {isListening && !isFollowUpActive && (
                <div className="flex items-center gap-2.5 py-1.5 px-3 rounded-lg bg-primary/10 border border-primary/25 text-primary text-xs font-semibold select-none shadow-[0_0_12px_rgba(37,99,235,0.15)] animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                  <div className="flex items-end gap-0.75 h-3 shrink-0">
                    <motion.span animate={{ height: [4, 12, 4] }} transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut' }} className="w-0.5 bg-blue-400 rounded-full" />
                    <motion.span animate={{ height: [8, 4, 8] }} transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }} className="w-0.5 bg-blue-400 rounded-full" />
                    <motion.span animate={{ height: [2, 14, 2] }} transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }} className="w-0.5 bg-blue-400 rounded-full" />
                    <motion.span animate={{ height: [10, 6, 10] }} transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }} className="w-0.5 bg-blue-400 rounded-full" />
                  </div>
                  <span>Listening...</span>
                </div>
              )}

              {!isFollowUpActive && isMicSupported && (
                <Button
                  type="button"
                  variant={isListening ? 'danger' : 'outline'}
                  onClick={handleToggleRecording}
                  className="p-2.5 rounded-lg active:scale-95 transition-all"
                  title={isListening ? 'Stop Recording' : 'Start Recording'}
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4 text-red-300" />
                  ) : (
                    <Mic className="w-4 h-4 text-primary" />
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center text-xs text-text-secondary select-none">
            <span>Words: {currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).length : 0}</span>
            <span>Characters: {currentAnswer.length}</span>
          </div>
        </CardContent>

        {!isFollowUpActive && !isGeneratingFollowUp && (
          <CardFooter className="justify-start pt-0 bg-card/10 border-none">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTriggerFollowUp}
              className="text-xs text-primary hover:text-blue-300 hover:bg-blue-950/20 border-blue-950/40"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary animate-pulse" />
              Ask Contextual Follow-up
            </Button>
          </CardFooter>
        )}

        {isGeneratingFollowUp && (
          <div className="p-5 border-t border-slate-900/60 bg-background/30 flex items-center gap-3 select-none">
            <div className="flex gap-1.25 items-center justify-center shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-primary dot-wave" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary dot-wave" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary dot-wave" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs text-text-secondary font-medium animate-pulse">AI is formulating follow-up...</span>
          </div>
        )}
      </Card>

      {/* Follow-up Question Card */}
      <AnimatePresence>
        {isFollowUpActive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-blue-900/30 bg-blue-950/5">
              <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                <div className="space-y-1 w-11/12">
                  <div className="flex items-center gap-2">
                    <Badge variant="primary" className="bg-primary/10 text-primary border-primary/20">
                      Follow-up Question
                    </Badge>
                  </div>
                  <h4 className="text-base font-semibold text-text mt-2 font-display leading-snug">
                    {followUpQuestion}
                  </h4>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {isSpeakerSupported && (
                    <>
                      <Button
                        variant="ghost"
                        onClick={handleSpeaker}
                        className={`p-2 rounded-lg shrink-0 ${
                          isSpeaking ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:text-text'
                        }`}
                        title="Speak Follow-up"
                      >
                        {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </Button>
                      {isSpeaking && (
                        <Button
                          variant="ghost"
                          onClick={stopSpeaking}
                          className="p-2 rounded-lg text-text-secondary hover:text-red-405"
                          title="Stop Speaking"
                        >
                          <Square className="w-3.5 h-3.5 fill-current" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Follow-up Answer
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAnswer}
                    disabled={!followUpAnswer}
                    className="text-text-secondary hover:text-red-450 text-xs px-2 py-1 h-auto"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Clear Answer
                  </Button>
                </div>

                <div className="relative">
                  <textarea
                    className="w-full min-h-[110px] bg-card/60 border border-input-border rounded-xl p-4 text-sm text-text placeholder:text-text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-blue-500 transition-all duration-200 leading-relaxed resize-y"
                    placeholder="Type your answer to the follow-up question here, or click the mic to dictate..."
                    value={followUpAnswer}
                    onChange={(e) => setFollowUpAnswer(e.target.value)}
                  />
                  
                  <div className="absolute right-3 bottom-3 flex items-center gap-2">
                    {isListening && (
                      <div className="flex items-center gap-2.5 py-1.5 px-3 rounded-lg bg-primary/10 border border-primary/25 text-primary text-xs font-semibold select-none shadow-[0_0_12px_rgba(37,99,235,0.15)] animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                        <div className="flex items-end gap-0.75 h-3 shrink-0">
                          <motion.span animate={{ height: [4, 12, 4] }} transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut' }} className="w-0.5 bg-blue-400 rounded-full" />
                          <motion.span animate={{ height: [8, 4, 8] }} transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }} className="w-0.5 bg-blue-400 rounded-full" />
                          <motion.span animate={{ height: [2, 14, 2] }} transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }} className="w-0.5 bg-blue-400 rounded-full" />
                        </div>
                        <span>Listening...</span>
                      </div>
                    )}
                    
                    {isMicSupported && (
                      <Button
                        type="button"
                        variant={isListening ? 'danger' : 'outline'}
                        onClick={handleToggleRecording}
                        className="p-2 rounded-lg"
                        title={isListening ? 'Stop Recording' : 'Start Recording'}
                      >
                        {isListening ? (
                          <MicOff className="w-4 h-4 text-red-300" />
                        ) : (
                          <Mic className="w-4 h-4 text-primary" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
