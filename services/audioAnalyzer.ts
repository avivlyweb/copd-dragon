export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private dataArray: Uint8Array | null = null;
  private stream: MediaStream | null = null;
  
  public isReady: boolean = false;

  async initialize(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: false, // Turn off for better spectral analysis
          noiseSuppression: false, // We want to hear the raw breath noise
          autoGainControl: false 
        } 
      });

      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 1024; // High resolution for frequency analysis
      this.analyser.smoothingTimeConstant = 0.2; // Fast response
      
      this.microphone = this.audioContext.createMediaStreamSource(this.stream);
      this.microphone.connect(this.analyser);
      
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.isReady = true;
    } catch (error) {
      console.error("Error accessing microphone:", error);
      throw error;
    }
  }

  // Returns spectral metrics
  getBreathMetrics(): { volume: number; quality: number } {
    if (!this.isReady || !this.analyser || !this.dataArray || !this.audioContext) {
      return { volume: 0, quality: 0 };
    }

    this.analyser.getByteFrequencyData(this.dataArray);

    const sampleRate = this.audioContext.sampleRate;
    const binSize = sampleRate / this.analyser.fftSize; // e.g., 48000 / 1024 = ~46.8Hz per bin

    // Define Frequency Bands
    // Low Band: 0Hz - 600Hz (Mains hum, Traffic, Human Voice Fundamentals)
    const lowStartBin = Math.floor(0 / binSize);
    const lowEndBin = Math.floor(600 / binSize);

    // High Band: 2000Hz - 8000Hz (The "Hiss" of Pursed Lip Breathing)
    const highStartBin = Math.floor(2000 / binSize);
    const highEndBin = Math.floor(8000 / binSize);

    let lowEnergy = 0;
    let highEnergy = 0;

    // Calculate Low Energy Average
    for (let i = lowStartBin; i <= lowEndBin; i++) {
      lowEnergy += this.dataArray[i];
    }
    lowEnergy /= (lowEndBin - lowStartBin + 1);

    // Calculate High Energy Average
    for (let i = highStartBin; i <= highEndBin; i++) {
      highEnergy += this.dataArray[i];
    }
    highEnergy /= (highEndBin - highStartBin + 1);

    // --- METRICS CALCULATION ---

    // Volume: We primarily care about the High Band volume for breath intensity.
    // Scale: 0-255 -> 0.0-1.0
    // We amplify it slightly because breath sounds are quiet.
    const volume = Math.min(1.0, (highEnergy / 255) * 4.0);

    // Quality: The ratio of High Frequency content to Low Frequency content.
    // PLB has high hiss (High Freq) and low voice (Low Freq).
    // Talking has high voice (Low Freq) and low hiss (High Freq).
    // A value close to 1.0 means "Pure Hiss". A value near 0 means "Pure Hum".
    
    // Protection against division by zero
    const denominator = lowEnergy + highEnergy + 1; 
    const quality = highEnergy / denominator;

    return { volume, quality };
  }

  cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.isReady = false;
  }
}