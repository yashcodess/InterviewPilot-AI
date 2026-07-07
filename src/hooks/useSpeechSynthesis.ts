import { useState, useEffect, useCallback } from 'react';

export function useSpeechSynthesis() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setIsSupported(true);
      const getVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
        // Default to a premium-sounding English voice if available, else standard
        const defaultVoice =
          availableVoices.find((v) => v.name.includes('Google US English') || v.name.includes('Natural')) ||
          availableVoices.find((v) => v.lang.startsWith('en-')) ||
          availableVoices[0] ||
          null;
        setSelectedVoice(defaultVoice);
      };

      getVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = getVoices;
      }
    }
  }, []);

  const speak = useCallback((text: string, options?: { rate?: number; voiceGender?: 'male' | 'female' | 'default' }) => {
    if (!isSupported) return;
    
    // Stop any ongoing speech first
    window.speechSynthesis.cancel();

    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    
    if (options?.rate) {
      utterance.rate = options.rate;
    }

    let voiceToUse = selectedVoice;
    if (options?.voiceGender && options.voiceGender !== 'default') {
      const isMalePref = options.voiceGender === 'male';
      const genderVoice = voices.find(v => {
        const nameLower = v.name.toLowerCase();
        if (isMalePref) {
          return nameLower.includes('male') || nameLower.includes('david') || nameLower.includes('guy') || nameLower.includes('microsoft mark') || nameLower.includes('google us english');
        } else {
          return nameLower.includes('female') || nameLower.includes('zira') || nameLower.includes('hazel') || nameLower.includes('susan') || nameLower.includes('aria') || nameLower.includes('google uk english female');
        }
      });
      if (genderVoice) {
        voiceToUse = genderVoice;
      }
    }

    if (voiceToUse) {
      utterance.voice = voiceToUse;
    }
    
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = (e) => {
      console.error('SpeechSynthesis error:', e);
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [isSupported, selectedVoice, voices]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  }, [isSupported]);

  return {
    isPlaying,
    isSupported,
    voices,
    selectedVoice,
    setSelectedVoice,
    speak,
    stop,
  };
}