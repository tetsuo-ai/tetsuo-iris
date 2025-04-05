class AsioAudioProcessor {
    private audioContext: AudioContext;
    private gainNode: GainNode;
    private equalizerNode: BiquadFilterNode;
    private analyserNode: AnalyserNode;
    private mediaSources: Map<HTMLMediaElement, MediaElementAudioSourceNode> = new Map();
    private customSources: AudioNode[] = [];

    constructor() {
        this.audioContext = new AudioContext({ latencyHint: "interactive" });
        this.gainNode = this.audioContext.createGain();
        this.equalizerNode = this.audioContext.createBiquadFilter();
        this.equalizerNode.type = "peaking";
        this.equalizerNode.frequency.value = 1000;
        this.equalizerNode.gain.value = 0;

        this.analyserNode = this.audioContext.createAnalyser();
        this.analyserNode.fftSize = 256;

        this.equalizerNode.connect(this.gainNode);
        this.gainNode.connect(this.analyserNode);
        this.analyserNode.connect(this.audioContext.destination);

        (window as any).sharedAudioCtx = this.audioContext;
        (window as any).sharedAnalyser = this.analyserNode;
    }

    public getAudioContext(): AudioContext {
        return this.audioContext;
    }

    public getAnalyser(): AnalyserNode {
        return this.analyserNode;
    }

    public connectMediaElement(element: HTMLMediaElement): boolean {
        if (!element || this.mediaSources.has(element)) return false;

        try {
            const source = this.audioContext.createMediaElementSource(element);
            source.connect(this.equalizerNode);
            this.mediaSources.set(element, source);
            console.log("Media element connected:", element.src || "No src yet");
            return true;
        } catch (error) {
            console.warn(`Media element connection failed: ${error}`);
            return false;
        }
    }

    public isMediaElementConnected(element: HTMLMediaElement): boolean {
        return this.mediaSources.has(element);
    }

    public connectAudioSource(source: AudioNode) {
        if (!this.customSources.includes(source)) {
            source.connect(this.equalizerNode);
            this.customSources.push(source);
        }
    }

    public getAudioData(): Uint8Array {
        const data = new Uint8Array(this.analyserNode.frequencyBinCount);
        this.analyserNode.getByteFrequencyData(data);
        return data;
    }

    public setVolume(volume: number) {
        this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }

    // Added method to get current gain value
    public getGainValue(): number {
        return this.gainNode.gain.value;
    }

    public setEqualizer(frequency: number, gain: number) {
        this.equalizerNode.frequency.value = frequency;
        this.equalizerNode.gain.value = gain;
    }

    public resume() {
        if (this.audioContext.state === "suspended") {
            this.audioContext.resume();
        }
    }

    public dispose() {
        this.mediaSources.forEach((source, element) => {
            source.disconnect();
            this.mediaSources.delete(element);
        });
        this.customSources.forEach(source => source.disconnect());
        this.customSources = [];
        this.equalizerNode.disconnect();
        this.gainNode.disconnect();
        this.analyserNode.disconnect();
        this.audioContext.close();
        delete (window as any).sharedAudioCtx;
        delete (window as any).sharedAnalyser;
    }
}

export default AsioAudioProcessor;