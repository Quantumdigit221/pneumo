import React, { useState, useEffect } from 'react';
import { MicOff, Lock, ExternalLink, Sparkles, Check, X, ShieldAlert, FileText, ArrowRight } from 'lucide-react';
import { formatClinicalFrench } from './VoiceDictationButton';

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
  targetFieldName = 'ce champ clinique'
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [currentField, setCurrentField] = useState(targetFieldName);
  const [manualText, setManualText] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalOpen;

  const handleClose = () => {
    if (controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalOpen(false);
    }
  };

  useEffect(() => {
    const handleDeniedEvent = (e: any) => {
      if (e.detail?.fieldName) setCurrentField(e.detail.fieldName);
      setInternalOpen(true);
    };

    window.addEventListener('microphone-permission-denied', handleDeniedEvent);
    return () => {
      window.removeEventListener('microphone-permission-denied', handleDeniedEvent);
    };
  }, []);

  if (!isOpen) return null;

  // Real-world Senegalese pneumology clinical dictation samples
  const CLINICAL_DICTATION_PRESETS = [
    {
      title: "Anamnèse Tuberculose Pulmonaire (PNT)",
      rawOral: "Patient adressé pour toux productive traînante depuis quatre semaines avec crachats muco-purulents virgule fébricule vespéro-nocturne à 38 virgule 2 degrés et sueurs nocturnes profuses point à la ligne altération de l'état général avec amaigrissement de six kilos point pas d'antécédent de traitement antituberculeux antérieur point",
      context: "Suspicion TPM+ / GeneXpert"
    },
    {
      title: "Exacerbation de BPCO & Emphysème",
      rawOral: "Majoration brutale de la dyspnée d'effort devenue stade trois mMRC avec augmentation du volume des expectorations devenues franchement purulentes point à la ligne tabagisme actif à vingt-cinq paquets-années point saturation à quatre-vingt-onze pour cent en air ambiant point sibilants diffus expiratoires aux deux champs pulmonaires point",
      context: "Décompensation respiratoire"
    },
    {
      title: "Examen Pleuro-Pulmonaire Normal",
      rawOral: "Auscultation pulmonaire symétrique virgule murmure vésiculaire bien transmis aux deux champs point absence de râles crépitants ou de sibilants surajoutés point silence auscultatoire absent point à la ligne fréquence respiratoire à seize par minute virgule eupnéique en air ambiant point",
      context: "Bilan systématique"
    },
    {
      title: "Prescription Antibiogouvernance & Aérosols",
      rawOral: "Premièrement Amoxicilline plus acide clavulanique un gramme deux points un comprimé trois fois par jour au milieu des repas pendant sept jours point à la ligne deuxièmement Salbutamol cent microgrammes deux points deux bouffées avec chambre d'inhalation toutes les six heures en cas de gêne respiratoire point",
      context: "Ordonnance sécurisée"
    }
  ];

  const handleInsertPreset = (rawOral: string, index: number) => {
    const formatted = formatClinicalFrench(rawOral);
    if (onInsertSample) {
      onInsertSample(formatted);
    } else {
      // Dispatch global insert event
      window.dispatchEvent(new CustomEvent('insert-dictation-sample', {
        detail: { text: formatted, fieldName: currentField }
      }));
    }
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex(null);
      handleClose();
    }, 600);
  };

  const handleFormatManual = () => {
    if (!manualText.trim()) return;
    const formatted = formatClinicalFrench(manualText);
    if (onInsertSample) {
      onInsertSample(formatted);
    } else {
      window.dispatchEvent(new CustomEvent('insert-dictation-sample', {
        detail: { text: formatted, fieldName: currentField }
      }));
    }
    handleClose();
  };

  const openInNewTab = () => {
    try {
      window.open(window.location.href, '_blank');
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-300 flex items-center justify-center">
              <MicOff className="w-5 h-5 text-rose-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-rose-500/30 text-rose-200 px-2 py-0.5 rounded-full border border-rose-400/30">
                  Microphone Bloqué par le Navigateur
                </span>
              </div>
              <h3 className="text-base font-black text-white mt-0.5">
                Activation de la Dictée Vocale Médicale
              </h3>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-white/10 rounded-xl text-white/70 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Explanation Alert */}
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-950 space-y-2">
            <div className="flex items-center gap-2 font-black text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Pourquoi ce message apparaît-il ?</span>
            </div>
            <p className="text-xs leading-relaxed text-amber-900/90 font-medium">
              Votre navigateur ou l'environnement de prévisualisation a bloqué l'accès au microphone pour protéger votre confidentialité. Vous pouvez facilement l'autoriser ou utiliser les raccourcis ci-dessous :
            </p>
          </div>

          {/* 3 Steps to unblock */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <span className="text-xxs font-black uppercase text-slate-500 tracking-wider block">
              Comment Débloquer le Micro dans Google Chrome / Edge / Safari :
            </span>
            <div className="space-y-2">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                <p className="text-slate-700">
                  Cliquez sur l'icône de <strong>cadenas 🔒</strong> ou de <strong>réglages de site</strong> à gauche de l'adresse URL dans votre navigateur.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                <p className="text-slate-700">
                  Passez le bouton <strong>Microphone</strong> sur <strong>« Autoriser »</strong> (ou *Allow*).
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                <p className="text-slate-700">
                  Revenez sur l'application et cliquez sur <strong>« Dicter »</strong> pour parler.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={openInNewTab}
                className="w-full py-2.5 px-3 bg-white hover:bg-slate-100 text-teal-800 border border-teal-300 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
              >
                <ExternalLink className="w-4 h-4 text-teal-600" />
                <span>Ouvrir l'application en plein écran (Débloque le micro immédiatement)</span>
              </button>
            </div>
          </div>

          {/* Alternative: Instant Clinical Sample Presets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xxs font-black uppercase text-teal-900 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Modèles de Dictée Vocale Médicale Instantanés (Pneumologie) :</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">1 clic pour insérer</span>
            </div>

            <div className="space-y-2">
              {CLINICAL_DICTATION_PRESETS.map((preset, idx) => {
                const formattedPreview = formatClinicalFrench(preset.rawOral);
                return (
                  <div
                    key={idx}
                    className="p-3 bg-white border border-slate-200 hover:border-teal-400 rounded-xl space-y-1.5 transition-all group shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 font-black">{preset.title}</strong>
                        <span className="text-[9px] font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full border border-teal-200">
                          {preset.context}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleInsertPreset(preset.rawOral, idx)}
                        className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xxs font-black transition cursor-pointer flex items-center gap-1 shadow-xs"
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

          {/* Test Medical Punctuation Formatting */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="text-xxs font-black uppercase text-slate-500 tracking-wider block">
              Tester le formateur oral clinique (Tapez ou collez une dictée avec ponctuation orale) :
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ex: dyspnée d'effort virgule toux sèche point à la ligne examen normal point"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                className="flex-1 text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-teal-500 outline-none"
              />
              <button
                type="button"
                onClick={handleFormatManual}
                disabled={!manualText.trim()}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
              >
                Formater & Insérer
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            CHREIN Kaolack &bull; Service de Pneumologie & Maladies Infectieuses
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-xs"
          >
            Fermer l'aide
          </button>
        </div>
      </div>
    </div>
  );
};

export default MicrophonePermissionModal;
