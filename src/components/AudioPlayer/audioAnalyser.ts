class AudioAnalyser {
  private audioCtx?: AudioContext;
  public analyser?: AnalyserNode;
  public buffer?: Uint8Array<ArrayBuffer>;

  initAnalyser(): void {
    this.audioCtx = new AudioContext();
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 512;
    this.buffer = new Uint8Array();
  }

  createAnalyser(audio: HTMLMediaElement): void {
    if (!this.analyser) {
      return;
    }

    this.buffer = new Uint8Array(this.analyser.frequencyBinCount);
    this.connectAudio(audio);
  }

  connectAudio(audio: HTMLMediaElement): void {
    if (!this.analyser || !this.audioCtx) {
      return;
    }

    const source = this.audioCtx.createMediaElementSource(audio);
    source.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);
  }
}

const audioAnalyser = new AudioAnalyser();

export default audioAnalyser;
