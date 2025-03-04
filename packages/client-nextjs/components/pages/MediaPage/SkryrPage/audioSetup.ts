import { useRef, useEffect } from "react";

export const useAudioSetup = (audioElement: HTMLAudioElement | null) => {
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const initializedRef = useRef(false);

    useEffect(() => {
        if (!audioElement || initializedRef.current) return;

        const context = new AudioContext();
        const source = context.createMediaElementSource(audioElement);
        const analyserNode = context.createAnalyser();
        analyserNode.fftSize = 256;

        source.connect(analyserNode);
        analyserNode.connect(context.destination);

        audioContextRef.current = context;
        analyserRef.current = analyserNode;
        initializedRef.current = true;

        console.log("Audio setup complete");

        (window as any).sharedAudioCtx = context;
        (window as any).sharedAnalyser = analyserNode;
        (window as any).sharedAudioElement = audioElement;

        return () => {
            if (audioContextRef.current && audioContextRef.current.state !== "closed") {
                audioContextRef.current.close().then(() => {
                    console.log("AudioContext closed");
                    audioContextRef.current = null;
                    analyserRef.current = null;
                    initializedRef.current = false;
                    delete (window as any).sharedAudioCtx;
                    delete (window as any).sharedAnalyser;
                    delete (window as any).sharedAudioElement;
                }).catch((e) => console.error("Error closing AudioContext:", e));
            }
        };
    }, [audioElement]);

    const resumeAudio = () => {
        if (audioContextRef.current && audioContextRef.current.state === "suspended") {
            audioContextRef.current.resume().then(() => console.log("AudioContext resumed"));
        }
    };

    return { audioContext: audioContextRef.current, analyser: analyserRef.current, resumeAudio };
};