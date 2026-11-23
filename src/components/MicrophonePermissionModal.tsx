import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  ExternalLink,
  Sparkles,
  Check,
  X,
  ShieldAlert,
  ArrowRight,
  Upload,
  Loader2,
  RefreshCw,
  Keyboard,
} from 'lucide-react';
import { formatClinicalFrench } from './VoiceDictationButton';
import { transcribeAudioBlob, MicrophoneDiagnostics } from '../utils/audioRecorder';

export interface MicrophonePermissionModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onInsertSample?: (formattedText: string) => void;
  targetFieldName?: string;
}

export const MicrophonePermissionModal: React.FC<MicrophonePermissionModalProps> = ({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  onInsertSample,
  targetFieldName = 'ce champ clinique',
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [currentField, setCurrentField] = useState(targetFieldName);
  const [currentRequestId, setCurrentRequestId] = useState<string | undefined>(undefined);
  const [errorDetailMsg, setErrorDetailMsg] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<MicrophoneDiagnostics | null>(null);

  const [manualText, setManualText] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isTranscribingNativeFile, setIsTranscribingNativeFile] = useState(false);
  const [nativeFileError, setNativeFileError] = useState<string | null>(null);

  const osDictationRef = useRef<HTMLTextAreaElement>(null);
  const nativeAudioInputRef = useRef<HTMLInputElement>(null);

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalOpen;

  const handleClose = () => {
    setNativeFileError(null);
    if (controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalOpen(false);
    }
  };

  useEffect(() => {
    const handleDeniedEvent = (e: any) => {
      if (e.detail?.fieldName) setCurrentField(e.detail.fieldName);
      setCurrentRequestId(e.detail?.requestId);
      setErrorDetailMsg(e.detail?.message || null);
      setDiagnostics(e.detail?.diagnostics || null);
      setNativeFileError(null);
      setInternalOpen(true);
    };

    window.addEventListener('microphone-permission-denied', handleDeniedEvent);
    return () => {
      window.removeEventListener('microphone-permission-denied', handleDeniedEvent);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        osDictationRef.current?.focus();
      }, 120);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const CLINICAL_DICTATION_PRESETS = [
    {
      title: 'Anamnèse Tuberculose Pulmonaire (PNT)',
      rawOral:
        "Patient adressé pour toux productive traînante depuis quatre semaines avec crachats muco-purulents virgule fébricule vespéro-nocturne à 38 virgule 2 degrés et sueurs nocturnes profuses point à la ligne altération de l'état général avec amaigrissement de six kilos point pas d'antécédent de traitement antituberculeux antérieur point",
      context: 'Suspicion TPM+ / GeneXpert',
    },
    {
      title: 'Exacerbation de BPCO & Emphysème',
      rawOral:
        "Majoration brutale de la dyspnée d'effort devenue stade trois mMRC avec augmentation du volume des expectorations devenues franchement purulentes point à la ligne tabagisme actif à vingt-cinq paquets-années point saturation à quatre-vingt-onze pour cent en air ambiant point sibilants diffus expiratoires aux deux champs pulmonaires point",
      context: 'Décompensation respiratoire',
    },
    {
      title: 'Examen Pleuro-Pulmonaire Normal',
      rawOral:
        'Auscultation pulmonaire symétrique virgule murmure vésiculaire bien transmis aux deux champs point absence de râles crépitants ou de sibilants surajoutés point silence auscultatoire absent point à la ligne fréquence respiratoire à seize par minute virgule eupnéique en air ambiant point',
      context: 'Bilan systématique',
    },
    {
      title: 'Prescription Antibiogouvernance & Aérosols',
      rawOral:
        "Premièrement Amoxicilline plus acide clavulanique un gramme deux points un comprimé trois fois par jour au milieu des repas pendant sept jours point à la ligne deuxièmement Salbutamol cent microgrammes deux points deux bouffées avec chambre d'inhalation toutes les six heures en cas de gêne respiratoire point",
      context: 'Ordonnance sécurisée',
    },
  ];

  const dispatchFormattedText = (formatted: string) => {
    if (!formatted.trim()) return;
    if (onInsertSample) {
      onInsertSample(formatted);
    } else {
      window.dispatchEvent(
        new CustomEvent('insert-dictation-sample', {
          detail: {
            text: formatted,
            fieldName: currentField,
            requestId: currentRequestId,
          },
        })
      );
    }
  };

  const handleInsertPreset = (rawOral: string, index: number) => {
    const formatted = formatClinicalFrench(rawOral);
    dispatchFormattedText(formatted);
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex(null);
      handleClose();
    }, 450);
  };

  const handleFormatManual = () => {
    if (!manualText.trim()) return;
    const formatted = formatClinicalFrench(manualText);
    dispatchFormattedText(formatted);
    setManualText('');
    handleClose();
  };

  const handleNativeAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsTranscribingNativeFile(true);
    setNativeFileError(null);
    try {
      const rawText = await transcribeAudioBlob(
        file,
        file.type || 'audio/mp4',
        `Dictée médicale native OS pour ${currentField}`
      );
      const formatted = formatClinicalFrench(rawText);
      if (!formatted) {
        setNativeFileError("Aucune parole audible détectée dans l'enregistrement audio.");
        return;
      }
      dispatchFormattedText(formatted);
      handleClose();
    } catch (err: any) {
      setNativeFileError(err?.message || "Impossible de transcrire l'enregistrement audio.");
    } finally {
      setIsTranscribingNativeFile(false);
    }
  };

  const handleRetryNativeMic = () => {
    const reqId = currentRequestId;
    const fName = currentField;
    handleClose();
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('retry-native-mic', {
          detail: { requestId: reqId, fieldName: fName },
        })
      );
    }, 80);
  };

  const standaloneUrl = typeof window !== 'undefined' ? window.location.href : '#';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 flex items-center justify-center shrink-0">
              <MicOff className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/25 text-amber-100 px-2 py-0.5 rounded border border-amber-400/30">
                Relais Vocal Natif OS Activé
              </span>
              <h3 className="text-base font-black text-white mt-1">
                Dictée & Capture Audio Native
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 hover:bg-white/10 rounded-xl text-white/70 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Diagnostic cause */}
          <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl text-amber-950 space-y-1.5">
            <div className="flex items-center gap-2 font-black text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Accès micro navigateur restreint pour « {currentField} »</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-900/90 font-medium">
              {errorDetailMsg ||
                "Le navigateur ou la fenêtre intégrée bloque le flux micro en direct. Utilisez immédiatement l'enregistreur natif de votre appareil ou la dictée système ci-dessous (sans blocage navigateur)."}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleRetryNativeMic}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-lg font-bold text-[11px] transition cursor-pointer shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
                <span>Réessayer le micro navigateur</span>
              </button>
              {diagnostics?.isIframe && (
                <a
                  href={standaloneUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold text-[11px] transition shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ouvrir hors iframe (Micro direct)</span>
                </a>
              )}
            </div>
          </div>

          {/* 1. Native OS Audio Capture (works even when iframe/browser blocks getUserMedia) */}
          <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-teal-700 shrink-0" />
                <span className="font-black text-teal-950 text-xs">
                  Option 1 : Capture Micro Native OS (Contourne le blocage navigateur)
                </span>
              </div>
              <span className="text-[10px] font-bold text-teal-700 bg-white px-2 py-0.5 rounded border border-teal-200">
                Système / Mobile
              </span>
            </div>
            <p className="text-[11px] text-teal-900/90 leading-relaxed">
              Déclenche l'enregistreur audio natif de votre système (téléphone/tablette/PC) ou importe un mémo vocal : l'audio est immédiatement transcrit en français médical clinique et inséré dans le dossier.
            </p>
            <input
              ref={nativeAudioInputRef}
              type="file"
              accept="audio/*"
              capture="microphone"
              onChange={handleNativeAudioUpload}
              className="hidden"
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => nativeAudioInputRef.current?.click()}
                disabled={isTranscribingNativeFile}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white rounded-xl font-black text-xs transition cursor-pointer shadow-xs"
              >
                {isTranscribingNativeFile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Transcription médicale en cours...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Enregistrer avec le micro natif / Fichier audio</span>
                  </>
                )}
              </button>
            </div>
            {nativeFileError && (
              <p className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5">
                {nativeFileError}
              </p>
            )}
          </div>

          {/* 2. Native OS Keyboard Dictation (Win+H / Fn x2 / Mobile keyboard mic) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-slate-700 shrink-0" />
                <span className="font-black text-slate-900 text-xs">
                  Option 2 : Dictée Vocale Système Native (OS)
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                Win+H • Fn×2 • Clavier Micro
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Placez le curseur ci-dessous et activez la dictée native de Windows (<strong>Win + H</strong>), macOS (<strong>Fn × 2</strong>) ou du clavier mobile. La ponctuation orale est formatée automatiquement :
            </p>
            <textarea
              ref={osDictationRef}
              rows={3}
              placeholder="Dictez ici avec Win+H, Fn×2 ou le micro du clavier... Ex: toux productive virgule crachats purulents point"
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && manualText.trim()) {
                  e.preventDefault();
                  handleFormatManual();
                }
              }}
              className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:border-teal-600 focus:ring-1 focus:ring-teal-500 outline-none resize-none"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-500">
                Astuce : « virgule », « point », « à la ligne » formatés automatiquement.
              </span>
              <button
                type="button"
                onClick={handleFormatManual}
                disabled={!manualText.trim()}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
              >
                Formater &amp; Insérer
              </button>
            </div>
          </div>

          {/* 3. Browser unlock checklist */}
          <div className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
              Débloquer le micro en direct dans le navigateur (Chrome / Edge / Safari) :
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-700">
              <div className="flex items-start gap-2 bg-white p-2 rounded-lg border border-slate-200">
                <span className="w-4 h-4 rounded bg-teal-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                <span>Cliquez sur l'icône <strong>🔒</strong> ou réglages à gauche de l'URL.</span>
              </div>
              <div className="flex items-start gap-2 bg-white p-2 rounded-lg border border-slate-200">
                <span className="w-4 h-4 rounded bg-teal-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                <span>Activez <strong>Microphone → Autoriser</strong>.</span>
              </div>
              <div className="flex items-start gap-2 bg-white p-2 rounded-lg border border-slate-200">
                <span className="w-4 h-4 rounded bg-teal-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                <span>Cliquez sur <strong>« Réessayer le micro »</strong> ci-dessus.</span>
              </div>
            </div>
          </div>

          {/* 4. Instant Clinical Sample Presets */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-teal-900 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Modèles Cliniques Instantanés (Pneumologie) :</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">1 clic pour insérer</span>
            </div>

            <div className="space-y-2">
              {CLINICAL_DICTATION_PRESETS.map((preset, idx) => {
                const formattedPreview = formatClinicalFrench(preset.rawOral);
                return (
                  <div
                    key={idx}
                    className="p-2.5 bg-white border border-slate-200 hover:border-teal-400 rounded-xl space-y-1 transition-all shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <strong className="text-slate-900 font-black truncate">{preset.title}</strong>
                        <span className="text-[9px] font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded border border-teal-200 shrink-0">
                          {preset.context}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleInsertPreset(preset.rawOral, idx)}
                        className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[10px] font-black transition cursor-pointer flex items-center gap-1 shadow-xs shrink-0"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Inséré !</span>
                          </>
                        ) : (
                          <>
                            <span>Insérer</span>
                            <ArrowRight className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-600 italic leading-relaxed line-clamp-2">
                      « {formattedPreview} »
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            CHREIN Kaolack &bull; Pneumologie &amp; Maladies Infectieuses
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-xs"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default MicrophonePermissionModal;
