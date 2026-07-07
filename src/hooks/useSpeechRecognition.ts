import { useState, useEffect, useRef } from 'react';

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [hasPermissionError, setHasPermissionError] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        let interim = '';
        let newlyFinalized = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptSegment = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            newlyFinalized += transcriptSegment;
          } else {
            interim += transcriptSegment;
          }
        }

        if (newlyFinalized) {
          setFinalTranscript((prev) => {
            const suffix = prev && !prev.endsWith(' ') ? ' ' : '';
            return prev + suffix + newlyFinalized.trim();
          });
        }
        setInterimTranscript(interim);
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setHasPermissionError(true);
        }
        if (event.error === 'no-speech') {
          // Soft error, no speech detected.
        } else {
          setIsListening(false);
        }
      };

      rec.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = rec;
    }
  }, []);

  const startListening = (initialText: string = '') => {
    if (!isSupported || !recognitionRef.current) return;
    setFinalTranscript(initialText);
    setInterimTranscript('');
    setHasPermissionError(false);
    setIsListening(true);
    try {
      recognitionRef.current.start();
    } catch (err) {
      console.warn('Error starting speech recognition:', err);
    }
  };

  const stopListening = () => {
    if (!isSupported || !recognitionRef.current) return;
    setIsListening(false);
    try {
      recognitionRef.current.stop();
    } catch (err) {
      console.warn('Error stopping speech recognition:', err);
    }
  };

  const resetTranscript = () => {
    setFinalTranscript('');
    setInterimTranscript('');
  };

  return {
    isListening,
    finalTranscript,
    interimTranscript,
    isSupported,
    hasPermissionError,
    startListening,
    stopListening,
    resetTranscript,
  };
}