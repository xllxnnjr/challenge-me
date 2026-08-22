/**
 * Speech Recognition, Microphone Audio Analysis, and AI Speech Evaluation
 */

export interface SpeechEvaluationResult {
  success: boolean;
  isCorrect: boolean;
  accuracyScore: number;
  detectedSpeech: string;
  pronunciationQuality: string;
  feedback: string;
  repsDetected?: number;
  bonusPoints?: number;
  error?: string;
}

export interface SpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
  onStart?: () => void;
}

// Check if Speech Recognition is supported in current browser
export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

// Check if Microphone (getUserMedia) is supported
export function isMicrophoneSupported(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices && !!navigator.mediaDevices.getUserMedia;
}

export class SpeechManager {
  private recognition: any = null;
  private isListening = false;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  // Start real-time speech recognition
  startListening(options: SpeechRecognitionOptions = {}) {
    if (this.isListening) {
      this.stopListening();
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      if (options.onError) {
        options.onError('Speech recognition is not supported in this browser environment. You can still tap to verify!');
      }
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = options.continuous ?? true;
      this.recognition.interimResults = options.interimResults ?? true;
      this.recognition.lang = options.lang ?? 'en-US';
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isListening = true;
        options.onStart?.();
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        const fullText = (finalTranscript + interimTranscript).trim();
        options.onResult?.(fullText, !!finalTranscript);
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          options.onError?.(`Mic notice: ${event.error}`);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        options.onEnd?.();
      };

      this.recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      options.onError?.(err.message || 'Microphone access failed');
    }
  }

  // Start Audio Meter & AudioContext for visual waveform
  async startAudioAnalyser(onVolumeChange?: (volume: number) => void): Promise<AnalyserNode | null> {
    try {
      if (!isMicrophoneSupported()) return null;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.micStream = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.8;
      source.connect(this.analyser);

      // Optional volume tracking loop
      if (onVolumeChange) {
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        const updateLoop = () => {
          if (!this.analyser || !this.isListening) return;
          this.analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          const normalizedVol = Math.min(1, average / 128);
          onVolumeChange(normalizedVol);

          if (this.isListening) {
            requestAnimationFrame(updateLoop);
          }
        };
        requestAnimationFrame(updateLoop);
      }

      return this.analyser;
    } catch (err) {
      console.warn('Could not initialize microphone visual analyser:', err);
      return null;
    }
  }

  // Stop listening and audio analysis
  stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
      this.recognition = null;
    }
    this.isListening = false;

    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (e) {
        // ignore
      }
      this.audioContext = null;
    }
    this.analyser = null;
  }

  getListeningState(): boolean {
    return this.isListening;
  }
}

// Singleton speech manager instance
export const speechManager = new SpeechManager();

// Send spoken text / audio to the backend AI evaluation endpoint
export async function evaluateSpeechWithAI(params: {
  challengeType: string;
  targetText?: string;
  spokenText?: string;
  expectedAnswer?: string;
  question?: string;
  targetReps?: number;
  difficulty?: string;
}): Promise<SpeechEvaluationResult> {
  try {
    const res = await fetch('/api/evaluate-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data: SpeechEvaluationResult = await res.json();
    return data;
  } catch (err: any) {
    console.error('Speech AI evaluation failed:', err);
    // Graceful offline fallback evaluation
    const cleanSpoken = (params.spokenText || '').toLowerCase().trim();
    const cleanTarget = (params.targetText || params.expectedAnswer || '').toLowerCase().trim();
    const isCorrect = cleanSpoken.length > 0 && cleanTarget.length > 0 && cleanSpoken.includes(cleanTarget);

    return {
      success: true,
      isCorrect,
      accuracyScore: isCorrect ? 90 : 50,
      detectedSpeech: params.spokenText || 'Spoken input',
      pronunciationQuality: isCorrect ? 'Good' : 'Needs Practice',
      feedback: isCorrect
        ? 'Speech recognized successfully!'
        : 'Could not clearly verify speech match. Try once more or tap to complete.',
      repsDetected: isCorrect ? params.targetReps || 1 : 0,
      bonusPoints: isCorrect ? 5 : 0,
    };
  }
}

// Synthesize text with browser SpeechSynthesis (Text to speech for challenge readout)
export function speakPrompt(text: string, onEnd?: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    if (onEnd) {
      utterance.onend = onEnd;
    }
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Speech synthesis error:', e);
  }
}
