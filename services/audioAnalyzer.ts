export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private dataArray: Uint8Array | null = null;
  private stream: MediaStream | null = null;
  
  public isReady: boolean = false;
  public baselineNoise: number = 0.05; // Default baseline

  async initialize(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false // Important for spirometry: we want raw volume changes
        } 
      });

      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create Filter: High-pass at 800Hz.
      // This removes deep voices, AC hum, and traffic, isolating the "hiss" of breath.
      this.filter = this.audioContext.createBiquadFilter();
      this.filter.type = 'highpass';
      this.filter.frequency.value = 800; 

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512; // Higher resolution
      this.analyser.smoothingTimeConstant = 0.3; // Responsive
      
      this.microphone = this.audioContext.createMediaStreamSource(this.stream);
      
      // Chain: Mic -> Filter -> Analyser
      this.microphone.connect(this.filter);
      this.filter.connect(this.analyser);
      
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.isReady = true;
    } catch (error) {
      console.error("Error accessing microphone:", error);
      throw error;
    }
  }

  // Returns normalized volume (0-1) relative to expected breath levels
  getVolume(): number {
    if (!this.isReady || !this.analyser || !this.dataArray) return 0;

    this.analyser.getByteFrequencyData(this.dataArray);

    let sum = 0;
    const length = this.dataArray.length;
    
    // We only care about the filtered input now.
    for (let i = 0; i < length; i++) {
      sum += this.dataArray[i] * this.dataArray[i];
    }
    
    const rms = Math.sqrt(sum / length);
    
    // Normalize logic: 
    // Typical breath RMS might be 10-50 depending on mic. Max is 255.
    // We scale it so 0.0 is silence, 1.0 is a strong blow.
    const normalized = Math.min(1, rms / 60); 
    return normalized;
  }

  // Measures background noise for a few frames
  setBaseline(noiseLevel: number) {
    this.baselineNoise = noiseLevel;
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