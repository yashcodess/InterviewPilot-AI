import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Key,
  Moon,
  Sun,
  Trash2,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  RotateCw,
  Download,
  Upload,
  Info,
  AlertTriangle,
  Volume2,
  Sliders
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { validateApiKey } from '../services/gemini';
import { useSettings } from '../contexts/SettingsContext';

interface SettingsProps {
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  onClearHistory: () => void;
}

type ConnectionStatus = 
  | 'unchecked' 
  | 'checking' 
  | 'connected' 
  | 'invalid_key' 
  | 'permission_denied' 
  | 'quota_exhausted' 
  | 'service_unavailable' 
  | 'offline';

export function Settings({ apiKey, onSaveApiKey, onClearHistory }: SettingsProps) {
  const { preferences, updatePreferences, resetToDefault } = useSettings();

  const [toastMsg, setToastMsg] = useState('');
  
  // Local preference states for editing
  const [prefTheme, setPrefTheme] = useState(preferences.theme);
  const [prefSpeed, setPrefSpeed] = useState(preferences.speakingSpeed);
  const [prefVoice, setPrefVoice] = useState(preferences.voice);
  const [prefDuration, setPrefDuration] = useState(preferences.defaultDuration);
  const [prefCount, setPrefCount] = useState(preferences.defaultQuestionsCount);
  const [prefAutoPlay, setPrefAutoPlay] = useState(preferences.autoPlayVoice);
  const [prefAutoSubmit, setPrefAutoSubmit] = useState(preferences.autoSubmitSpeech);

  // Sync states if preferences changes from context (e.g. on reset)
  useEffect(() => {
    setPrefTheme(preferences.theme);
    setPrefSpeed(preferences.speakingSpeed);
    setPrefVoice(preferences.voice);
    setPrefDuration(preferences.defaultDuration);
    setPrefCount(preferences.defaultQuestionsCount);
    setPrefAutoPlay(preferences.autoPlayVoice);
    setPrefAutoSubmit(preferences.autoSubmitSpeech);
  }, [preferences]);

  const handleSavePrefs = () => {
    updatePreferences({
      theme: prefTheme,
      speakingSpeed: prefSpeed,
      voice: prefVoice,
      defaultDuration: prefDuration,
      defaultQuestionsCount: prefCount,
      autoPlayVoice: prefAutoPlay,
      autoSubmitSpeech: prefAutoSubmit,
    });
    setToastMsg('Preferences saved successfully!');
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleResetPrefs = () => {
    resetToDefault();
    setToastMsg('Reset to default configurations.');
    setTimeout(() => setToastMsg(''), 3000);
  };

  const [keyInput, setKeyInput] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return !document.documentElement.classList.contains('light');
  });
  const [isSaved, setIsSaved] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('unchecked');
  const [isValidating, setIsValidating] = useState(false);
  const [voiceReadingEnabled, setVoiceReadingEnabled] = useState(() => {
    return window.localStorage.getItem('interviewpilot_voice_reading_enabled') !== 'false';
  });
  const [lastValidatedKey, setLastValidatedKey] = useState('');

  useEffect(() => {
    setKeyInput(apiKey);
    if (apiKey) {
      const cache = window.localStorage.getItem('interviewpilot_api_validation_cache');
      if (cache) {
        try {
          const parsed = JSON.parse(cache);
          if (parsed.key === apiKey) {
            setConnectionStatus(parsed.connectionStatus);
            setLastValidatedKey(apiKey);
            return;
          }
        } catch (e) {
          console.warn('Failed to parse validation cache', e);
        }
      }
      handleValidate(apiKey);
    }
  }, [apiKey]);

  const handleValidate = async (keyToCheck: string) => {
    if (!keyToCheck.trim()) {
      setConnectionStatus('unchecked');
      setLastValidatedKey('');
      return;
    }
    setIsValidating(true);
    setConnectionStatus('checking');
    const result = await validateApiKey(keyToCheck.trim());
    
    let statusToSet: 'connected' | 'invalid_key' | 'permission_denied' | 'quota_exhausted' | 'service_unavailable' | 'offline' = 'invalid_key';
    if (result.valid) {
      statusToSet = 'connected';
      setConnectionStatus('connected');
      setLastValidatedKey(keyToCheck.trim());
    } else {
      setLastValidatedKey('');
      if (result.reason === 'OFFLINE') {
        statusToSet = 'offline';
        setConnectionStatus('offline');
      } else if (result.status === 401) {
        statusToSet = 'invalid_key';
        setConnectionStatus('invalid_key');
      } else if (result.status === 403) {
        statusToSet = 'permission_denied';
        setConnectionStatus('permission_denied');
      } else if (result.status === 429) {
        statusToSet = 'quota_exhausted';
        setConnectionStatus('quota_exhausted');
      } else if (result.status === 503) {
        statusToSet = 'service_unavailable';
        setConnectionStatus('service_unavailable');
      } else {
        statusToSet = 'invalid_key';
        setConnectionStatus('invalid_key');
      }
    }
    
    // Save to cache
    window.localStorage.setItem('interviewpilot_api_validation_cache', JSON.stringify({
      key: keyToCheck.trim(),
      connectionStatus: statusToSet
    }));
    
    setIsValidating(false);
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveApiKey(keyInput.trim());
    setIsSaved(true);
    handleValidate(keyInput.trim());
    setTimeout(() => setIsSaved(false), 3000);
  };

  const toggleTheme = () => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.remove('dark');
      html.classList.add('light');
      window.localStorage.setItem('interviewpilot_theme', 'light');
      setIsDarkMode(false);
    } else {
      html.classList.remove('light');
      html.classList.add('dark');
      window.localStorage.setItem('interviewpilot_theme', 'dark');
      setIsDarkMode(true);
    }
  };

  const handleClearHistoryClick = () => {
    if (window.confirm('Are you sure you want to permanently clear your mock interview history? This action cannot be undone.')) {
      onClearHistory();
      alert('Interview history cleared successfully.');
    }
  };

  const handleClearCache = () => {
    if (window.confirm('Are you sure you want to clear active draft sessions? Your completed interview history will be preserved.')) {
      window.localStorage.removeItem('interviewpilot_active_session');
      alert('Application session cache cleared successfully.');
    }
  };

  const handleExportData = () => {
    const data = {
      apiKey: window.localStorage.getItem('interviewpilot_api_key') || '',
      history: JSON.parse(window.localStorage.getItem('interviewpilot_history') || '[]'),
      activeRecord: JSON.parse(window.localStorage.getItem('interviewpilot_active_record') || 'null'),
      theme: window.localStorage.getItem('interviewpilot_theme') || 'dark',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `InterviewPilot_Data_Export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.apiKey !== undefined) {
          onSaveApiKey(parsed.apiKey);
          setKeyInput(parsed.apiKey);
        }
        if (Array.isArray(parsed.history)) {
          window.localStorage.setItem('interviewpilot_history', JSON.stringify(parsed.history));
          window.localStorage.setItem('interviewpilot_theme', parsed.theme || 'dark');
          if (parsed.activeRecord) {
            window.localStorage.setItem('interviewpilot_active_record', JSON.stringify(parsed.activeRecord));
          }
          alert('Backup data successfully imported! The application will now reload.');
          window.location.reload();
        } else {
          alert('Invalid import format. Could not find history array.');
        }
      } catch (err) {
        alert('Failed to parse import file. Make sure it is a valid JSON backup.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="max-w-2xl mx-auto py-8 px-4"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display tracking-tight text-text-bright">Settings</h1>
        <p className="text-sm text-text-secondary mt-1">Configure your personal preferences, Gemini API keys, and local records.</p>
      </div>

      <div className="space-y-6">
        {/* API Key Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-primary">
              <Key className="w-5 h-5" />
              <CardTitle>Gemini API Key</CardTitle>
            </div>
            <CardDescription>
              Your API key is stored securely in your browser's LocalStorage and is only used to connect to Google's Gemini servers directly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveKey} className="space-y-5">
              <div className="relative">
                <Input
                  type={showKey ? 'text' : 'password'}
                  placeholder="Enter your Gemini API Key..."
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-3 text-text-secondary hover:text-slate-350 cursor-pointer"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* API Validation and Connection Status indicators */}
              <div className="p-4 rounded-xl bg-card/40 border border-input-border/60 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
                    Connection Status
                  </span>
                  
                  {connectionStatus === 'unchecked' && (
                    <div className="inline-flex items-center gap-1.5 text-xs text-text-secondary font-medium select-none">
                      <span className="w-2 h-2 rounded-full bg-slate-600" />
                      <span>Validation Pending</span>
                    </div>
                  )}
                  {connectionStatus === 'checking' && (
                    <div className="inline-flex items-center gap-1.5 text-xs text-primary font-medium select-none animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                      <span>Verifying Google AI Studio key...</span>
                    </div>
                  )}
                  {connectionStatus === 'connected' && (
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.75 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Active Connection Established
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed font-mono">
                        Model: gemini-2.5-flash
                      </p>
                    </div>
                  )}
                  {connectionStatus === 'invalid_key' && (
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.75 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Invalid API Key
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        The API key is incorrect or has been deleted. Please enter a valid Gemini API key.
                      </p>
                    </div>
                  )}
                  {connectionStatus === 'permission_denied' && (
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.75 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        Permission Denied
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        This API key does not have permission to access the Gemini API.
                      </p>
                    </div>
                  )}
                  {connectionStatus === 'quota_exhausted' && (
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.75 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                        Daily Quota Exhausted
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        Your API key is valid, but the free Gemini API request limit has been reached for today. Please wait for the quota to reset or use another Google AI Studio project.
                      </p>
                    </div>
                  )}
                  {connectionStatus === 'service_unavailable' && (
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.75 bg-red-950/40 border border-red-800/50 text-red-300 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        Service Unavailable
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        Google's Gemini servers are temporarily busy. Please try again in a few moments.
                      </p>
                    </div>
                  )}
                  {connectionStatus === 'offline' && (
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.75 bg-card border border-border text-text-secondary rounded-full text-[10px] font-bold uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                        Offline
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        Please check your internet connection and try again.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-900/60">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleValidate(keyInput)}
                    disabled={isValidating || !keyInput}
                    className="text-xs flex items-center gap-1.5 self-center"
                  >
                    {isValidating ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        Validating...
                      </>
                    ) : (keyInput.trim() === lastValidatedKey && connectionStatus === 'connected') ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Connected ✓
                      </>
                    ) : (
                      <>
                        <RotateCw className="w-3.5 h-3.5" />
                        Test Connection
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 pt-3.5 border-t border-slate-900/60 text-xs text-text-secondary font-medium">
                <div className="flex items-center gap-1.75">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Stored only in your browser</span>
                </div>
                <div className="flex items-center gap-1.75">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Never uploaded to our servers</span>
                </div>
                <div className="flex items-center gap-1.75">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>You control Gemini API usage</span>
                </div>
                <div className="flex items-center gap-1.75">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Privacy First Design</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <a
                  href="https://aistudio.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  Get a free Gemini API key →
                </a>
                
                <div className="flex items-center gap-3">
                  {isSaved && (
                    <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium animate-pulse">
                      <ShieldCheck className="w-3.5 h-3.5" /> Key Saved
                    </span>
                  )}
                  <Button type="submit" size="sm">
                    Save Key
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Theme Preferences with Visual Card Previews */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-primary">
              {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              <CardTitle>App Theme</CardTitle>
            </div>
            <CardDescription>
              Toggle between dark mode (recommended for coding interfaces) and light mode.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mt-2 select-none">
              {/* Dark Mode preview */}
              <div
                onClick={() => { if (!isDarkMode) toggleTheme(); }}
                className={`cursor-pointer rounded-xl p-4 border transition-all flex flex-col gap-3 bg-background ${
                  isDarkMode ? 'border-primary ring-1 ring-primary shadow-md shadow-primary/5' : 'border-border hover:border-border'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-text-bright">Dark Theme</span>
                  {isDarkMode && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <div className="space-y-1.5 opacity-60">
                  <div className="h-3 bg-card border border-border rounded w-full" />
                  <div className="h-3 bg-card border border-border rounded w-2/3" />
                </div>
              </div>

              {/* Light Mode preview */}
              <div
                onClick={() => { if (isDarkMode) toggleTheme(); }}
                className={`cursor-pointer rounded-xl p-4 border transition-all flex flex-col gap-3 bg-[#F5F7FB] ${
                  !isDarkMode ? 'border-primary ring-1 ring-primary shadow-md shadow-primary/5' : 'border-border hover:border-border'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-900">Light Theme</span>
                  {!isDarkMode && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <div className="space-y-1.5 opacity-65">
                  <div className="h-3 bg-white border border-slate-200 rounded w-full" />
                  <div className="h-3 bg-white border border-slate-200 rounded w-2/3" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interview Preferences Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-primary">
              <Sliders className="w-5 h-5" />
              <CardTitle>Interview Preferences</CardTitle>
            </div>
            <CardDescription>
              Configure default voice settings, timer durations, question count defaults, and auto-navigation behavior.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Theme, Duration, Question count grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text">Theme Preference</label>
                <select
                  value={prefTheme}
                  onChange={(e) => setPrefTheme(e.target.value as any)}
                  className="w-full text-sm bg-card border border-border/80 rounded-lg px-3 py-2 text-text-bright focus:outline-none focus:border-primary"
                >
                  <option value="dark">Dark Theme</option>
                  <option value="light">Light Theme</option>
                  <option value="system">System Preference</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text">Default Voice Speed</label>
                <select
                  value={prefSpeed}
                  onChange={(e) => setPrefSpeed(e.target.value as any)}
                  className="w-full text-sm bg-card border border-border/80 rounded-lg px-3 py-2 text-text-bright focus:outline-none focus:border-primary"
                >
                  <option value="slow">Slow</option>
                  <option value="normal">Normal</option>
                  <option value="fast">Fast</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text">Voice Gender Preference</label>
                <select
                  value={prefVoice}
                  onChange={(e) => setPrefVoice(e.target.value as any)}
                  className="w-full text-sm bg-card border border-border/80 rounded-lg px-3 py-2 text-text-bright focus:outline-none focus:border-primary"
                >
                  <option value="default">Default System Voice</option>
                  <option value="male">Male Voice</option>
                  <option value="female">Female Voice</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text">Default Question Timer (seconds)</label>
                <Input
                  type="number"
                  min="30"
                  max="600"
                  value={prefDuration}
                  onChange={(e) => setPrefDuration(Number(e.target.value))}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-text">Default Questions per Interview</label>
                <select
                  value={prefCount}
                  onChange={(e) => setPrefCount(Number(e.target.value))}
                  className="w-full text-sm bg-card border border-border/80 rounded-lg px-3 py-2 text-text-bright focus:outline-none focus:border-primary"
                >
                  <option value="5">Beginner Flow (5 questions)</option>
                  <option value="7">Intermediate Flow (7 questions)</option>
                  <option value="10">Advanced Flow (10 questions)</option>
                </select>
              </div>
            </div>

            {/* Checkbox settings */}
            <div className="space-y-4 pt-2 border-t border-border/40">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-text">Auto Play AI Voice</span>
                  <span className="text-xs text-text-secondary">Read questions aloud automatically when they load.</span>
                </div>
                <input
                  type="checkbox"
                  checked={prefAutoPlay}
                  onChange={(e) => setPrefAutoPlay(e.target.checked)}
                  className="w-4 h-4 rounded border-border bg-card text-primary focus:ring-blue-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-text">Auto Submit After Speech</span>
                  <span className="text-xs text-text-secondary">Automatically advance to the next step when you stop speaking.</span>
                </div>
                <input
                  type="checkbox"
                  checked={prefAutoSubmit}
                  onChange={(e) => setPrefAutoSubmit(e.target.checked)}
                  className="w-4 h-4 rounded border-border bg-card text-primary focus:ring-blue-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Save and Reset buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-border/40">
              <Button variant="secondary" size="sm" onClick={handleResetPrefs} className="text-text-secondary border-border/80">
                Reset to Defaults
              </Button>
              <Button size="sm" onClick={handleSavePrefs} className="flex items-center gap-1.5">
                Save Preferences
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data backup export import */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-primary">
              <Download className="w-5 h-5" />
              <CardTitle>Backup & Portability</CardTitle>
            </div>
            <CardDescription>
              Export settings and completed history records to a file, or restore from a previous backup.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-4">
            <Button variant="secondary" size="sm" onClick={handleExportData} className="flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" />
              Export Data JSON
            </Button>
            
            <label className="inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 bg-slate-800 hover:bg-slate-700 text-text-bright border border-border/80 px-3.5 py-2 text-xs cursor-pointer active:scale-97 hover:scale-[1.015] hover:-translate-y-0.5">
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              Import Data JSON
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
              />
            </label>
          </CardContent>
        </Card>

        {/* Data Management Danger Zone */}
        <Card className="border-red-950/45 bg-red-950/5">
          <CardHeader>
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <CardTitle className="text-red-200">Danger Zone</CardTitle>
            </div>
            <CardDescription>
              Permanently clear application local state history, mock transcripts, and learning guides.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 py-2 border-b border-red-950/20">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-text">Clear Application Cache</span>
                <span className="text-[10px] text-text-secondary">Deletes current mock draft sessions but preserves scorecard history.</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleClearCache} className="text-rose-300 hover:bg-rose-950/20 border-rose-950/40 shrink-0 self-start sm:self-center">
                Clear Session Cache
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 py-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-text">Reset Local History</span>
                <span className="text-[10px] text-text-secondary">Permanently clears all mock records and evaluation roadmaps.</span>
              </div>
              <Button variant="danger" size="sm" onClick={handleClearHistoryClick} className="shrink-0 self-start sm:self-center">
                Reset Local History
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Version and engine information footer */}
      <div className="mt-10 py-6 border-t border-slate-900/60 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-text-secondary select-none">
        <div className="flex items-center gap-1.5">
          <Info className="w-4 h-4 text-text-secondary" />
          <span>InterviewPilot AI Engine v1.2.4</span>
        </div>
        <div className="flex gap-4 font-mono text-[10px] text-text-secondary">
          <span>Channel: Production Stable</span>
          <span>SDK: @google/genai</span>
        </div>
      </div>
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-emerald-500/40 text-emerald-400 px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 text-sm font-semibold animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-bounce" />
          <span>{toastMsg}</span>
        </div>
      )}
    </motion.div>
  );
}