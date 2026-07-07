import React, { createContext, useContext, useState, useEffect } from 'react';

export type SpeakingSpeed = 'slow' | 'normal' | 'fast';
export type AppTheme = 'dark' | 'light' | 'system';
export type VoicePreference = 'male' | 'female' | 'default';

export interface SettingsPreferences {
  speakingSpeed: SpeakingSpeed;
  voice: VoicePreference;
  theme: AppTheme;
  defaultDuration: number;
  defaultQuestionsCount: number;
  autoPlayVoice: boolean;
  autoSubmitSpeech: boolean;
}

export const DEFAULT_PREFERENCES: SettingsPreferences = {
  speakingSpeed: 'normal',
  voice: 'default',
  theme: 'dark',
  defaultDuration: 120,
  defaultQuestionsCount: 5,
  autoPlayVoice: true,
  autoSubmitSpeech: false
};

interface SettingsContextType {
  preferences: SettingsPreferences;
  updatePreferences: (prefs: Partial<SettingsPreferences>) => void;
  resetToDefault: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<SettingsPreferences>(() => {
    const saved = localStorage.getItem('interviewpilot_preferences');
    if (saved) {
      try {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_PREFERENCES;
      }
    }
    return DEFAULT_PREFERENCES;
  });

  useEffect(() => {
    localStorage.setItem('interviewpilot_preferences', JSON.stringify(preferences));
    applyTheme(preferences.theme);
  }, [preferences]);

  const applyTheme = (theme: AppTheme) => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else if (theme === 'dark') {
      root.classList.remove('light');
    } else {
      const systemIsLight = window.matchMedia('(prefers-color-scheme: light)').matches;
      if (systemIsLight) {
        root.classList.add('light');
      } else {
        root.classList.remove('light');
      }
    }
  };

  // Listen to system theme changes if theme is set to 'system'
  useEffect(() => {
    if (preferences.theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = (e: MediaQueryListEvent) => {
      const root = document.documentElement;
      if (e.matches) {
        root.classList.add('light');
      } else {
        root.classList.remove('light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [preferences.theme]);

  const updatePreferences = (prefs: Partial<SettingsPreferences>) => {
    setPreferences(prev => ({ ...prev, ...prefs }));
  };

  const resetToDefault = () => {
    setPreferences(DEFAULT_PREFERENCES);
  };

  return (
    <SettingsContext.Provider value={{ preferences, updatePreferences, resetToDefault }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
