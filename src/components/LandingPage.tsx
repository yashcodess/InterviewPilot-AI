import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Mic,
  Volume2,
  Award,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Code
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { AtsCard } from './AtsCard';

export function LandingPage() {
  const navigate = useNavigate();
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const features = [
    {
      icon: Sparkles,
      title: 'Gemini-Powered Intelligence',
      description: 'Generates contextually accurate technical questions and grades your answers with industry-grade metrics.'
    },
    {
      icon: Mic,
      title: 'Voice Recognition & Synthesis',
      description: 'Speak your answers naturally using browser Speech Recognition. Listen to questions read aloud by AI.'
    },
    {
      icon: Award,
      title: 'Interactive Skill Analytics',
      description: 'Visualize your scores on communication, technical execution, confidence, and completeness via custom radar charts.'
    },
    {
      icon: Code,
      title: 'AI Follow-up Interrogation',
      description: 'AI detects gaps in your answers and automatically generates relevant follow-up questions to challenge you.'
    },
    {
      icon: BookOpen,
      title: 'Dynamic Study Roadmaps',
      description: 'Receive a personalized, modular syllabus detailing exactly what topics to study next based on weaknesses.'
    },
    {
      icon: ShieldCheck,
      title: 'Client-Side Security',
      description: 'Your Gemini API key is stored securely inside your browser local storage. No tracking, 100% private.'
    }
  ];

  const faqs = [
    {
      question: 'How do I obtain a Gemini API key?',
      answer: 'You can get a free API key by visiting Google AI Studio (aistudio.google.com). Sign in with your Google account, click "Get API Key", copy it, and paste it into the Settings tab.'
    },
    {
      question: 'Are my transcripts or API keys saved on external servers?',
      answer: 'No. InterviewPilot AI operates fully client-side. Your API key and past interview history are stored exclusively in your browser localStorage. No data is sent to any external server except Google Gemini endpoints.'
    },
    {
      question: 'Can I practice behavioral interviews too?',
      answer: 'Yes! While configuring your session, you can select categories such as Technical, Behavioral, HR, System Design, or Aptitude to test different dimensions of your skill set.'
    },
    {
      question: 'Does the voice feature work on mobile browsers?',
      answer: 'Yes, browser-native Speech Recognition and Speech Synthesis are widely supported in modern mobile browsers like Chrome and Safari.'
    }
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Background decoration elements */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] radial-glow opacity-30 pointer-events-none -z-10" />
      <div className="absolute top-[600px] left-1/3 w-[300px] h-[300px] radial-glow-blue opacity-25 pointer-events-none -z-10" />

      {/* Grid Pattern overlays */}
      <div className="absolute inset-0 grid-bg opacity-30 -z-20 pointer-events-none" />

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto pt-16 pb-20 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-1.5 px-3 py-1.25 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-semibold text-primary tracking-wider uppercase mb-6"
        >
          <Sparkles className="w-3.5 h-3.5 animate-pulse text-primary" /> Introducing InterviewPilot AI
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-4xl sm:text-6xl font-extrabold font-display tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-text-bright via-text-bright to-primary max-w-3xl mx-auto leading-tight"
        >
          Perfect Your Mock Interviews with InterviewPilot AI
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-base sm:text-lg text-text-secondary mt-6 max-w-xl mx-auto leading-relaxed"
        >
          An AI-Powered Mock Interview Platform. Practice tailored sessions with voice recognition, real-time feedback, and dynamic follow-up prompts.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-10 flex flex-col sm:flex-row justify-center gap-4"
        >
          <Button onClick={() => navigate('/setup')} size="lg" className="flex items-center gap-2 font-semibold">
            Start Mock Session <ArrowRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate('/settings')} className="flex items-center gap-2">
            Configure API Key
          </Button>
        </motion.div>

        {/* Premium Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.85 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="mt-8 flex flex-wrap justify-center items-center gap-6 text-xs text-text-secondary font-medium"
        >
          <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-primary" /> AI Powered</span>
          <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-primary" /> Voice Enabled</span>
          <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-primary" /> Instant Feedback</span>
        </motion.div>

        {/* Premium Browser Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-16 relative mx-auto max-w-4xl rounded-2xl border border-border/80 bg-card/25 p-2.5 shadow-2xl backdrop-blur-sm no-print"
        >
          {/* Browser Container */}
          <div className="rounded-xl border border-border/90 bg-background/90 overflow-hidden flex flex-col min-h-[420px] relative text-left">
            {/* Browser Header Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-card/60 border-b border-input-border/60">
              {/* Window Dots */}
              <div className="flex gap-1.5 shrink-0">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              {/* Address bar */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-background/60 border border-input-border/40 text-[10px] text-text-secondary w-full max-w-md mx-4 font-mono select-none">
                <svg className="w-3.5 h-3.5 text-text-secondary fill-current" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9v3H4c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-6c0-1.1-.9-2-2-2h-1V9c0-3.87-3.13-7-7-7zm5 10H7V9c0-2.76 2.24-5 5-5s5 2.24 5 5v3z"/></svg>
                interviewpilot.ai/mock/session-8a3b
              </div>
              {/* Menu dots */}
              <div className="flex gap-1 shrink-0">
                <span className="w-1 h-1 rounded-full bg-slate-500" />
                <span className="w-1 h-1 rounded-full bg-slate-500" />
                <span className="w-1 h-1 rounded-full bg-slate-500" />
              </div>
            </div>

            {/* Browser Inside Workspace */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border/60 p-5 gap-5">
              {/* Left sidebar: Session progress */}
              <div className="hidden md:block col-span-1 space-y-4 pr-1">
                <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest block">Progress</span>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 rounded bg-card/30 text-xs text-text-secondary font-medium">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500 flex items-center justify-center text-[9px] text-emerald-400 font-bold">1</span>
                    <span>Self Introduction</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-card/60 text-xs text-text-bright font-semibold border border-primary/25">
                    <span className="w-4 h-4 rounded-full bg-primary/10 border border-primary flex items-center justify-center text-[9px] text-primary font-bold">2</span>
                    <span>React Virtual DOM</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-background text-xs text-text-secondary font-medium opacity-60">
                    <span className="w-4 h-4 rounded-full border border-border flex items-center justify-center text-[9px] font-bold">3</span>
                    <span>State vs Props</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-background text-xs text-text-secondary font-medium opacity-60">
                    <span className="w-4 h-4 rounded-full border border-border flex items-center justify-center text-[9px] font-bold">4</span>
                    <span>Hooks lifecycle</span>
                  </div>
                </div>
              </div>

              {/* Main Room panel */}
              <div className="col-span-1 md:col-span-3 space-y-5 md:pl-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs text-text-secondary">
                    <span className="flex items-center gap-1.5 font-medium"><Mic className="w-3.5 h-3.5 text-primary animate-pulse" /> Live Speech dictation</span>
                    <span className="font-mono bg-card px-2 py-0.5 rounded text-[10px]">Timer: 112s</span>
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-primary uppercase tracking-widest">Question 2</span>
                    <h3 className="text-base font-semibold text-text-bright leading-snug">
                      What are the primary differences between the Virtual DOM and the Shadow DOM in web development?
                    </h3>
                  </div>

                  <div className="h-24 bg-card/30 border border-input-border/50 rounded-lg p-3 text-xs text-text-secondary font-mono leading-relaxed select-none">
                    The Virtual DOM is a lightweight React-specific memory representation of the real DOM.
                    It computes diffs to apply targeted UI updates. The Shadow DOM, on the other hand, is a browser-native
                    web component standard used to encapsulate styles...
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-4 border-t border-border/60">
                  <Badge variant="primary">Frontend Developer</Badge>
                  
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    {/* Simulated Voice wave */}
                    <div className="flex items-center gap-1 py-1 px-2.5 rounded bg-primary/10 border border-primary/20">
                      <span className="w-1.5 h-3 rounded-full bg-primary animate-pulse" />
                      <span className="w-1.5 h-4.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.1s' }} />
                      <span className="w-1.5 h-2.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <span className="text-[10px] text-primary font-bold uppercase tracking-wider ml-1">Analyzing Voice</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="max-w-5xl mx-auto py-16 px-4 border-t border-border/60 no-print">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: '20+', label: 'Job Roles' },
            { value: '5', label: 'Interview Categories' },
            { value: 'Voice', label: 'Recognition' },
            { value: 'AI', label: 'Evaluation' },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="space-y-1.5 p-5 rounded-xl glass border border-border/40"
            >
              <h4 className="text-3xl font-extrabold font-display tracking-tight text-primary">
                {stat.value}
              </h4>
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Feature grid Section */}
      <section className="border-t border-border bg-background/20 py-20 px-4">
        <div className="max-w-5xl mx-auto animate-fade-in">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold font-display tracking-tight text-text-bright">Packed with Premium Features</h2>
            <p className="text-sm text-text-secondary mt-2 max-w-sm mx-auto">Everything you need to perfect your verbal reasoning and land developer roles.</p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.08
                }
              }
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={idx}
                  variants={{
                    hidden: { opacity: 0, y: 15 },
                    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
                  }}
                >
                  <Card className="h-full hover:border-border/90 transition-all duration-300">
                    <CardHeader>
                      <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
                        <Icon className="w-5 h-5" />
                      </div>
                      <CardTitle className="text-base">{feat.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-text-secondary leading-relaxed">{feat.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 15 },
                show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
              }}
            >
              <AtsCard />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-t border-border py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold font-display tracking-tight text-text-bright">Frequently Asked Questions</h2>
            <p className="text-sm text-text-secondary mt-2">Answers to common inquiries regarding keys, browsers, and usage limits.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <Card key={idx} className="cursor-pointer overflow-hidden hover:border-border/80 transition-colors" onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}>
                <CardHeader className="flex flex-row items-center justify-between pb-2 mb-0 select-none">
                  <CardTitle className="text-sm text-text">{faq.question}</CardTitle>
                  <HelpCircle className={`w-4 h-4 text-text-secondary transition-transform ${faqOpen === idx ? 'rotate-180 text-primary' : ''}`} />
                </CardHeader>
                <AnimatePresence initial={false}>
                  {faqOpen === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <CardContent className="mt-2 border-t border-border/60 pt-4">
                        <p className="text-xs text-text-secondary leading-relaxed">{faq.answer}</p>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}