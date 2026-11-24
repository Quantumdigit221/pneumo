import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import { startDictationSession, transcribeAudioBlob, DictationSession } from '../utils/audioRecorder';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
  Send,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  UserCheck,
  Loader2,
  Upload,
  Stethoscope
} from 'lucide-react';

interface VoiceMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  actionType?: string;
  actionData?: any;
  isError?: boolean;
  timestamp: string;
}

export const ClinicalVoiceAssistant: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    patients,
    beds,
    consultations,
    nurseVitalRecords,
    nurseTargetedTransmissions,
    clinicalScoreCalculations,
    labResults,
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
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [textInput, setTextInput] = useState<string>('');
  const [transcript, setTranscript] = useState<string>('');
  const [executedActionNotice, setExecutedActionNotice] = useState<{ message: string; type: 'success' | 'warning' } | null>(null);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);

  const [micStatus, setMicStatus] = useState<'IDLE' | 'REQUESTING_MIC' | 'RECORDING' | 'TRANSCRIBING'>('IDLE');
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [micErrorMessage, setMicErrorMessage] = useState<string | null>(null);

  const dictationSessionRef = useRef<DictationSession | null>(null);
  const recordingTimerRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nativeAudioInputRef = useRef<HTMLInputElement>(null);

  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === selectedPatientId) || null,
    [patients, selectedPatientId]
  );

  // Refs to ensure latest store state inside async callbacks
  const patientsRef = useRef(patients);
  patientsRef.current = patients;
  const bedsRef = useRef(beds);
  bedsRef.current = beds;
  const selectedPatientRef = useRef(selectedPatient);
  selectedPatientRef.current = selectedPatient;
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  // Auto-scroll conversation thread
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isProcessing]);

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

    const voices = window.speechSynthesis.getVoices();
    const frVoice = voices.find(
      (v) =>
        v.lang.startsWith('fr') &&
        (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Thomas') || v.name.includes('Amelie'))
    );
    if (frVoice) utterance.voice = frVoice;

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

  const handleResetConversation = () => {
    stopSpeaking();
    setMessages([]);
    setTranscript('');
    setMicErrorMessage(null);
    setExecutedActionNotice(null);
  };

  // Start Live Mic Dictation
  const startListening = async () => {
    stopSpeaking();
    setMicErrorMessage(null);
    setTranscript('');
    setIsOpen(true);
    setRecordingSeconds(0);

    try {
      const session = await startDictationSession({
        context: 'Requête ou ordre clinique pour Assistant Clinique CHREIN',
        fieldName: 'Assistant Clinique Vocal',
        requestId: 'clinical-voice-assistant',
        onInterimText: (text) => {
          setTranscript(text);
        },
        onStatusChange: (status) => {
          setMicStatus(status);
          if (status === 'RECORDING') {
            setIsListening(true);
            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = setInterval(() => {
              setRecordingSeconds((prev) => prev + 1);
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
      console.warn('[Start Listening Notice]:', err);
      setIsListening(false);
      setMicStatus('IDLE');
    }
  };

  const handleNativeAudioFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setMicErrorMessage(null);
    setMicStatus('TRANSCRIBING');
    try {
      const transcribed = await transcribeAudioBlob(
        file,
        file.type || 'audio/mp4',
        'Requête clinique vocale CHREIN'
      );
      setMicStatus('IDLE');
      if (transcribed && transcribed.trim().length > 1) {
        await handleProcessCommand(transcribed.trim());
      } else {
        setMicErrorMessage("Aucune parole audible détectée dans l'enregistrement.");
      }
    } catch (err: any) {
      setMicStatus('IDLE');
      setMicErrorMessage(err?.message || 'Erreur lors de la transcription audio.');
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
      } catch {
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

  useEffect(() => {
    const handleInsertSample = (e: any) => {
      if (e?.detail?.requestId === 'clinical-voice-assistant' && e?.detail?.text) {
        setMicErrorMessage(null);
        handleProcessCommand(e.detail.text);
      }
    };
    const handleRetryMic = (e: any) => {
      if (e?.detail?.requestId === 'clinical-voice-assistant') {
        startListening();
      }
    };
    window.addEventListener('insert-dictation-sample', handleInsertSample);
    window.addEventListener('retry-native-mic', handleRetryMic);
    return () => {
      window.removeEventListener('insert-dictation-sample', handleInsertSample);
      window.removeEventListener('retry-native-mic', handleRetryMic);
      if (dictationSessionRef.current) {
        dictationSessionRef.current.abort();
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      stopSpeaking();
    };
  }, []);

  // Build real clinical context snapshot for the selected patient
  const buildCurrentPatientSnapshot = () => {
    const p = selectedPatientRef.current;
    if (!p) return null;

    const pBed = beds.find((b) => b.patientId === p.id && b.status === 'occupied');
    const pVitals = [...nurseVitalRecords]
      .filter((v) => v.patientId === p.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

    const pConsults = [...consultations]
      .filter((c) => c.patientId === p.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3)
      .map((c) => ({
        date: c.date,
        diagnosis: c.diagnosis,
        symptoms: c.symptoms,
        medicationsPrescribed: c.twelveSteps?.managementPlan?.medicationsPrescribed || c.prescription || ''
      }));

    const pTrans = [...nurseTargetedTransmissions]
      .filter((t) => t.patientId === p.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 3);

    const pScores = [...clinicalScoreCalculations]
      .filter((s) => s.patientId === p.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);

    const pLabs = [...labResults]
      .filter((l) => l.patientId === p.id)
      .slice(0, 4);

    return {
      id: p.id,
      code: p.code,
      firstName: p.firstName,
      lastName: p.lastName,
      age: p.age,
      gender: p.gender,
      bloodGroup: p.bloodGroup,
      allergies: p.allergies || 'Aucune signalée',
      chronicConditions: p.chronicConditions || '',
      smokingHistory: p.smokingHistory,
      activeHospitalizationBed: pBed ? { roomNumber: pBed.roomNumber, unitType: pBed.unitType } : null,
      recentVitals: pVitals,
      recentConsultations: pConsults,
      recentTransmissionsDAR: pTrans,
      recentScores: pScores,
      recentLabResults: pLabs
    };
  };

  // Resolve target patient strictly (never silently fall back to patients[0])
  const resolveTargetPatient = (actionData: any) => {
    const currentPatients = patientsRef.current || [];
    if (actionData?.patientId) {
      const byId = currentPatients.find((p) => p.id === actionData.patientId);
      if (byId) return byId;
    }
    if (actionData?.patientName) {
      const q = String(actionData.patientName).toLowerCase().trim();
      const byName = currentPatients.find((p) =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q)
      );
      if (byName) return byName;
    }
    return selectedPatientRef.current;
  };

  // Execute verified DPI actions
  const executeAction = async (actionType: string, actionData: any, userSpeechText: string): Promise<boolean> => {
    if (!actionType || actionType === 'NONE' || actionType === 'INFO' || actionType === 'MEDICAL_QA') {
      return false;
    }

    const targetPatient = resolveTargetPatient(actionData);
    let executionNotice = '';
    let executed = false;

    switch (actionType) {
      case 'RECORD_VITALS': {
        if (!targetPatient) {
          setExecutedActionNotice({
            message: 'Sélectionnez un patient ci-dessus pour enregistrer ses constantes.',
            type: 'warning'
          });
          return false;
        }
        if (actionData?.vitals) {
          const v = actionData.vitals;
          addNurseVitalRecord({
            id: `nv-${Date.now()}`,
            patientId: targetPatient.id,
            centerId: targetPatient.centerId || activeCenterId || 'center-1',
            timestamp: new Date().toISOString(),
            bp: v.bp || '',
            pulse: v.pulse !== undefined ? Number(v.pulse) : 0,
            rr: v.rr !== undefined ? Number(v.rr) : 0,
            spo2: v.spo2Ambient !== undefined ? Number(v.spo2Ambient) : 0,
            temperature: v.temperature !== undefined ? Number(v.temperature) : 0,
            weight: v.weight !== undefined ? Number(v.weight) : undefined,
            height: v.height !== undefined ? Number(v.height) : undefined,
            nurseName: currentUser?.name || 'Praticien CHREIN'
          });
          setSelectedPatientId(targetPatient.id);
          executionNotice = `Constantes enregistrées pour ${targetPatient.firstName} ${targetPatient.lastName}.`;
          executed = true;
        }
        break;
      }

      case 'PRESCRIBE': {
        if (!targetPatient) {
          setExecutedActionNotice({
            message: 'Sélectionnez un patient ci-dessus pour enregistrer la prescription.',
            type: 'warning'
          });
          return false;
        }
        if (actionData?.prescription?.rawText) {
          const raw = actionData.prescription.rawText;
          const protoName = actionData.prescription.protocolName || 'Prescription Pneumologie';
          await saveConsultation({
            ticketId: '',
            patientId: targetPatient.id,
            doctorId: currentUser?.id || 'u1',
            patientName: `${targetPatient.firstName} ${targetPatient.lastName}`,
            doctorName: currentUser?.name || 'Praticien CHREIN',
            serviceName: 'Consultation Spécialisée Pneumologie',
            date: new Date().toISOString(),
            weight: 0,
            temperature: 0,
            bloodPressure: '',
            symptoms: 'Prescription assistée par dictée clinique',
            diagnosis: protoName,
            prescription: JSON.stringify([{ medicineName: protoName, dosage: raw, quantity: 1 }]),
            prescriptionItems: [
              {
                medicineId: `m-${Date.now()}`,
                medicineName: protoName,
                dosage: raw,
                duration: 'Selon protocole',
                quantity: 1
              }
            ],
            twelveSteps: {
              chiefComplaint: 'Prescription assistée',
              historyOfIllness: '',
              riskFactors: {},
              vitals: { bp: '', pulse: 0, rr: 0, spo2Ambient: 0, temperature: 0 },
              systems: {} as any,
              syndromicSummary: protoName,
              diagnosticHypotheses: [protoName],
              paraclinicalOrdered: {},
              diagnoses: [
                {
                  id: `diag-${Date.now()}`,
                  codeCIM11: 'CA22',
                  label: protoName,
                  type: 'PRINCIPAL',
                  status: 'CONFIRME',
                  dateDiagnosed: new Date().toISOString().split('T')[0]
                }
              ],
              managementPlan: {
                medicationsPrescribed: raw,
                nonPharmacological: 'Surveillance clinique et tolérance thérapeutique',
                followUpDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]
              }
            }
          });
          setSelectedPatientId(targetPatient.id);
          executionNotice = `Ordonnance « ${protoName} » enregistrée pour ${targetPatient.firstName} ${targetPatient.lastName}.`;
          executed = true;
        }
        break;
      }

      case 'ADD_NURSING_DAR': {
        if (!targetPatient) {
          setExecutedActionNotice({
            message: 'Sélectionnez un patient ci-dessus pour enregistrer la transmission DAR.',
            type: 'warning'
          });
          return false;
        }
        if (actionData?.transmission) {
          const t = actionData.transmission;
          addNurseTargetedTransmission({
            id: `dar-${Date.now()}`,
            patientId: targetPatient.id,
            patientName: `${targetPatient.firstName} ${targetPatient.lastName}`,
            centerId: targetPatient.centerId || activeCenterId || 'center-1',
            timestamp: new Date().toISOString(),
            target: t.target || 'Surveillance clinique',
            data: t.data || '',
            action: t.action || '',
            result: t.result || '',
            nurseName: currentUser?.name || 'Praticien CHREIN',
            nurseSignature: 'Validé via Assistant Clinique'
          });
          setSelectedPatientId(targetPatient.id);
          executionNotice = `Transmission DAR enregistrée pour ${targetPatient.firstName} ${targetPatient.lastName}.`;
          executed = true;
        }
        break;
      }

      case 'ASSIGN_BED': {
        if (!targetPatient) {
          setExecutedActionNotice({
            message: 'Précisez ou sélectionnez le patient à hospitaliser.',
            type: 'warning'
          });
          return false;
        }
        const bedNum = String(actionData?.bedNumber || '').trim();
        const currentBeds = bedsRef.current || [];
        const matchedBed = bedNum
          ? currentBeds.find((b) => b.roomNumber.toLowerCase().includes(bedNum.toLowerCase()))
          : currentBeds.find((b) => b.status === 'available');
        if (matchedBed) {
          await updateBed(matchedBed.id, {
            status: 'occupied',
            patientId: targetPatient.id,
            patientName: `${targetPatient.firstName} ${targetPatient.lastName}`
          });
          setSelectedPatientId(targetPatient.id);
          executionNotice = `Lit ${matchedBed.roomNumber} attribué à ${targetPatient.firstName} ${targetPatient.lastName}.`;
          executed = true;
        } else {
          setExecutedActionNotice({
            message: `Lit ${bedNum || ''} introuvable ou aucun lit disponible.`,
            type: 'warning'
          });
          return false;
        }
        break;
      }

      case 'ADD_PATIENT': {
        if (actionData?.patient?.firstName || actionData?.patient?.lastName) {
          const p = actionData.patient;
          const newPat = await addPatient({
            firstName: p.firstName || 'Nouveau',
            lastName: p.lastName || 'Patient',
            gender: p.gender === 'F' ? 'F' : 'M',
            birthDate: `${new Date().getFullYear() - (Number(p.age) || 40)}-01-01`,
            phone: p.phone || '',
            address: p.address || 'Kaolack',
            chronicConditions: '',
            smokingHistory: { isSmoker: false, biomassExposure: false }
          });
          if (newPat?.id) setSelectedPatientId(newPat.id);
          executionNotice = `Dossier créé pour ${p.firstName || ''} ${p.lastName || ''} (${newPat?.code || 'IP généré'}).`;
          executed = true;
        }
        break;
      }

      case 'CALCULATE_SCORE': {
        if (!targetPatient) {
          setExecutedActionNotice({
            message: 'Sélectionnez un patient ci-dessus pour consigner ce score.',
            type: 'warning'
          });
          return false;
        }
        if (actionData?.scoreCalculation && actionData.scoreCalculation.calculatedValue !== undefined) {
          const sc = actionData.scoreCalculation;
          saveClinicalScoreCalculation({
            id: `sc-${Date.now()}`,
            patientId: targetPatient.id,
            patientName: `${targetPatient.firstName} ${targetPatient.lastName}`,
            scoreId: sc.scoreId || 'CLINICAL_SCORE',
            scoreName: sc.scoreName || 'Score Clinique',
            scoreCategory: sc.scoreCategory || 'RESPIRATORY',
            calculatedValue: Number(sc.calculatedValue),
            variables: {},
            interpretation: sc.interpretation || '',
            clinicalRecommendation: sc.clinicalRecommendation || '',
            referenceSource: sc.referenceSource || 'CHREIN Pneumologie',
            date: new Date().toISOString()
          });
          setSelectedPatientId(targetPatient.id);
          executionNotice = `${sc.scoreName} (${sc.calculatedValue}) consigné pour ${targetPatient.firstName} ${targetPatient.lastName}.`;
          executed = true;
        }
        break;
      }

      case 'SEARCH_PATIENT': {
        if (targetPatient) {
          setSelectedPatientId(targetPatient.id);
          executionNotice = `Patient ciblé : ${targetPatient.firstName} ${targetPatient.lastName} (${targetPatient.code}).`;
          executed = true;
        }
        break;
      }

      case 'NAVIGATE': {
        if (actionData?.targetRoute) {
          executionNotice = `Navigation vers ${actionData.targetRoute}`;
          executed = true;
        }
        break;
      }

      default:
        break;
    }

    if (executionNotice) {
      setExecutedActionNotice({ message: executionNotice, type: 'success' });
      setTimeout(() => setExecutedActionNotice(null), 6500);
    }

    if (executed) {
      window.dispatchEvent(
        new CustomEvent('clinical-voice-action', {
          detail: {
            actionType,
            actionData,
            rawSpeech: userSpeechText,
            timestamp: Date.now()
          }
        })
      );
    }

    if (actionData?.targetRoute && location.pathname !== actionData.targetRoute && executed) {
      navigate(actionData.targetRoute);
    }

    return executed;
  };

  const handleProcessCommand = async (command: string) => {
    if (!command || !command.trim() || isProcessing) return;
    const cleanCmd = command.trim();
    setTextInput('');
    setTranscript('');

    const historySnapshot = messagesRef.current
      .filter((m) => !m.isError)
      .slice(-12)
      .map((m) => ({ sender: m.sender, text: m.text }));

    const userMsg: VoiceMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: cleanCmd,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      const availableBeds = beds.filter((b) => b.status === 'available');
      const occupiedBeds = beds.filter((b) => b.status === 'occupied');

      const response = await fetch('/api/voice-assistant-llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userSpeech: cleanCmd,
          history: historySnapshot,
          currentRoute: location.pathname,
          currentPatient: buildCurrentPatientSnapshot(),
          availablePatients: patients.map((p) => ({
            id: p.id,
            firstName: p.firstName,
            lastName: p.lastName,
            code: p.code,
            age: p.age,
            gender: p.gender,
            chronicConditions: p.chronicConditions
          })),
          serviceContext: {
            clinician: currentUser?.name || 'Praticien',
            role: currentUser?.role || 'CLINICIAN',
            bedsSummary: {
              total: beds.length,
              available: availableBeds.length,
              occupied: occupiedBeds.length,
              availableRooms: availableBeds.map((b) => b.roomNumber)
            }
          }
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || `Erreur serveur (${response.status})`);
      }

      let wasActionExecuted = false;
      if (data.actionType && data.actionType !== 'NONE') {
        wasActionExecuted = await executeAction(data.actionType, data.actionData || {}, cleanCmd);
      }

      const assistantMsg: VoiceMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: data.displayText || data.spokenResponse || '',
        actionType: wasActionExecuted ? data.actionType : undefined,
        actionData: data.actionData,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (data.spokenResponse) {
        speakText(data.spokenResponse);
      }
    } catch (err: any) {
      const errorMsg: VoiceMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: err?.message || "Impossible de joindre l'assistant clinique IA pour le moment.",
        isError: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {/* Expanded Console Window */}
      {isOpen && (
        <div className="mb-3 w-96 sm:w-[440px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col transition-all duration-200 ease-out">
          {/* Header */}
          <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-teal-600/30 border border-teal-400/40 flex items-center justify-center text-teal-200 shrink-0">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold truncate">Assistant Clinique IA</h3>
                <p className="text-[10px] text-slate-300 truncate">
                  {selectedPatient
                    ? `${selectedPatient.firstName} ${selectedPatient.lastName} (${selectedPatient.code})`
                    : 'Mode général • CHREIN Kaolack'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleResetConversation}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
                  title="Nouvelle conversation (effacer l'historique)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (isSpeaking) stopSpeaking();
                  setTtsEnabled(!ttsEnabled);
                }}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  ttsEnabled ? 'text-teal-300 hover:bg-white/10' : 'text-slate-400 hover:bg-white/10'
                }`}
                title={ttsEnabled ? 'Lecture vocale activée' : 'Lecture vocale muette (activer)'}
              >
                {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  stopSpeaking();
                  if (isListening) stopListening();
                  setIsOpen(false);
                }}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
                title="Réduire"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Patient Context Selector Bar */}
          <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2 text-xxs">
            <UserCheck className="w-3.5 h-3.5 text-teal-700 shrink-0" />
            <span className="text-slate-600 font-semibold shrink-0">Patient :</span>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="flex-1 min-w-0 bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-800 font-semibold text-[11px] focus:outline-none focus:ring-1 focus:ring-teal-600"
            >
              <option value="">Aucun patient ciblé (mode général)</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} ({p.code} • {p.age} ans)
                </option>
              ))}
            </select>
          </div>

          {/* Execution / Warning Banner */}
          {executedActionNotice && (
            <div
              className={`px-3.5 py-2 border-b text-xs flex items-center justify-between ${
                executedActionNotice.type === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {executedActionNotice.type === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <span className="text-[11px] font-semibold line-clamp-2 leading-tight">
                  {executedActionNotice.message}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setExecutedActionNotice(null)}
                className="text-slate-500 hover:text-slate-800 p-0.5 ml-2 cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <input
            ref={nativeAudioInputRef}
            type="file"
            accept="audio/*"
            capture="microphone"
            onChange={handleNativeAudioFile}
            className="hidden"
          />

          {/* Mic Error Banner with Direct Native OS Capture Fallback */}
          {micErrorMessage && (
            <div className="px-3.5 py-2.5 bg-rose-50 border-b border-rose-200 text-rose-900 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1.5">
                <p className="font-bold text-[11px] leading-tight">{micErrorMessage}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => nativeAudioInputRef.current?.click()}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded-md text-[10px] font-black transition cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Micro natif OS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(
                        new CustomEvent('microphone-permission-denied', {
                          detail: {
                            message: micErrorMessage,
                            fieldName: 'Assistant Clinique Vocal',
                            requestId: 'clinical-voice-assistant'
                          }
                        })
                      );
                    }}
                    className="px-2 py-1 bg-white hover:bg-rose-100 border border-rose-300 text-rose-800 rounded-md text-[10px] font-bold transition cursor-pointer"
                  >
                    Options / Win+H
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMicErrorMessage(null)}
                className="text-rose-500 hover:text-rose-700 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Active Mic / Processing Status Strip */}
          {(isListening || isSpeaking || isProcessing || micStatus !== 'IDLE') && (
            <div
              className={`px-3.5 py-2 border-b flex items-center justify-between ${
                micStatus === 'RECORDING'
                  ? 'bg-rose-50 border-rose-200'
                  : micStatus === 'TRANSCRIBING' || isProcessing
                  ? 'bg-slate-100 border-slate-200'
                  : 'bg-teal-50 border-teal-100'
              }`}
            >
              <div className="flex items-center gap-2">
                {micStatus === 'RECORDING' ? (
                  <>
                    <span className="w-2 h-2 bg-rose-600 rounded-full"></span>
                    <span className="text-xs font-black text-rose-700 font-mono tabular-nums">
                      00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
                    </span>
                    <span className="text-[11px] font-bold text-rose-800">Écoute en cours...</span>
                  </>
                ) : micStatus === 'REQUESTING_MIC' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-teal-700 animate-spin" />
                    <span className="text-[11px] font-bold text-teal-800">Activation du micro...</span>
                  </>
                ) : micStatus === 'TRANSCRIBING' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-slate-700 animate-spin" />
                    <span className="text-[11px] font-bold text-slate-800">Transcription en cours...</span>
                  </>
                ) : isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-teal-700 animate-spin" />
                    <span className="text-[11px] font-bold text-teal-900">Analyse clinique en cours...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-teal-700" />
                    <span className="text-[11px] font-bold text-teal-800">Lecture vocale...</span>
                  </>
                )}
              </div>

              {micStatus === 'RECORDING' ? (
                <button
                  type="button"
                  onClick={stopListening}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black rounded-lg transition cursor-pointer"
                >
                  Envoyer
                </button>
              ) : isSpeaking ? (
                <button
                  type="button"
                  onClick={stopSpeaking}
                  className="text-[10px] text-teal-700 font-bold hover:underline cursor-pointer"
                >
                  Couper
                </button>
              ) : null}
            </div>
          )}

          {/* Live Transcript Preview */}
          {transcript && (
            <div className="px-3.5 py-2 bg-amber-50/80 border-b border-amber-200 text-amber-900 text-xs italic">
              « {transcript} »
            </div>
          )}

          {/* Conversation Thread */}
          <div className="p-3.5 h-72 overflow-y-auto space-y-3 bg-slate-50/60 text-xs">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4 space-y-2.5 text-slate-500">
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800">
                    {selectedPatient
                      ? `Contexte actif : ${selectedPatient.firstName} ${selectedPatient.lastName}`
                      : 'Prêt pour vos questions et ordres cliniques'}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Posez une question médicale, demandez une synthèse du dossier sélectionné, vérifiez une interaction ou dictez des constantes, transmissions DAR ou prescriptions.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`p-3 rounded-2xl max-w-[92%] shadow-2xs leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-teal-700 text-white rounded-tr-xs'
                        : m.isError
                        ? 'bg-rose-50 text-rose-900 border border-rose-200 rounded-tl-xs'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                    }`}
                  >
                    <div className="space-y-1 whitespace-pre-line text-xs font-normal">
                      {m.text}
                    </div>

                    {m.actionType && (
                      <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50/80 px-2 py-1 rounded-md">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Action DPI exécutée : {m.actionType}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 px-1">{m.timestamp}</span>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input & Mic Bar */}
          <div className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleListening}
              disabled={isProcessing}
              className={`p-2.5 rounded-full shadow-xs transition shrink-0 cursor-pointer ${
                isListening
                  ? 'bg-rose-600 text-white ring-4 ring-rose-200'
                  : 'bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-50'
              }`}
              title={isListening ? "Terminer et envoyer" : 'Dicter au microphone'}
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
                placeholder="Question médicale ou instruction DPI..."
                className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:bg-white"
              />
              <button
                type="submit"
                disabled={!textInput.trim() || isProcessing}
                className="p-2 bg-teal-700 text-white rounded-xl hover:bg-teal-800 disabled:opacity-40 transition cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Minimized Execution Toast */}
      {executedActionNotice && !isOpen && (
        <div className="mb-2 px-3.5 py-2.5 bg-slate-900 text-white rounded-xl shadow-2xl border border-teal-500/40 text-xs flex items-center gap-2 max-w-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-[11px] text-slate-100 font-medium line-clamp-2 flex-1 leading-tight">
            {executedActionNotice.message}
          </span>
          <button
            type="button"
            onClick={() => setExecutedActionNotice(null)}
            className="text-slate-400 hover:text-white p-0.5 ml-1 cursor-pointer"
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
          className={`flex items-center gap-2 px-3.5 py-2 rounded-full shadow-lg border transition-all duration-200 cursor-pointer ${
            isOpen
              ? 'bg-slate-900 text-white border-slate-800'
              : 'bg-white text-slate-800 border-slate-200 hover:shadow-xl hover:border-teal-500'
          }`}
        >
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center ${
              isListening
                ? 'bg-rose-600 text-white'
                : isSpeaking
                ? 'bg-teal-600 text-white'
                : 'bg-teal-100 text-teal-800'
            }`}
          >
            {isListening ? <Mic className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          </div>

          <div className="text-left hidden sm:block">
            <span className="text-xs font-bold leading-tight block">Assistant Clinique</span>
            <p className="text-[10px] text-slate-500 leading-tight">
              {isListening
                ? 'Écoute active...'
                : isProcessing
                ? 'Analyse...'
                : selectedPatient
                ? `${selectedPatient.firstName} ${selectedPatient.lastName}`
                : 'Voix & Aide Médicale'}
            </p>
          </div>

          {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </button>

        {!isOpen && (
          <button
            type="button"
            onClick={toggleListening}
            className={`w-10 h-10 rounded-full shadow-xl flex items-center justify-center transition-all cursor-pointer ${
              isListening
                ? 'bg-rose-600 text-white ring-4 ring-rose-300'
                : 'bg-teal-700 text-white hover:bg-teal-800'
            }`}
            title="Activer la dictée vocale"
          >
            <Mic className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ClinicalVoiceAssistant;
