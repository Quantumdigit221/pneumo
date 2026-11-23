import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, Loader2, X, Volume2, AlertCircle, Upload } from 'lucide-react';
import { startDictationSession, transcribeAudioBlob, DictationSession } from '../utils/audioRecorder';

export interface VoiceDictationButtonProps {
  value: string;
  onTranscript: (updatedText: string) => void;
  fieldName?: string;
  appendMode?: boolean;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  buttonText?: string;
  showStatusBanner?: boolean;
}

/**
 * Format oral French clinical voice punctuation commands
 * (ex: "toux persistante virgule expectorations purulentes à la ligne point")
 */
export function formatClinicalFrench(raw: string): string {
  if (!raw) return '';
  let text = raw;

  // Newlines & paragraphs
  text = text.replace(/\b(nouveau paragraphe|paragraphe suivant)\b/gi, '\n\n');
  text = text.replace(/\b(à la ligne|nouvelle ligne|retour chariot)\b/gi, '\n');

  // Punctuation marks
  text = text.replace(/\b(deux points)\b/gi, ':');
  text = text.replace(/\b(point virgule)\b/gi, ';');
  text = text.replace(/\b(point d'interrogation)\b/gi, '?');
  text = text.replace(/\b(point d'exclamation)\b/gi, '!');
  text = text.replace(/\b(point)\b/gi, '.');
  text = text.replace(/\b(virgule)\b/gi, ',');
  text = text.replace(/\b(tiret|trait d'union)\b/gi, '- ');
  text = text.replace(/\b(ouvrez les parenthèses|ouvrir la parenthèse)\b/gi, '(');
  text = text.replace(/\b(fermez les parenthèses|fermer la parenthèse)\b/gi, ')');
  text = text.replace(/\b(ouvrez les guillemets)\b/gi, '« ');
  text = text.replace(/\b(fermez les guillemets)\b/gi, ' »');

  // Fix spacing before punctuation (ex: "toux , expectorations" -> "toux, expectorations")
  text = text.replace(/\s+([.,;:!?])/g, '$1');

  // Ensure spacing after punctuation (ex: "toux,expectorations" -> "toux, expectorations")
  text = text.replace(/([.,;:!?])([^\s\d\n])/g, '$1 $2');

  // Capitalize sentence start or after dot/newline
  text = text.replace(/(^|[.\n]\s*)([a-zà-öø-ÿ])/g, (_, p1, p2) => p1 + p2.toUpperCase());

  return text.trim();
}

export const VoiceDictationButton: React.FC<VoiceDictationButtonProps> = ({
  value,
  onTranscript,
  fieldName = 'ce champ',
  appendMode = true,
  size = 'xs',
  className = '',
  buttonText = 'Dicter',
  showStatusBanner = true
}) => {
  const [status, setStatus] = useState<'IDLE' | 'REQUESTING_MIC' | 'RECORDING' | 'TRANSCRIBING'>('IDLE');
  const [seconds, setSeconds] = useState<number>(0);
  const [interimText, setInterimText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sessionRef = useRef<DictationSession | null>(null);
  const timerRef = useRef<any>(null);
  const nativeFileInputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef<string>(`vdb-${Math.random().toString(36).slice(2, 10)}`);
  const currentValueRef = useRef<string>(value);
  currentValueRef.current = value;
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  const commitFormattedText = useCallback((rawText: string) => {
    const formatted = formatClinicalFrench(rawText);
    if (!formatted || formatted.length === 0) return;

    if (appendMode && currentValueRef.current && currentValueRef.current.trim().length > 0) {
      const separator = currentValueRef.current.endsWith('\n') ? '' : ' ';
      onTranscriptRef.current(`${currentValueRef.current}${separator}${formatted}`);
    } else {
      onTranscriptRef.current(formatted);
    }
  }, [appendMode]);

  const handleStart = useCallback(async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setErrorMessage(null);
    setInterimText('');
    setSeconds(0);

    try {
      const session = await startDictationSession({
        context: `Dictée médicale pneumologie pour ${fieldName}`,
        fieldName,
        requestId: requestIdRef.current,
        onInterimText: (text) => {
          setInterimText(text);
        },
        onStatusChange: (newStatus) => {
          setStatus(newStatus);
          if (newStatus === 'RECORDING') {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
              setSeconds(prev => prev + 1);
            }, 1000);
          } else if (newStatus === 'IDLE') {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
          }
        },
        onError: (err) => {
          setErrorMessage(err);
        }
      });

      sessionRef.current = session;
    } catch (err: any) {
      console.warn('Voice Dictation start notice:', err);
      setStatus('IDLE');
      setErrorMessage(err?.message || "Accès micro restreint. Utilisez la capture native OS.");
    }
  }, [fieldName]);

  // Listen to modal fallback insertions (Native OS recording, Win+H / Fn x2 dictation, or preset) and retry triggers
  useEffect(() => {
    const handleInsertSample = (e: any) => {
      const detail = e?.detail;
      if (!detail?.text) return;
      if (detail.requestId === requestIdRef.current) {
        commitFormattedText(detail.text);
        setErrorMessage(null);
      }
    };

    const handleRetryMic = (e: any) => {
      if (e?.detail?.requestId === requestIdRef.current) {
        handleStart();
      }
    };

    window.addEventListener('insert-dictation-sample', handleInsertSample);
    window.addEventListener('retry-native-mic', handleRetryMic);
    return () => {
      window.removeEventListener('insert-dictation-sample', handleInsertSample);
      window.removeEventListener('retry-native-mic', handleRetryMic);
    };
  }, [commitFormattedText, handleStart]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (sessionRef.current) {
        try {
          sessionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  const handleStopAndCommit = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (sessionRef.current) {
      const activeSession = sessionRef.current;
      sessionRef.current = null;

      try {
        setStatus('TRANSCRIBING');
        const rawTranscript = await activeSession.stop();
        commitFormattedText(rawTranscript);
      } catch (err) {
        console.error('Stop dictation error:', err);
      } finally {
        setStatus('IDLE');
        setInterimText('');
        setSeconds(0);
      }
    } else {
      setStatus('IDLE');
    }
  };

  const handleCancel = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (sessionRef.current) {
      try {
        sessionRef.current.abort();
      } catch {}
      sessionRef.current = null;
    }
    setStatus('IDLE');
    setInterimText('');
    setSeconds(0);
  };

  const handleNativeFileCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setErrorMessage(null);
    setStatus('TRANSCRIBING');
    try {
      const rawTranscript = await transcribeAudioBlob(
        file,
        file.type || 'audio/mp4',
        `Dictée médicale native OS pour ${fieldName}`
      );
      if (rawTranscript) {
        commitFormattedText(rawTranscript);
      } else {
        setErrorMessage("Aucune parole audible détectée.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Erreur lors de la transcription audio.");
    } finally {
      setStatus('IDLE');
    }
  };

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Size styling
  const sizeClasses = {
    xs: 'text-[11px] px-2 py-1 gap-1',
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-3.5 py-2 gap-2'
  }[size];

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4'
  }[size];

  return (
    <div className={`inline-flex flex-col items-start gap-1 ${className}`}>
      <input
        ref={nativeFileInputRef}
        type="file"
        accept="audio/*"
        capture="microphone"
        onChange={handleNativeFileCapture}
        className="hidden"
      />

      {/* Active State / Trigger Button */}
      {status === 'IDLE' && (
        <button
          type="button"
          onClick={handleStart}
          title={`Dicter à la voix dans ${fieldName}`}
          className={`inline-flex items-center font-bold rounded-lg border border-teal-300 bg-teal-50/80 hover:bg-teal-100/90 text-teal-800 hover:text-teal-900 transition-all cursor-pointer shadow-2xs group ${sizeClasses}`}
        >
          <Mic className={`${iconSizes} text-teal-600 group-hover:scale-110 transition-transform`} />
          <span>{buttonText}</span>
          <span className="hidden sm:inline text-[9px] text-teal-600/80 font-normal">
            (Parlez &amp; dictez)
          </span>
        </button>
      )}

      {status === 'REQUESTING_MIC' && (
        <div className={`inline-flex items-center font-bold rounded-lg border border-amber-300 bg-amber-50 text-amber-800 ${sizeClasses}`}>
          <Loader2 className={`${iconSizes} animate-spin text-amber-600`} />
          <span>Activation micro...</span>
        </div>
      )}

      {status === 'RECORDING' && (
        <div className="inline-flex items-center gap-1.5 p-1 bg-rose-50 border border-rose-300 rounded-xl shadow-xs animate-fade-in">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white border border-rose-200">
            <span className="inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
            <span className="text-[10px] font-black text-rose-800 font-mono tabular-nums">
              {formatTimer(seconds)}
            </span>

            <div className="flex items-center gap-0.5 h-3">
              <span className="w-0.5 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.3s] h-3"></span>
              <span className="w-0.5 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.15s] h-2"></span>
              <span className="w-0.5 bg-rose-500 rounded-full animate-bounce h-3.5"></span>
              <span className="w-0.5 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.2s] h-2"></span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleStopAndCommit}
            className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xxs font-black transition cursor-pointer flex items-center gap-1 shadow-2xs"
            title="Arrêter et insérer la dictée"
          >
            <Square className="w-2.5 h-2.5 fill-current" />
            <span>Insérer</span>
          </button>

          <button
            type="button"
            onClick={handleCancel}
            className="p-1 hover:bg-rose-100 text-rose-500 rounded-lg text-xxs transition cursor-pointer"
            title="Annuler"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {status === 'TRANSCRIBING' && (
        <div className={`inline-flex items-center font-bold rounded-lg border border-teal-300 bg-teal-50 text-teal-800 ${sizeClasses}`}>
          <Loader2 className={`${iconSizes} animate-spin text-teal-600`} />
          <span>Transcription clinique...</span>
        </div>
      )}

      {/* Live Interim Transcript */}
      {status === 'RECORDING' && interimText && showStatusBanner && (
        <div className="max-w-md bg-white border border-rose-200 rounded-lg p-1.5 text-[10px] text-slate-700 font-medium shadow-xs italic flex items-center gap-1.5 animate-fade-in">
          <Volume2 className="w-3 h-3 text-rose-500 shrink-0" />
          <span className="truncate">« {interimText} »</span>
        </div>
      )}

      {/* Inline Native OS Fallback Bar when browser blocks live mic */}
      {errorMessage && status === 'IDLE' && (
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg animate-fade-in">
          <AlertCircle className="w-3 h-3 shrink-0 text-rose-600" />
          <span className="max-w-xs truncate">{errorMessage}</span>
          <button
            type="button"
            onClick={() => nativeFileInputRef.current?.click()}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-teal-700 hover:bg-teal-800 text-white rounded text-[9px] font-black transition cursor-pointer"
            title="Ouvrir l'enregistreur micro natif du système (contourne le blocage navigateur)"
          >
            <Upload className="w-2.5 h-2.5" />
            <span>Micro natif OS</span>
          </button>
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('microphone-permission-denied', {
                detail: { message: errorMessage, fieldName, requestId: requestIdRef.current }
              }));
            }}
            className="underline text-[9px] text-rose-900 hover:text-rose-700 cursor-pointer"
          >
            Options / Win+H
          </button>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-rose-700 cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export default VoiceDictationButton;

