/**
 * Universal Audio Recorder & Dictation Engine for Clinical DPI
 * Supports Web Speech API (real-time) with seamless fallback to MediaRecorder + Gemini Speech-to-Text API.
 * Compatible with Chrome, Edge, Firefox, Safari, iOS, Android, and embedded iframes.
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
}

export async function startDictationSession(options: DictationOptions): Promise<DictationSession> {
  const { onInterimText, onStatusChange, onError, context } = options;

  let mediaStream: MediaStream | null = null;
  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: Blob[] = [];
  let speechRecognition: any = null;
  let webSpeechText = '';
  let isAborted = false;
  let speechRecognitionActive = false;
  let mediaRecorderActive = false;
  let micErrorDetails: any = null;

  onStatusChange?.('REQUESTING_MIC');

  // 1. Try initializing Web Speech API first (native in Chrome/Edge, works without separate getUserMedia prompt)
  const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (SpeechRecognitionClass) {
    try {
      speechRecognition = new SpeechRecognitionClass();
      speechRecognition.continuous = true;
      speechRecognition.interimResults = true;
      speechRecognition.lang = 'fr-FR';

      speechRecognition.onresult = (event: any) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript + ' ';
        }
        const trimmed = fullTranscript.trim();
        webSpeechText = trimmed;
        onInterimText?.(trimmed);
      };

      speechRecognition.onerror = (e: any) => {
        if (e.error !== 'no-speech' && e.error !== 'aborted') {
          console.warn('[SpeechRecognition Notice]:', e.error);
          if (e.error === 'not-allowed') {
            micErrorDetails = e;
            const msg = "Accès au microphone refusé par le navigateur. Autorisez le micro (icône 🔒).";
            onError?.(msg);
            window.dispatchEvent(new CustomEvent('microphone-permission-denied', {
              detail: { message: msg, fieldName: context }
            }));
          }
        }
      };

      speechRecognition.start();
      speechRecognitionActive = true;
    } catch (srErr) {
      console.warn('[SpeechRecognition Init Notice]:', srErr);
    }
  }

  // 2. Also try requesting standard MediaStream for MediaRecorder / Gemini server-side transcription
  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        }

        mediaRecorder = new MediaRecorder(mediaStream, { mimeType });
        mediaRecorder.ondataavailable = (event: BlobEvent) => {
          if (event.data && event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };
        mediaRecorder.start(250);
        mediaRecorderActive = true;
      }
    }
  } catch (micErr: any) {
    console.warn('[Microphone Access Warning]:', micErr);
    micErrorDetails = micErr;
    // If Web Speech API is actively running, do not block the session
  }

  // 3. If NEITHER Web Speech nor MediaRecorder could be started, trigger clear permission dialog
  if (!speechRecognitionActive && !mediaRecorderActive) {
    const isDenied = micErrorDetails?.name === 'NotAllowedError' || 
                     micErrorDetails?.name === 'PermissionDeniedError' || 
                     micErrorDetails?.name === 'SecurityError' ||
                     (typeof micErrorDetails?.message === 'string' && micErrorDetails.message.toLowerCase().includes('denied'));

    const message = isDenied
      ? "Accès au microphone refusé. Autorisez le micro via le cadenas 🔒 dans la barre d'adresse du navigateur."
      : "Microphone indisponible. Vérifiez les autorisations de votre navigateur.";

    onError?.(message);
    onStatusChange?.('IDLE');

    // Notify application to display guidance modal
    window.dispatchEvent(new CustomEvent('microphone-permission-denied', {
      detail: { message, fieldName: context }
    }));

    throw new Error(message);
  }

  onStatusChange?.('RECORDING');

  // Abort function
  const abort = () => {
    isAborted = true;
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
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      try { mediaRecorder.stop(); } catch {}
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
    }
    onStatusChange?.('IDLE');
  };

  // Stop & Finalize function
  const stop = async (): Promise<string> => {
    if (isAborted) return '';

    // Stop Web Speech API
    if (speechRecognition) {
      try {
        speechRecognition.stop();
      } catch {}
    }

    // Stop MediaRecorder and wait for final audio blob
    let recordedBlob: Blob | null = null;
    let mimeType = 'audio/webm';
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mimeType = mediaRecorder.mimeType || 'audio/webm';
      await new Promise<void>((resolve) => {
        mediaRecorder!.onstop = () => {
          recordedBlob = new Blob(audioChunks, { type: mimeType });
          resolve();
        };
        try { mediaRecorder!.stop(); } catch { resolve(); }
      });
    } else if (audioChunks.length > 0) {
      recordedBlob = new Blob(audioChunks, { type: mimeType });
    }

    // Release microphone hardware immediately
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
    }

    // If Web Speech API delivered a good transcript (> 1 word), prioritize it for instant speed!
    if (webSpeechText && webSpeechText.trim().length > 3) {
      onStatusChange?.('IDLE');
      return webSpeechText.trim();
    }

    // Otherwise, transcribe recorded audio via server Gemini Speech-to-Text API
    if (recordedBlob && (recordedBlob as Blob).size > 1000) {
      onStatusChange?.('TRANSCRIBING');
      try {
        const base64Data = await blobToBase64(recordedBlob);
        const res = await fetch('/api/voice-transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioData: base64Data,
            mimeType,
            context: context || 'Dictée médicale pneumologie'
          })
        });

        if (res.ok) {
          const data = await res.json();
          onStatusChange?.('IDLE');
          return data.text || webSpeechText || '';
        }
      } catch (apiErr) {
        console.warn('[Transcription Fallback API Notice]:', apiErr);
      }
    }

    onStatusChange?.('IDLE');
    return webSpeechText || '';
  };

  return { stop, abort };
}

// Convert audio blob to base64 string
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
