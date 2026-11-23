/**
 * Universal Native Audio Recorder & Dictation Engine for Clinical DPI
 * Strategy:
 *  1. Prioritizes native hardware capture via getUserMedia (with relaxed constraint fallbacks + device enumeration).
 *  2. Uses verified MediaRecorder MIME type OR automatic Web Audio PCM -> WAV encoder fallback.
 *  3. Runs Web Speech API as non-blocking live preview when native stream is active, or as secondary fallback if getUserMedia is unavailable.
 *  4. Never emits false "microphone-permission-denied" modals when native MediaRecorder/WAV is actively capturing.
 *  5. Exports transcribeAudioBlob() so native OS <input type="file" accept="audio/*" capture="microphone"> uploads work seamlessly when iframes/browsers lock live mic APIs.
 */

export interface DictationSession {
  stop: () => Promise<string>;
  abort: () => void;
}

export interface DictationOptions {
  onInterimText?: (text: string) => void;
  onStatusChange?: (status: 'REQUESTING_MIC' | 'RECORDING' | 'TRANSCRIBING' | 'IDLE') => void;
  onError?: (errorMessage: string) => void;
  context?: string;
  fieldName?: string;
  requestId?: string;
}

export interface MicrophoneDiagnostics {
  isSecureContext: boolean;
  isIframe: boolean;
  permissionState: 'granted' | 'denied' | 'prompt' | 'unknown';
  hasMediaDevices: boolean;
  hasSpeechRecognition: boolean;
}

export async function getMicrophoneDiagnostics(): Promise<MicrophoneDiagnostics> {
  const isSecureContext = typeof window !== 'undefined' ? Boolean(window.isSecureContext) : false;
  let isIframe = false;
  try {
    isIframe = typeof window !== 'undefined' && window.self !== window.top;
  } catch {
    isIframe = true;
  }

  let permissionState: 'granted' | 'denied' | 'prompt' | 'unknown' = 'unknown';
  try {
    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      if (status?.state === 'granted' || status?.state === 'denied' || status?.state === 'prompt') {
        permissionState = status.state;
      }
    }
  } catch {
    // Safari / Firefox / embedded WebViews may throw on permissions.query('microphone')
  }

  const hasMediaDevices = typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);
  const hasSpeechRecognition =
    typeof window !== 'undefined' &&
    Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  return {
    isSecureContext,
    isIframe,
    permissionState,
    hasMediaDevices,
    hasSpeechRecognition,
  };
}

/**
 * Acquire native MediaStream with automatic relaxed fallbacks for quirky drivers / WebViews / headsets.
 */
async function acquireNativeMediaStream(): Promise<{ stream: MediaStream | null; lastError: any }> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return { stream: null, lastError: new Error('mediaDevices.getUserMedia indisponible') };
  }

  let lastError: any = null;

  // Attempt 1: Ideal clinical voice constraints
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    return { stream, lastError: null };
  } catch (err1: any) {
    lastError = err1;
    console.warn('[Native Mic Attempt 1 notice]:', err1?.name, err1?.message);
  }

  // Attempt 2: Minimal native constraint { audio: true }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return { stream, lastError: null };
  } catch (err2: any) {
    lastError = err2;
    console.warn('[Native Mic Attempt 2 notice]:', err2?.name, err2?.message);
  }

  // Attempt 3: Explicit deviceId enumeration fallback (only if not hard NotAllowedError, or still worth probing if hardware busy)
  if (navigator.mediaDevices.enumerateDevices) {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter((d) => d.kind === 'audioinput' && d.deviceId);
      for (const dev of audioInputs) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: { ideal: dev.deviceId } },
          });
          return { stream, lastError: null };
        } catch (errDev: any) {
          lastError = errDev;
        }
      }
    } catch (enumErr) {
      console.warn('[Native Mic Enumerate notice]:', enumErr);
    }
  }

  return { stream: null, lastError };
}

/**
 * Encode Float32 PCM chunks into a standard 16-bit mono WAV Blob
 */
function encodeWavBlob(chunks: Float32Array[], sampleRate: number): Blob {
  const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
  const buffer = new ArrayBuffer(44 + totalLength * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + totalLength * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, 'data');
  view.setUint32(40, totalLength * 2, true);

  let offset = 44;
  for (const chunk of chunks) {
    for (let i = 0; i < chunk.length; i++) {
      const s = Math.max(-1, Math.min(1, chunk[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Send any recorded or OS-captured audio Blob/File to /api/voice-transcribe
 */
export async function transcribeAudioBlob(
  blob: Blob,
  mimeType?: string,
  context?: string
): Promise<string> {
  if (!blob || blob.size < 256) return '';

  const base64Data = await blobToBase64(blob);
  const cleanMime = (mimeType || blob.type || 'audio/webm').split(';')[0].trim() || 'audio/webm';

  const res = await fetch('/api/voice-transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audioData: base64Data,
      mimeType: cleanMime,
      context: context || 'Dictée médicale pneumologie CHREIN',
    }),
  });

  if (!res.ok) {
    const errPayload = await res.json().catch(() => ({}));
    throw new Error(errPayload?.error || `Erreur de transcription (${res.status})`);
  }

  const data = await res.json();
  return (data.text || '').trim();
}

export async function startDictationSession(options: DictationOptions): Promise<DictationSession> {
  const { onInterimText, onStatusChange, onError, context, fieldName, requestId } = options;

  let mediaStream: MediaStream | null = null;
  let mediaRecorder: MediaRecorder | null = null;
  let selectedMimeType = 'audio/webm';
  let audioChunks: Blob[] = [];

  // Web Audio PCM fallback state
  let audioCtx: AudioContext | null = null;
  let pcmProcessor: ScriptProcessorNode | null = null;
  let pcmSource: MediaStreamAudioSourceNode | null = null;
  let pcmChunks: Float32Array[] = [];
  let pcmSampleRate = 16000;

  let speechRecognition: any = null;
  let webSpeechText = '';
  let isAborted = false;
  let speechRecognitionActive = false;
  let nativeAudioActive = false;
  let micErrorDetails: any = null;

  onStatusChange?.('REQUESTING_MIC');

  // 1. Prioritize Native Hardware Microphone Stream (works reliably on Chrome, Firefox, Safari, Edge, Brave)
  const { stream, lastError } = await acquireNativeMediaStream();
  if (stream) {
    mediaStream = stream;

    // 1A. Start MediaRecorder with verified native MIME type
    if (typeof MediaRecorder !== 'undefined') {
      const candidateTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
        'audio/ogg',
        'audio/aac',
      ];
      let chosenType = '';
      for (const t of candidateTypes) {
        try {
          if (typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported(t)) {
            chosenType = t;
            break;
          }
        } catch {}
      }

      try {
        mediaRecorder = chosenType
          ? new MediaRecorder(mediaStream, { mimeType: chosenType })
          : new MediaRecorder(mediaStream);
        selectedMimeType = mediaRecorder.mimeType || chosenType || 'audio/webm';
        mediaRecorder.ondataavailable = (event: BlobEvent) => {
          if (event.data && event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };
        mediaRecorder.start(250);
        nativeAudioActive = true;
      } catch (mrErr) {
        console.warn('[MediaRecorder Init Fallback to WAV]:', mrErr);
        mediaRecorder = null;
      }
    }

    // 1B. If MediaRecorder unavailable or failed, use Web Audio PCM -> WAV recorder directly from mediaStream
    if (!nativeAudioActive) {
      try {
        const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          audioCtx = new AudioCtx();
          if (audioCtx.state === 'suspended') {
            await audioCtx.resume().catch(() => {});
          }
          pcmSampleRate = audioCtx.sampleRate || 44100;
          pcmSource = audioCtx.createMediaStreamSource(mediaStream);
          pcmProcessor = audioCtx.createScriptProcessor(4096, 1, 1);
          pcmProcessor.onaudioprocess = (e: AudioProcessingEvent) => {
            const input = e.inputBuffer.getChannelData(0);
            pcmChunks.push(new Float32Array(input));
          };
          pcmSource.connect(pcmProcessor);
          pcmProcessor.connect(audioCtx.destination);
          nativeAudioActive = true;
        }
      } catch (wavErr) {
        console.warn('[WebAudio PCM Fallback Warning]:', wavErr);
      }
    }

    // If mediaStream exists even without MediaRecorder/WebAudio, mark active only if recorder started
    if (!nativeAudioActive) {
      mediaStream.getTracks().forEach((t) => t.stop());
      mediaStream = null;
    }
  } else {
    micErrorDetails = lastError;
  }

  // 2. Attach Web Speech API:
  //    - If nativeAudioActive is true: purely non-blocking real-time interim preview (never fails the session!)
  //    - If nativeAudioActive is false: try SpeechRecognition as secondary engine and verify it actually starts cleanly.
  const SpeechRecognitionClass =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (SpeechRecognitionClass) {
    try {
      const sr = new SpeechRecognitionClass();
      sr.continuous = true;
      sr.interimResults = true;
      sr.lang = 'fr-FR';

      let srConfirmedStarted = false;
      let srFailedError: string | null = null;

      sr.onstart = () => {
        srConfirmedStarted = true;
      };

      sr.onresult = (event: any) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript + ' ';
        }
        const trimmed = fullTranscript.trim();
        webSpeechText = trimmed;
        onInterimText?.(trimmed);
      };

      sr.onerror = (e: any) => {
        if (e.error === 'no-speech' || e.error === 'aborted') return;
        srFailedError = e.error;
        console.warn('[SpeechRecognition Notice]:', e.error);
        // Only treat as fatal if we DO NOT have native audio recording running
        if (!nativeAudioActive && (e.error === 'not-allowed' || e.error === 'service-not-allowed' || e.error === 'audio-capture')) {
          micErrorDetails = micErrorDetails || e;
        }
      };

      sr.start();
      speechRecognition = sr;

      if (nativeAudioActive) {
        speechRecognitionActive = true;
      } else {
        // Give SpeechRecognition 350ms to either confirm start or fire asynchronous 'not-allowed'
        await new Promise((r) => setTimeout(r, 350));
        if (srFailedError === 'not-allowed' || srFailedError === 'service-not-allowed' || srFailedError === 'audio-capture') {
          try {
            sr.abort();
          } catch {}
          speechRecognition = null;
          speechRecognitionActive = false;
        } else if (srConfirmedStarted || !srFailedError) {
          speechRecognitionActive = true;
        }
      }
    } catch (srErr) {
      console.warn('[SpeechRecognition Init Notice]:', srErr);
    }
  }

  // 3. If NEITHER native hardware capture NOR SpeechRecognition could be activated, diagnose & trigger modal once
  if (!nativeAudioActive && !speechRecognitionActive) {
    const diagnostics = await getMicrophoneDiagnostics();
    const isDenied =
      diagnostics.permissionState === 'denied' ||
      micErrorDetails?.name === 'NotAllowedError' ||
      micErrorDetails?.name === 'PermissionDeniedError' ||
      micErrorDetails?.name === 'SecurityError' ||
      micErrorDetails?.error === 'not-allowed' ||
      (typeof micErrorDetails?.message === 'string' && micErrorDetails.message.toLowerCase().includes('denied'));

    let message = "Microphone inaccessible dans le navigateur. Utilisez l'enregistrement natif OS ou autorisez le micro.";
    if (!diagnostics.isSecureContext) {
      message = "Contexte non sécurisé (HTTPS requis). Utilisez la capture audio native OS ci-dessous.";
    } else if (diagnostics.isIframe && isDenied) {
      message = "Microphone bloqué par la fenêtre intégrée ou le navigateur. Utilisez la capture native OS ou ouvrez en plein écran.";
    } else if (isDenied) {
      message = "Accès au microphone refusé par le navigateur. Utilisez la capture native OS ou autorisez le micro (🔒).";
    } else if (micErrorDetails?.name === 'NotFoundError' || micErrorDetails?.name === 'DevicesNotFoundError') {
      message = "Aucun microphone détecté sur cet appareil. Utilisez un fichier audio ou la dictée système.";
    }

    onError?.(message);
    onStatusChange?.('IDLE');

    window.dispatchEvent(
      new CustomEvent('microphone-permission-denied', {
        detail: {
          message,
          fieldName: fieldName || context,
          requestId,
          diagnostics,
        },
      })
    );

    throw new Error(message);
  }

  onStatusChange?.('RECORDING');

  const releaseAllHardware = () => {
    if (speechRecognition) {
      try {
        speechRecognition.onstart = null;
        speechRecognition.onresult = null;
        speechRecognition.onerror = null;
        speechRecognition.onend = null;
        speechRecognition.abort();
      } catch {}
      speechRecognition = null;
    }
    if (pcmProcessor) {
      try {
        pcmProcessor.disconnect();
      } catch {}
      pcmProcessor = null;
    }
    if (pcmSource) {
      try {
        pcmSource.disconnect();
      } catch {}
      pcmSource = null;
    }
    if (audioCtx) {
      try {
        audioCtx.close().catch(() => {});
      } catch {}
      audioCtx = null;
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      mediaStream = null;
    }
  };

  const abort = () => {
    isAborted = true;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      try {
        mediaRecorder.stop();
      } catch {}
    }
    releaseAllHardware();
    onStatusChange?.('IDLE');
  };

  const stop = async (): Promise<string> => {
    if (isAborted) return '';

    if (speechRecognition) {
      try {
        speechRecognition.stop();
      } catch {}
    }

    // Collect MediaRecorder Blob or WAV Blob
    let recordedBlob: Blob | null = null;
    let mimeType = selectedMimeType || 'audio/webm';

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mimeType = mediaRecorder.mimeType || selectedMimeType || 'audio/webm';
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, 1200);
        mediaRecorder!.onstop = () => {
          clearTimeout(timer);
          recordedBlob = new Blob(audioChunks, { type: mimeType });
          resolve();
        };
        try {
          mediaRecorder!.stop();
        } catch {
          clearTimeout(timer);
          resolve();
        }
      });
    } else if (audioChunks.length > 0) {
      recordedBlob = new Blob(audioChunks, { type: mimeType });
    } else if (pcmChunks.length > 0) {
      recordedBlob = encodeWavBlob(pcmChunks, pcmSampleRate);
      mimeType = 'audio/wav';
    }

    releaseAllHardware();

    // If live Web Speech already captured a clean multi-character transcript, return immediately
    if (webSpeechText && webSpeechText.trim().length > 3) {
      onStatusChange?.('IDLE');
      return webSpeechText.trim();
    }

    // Otherwise transcribe captured native audio via /api/voice-transcribe (Gemini)
    if (recordedBlob && (recordedBlob as Blob).size > 400) {
      onStatusChange?.('TRANSCRIBING');
      try {
        const text = await transcribeAudioBlob(recordedBlob, mimeType, context);
        onStatusChange?.('IDLE');
        return text || webSpeechText || '';
      } catch (apiErr) {
        console.warn('[Transcription Fallback API Notice]:', apiErr);
      }
    }

    onStatusChange?.('IDLE');
    return webSpeechText || '';
  };

  return { stop, abort };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
