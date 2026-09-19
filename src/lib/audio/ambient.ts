/**
 * Música de fondo generada con Web Audio.
 *
 * Un pad de tres voces afinadas en La. Suena a "música de meditación" porque
 * literalmente lo es: seno + quinta + octava con un filtro suave y un LFO muy
 * lento. Cero ficheros, cero licencias, cero MB, y no se repite nunca.
 */
export class AmbientPad {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private nodes: OscillatorNode[] = [];

  async start(volume = 0.055): Promise<void> {
    if (typeof window === "undefined") return;
    if (this.ctx && this.ctx.state === "running") return;

    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === "suspended") await this.ctx.resume();
    if (this.nodes.length) {
      this.master?.gain.setTargetAtTime(volume, this.ctx.currentTime, 1.5);
      return;
    }

    const ctx = this.ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    filter.Q.value = 0.5;

    this.master.connect(filter).connect(ctx.destination);

    // La2, Mi3, La3: intervalo abierto, sin tensión.
    for (const [freq, gain, detune] of [
      [110, 0.5, 0],
      [164.81, 0.3, 4],
      [220, 0.22, -6],
    ]) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.detune.value = detune;

      const voice = ctx.createGain();
      voice.gain.value = gain;

      // Un latido muy lento por voz: evita que el pad suene estático.
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.05 + Math.random() * 0.05;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = gain * 0.35;
      lfo.connect(lfoGain).connect(voice.gain);
      lfo.start();

      osc.connect(voice).connect(this.master);
      osc.start();
      this.nodes.push(osc, lfo);
    }

    this.master.gain.setTargetAtTime(volume, ctx.currentTime, 2);
  }

  stop(): void {
    if (!this.ctx || !this.master) return;
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.6);
  }

  dispose(): void {
    this.nodes.forEach((n) => {
      try {
        n.stop();
      } catch {
        /* ya parado */
      }
    });
    this.nodes = [];
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
  }
}
