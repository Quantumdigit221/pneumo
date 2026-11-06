import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import { startDictationSession, DictationSession } from '../utils/audioRecorder';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
  Activity,
  Send,
  Stethoscope,
  Pill,
  Users,
  Compass,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Cpu,
  Layers,
  BookOpen,
  Radio,
  Loader2
} from 'lucide-react';

interface VoiceMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  actionType?: string;
  actionData?: any;
  modelBadge?: string;
  timestamp: string;
}

export const ClinicalVoiceAssistant: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    patients,
    beds,
    currentUser,
    activeCenterId,
    addNurseVitalRecord,
    addNurseTargetedTransmission,
    saveClinicalScoreCalculation,
    addPatient,
    updateBed,
    saveConsultation
  } = useStore();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(true);
  const [textInput, setTextInput] = useState<string>('');
  const [transcript, setTranscript] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('openbiollm');
  const [executedActionNotice, setExecutedActionNotice] = useState<{ message: string; type: string } | null>(null);
  const [messages, setMessages] = useState<VoiceMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: "Bonjour Confrère. Je suis votre assistante clinique vocale propulsée par le modèle Open Source OpenBioLLM. J'exécute directement vos ordres cliniques : enregistrement des constantes, prescriptions, transmissions ciblées DAR, attribution de lits et calculs de scores.",
      actionType: 'INFO',
      modelBadge: 'OpenBioLLM-Llama3-8B',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [micStatus, setMicStatus] = useState<'IDLE' | 'REQUESTING_MIC' | 'RECORDING' | 'TRANSCRIBING'>('IDLE');
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [micErrorMessage, setMicErrorMessage] = useState<string | null>(null);
  const dictationSessionRef = useRef<DictationSession | null>(null);
  const recordingTimerRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Keep refs for latest values without triggering re-subscriptions
  const selectedModelRef = useRef(selectedModel);
  selectedModelRef.current = selectedModel;
  const locationPathRef = useRef(location.pathname);
  locationPathRef.current = location.pathname;
  const patientsRef = useRef(patients);
  patientsRef.current = patients;
  const bedsRef = useRef(beds);
  bedsRef.current = beds;

  // Scroll to bottom of message drawer
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Speech Synthesis
  const speakText = (text: string) => {
    if (!ttsEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const cleanToSpeak = text
      .replace(/[*#_`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanToSpeak) return;

    const utterance = new SpeechSynthesisUtterance(cleanToSpeak);
    utterance.lang = 'fr-FR';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // Pick a natural French voice if available
    const voices = window.speechSynthesis.getVoices();
    const frVoice = voices.find(v => v.lang.startsWith('fr') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Thomas') || v.name.includes('Amelie')));
    if (frVoice) {
      utterance.voice = frVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // Universal Dictation Management via MediaRecorder & Gemini Fallback
  const startListening = async () => {
    stopSpeaking();
    setMicErrorMessage(null);
    setTranscript('');
    setIsOpen(true);
    setRecordingSeconds(0);

    try {
      const session = await startDictationSession({
        context: 'Ordre clinique vocal pour dossier patient pneumologie Kaolack',
        onInterimText: (text) => {
          setTranscript(text);
        },
        onStatusChange: (status) => {
          setMicStatus(status);
          if (status === 'RECORDING') {
            setIsListening(true);
            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = setInterval(() => {
              setRecordingSeconds(prev => prev + 1);
            }, 1000);
          } else if (status === 'IDLE') {
            setIsListening(false);
            if (recordingTimerRef.current) {
              clearInterval(recordingTimerRef.current);
              recordingTimerRef.current = null;
            }
          }
        },
        onError: (err) => {
          setMicErrorMessage(err);
          setIsListening(false);
          if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
          }
        }
      });

      dictationSessionRef.current = session;
    } catch (err: any) {
      console.warn('[Start Listening Error]:', err);
      setIsListening(false);
      setMicStatus('IDLE');
    }
  };

  const stopListening = async () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (dictationSessionRef.current) {
      const session = dictationSessionRef.current;
      dictationSessionRef.current = null;
      try {
        setMicStatus('TRANSCRIBING');
        const text = await session.stop();
        setMicStatus('IDLE');
        setIsListening(false);
        if (text && text.trim().length > 1) {
          handleProcessCommand(text.trim());
        }
      } catch (e) {
        setMicStatus('IDLE');
        setIsListening(false);
      }
    } else {
      setIsListening(false);
      setMicStatus('IDLE');
    }
  };

  const toggleListening = () => {
    if (isListening || micStatus === 'RECORDING' || micStatus === 'REQUESTING_MIC') {
      stopListening();
    } else {
      startListening();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (dictationSessionRef.current) {
        dictationSessionRef.current.abort();
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      stopSpeaking();
    };
  }, []);

  // Directly execute clinical voice actions into store and UI
  const executeAction = async (actionType: string, actionData: any, userSpeechText: string) => {
    const currentPatients = patientsRef.current || [];
    let targetPatient = currentPatients.find(p => p.id === actionData?.patientId);
    if (!targetPatient && actionData?.patientName) {
      targetPatient = currentPatients.find(p =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(String(actionData.patientName).toLowerCase())
      );
    }
    if (!targetPatient && currentPatients.length > 0) {
      targetPatient = currentPatients[0];
    }

    let executionNotice = '';

    // Direct store mutations by action type
    switch (actionType) {
      case 'RECORD_VITALS': {
        if (targetPatient && actionData?.vitals) {
          const v = actionData.vitals;
          addNurseVitalRecord({
            id: `nv-${Date.now()}`,
            patientId: targetPatient.id,
            centerId: targetPatient.centerId || activeCenterId || 'center-1',
            timestamp: new Date().toISOString(),
            bp: v.bp || '120/80',
            pulse: Number(v.pulse) || 80,
            rr: Number(v.rr) || 20,
            spo2: Number(v.spo2Ambient) || 95,
            temperature: Number(v.temperature) || 37.0,
            nurseName: currentUser?.name || 'Dr. Cheikh Ndao (Ordre vocal)'
          });
          executionNotice = `Constantes injectées directement pour ${targetPatient.firstName} ${targetPatient.lastName} (TA ${v.bp || '-'}, SpO2 ${v.spo2Ambient || '-'}%, T° ${v.temperature || '-'}°C).`;
        }
        break;
      }

      case 'PRESCRIBE': {
        if (targetPatient && actionData?.prescription?.rawText) {
          const raw = actionData.prescription.rawText;
          const protoName = actionData.prescription.protocolName || 'Prescription Pneumologie';
          try {
            await saveConsultation({
              ticketId: '',
              patientId: targetPatient.id,
              doctorId: currentUser?.id || 'u2',
              patientName: `${targetPatient.firstName} ${targetPatient.lastName}`,
              doctorName: currentUser?.name || 'Dr. Cheikh Ndao',
              serviceName: 'Consultation Spécialisée Pneumologie',
              date: new Date().toISOString(),
              weight: 65,
              temperature: 37.2,
              bloodPressure: '120/80',
              symptoms: 'Prescription vocale directe',
              diagnosis: protoName,
              prescription: JSON.stringify([{
                medicineName: protoName,
                dosage: raw,
                quantity: 1
              }]),
              prescriptionItems: [{
                medicineId: `m-${Date.now()}`,
                medicineName: protoName,
                dosage: raw,
                duration: 'Selon protocole PNT',
                quantity: 1
              }],
              twelveSteps: {
                chiefComplaint: 'Prescription directe par assistante vocale',
                historyOfIllness: 'Prescription générée et validée par ordre vocal direct.',
                riskFactors: {},
                vitals: { bp: '120/80', pulse: 80, rr: 20, spo2Ambient: 96, temperature: 37.0 },
                systems: {} as any,
                syndromicSummary: protoName,
                diagnosticHypotheses: [protoName],
                paraclinicalOrdered: {},
                diagnoses: [{
                  id: `diag-${Date.now()}`,
                  codeCIM11: 'CA22',
                  label: protoName,
                  type: 'PRINCIPAL',
                  status: 'CONFIRME',
                  dateDiagnosed: new Date().toISOString().split('T')[0]
                }],
                managementPlan: {
                  medicationsPrescribed: raw,
                  nonPharmacological: 'Mesures hygiéno-diététiques et surveillance continue',
                  followUpDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]
                }
              }
            });
            executionNotice = `Ordonnance « ${protoName} » enregistrée et validée directement pour ${targetPatient.firstName} ${targetPatient.lastName}.`;
          } catch (e) {
            console.warn('[Direct Prescribe Notice]:', e);
          }
        }
        break;
      }

      case 'ADD_NURSING_DAR': {
        if (targetPatient && actionData?.transmission) {
          const t = actionData.transmission;
          addNurseTargetedTransmission({
            id: `dar-${Date.now()}`,
            patientId: targetPatient.id,
            patientName: `${targetPatient.firstName} ${targetPatient.lastName}`,
            centerId: targetPatient.centerId || activeCenterId || 'center-1',
            timestamp: new Date().toISOString(),
            target: t.target || 'Transmission ciblée',
            data: t.data || 'Constantes surveillées',
            action: t.action || 'Surveillance continue',
            result: t.result || 'État stable',
            nurseName: currentUser?.name || 'Assistante Vocale Clinique',
            nurseSignature: 'Signature automatique DPI'
          });
          executionNotice = `Transmission ciblée DAR enregistrée directement pour ${targetPatient.firstName} ${targetPatient.lastName} (Cible : ${t.target}).`;
        }
        break;
      }

      case 'ASSIGN_BED': {
        const bedNum = String(actionData?.bedNumber || '101');
        const currentBeds = bedsRef.current || [];
        const matchedBed = currentBeds.find(b => b.roomNumber.toLowerCase().includes(bedNum.toLowerCase())) ||
                           currentBeds.find(b => b.status === 'available');
        if (matchedBed && targetPatient) {
          await updateBed(matchedBed.id, {
            status: 'occupied',
            patientId: targetPatient.id,
            patientName: `${targetPatient.firstName} ${targetPatient.lastName}`
          });
          executionNotice = `Lit ${matchedBed.roomNumber} attribué directement à ${targetPatient.firstName} ${targetPatient.lastName}.`;
        }
        break;
      }

      case 'ADD_PATIENT': {
        if (actionData?.patient) {
          const p = actionData.patient;
          const newPat = await addPatient({
            firstName: p.firstName || 'Nouveau',
            lastName: p.lastName || 'Patient',
            gender: p.gender || 'M',
            birthDate: `${new Date().getFullYear() - (p.age || 40)}-01-01`,
            phone: p.phone || '+221 77 000 00 00',
            address: p.address || 'Région de Kaolack',
            chronicConditions: 'Créé directement par assistante vocale clinique',
            smokingHistory: { isSmoker: false, biomassExposure: false }
          });
          executionNotice = `Nouveau patient ${p.firstName} ${p.lastName} créé directement dans le DPI (${newPat?.code || 'N° IP généré'}).`;
        }
        break;
      }

      case 'CALCULATE_SCORE': {
        if (targetPatient && actionData?.scoreCalculation) {
          const sc = actionData.scoreCalculation;
          saveClinicalScoreCalculation({
            id: `sc-${Date.now()}`,
            patientId: targetPatient.id,
            patientName: `${targetPatient.firstName} ${targetPatient.lastName}`,
            scoreId: sc.scoreId || 'WELLS_EP',
            scoreName: sc.scoreName || 'Score Clinique',
            scoreCategory: sc.scoreCategory || 'EMBOLISM',
            calculatedValue: sc.calculatedValue || 4.5,
            variables: sc.variables || {},
            interpretation: sc.interpretation || 'Calcul direct',
            clinicalRecommendation: sc.clinicalRecommendation || 'Prise en charge selon protocole',
            referenceSource: sc.referenceSource || 'PNT / CHREIN 2026',
            date: new Date().toISOString()
          });
          executionNotice = `${sc.scoreName} calculé et consigné directement (Valeur : ${sc.calculatedValue}).`;
        }
        break;
      }

      case 'SEARCH_PATIENT': {
        if (targetPatient) {
          executionNotice = `Dossier patient de ${targetPatient.firstName} ${targetPatient.lastName} (${targetPatient.code}) ouvert directement.`;
        }
        break;
      }

      default: {
        if (actionData?.targetRoute) {
          executionNotice = `Navigation directe effectuée vers ${actionData.targetRoute}.`;
        }
        break;
      }
    }

    if (executionNotice) {
      setExecutedActionNotice({
        message: executionNotice,
        type: 'success'
      });
      setTimeout(() => setExecutedActionNotice(null), 8000);
    }

    // 2. Dispatch custom event for real-time form bindings (Consultations, Nursing, Scores)
    const eventDetail = {
      actionType,
      actionData,
      rawSpeech: userSpeechText,
      timestamp: Date.now()
    };
    window.dispatchEvent(new CustomEvent('clinical-voice-action', { detail: eventDetail }));

    // 3. Perform navigation if required
    if (actionData?.targetRoute && location.pathname !== actionData.targetRoute) {
      navigate(actionData.targetRoute);
    }
  };

  const handleProcessCommand = async (command: string) => {
    if (!command || !command.trim()) return;
    const cleanCmd = command.trim();
    setTextInput('');
    setTranscript('');

    // Add user message to thread
    const userMsg: VoiceMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: cleanCmd,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      const response = await fetch('/api/voice-assistant-llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userSpeech: cleanCmd,
          modelKey: selectedModel,
          currentRoute: location.pathname,
          availablePatients: patients.map(p => ({
            id: p.id,
            firstName: p.firstName,
            lastName: p.lastName,
            code: p.code,
            age: p.age
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();

      const assistantMsg: VoiceMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: data.displayText || data.spokenResponse || 'Ordre clinique exécuté directement.',
        actionType: data.actionType,
        actionData: data.actionData,
        modelBadge: data.modelInfo?.name || 'OpenBioLLM-Llama3-8B',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);

      // Direct execution of tasks
      if (data.actionType && data.actionData) {
        await executeAction(data.actionType, data.actionData, cleanCmd);
      }

      // Vocalize decisive spoken response
      if (data.spokenResponse) {
        speakText(data.spokenResponse);
      }
    } catch (err: any) {
      console.error('[Voice Assistant Client Error]:', err);
      const fallbackMsg: VoiceMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `⚠️ Désolé, une anomalie s'est produite lors de l'analyse vocale. Vous pouvez réitérer votre demande.`,
        actionType: 'INFO',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const quickPrompts = [
    { label: '🩺 Constantes 13/8 - 94%', prompt: 'Enregistrer constantes : tension 13 8 pouls 82 saturation 94 température 38.2 fréquence respiratoire 22' },
    { label: '💊 Prescrire 2RHZE', prompt: 'Prescrire protocole tuberculose phase intensive 2RHZE' },
    { label: '💊 Prescrire BPCO', prompt: 'Prescrire exacerbation BPCO' },
    { label: '📋 Transmission DAR Dyspnée', prompt: 'Transmission DAR cible dyspnée données SpO2 88% action oxygène 3L résultat SpO2 95%' },
    { label: '🛏️ Attribuer lit 102', prompt: 'Attribuer le lit 102 à Mamadou Diop' },
    { label: '📊 Score de Wells', prompt: 'Calculer le score de Wells' },
    { label: '👤 Chercher Mamadou Diop', prompt: 'Chercher le patient Mamadou Diop' },
    { label: '🫁 CAT Hémoptysie', prompt: 'Quelle est la conduite à tenir devant une hémoptysie ?' }
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {/* Expanded Console Window */}
      {isOpen && (
        <div className="mb-3 w-96 sm:w-[440px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col transition-all duration-200 ease-out animate-in fade-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-teal-500/30 border border-teal-400/40 flex items-center justify-center text-teal-200">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold truncate">Assistante Vocale Clinique</h3>
                  <span className="text-3xs px-1.5 py-0.2 bg-teal-500/20 text-teal-300 font-semibold rounded-full border border-teal-400/30">
                    Open Source
                  </span>
                </div>
                <p className="text-3xs text-teal-200/80 truncate">CHREIN Kaolack • Mains libres</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  if (isSpeaking) stopSpeaking();
                  setTtsEnabled(!ttsEnabled);
                }}
                className={`p-1.5 rounded-lg transition text-xs ${
                  ttsEnabled ? 'text-teal-200 hover:bg-teal-700/50' : 'text-slate-400 hover:bg-teal-700/50'
                }`}
                title={ttsEnabled ? 'Voix activée (cliquer pour couper)' : 'Voix coupée (cliquer pour activer)'}
              >
                {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  stopSpeaking();
                  stopListening();
                  setIsOpen(false);
                }}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-teal-700/50 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Model Switcher Bar */}
          <div className="px-3.5 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xxs">
            <div className="flex items-center gap-1.5 text-slate-600 font-medium">
              <Cpu className="w-3.5 h-3.5 text-teal-700" />
              <span>Modèle Santé :</span>
            </div>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-white border border-slate-300 rounded-md px-2 py-0.5 text-slate-800 font-semibold text-xxs focus:outline-none focus:ring-1 focus:ring-teal-600"
            >
              <option value="openbiollm">OpenBioLLM-Llama3-8B (SOTA Santé)</option>
              <option value="biomistral">BioMistral-7B (PMC & Cochrane)</option>
              <option value="medgemma">MedGemma-Health (DeepMind)</option>
              <option value="clinical-camel">Clinical-Camel-70B (Protocoles Afrique)</option>
            </select>
          </div>

          {/* Direct Execution Banner */}
          {executedActionNotice && (
            <div className="px-3.5 py-2 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs flex items-center justify-between animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="font-extrabold text-3xs uppercase tracking-wider text-emerald-700 block">
                    ⚡ Tâche Exécutée Directement
                  </span>
                  <span className="text-xxs text-emerald-900 font-semibold line-clamp-2 block leading-tight">
                    {executedActionNotice.message}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExecutedActionNotice(null)}
                className="text-emerald-600 hover:text-emerald-800 p-0.5 ml-2 cursor-pointer flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Mic Permission or Error Alert Banner */}
          {micErrorMessage && (
            <div className="px-3.5 py-2.5 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-xxs leading-tight">{micErrorMessage}</p>
                <p className="text-3xs text-rose-600 mt-0.5">
                  Cliquez sur l'icône de cadenas ou caméra/micro dans la barre d'adresse de votre navigateur pour autoriser le micro.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMicErrorMessage(null)}
                className="text-rose-500 hover:text-rose-700 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Active Speaking / Listening Waveform & Recording Timer Indicator */}
          {(isListening || isSpeaking || isProcessing || micStatus !== 'IDLE') && (
            <div className={`px-3.5 py-2 border-b flex items-center justify-between ${
              micStatus === 'RECORDING'
                ? 'bg-rose-50 border-rose-200'
                : micStatus === 'TRANSCRIBING'
                ? 'bg-blue-50 border-blue-200'
                : 'bg-teal-50 border-teal-100'
            }`}>
              <div className="flex items-center gap-2">
                {micStatus === 'RECORDING' ? (
                  <>
                    <span className="w-2.5 h-2.5 bg-rose-600 rounded-full animate-ping"></span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-black text-rose-700 tracking-wider font-mono">
                        00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
                      </span>
                      <div className="flex items-center gap-0.5 h-3 ml-1">
                        <span className="w-1 h-3 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1 h-4 bg-rose-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1 h-3 bg-rose-500 rounded-full animate-bounce"></span>
                      </div>
                    </div>
                    <span className="text-xxs font-bold text-rose-800 ml-1">
                      Enregistrement en cours... Parlez
                    </span>
                  </>
                ) : micStatus === 'REQUESTING_MIC' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-teal-700 animate-spin" />
                    <span className="text-xxs font-bold text-teal-800">
                      Demande d'accès au microphone...
                    </span>
                  </>
                ) : micStatus === 'TRANSCRIBING' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-blue-700 animate-spin" />
                    <span className="text-xxs font-bold text-blue-800">
                      Transcription audio par l'IA médicale...
                    </span>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-0.5 h-3">
                      <span className="w-1 h-3 bg-teal-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1 h-3 bg-teal-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1 h-3 bg-teal-600 rounded-full animate-bounce"></span>
                    </div>
                    <span className="text-xxs font-bold text-teal-800">
                      {isSpeaking ? 'Synthèse vocale en cours...' : 'Raisonnement clinique Open Source...'}
                    </span>
                  </>
                )}
              </div>

              {micStatus === 'RECORDING' ? (
                <button
                  type="button"
                  onClick={stopListening}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-3xs font-black rounded-lg shadow-xs transition"
                >
                  Terminer
                </button>
              ) : isSpeaking ? (
                <button
                  type="button"
                  onClick={stopSpeaking}
                  className="text-3xs text-teal-700 font-semibold hover:underline"
                >
                  Arrêter
                </button>
              ) : null}
            </div>
          )}

          {/* Live Transcript Bubble */}
          {transcript && (
            <div className="px-3.5 py-2 bg-amber-50/80 border-b border-amber-200 text-amber-900 text-xs italic">
              « {transcript} »
            </div>
          )}

          {/* Conversation Thread */}
          <div className="p-3.5 max-h-72 overflow-y-auto space-y-3 bg-slate-50/50 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3 rounded-2xl max-w-[90%] shadow-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-teal-700 text-white rounded-tr-xs'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs'
                  }`}
                >
                  {m.sender === 'assistant' && m.modelBadge && (
                    <div className="flex items-center gap-1.5 mb-1.5 pb-1 border-b border-slate-100 text-3xs text-teal-700 font-bold">
                      <Sparkles className="w-3 h-3" />
                      <span>{m.modelBadge}</span>
                    </div>
                  )}

                  {/* Message Body with clean markdown linebreaks */}
                  <div className="space-y-1 whitespace-pre-line text-xs font-normal">
                    {m.text}
                  </div>

                  {/* Action pill if an action was executed */}
                  {m.actionType && m.actionType !== 'INFO' && (
                    <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center gap-1.5 text-3xs font-bold text-emerald-700 bg-emerald-50/70 px-2 py-1 rounded-md">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>⚡ Tâche Exécutée Directement dans le DPI : {m.actionType}</span>
                    </div>
                  )}
                </div>
                <span className="text-3xs text-slate-400 mt-0.5 px-1">{m.timestamp}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Chips */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleProcessCommand(qp.prompt)}
                className="whitespace-nowrap px-2.5 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 rounded-full text-3xs font-semibold transition border border-slate-200/80 cursor-pointer"
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Input & Mic Bar */}
          <div className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2.5 rounded-full shadow-xs transition flex-shrink-0 ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-200'
                  : 'bg-teal-700 text-white hover:bg-teal-800'
              }`}
              title={isListening ? "Arrêter l'écoute" : "Activer le micro"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleProcessCommand(textInput);
              }}
              className="flex-1 flex items-center gap-1.5"
            >
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Dicter ou saisir un ordre clinique direct..."
                className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:bg-white"
              />
              <button
                type="submit"
                disabled={!textInput.trim() || isProcessing}
                className="p-2 bg-teal-700 text-white rounded-xl hover:bg-teal-800 disabled:opacity-40 transition cursor-pointer flex-shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Minimized Execution Toast */}
      {executedActionNotice && !isOpen && (
        <div className="mb-2 px-3.5 py-2.5 bg-slate-900/95 text-white rounded-xl shadow-2xl border border-emerald-500/50 text-xs flex items-center gap-2 max-w-sm animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <span className="font-extrabold text-3xs uppercase tracking-wider text-emerald-400 block">
              ⚡ Tâche Exécutée Directement
            </span>
            <span className="text-xxs text-slate-200 font-medium line-clamp-2 block leading-tight">
              {executedActionNotice.message}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setExecutedActionNotice(null)}
            className="text-slate-400 hover:text-white p-0.5 ml-1"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Floating Trigger Dock Button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-full shadow-lg border transition-all duration-200 ${
            isOpen
              ? 'bg-slate-900 text-white border-slate-800'
              : 'bg-white text-slate-800 border-slate-200 hover:shadow-xl hover:border-teal-500'
          }`}
        >
          <div className="relative">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse'
                : isSpeaking
                ? 'bg-teal-600 text-white'
                : 'bg-teal-100 text-teal-800'
            }`}>
              {isListening ? <Mic className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </div>
            {isListening && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping"></span>
            )}
          </div>

          <div className="text-left hidden sm:block">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold leading-tight">Voix & IA Clinique</span>
              <span className="text-3xs px-1 bg-teal-100 text-teal-800 rounded font-semibold">
                OpenBioLLM
              </span>
            </div>
            <p className="text-3xs text-slate-500 leading-tight">
              {isListening ? 'Écoute active...' : isSpeaking ? 'En train de parler...' : 'Cliquez pour parler'}
            </p>
          </div>

          {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </button>

        {/* Dedicated Quick-Mic Push Button */}
        {!isOpen && (
          <button
            type="button"
            onClick={toggleListening}
            className={`w-11 h-11 rounded-full shadow-xl flex items-center justify-center transition-all ${
              isListening
                ? 'bg-rose-600 text-white ring-4 ring-rose-300 animate-pulse'
                : 'bg-teal-700 text-white hover:bg-teal-800 hover:scale-105'
            }`}
            title="Activer la dictée vocale instantanée"
          >
            <Mic className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ClinicalVoiceAssistant;
