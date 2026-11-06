import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Square, Loader2, Check, X, Volume2, AlertCircle } from 'lucide-react';
import { startDictationSession, DictationSession } from '../utils/audioRecorder';

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
  const currentValueRef = useRef<string>(value);
  currentValueRef.current = value;

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

  const handleStart = async (e?: React.MouseEvent) => {
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
          setTimeout(() => setErrorMessage(null), 5000);
        }
      });

      sessionRef.current = session;
    } catch (err: any) {
      console.warn('Voice Dictation start error:', err);
      setStatus('IDLE');
      setErrorMessage(err?.message || "Accès micro refusé. Autorisez le micro (cadenas 🔒).");
      setTimeout(() => setErrorMessage(null), 7000);
    }
  };

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
        const formatted = formatClinicalFrench(rawTranscript);

        if (formatted && formatted.length > 0) {
          if (appendMode && currentValueRef.current && currentValueRef.current.trim().length > 0) {
            const separator = currentValueRef.current.endsWith('\n') ? '' : currentValueRef.current.endsWith('.') ? ' ' : ' ';
            onTranscript(`${currentValueRef.current}${separator}${formatted}`);
          } else {
            onTranscript(formatted);
          }
        }
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
      {/* Active State / Trigger Button */}
      {status === 'IDLE' && (
        <button
          type="button"
          onClick={handleStart}
          title={`Dicter à la voix dans ${fieldName} (gain de temps)`}
          className={`inline-flex items-center font-bold rounded-lg border border-teal-300 bg-teal-50/80 hover:bg-teal-100/90 text-teal-800 hover:text-teal-900 transition-all cursor-pointer shadow-2xs group ${sizeClasses}`}
        >
          <Mic className={`${iconSizes} text-teal-600 group-hover:scale-110 transition-transform`} />
          <span>{buttonText}</span>
          <span className="hidden sm:inline text-[9px] text-teal-600/80 font-normal">
            (Poncez & dictez)
          </span>
        </button>
      )}

      {status === 'REQUESTING_MIC' && (
        <div className={`inline-flex items-center font-bold rounded-lg border border-amber-300 bg-amber-50 text-amber-800 ${sizeClasses} animate-pulse`}>
          <Loader2 className={`${iconSizes} animate-spin text-amber-600`} />
          <span>Connexion micro...</span>
        </div>
      )}

      {status === 'RECORDING' && (
        <div className="inline-flex items-center gap-1.5 p-1 bg-rose-50 border border-rose-300 rounded-xl shadow-xs animate-fade-in">
          {/* Pulsing indicator & timer */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white border border-rose-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
            </span>
            <span className="text-[10px] font-black text-rose-800 font-mono">
              {formatTimer(seconds)}
            </span>

            {/* Audio wave bars */}
            <div className="flex items-center gap-0.5 h-3">
              <span className="w-0.5 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.3s] h-3"></span>
              <span className="w-0.5 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.15s] h-2"></span>
              <span className="w-0.5 bg-rose-500 rounded-full animate-bounce h-3.5"></span>
              <span className="w-0.5 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.2s] h-2"></span>
            </div>
          </div>

          {/* Commit button */}
          <button
            type="button"
            onClick={handleStopAndCommit}
            className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xxs font-black transition cursor-pointer flex items-center gap-1 shadow-2xs"
            title="Arrêter et insérer la dictée"
          >
            <Square className="w-2.5 h-2.5 fill-current" />
            <span>Insérer</span>
          </button>

          {/* Cancel button */}
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
          <span>Formatage clinique...</span>
        </div>
      )}

      {/* Live Interim Transcript or Error pill */}
      {status === 'RECORDING' && interimText && showStatusBanner && (
        <div className="max-w-md bg-white border border-rose-200 rounded-lg p-1.5 text-[10px] text-slate-700 font-medium shadow-xs italic flex items-center gap-1.5 animate-fade-in">
          <Volume2 className="w-3 h-3 text-rose-500 shrink-0" />
          <span className="truncate">« {interimText} »</span>
        </div>
      )}

      {errorMessage && (
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('microphone-permission-denied', {
              detail: { message: errorMessage, fieldName }
            }));
          }}
          title="Cliquez pour afficher les instructions de déblocage du micro"
          className="text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-md flex items-center gap-1.5 animate-fade-in transition cursor-pointer"
        >
          <AlertCircle className="w-3 h-3 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
          <span className="underline text-[9px] text-rose-800">Débloquer / Exemples</span>
        </button>
      )}
    </div>
  );
};

export default VoiceDictationButton;
