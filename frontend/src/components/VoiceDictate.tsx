'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface VoiceDictateProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}

function WaveformBars({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-0.5 h-5">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-all duration-100 ${
            active ? 'bg-teal-400 animate-pulse' : 'bg-slate-600'
          }`}
          style={{
            height: active ? `${Math.random() * 16 + 4}px` : '4px',
            animationDelay: active ? `${i * 0.1}s` : '0s',
          }}
        />
      ))}
    </div>
  );
}

export default function VoiceDictate({
  value,
  onChange,
  placeholder,
  className = '',
  rows = 4,
}: VoiceDictateProps) {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');

  const isSupported =
    typeof window !== 'undefined' &&
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      finalTranscriptRef.current = value;
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      if (final) {
        finalTranscriptRef.current += final;
        onChange(finalTranscriptRef.current);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Check browser permissions.');
      } else if (event.error === 'no-speech') {
        setError('No speech detected. Try speaking louder.');
      } else if (event.error === 'network') {
        setError('Network error. Check your connection.');
      } else {
        setError(`Speech error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [isSupported, onChange, value]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setInterimTranscript('');
    } else {
      finalTranscriptRef.current = value;
      recognitionRef.current.start();
    }
  }, [isListening, value]);

  return (
    <div className="relative">
      <textarea
        value={value + interimTranscript}
        onChange={(e) => {
          onChange(e.target.value);
          setInterimTranscript('');
        }}
        placeholder={placeholder}
        rows={rows}
        className={`${className}`}
      />

      {/* Mic button and status */}
      <div className="absolute bottom-2 right-2 flex items-center gap-2">
        {isListening && (
          <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-slate-900/80 border border-slate-700">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-red-500 animate-ping" />
            </div>
            <WaveformBars active={true} />
            <span className="text-xs text-slate-300">Listening</span>
          </div>
        )}

        <button
          type="button"
          onClick={toggleListening}
          disabled={!isSupported}
          className={`p-2 rounded-lg transition-all ${
            isListening
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
              : 'bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 border border-teal-500/20'
          } ${!isSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isSupported ? 'Click to dictate notes' : 'Voice dictation requires Chrome or Edge'}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="absolute -top-8 left-0 right-0 flex items-center gap-1.5 text-xs text-red-400 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-red-500/20">
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}

      {/* Browser not supported message */}
      {!isSupported && !error && (
        <div className="absolute -top-8 left-0 right-0 text-xs text-slate-500 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-700">
          Voice dictation works in Chrome and Edge
        </div>
      )}
    </div>
  );
}
