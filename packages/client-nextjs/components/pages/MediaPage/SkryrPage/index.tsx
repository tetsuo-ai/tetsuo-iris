"use client";

import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Workspace, { MediaItem, MixBlendMode, MediaItem as WorkspaceMediaItem, MixBlendMode as WorkspaceMixBlendMode } from "./Workspace";
import { useDrag, MediaItem as DragMediaItem } from "./hooks/useDrag";
import { ExtendedMediaItem } from "./ui/skryr-toolbar";
import { KeyMapping, VirtualKeyboard } from "./VirtualKeyboard"; // Add VirtualKeyboard import
import { useEffects } from "./hooks/useEffects";
import { WebampMilkdrop, WebampMilkdropProps } from "./WebampMilkdrop";
// import VirtualKeyboard, { KeyMapping, MediaItem as VirtualKeyboardMediaItem } from "./VirtualKeyboard";
import { useFullscreen } from "./hooks/useFullscreen";
import { useMediaState, CustomTextItem } from "./hooks/useMediaState";
// import { useDrag, MediaItem as DragMediaItem } from "./hooks/useDrag";
import AsioAudioProcessor from "./AsioAudioProcess";
import { Button } from "@/components/ui/button";
import Slider from "@/components/ui/slider";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import UnboundMediaList from "@/components/pages/MediaPage/SkryrPage/ui/skryr-unbound-media"; // Add this import at the top

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

const SkryrToolbar = dynamic(() => import("@/components/pages/MediaPage/SkryrPage/ui/skryr-toolbar"), { ssr: false });
const SkryrPalette = dynamic(() => import("@/components/pages/MediaPage/SkryrPage/ui/skryr-palette"), { ssr: false });

type SelectedElement = { type: "media" | "customText"; index: number; fileName?: string } | null; 
type SelectedLayer = "milkdrop" | "matrix" | "ascii" | "allMedia" | "background" | null;

interface SkryrPageProps {
    backgroundEnabled?: boolean;
}

const defaultMediaItems: ExtendedMediaItem[] = [
    {
        type: "image",
        src: "https://eaccelerate.me/tetsuo/tetsuo-unit-frame.gif",
        x: 10,
        y: 10,
        scale: 1,
        rotation: 0,
        opacity: 1,
        visible: true,
        interruptOnPlay: false,
        isManuallyControlled: true,
        showAt: 0,
        hideAt: Infinity,
        mixBlendMode: "normal",
    },
    {
        type: "image",
        src: "https://eaccelerate.me/tetsuo/skryrblendingdemo.gif",
        x: 20,
        y: 20,
        scale: 1,
        rotation: 0,
        opacity: 1,
        visible: false,
        interruptOnPlay: true,
        isManuallyControlled: true,
        showAt: 2,
        hideAt: Infinity,
        mixBlendMode: "normal",
        showControls: true,
    },
    {
        type: "image",
        src: "https://eaccelerate.me/tetsuo/neuro-gifs.gif",
        x: 30,
        y: 30,
        scale: 1,
        rotation: 0,
        opacity: 1,
        visible: false,
        interruptOnPlay: true,
        isManuallyControlled: true,
        showAt: 3,
        hideAt: Infinity,
        mixBlendMode: "normal",
        showControls: true,
    },
];

const SkryrPage: React.FC<SkryrPageProps> = ({ backgroundEnabled = true }) => {
    const [isClient, setIsClient] = useState(false);
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
    const [isPlaying, setIsPlaying] = useState(false);
    const [isStarted, setIsStarted] = useState(true);
    const [webampReady, setWebampReady] = useState(false);
    const [audioReady, setAudioReady] = useState(false);
    const [countdown, setCountdown] = useState<number>(5);
    const [matrixEnabled, setMatrixEnabled] = useState(true);
    const [asciiEnabled, setAsciiEnabled] = useState(true);
    const [visualizerEnabled, setVisualizerEnabled] = useState(backgroundEnabled);
    const [showWinamp, setShowWinamp] = useState(false);
    const [showGiphyKeyboard, setShowGiphyKeyboard] = useState(true);
    const [showVirtualKeyboard, setShowVirtualKeyboard] = useState(true);
    const [showMediaPanel, setShowMediaPanel] = useState(true);
    const [showUnboundMediaList, setShowUnboundMediaList] = useState(true);
    const [showPalette, setShowPalette] = useState(true);
    const [showLayerPanel, setShowLayerPanel] = useState(true);
    const [selectedElement, setSelectedElement] = useState<SelectedElement>(null);
    const [selectedLayer, setSelectedLayer] = useState<SelectedLayer>(null);
    const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(32));
    const [zoomLevel, setZoomLevel] = useState(1);
    const [primaryAudioSrc, setPrimaryAudioSrc] = useState<string>("");
    const [fps, setFps] = useState(0);
    const [activeMediaIndex, setActiveMediaIndex] = useState<number | null>(null);
    const [computedColor, setComputedColor] = useState("#00ff00");
    const [matrixMixBlendMode, setMatrixMixBlendMode] = useState<MixBlendMode>("screen");
    const [asciiMixBlendMode, setAsciiMixBlendMode] = useState<MixBlendMode>("normal");
    const [allMediaMixBlendMode, setAllMediaMixBlendMode] = useState<MixBlendMode>("normal");
    const [backgroundMixBlendMode, setBackgroundMixBlendMode] = useState<MixBlendMode>("normal");
    const [milkdropOpacity, setMilkdropOpacity] = useState<number>(1);
    const [matrixOpacity, setMatrixOpacity] = useState<number>(1);
    const [asciiOpacity, setAsciiOpacity] = useState<number>(1);
    const [allMediaOpacity, setAllMediaOpacity] = useState<number>(1);
    const [backgroundOpacity, setBackgroundOpacity] = useState<number>(0);
    const [milkdropGamma, setMilkdropGamma] = useState<number>(1);
    const [matrixGamma, setMatrixGamma] = useState<number>(1);
    const [asciiGamma, setAsciiGamma] = useState<number>(1);
    const [allMediaGamma, setAllMediaGamma] = useState<number>(1);
    const [backgroundGamma, setBackgroundGamma] = useState<number>(1);
    const [milkdropSaturation, setMilkdropSaturation] = useState<number>(1);
    const [matrixSaturation, setMatrixSaturation] = useState<number>(1);
    const [asciiSaturation, setAsciiSaturation] = useState<number>(1);
    const [allMediaSaturation, setAllMediaSaturation] = useState<number>(1);
    const [backgroundSaturation, setBackgroundSaturation] = useState<number>(1);
    const [layerOrder, setLayerOrder] = useState<string[]>(["background", "matrix", "milkdrop", "ascii", "allMedia"]);
    const [backgroundColor, setBackgroundColor] = useState<string>("#000000");
    const [backgroundMedia, setBackgroundMedia] = useState<string | null>(null);
    const [backgroundScale, setBackgroundScale] = useState<number>(1);
    const [backgroundRotation, setBackgroundRotation] = useState<number>(0);
    const [backgroundX, setBackgroundX] = useState<number>(0);
    const [backgroundY, setBackgroundY] = useState<number>(0);
    const [backgroundLoop, setBackgroundLoop] = useState<boolean>(true);
    const [backgroundAutoplay, setBackgroundAutoplay] = useState<boolean>(true);
    const [isRecording, setIsRecording] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
    const [useAsioProcessing, setUseAsioProcessing] = useState<boolean>(true);
    const [webampAudioElement, setWebampAudioElement] = useState<HTMLAudioElement | null>(null);
    const [volume, setVolume] = useState<number>(1);
    const [eqFrequency, setEqFrequency] = useState<number>(1000);
    const [eqGain, setEqGain] = useState<number>(0);
    const [showAudioPanel, setShowAudioPanel] = useState(false);
    const [media404List, setMedia404List] = useState<string[]>([]);
    const [isPreparingFile, setIsPreparingFile] = useState<boolean>(false);
    const [prepStatus, setPrepStatus] = useState<"preparing" | "done" | "fucked" | null>(null);
    const [isFFmpegLoaded, setIsFFmpegLoaded] = useState(false);

    const [streamBitrate, setStreamBitrate] = useState(2500000);
    const [streamResolution, setStreamResolution] = useState("1920x1080");
    const [streamServerUrl, setStreamServerUrl] = useState("");
    const [streamKey, setStreamKey] = useState("");

    const recordedChunksRef = useRef<Blob[]>([]);
    const ffmpegRef = useRef<FFmpeg | null>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    // const asioAudioRef = useRef<HTMLAudioElement>(null);
    const matrixCanvasRef = useRef<HTMLCanvasElement>(null);
    const barCanvasRef = useRef<HTMLCanvasElement>(null);
    const visualizerCanvasRef = useRef<HTMLCanvasElement>(null);
    const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
    const backgroundVideoRef = useRef<HTMLVideoElement>(null);
    const processorRef = useRef<AsioAudioProcessor | null>(null);

    const { isFullscreen, workspaceDimensions, handleToggleFullscreen } = useFullscreen();
    const { mediaList: baseMediaList, setMediaList: setBaseMediaList, customTexts, setCustomTexts, keyMappings, setKeyMappings } =
        useMediaState(isFullscreen);
    const [mediaList, setMediaList] = useState<ExtendedMediaItem[]>(defaultMediaItems);


    // For useDrag (matches DragMediaItem)
    const mediaListForDrag: DragMediaItem[] = mediaList
        .filter(item => ["audio", "video", "image"].includes(item.type))
        .map(item => ({
            type: item.type as "audio" | "video" | "image",
            src: item.src,
            x: item.x,
            y: item.y,
            scale: item.scale,
            rotation: item.rotation,
            opacity: item.opacity,
            visible: item.visible,
            showAt: item.showAt,
            hideAt: item.hideAt,
            isManuallyControlled: item.isManuallyControlled,
            interruptOnPlay: item.interruptOnPlay,
        }));

    const { onImageMouseDown, onCustomTextMouseDown } = useDrag(
        mediaListForDrag,
        customTexts,
        (list) => setMediaList(prev => {
            const updatedList = prev.map(item => {
                const match = list.find(dragItem => dragItem.src === item.src);
                return match ? { ...item, ...match } : item;
            });
            return updatedList as ExtendedMediaItem[];
        }),
        setCustomTexts
    );
    // Refs for persistent audio elements
    // const asioAudioRef = useRef<HTMLAudioElement | null>(null);

    // Initialize processor and asioAudio once on mount
    useEffect(() => {
        processorRef.current = new AsioAudioProcessor();

        asioAudioRef.current = new Audio();
        asioAudioRef.current.className = "hidden";
        document.body.appendChild(asioAudioRef.current);

        return () => {
            processorRef.current?.dispose();
            processorRef.current = null;
            if (asioAudioRef.current && document.body.contains(asioAudioRef.current)) {
                document.body.removeChild(asioAudioRef.current);
            }
            asioAudioRef.current = null;
        };
    }, []);

    // Connect media elements and lock volume
    useEffect(() => {
        if (!useAsioProcessing) {
            if (audioRef.current) {
                audioRef.current.muted = false;
                audioRef.current.volume = volume;
                console.log("Non-ASIO volume set to:", volume);
            }
            setAudioReady(true);
            return;
        }

        if (!processorRef.current || !asioAudioRef.current) return;

        if (!processorRef.current.isMediaElementConnected(asioAudioRef.current)) {
            processorRef.current.connectMediaElement(asioAudioRef.current);
            asioAudioRef.current.muted = false;
        }

        processorRef.current.setVolume(volume);
        asioAudioRef.current.volume = volume;
        console.log("ASIO volume set to:", volume);

        setAudioReady(true);
    }, [useAsioProcessing, volume]);

    // Sync audio source and handle playback
    useEffect(() => {
        if (!useAsioProcessing || !processorRef.current || !audioRef.current || !asioAudioRef.current) return;

        const syncAudio = () => {
            if (audioRef.current && asioAudioRef.current && audioRef.current.src !== asioAudioRef.current.src) {
                asioAudioRef.current.src = audioRef.current.src;
                if (isPlaying) asioAudioRef.current.play().catch(err => console.error("ASIO sync play error:", err));
            }
        };

        processorRef.current.resume();
        if (isPlaying) {
            audioRef.current.play().catch(err => console.error("Audio play error:", err));
            if (audioRef.current.src && asioAudioRef.current) {
                asioAudioRef.current.play().catch(err => console.error("ASIO play error:", err));
            }
        } else {
            audioRef.current.pause();
            asioAudioRef.current.pause();
        }

        processorRef.current.setVolume(volume);
        asioAudioRef.current.volume = volume;
        audioRef.current.volume = volume;
        console.log("Volume reapplied during playback sync:", volume);

        audioRef.current.addEventListener("play", syncAudio);
        audioRef.current.addEventListener("pause", () => asioAudioRef.current?.pause());
        audioRef.current.addEventListener("ended", () => asioAudioRef.current?.pause());

        return () => {
            audioRef.current?.removeEventListener("play", syncAudio);
            audioRef.current?.removeEventListener("pause", () => asioAudioRef.current?.pause());
            audioRef.current?.removeEventListener("ended", () => asioAudioRef.current?.pause());
        };
    }, [useAsioProcessing, isPlaying, volume]);



    const [isClearingAll, setIsClearingAll] = useState(false);


    const handleClearAllMedia = useCallback(() => {
        console.log("handleClearAllMedia called");
        setMediaList(() => []);
        setKeyMappings(() => []);
        setSelectedElement(null);
        setActiveMediaIndex(null);
        setIsClearingAll(true);
        localStorage.removeItem("skryrMediaList");
        localStorage.removeItem("skryrKeyMappings");
    }, [setMediaList, setKeyMappings]);


    useEffect(() => {
        const savedMedia = localStorage.getItem("skryrMediaList");
        const savedMappings = localStorage.getItem("skryrKeyMappings");
        const savedPanels = localStorage.getItem("skryrPanels");

        if (isClearingAll) {
            console.log("Skipping localStorage load due to clear");
            setIsClearingAll(false);
            return;
        }

        if (savedMedia) {
            const parsedMedia: ExtendedMediaItem[] = JSON.parse(savedMedia);
            console.log("Loading media from localStorage:", parsedMedia);
            setMediaList(parsedMedia.length > 0 ? parsedMedia : defaultMediaItems);
        } else {
            setMediaList(defaultMediaItems);
        }

        if (savedMappings) {
            const parsedMappings: KeyMapping[] = JSON.parse(savedMappings);
            console.log("Loading keyMappings from localStorage:", parsedMappings);
            setKeyMappings(parsedMappings);
        }

        if (savedPanels) {
            const { giphy, keyboard, media, unbound, layer } = JSON.parse(savedPanels);
            setShowGiphyKeyboard(giphy);
            setShowVirtualKeyboard(keyboard);
            setShowMediaPanel(media);
            setShowUnboundMediaList(unbound);
            setShowLayerPanel(layer);
        }
    }, [setMediaList, setKeyMappings, isClearingAll, defaultMediaItems]);

    useEffect(() => {
        localStorage.setItem("skryrMediaList", JSON.stringify(mediaList));
        localStorage.setItem("skryrKeyMappings", JSON.stringify(keyMappings));
        localStorage.setItem("skryrPanels", JSON.stringify({
            giphy: showGiphyKeyboard,
            keyboard: showVirtualKeyboard,
            media: showMediaPanel,
            unbound: showUnboundMediaList,
            layer: showLayerPanel,
        }));
    }, [mediaList, keyMappings, showGiphyKeyboard, showVirtualKeyboard, showMediaPanel, showUnboundMediaList, showLayerPanel]);
    const checkMediaValidity = useCallback((item: ExtendedMediaItem, index: number) => {
        if (item.src.startsWith("blob:")) {
            console.log(`Skipping validity check for blob URL: ${item.src}`);
            return;
        }
        fetch(item.src, { method: "HEAD", mode: "no-cors" })
            .then(response => {
                if (!response.ok) {
                    setMedia404List(prev => [...new Set([...prev, item.src])]);
                    setMediaList(prev => {
                        const newList = prev.filter((_, i) => i !== index);
                        setKeyMappings(prevMappings => {
                            const newMappings = prevMappings.map(mapping => {
                                if (mapping.assignedIndex === index) {
                                    return { ...mapping, assignedIndex: null };
                                }
                                if (mapping.assignedIndex !== null && mapping.assignedIndex > index) {
                                    return { ...mapping, assignedIndex: mapping.assignedIndex - 1 };
                                }
                                return mapping;
                            });
                            return newMappings;
                        });
                        return newList;
                    });
                }
            })
            .catch(() => {
                setMedia404List(prev => [...new Set([...prev, item.src])]);
                setMediaList(prev => {
                    const newList = prev.filter((_, i) => i !== index);
                    setKeyMappings(prevMappings => {
                        const newMappings = prevMappings.map(mapping => {
                            if (mapping.assignedIndex === index) {
                                return { ...mapping, assignedIndex: null };
                            }
                            if (mapping.assignedIndex !== null && mapping.assignedIndex > index) {
                                return { ...mapping, assignedIndex: mapping.assignedIndex - 1 };
                            }
                            return mapping;
                        });
                        return newMappings;
                    });
                    return newList;
                });
            });
    }, [setMediaList, setKeyMappings, setMedia404List]);

    // Clear 404 media
    const handleClear404Media = useCallback(() => {
        console.log("Clearing 404 media");
        setMediaList(prev => {
            const newList = prev.filter(item => !media404List.includes(item.src));
            console.log("Media list after clearing 404s:", newList);
            setKeyMappings(prevMappings => {
                const newMappings = prevMappings.map(mapping => {
                    if (mapping.assignedIndex !== null &&
                        !newList.some(item => item.src === (mapping.assignedIndex !== null ? mediaList[mapping.assignedIndex]?.src : undefined))) {
                        return { ...mapping, assignedIndex: null };
                    }
                    return mapping;
                });
                console.log("Key mappings after clearing 404s:", newMappings);
                localStorage.setItem("skryrKeyMappings", JSON.stringify(newMappings));
                return newMappings;
            });
            localStorage.setItem("skryrMediaList", JSON.stringify(newList));
            return newList;
        });
        setMedia404List([]);
    }, [mediaList, media404List, setMediaList, setKeyMappings]);

    // Toggle recording with system audio at 320 kbps and ultra-fast volume lock
    const toggleRecording = useCallback(async () => {
        if (!isRecording && !isStreaming) {
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({
                    video: { displaySurface: "monitor" },
                    audio: { echoCancellation: false, noiseSuppression: false, sampleRate: 44100 }, // Prompt for system audio
                });

                const recorder = new MediaRecorder(stream, {
                    mimeType: "video/webm;codecs=vp8,opus",
                    videoBitsPerSecond: 2500000, // 2.5 Mbps for video
                    audioBitsPerSecond: 320000,  // 320 kbps for audio
                });
                setMediaRecorder(recorder);
                recordedChunksRef.current = [];
                setIsPreparingFile(false);
                setPrepStatus(null);

                recorder.ondataavailable = (e) => {
                    if (e.data.size > 0) {
                        recordedChunksRef.current.push(e.data);
                    }
                };

                recorder.onstop = async () => {
                    setIsPreparingFile(true);
                    setPrepStatus("preparing");

                    const webmBlob = new Blob(recordedChunksRef.current, { type: "video/webm" });
                    if (ffmpegRef.current && ffmpegRef.current.loaded) {
                        try {
                            const webmArrayBuffer = await webmBlob.arrayBuffer();
                            await ffmpegRef.current.writeFile("input.webm", new Uint8Array(webmArrayBuffer));
                            await ffmpegRef.current.exec([
                                "-i", "input.webm",
                                "-c:v", "libx264",
                                "-c:a", "aac",
                                "-b:v", "2500k",
                                "-b:a", "320k",
                                "-preset", "fast",
                                "output.mp4",
                            ]);
                            const mp4Data = await ffmpegRef.current.readFile("output.mp4") as Uint8Array;
                            const mp4Blob = new Blob([mp4Data], { type: "video/mp4" });
                            const url = URL.createObjectURL(mp4Blob);
                            setPrepStatus("done");
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `recording-${Date.now()}.mp4`;
                            a.click();
                            URL.revokeObjectURL(url);
                            await ffmpegRef.current.deleteFile("input.webm");
                            await ffmpegRef.current.deleteFile("output.mp4");
                        } catch (err) {
                            console.error("FFmpeg conversion failed:", err);
                            setPrepStatus("fucked");
                        }
                    } else {
                        const url = URL.createObjectURL(webmBlob);
                        setPrepStatus("done");
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `recording-${Date.now()}.webm`;
                        a.click();
                        URL.revokeObjectURL(url);
                    }
                    stream.getTracks().forEach(track => track.stop());
                    setMediaRecorder(null);
                    recordedChunksRef.current = [];

                    // Restore volume after recording stops
                    if (useAsioProcessing && processorRef.current) {
                        processorRef.current.setVolume(volume);
                        if (asioAudioRef.current) asioAudioRef.current.volume = volume;
                        console.log("Volume restored post-recording (ASIO):", volume);
                    } else if (audioRef.current) {
                        audioRef.current.volume = volume;
                        console.log("Volume restored post-recording (non-ASIO):", volume);
                    }

                    setTimeout(() => {
                        setIsPreparingFile(false);
                        setPrepStatus(null);
                    }, 2000);
                };

                recorder.onstart = () => {
                    // Lock volume at recording start
                    if (useAsioProcessing && processorRef.current) {
                        processorRef.current.setVolume(volume);
                        if (asioAudioRef.current) asioAudioRef.current.volume = volume;
                    } else if (audioRef.current) {
                        audioRef.current.volume = volume;
                    }
                    console.log("Recording started, volume locked at:", volume);

                    // Continuous volume lock during recording with requestAnimationFrame
                    let lastVolumeCheck = performance.now();
                    const lockVolume = () => {
                        const now = performance.now();
                        if (now - lastVolumeCheck >= 100) { // Check every 100ms
                            lastVolumeCheck = now;
                            if (useAsioProcessing && processorRef.current) {
                                const currentGain = processorRef.current.getGainValue();
                                if (currentGain !== volume) {
                                    console.warn("Volume drift detected during recording (ASIO), correcting from", currentGain, "to", volume);
                                    processorRef.current.setVolume(volume);
                                }
                                if (asioAudioRef.current && asioAudioRef.current.volume !== volume) {
                                    console.warn("Volume drift detected during recording (asioAudio), correcting from", asioAudioRef.current.volume, "to", volume);
                                    asioAudioRef.current.volume = volume;
                                }
                            } else if (audioRef.current && audioRef.current.volume !== volume) {
                                console.warn("Volume drift detected during recording (audioRef), correcting from", audioRef.current.volume, "to", volume);
                                audioRef.current.volume = volume;
                            }
                        }
                        if (recorder.state !== "inactive") {
                            requestAnimationFrame(lockVolume);
                        }
                    };
                    requestAnimationFrame(lockVolume);
                };

                recorder.start(500);
                setIsRecording(true);
            } catch (err) {
                console.error("Error starting recording:", err);
                setIsRecording(false);
            }
        } else if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
            setIsRecording(false);
        }
    }, [isRecording, isStreaming, mediaRecorder, useAsioProcessing, volume]);

    const renderAudioControls = useCallback(() => (
        <div className={`flex flex-col gap-6 p-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700 animate-panel`}>
            <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                    <Button
                        onClick={toggleRecording}
                        className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                        style={{ backgroundColor: isRecording ? computedColor : "gray" }}
                    >
                        <i className={`fa-solid ${isRecording ? "fa-stop" : "fa-video"}`} />
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        onClick={() => setUseAsioProcessing(prev => !prev)}
                        className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                        style={{ backgroundColor: useAsioProcessing ? computedColor : "gray" }}
                    >
                        <i className={`fa-solid ${useAsioProcessing ? "fa-volume-high" : "fa-volume-xmark"}`} />
                    </Button>
                    <Slider
                        min={0}
                        max={1}
                        step={0.01}
                        value={[volume]}
                        onValueChange={(value) => {
                            setVolume(value[0]);
                            if (useAsioProcessing && processorRef.current) {
                                processorRef.current.setVolume(value[0]);
                            } else if (audioRef.current) {
                                audioRef.current.volume = value[0];
                            }
                        }}
                        className="w-40"
                        style={{ accentColor: computedColor }}
                        showTooltip={true}
                    />
                </div>
                {useAsioProcessing && (
                    <>
                        <div className="flex items-center gap-4">
                            <Slider
                                min={20}
                                max={20000}
                                step={10}
                                value={[eqFrequency]}
                                onValueChange={(value) => {
                                    setEqFrequency(value[0]);
                                    if (processorRef.current) {
                                        processorRef.current.setEqualizer(value[0], eqGain);
                                    }
                                }}
                                className="w-40"
                                style={{ accentColor: computedColor }}
                                showTooltip={true}
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <Slider
                                min={-12}
                                max={12}
                                step={0.1}
                                value={[eqGain]}
                                onValueChange={(value) => {
                                    setEqGain(value[0]);
                                    if (processorRef.current) {
                                        processorRef.current.setEqualizer(eqFrequency, value[0]);
                                    }
                                }}
                                className="w-40"
                                style={{ accentColor: computedColor }}
                                showTooltip={true}
                            />
                        </div>
                    </>
                )}
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                    <Button
                        onClick={handleClearAllMedia}
                        className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                        style={{ backgroundColor: computedColor }}
                    >
                        <i className="fa-solid fa-eraser" />
                    </Button>
                    <Button
                        onClick={handleClear404Media}
                        className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                        style={{ backgroundColor: computedColor }}
                    >
                        <i className="fa-solid fa-trash" />
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                    <Button
                        onClick={handleToggleFullscreen}
                        className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                        style={{ backgroundColor: computedColor }}
                    >
                        <i className={`fa-solid ${isFullscreen ? "fa-compress" : "fa-expand"}`} />
                    </Button>
                    <Button
                        onClick={() => setZoomLevel(prev => clamp(prev + 0.1, 0.5, 3))}
                        className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                        style={{ backgroundColor: computedColor }}
                    >
                        <i className="fa-solid fa-eye" />
                    </Button>
                    <Button
                        onClick={() => setZoomLevel(prev => clamp(prev - 0.1, 0.5, 3))}
                        className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                        style={{ backgroundColor: computedColor }}
                    >
                        <i className="fa-solid fa-eye-slash" />
                    </Button>
                </div>
                <div className="flex gap-4">
                    <Button
                        onClick={() => setShowWinamp(prev => !prev)}
                        className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                        style={{ backgroundColor: showWinamp ? computedColor : "gray" }}
                    >
                        <i className="fa-solid fa-compact-disc" />
                    </Button>
                    <Button
                        onClick={() => setMatrixEnabled(prev => !prev)}
                        className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                        style={{ backgroundColor: matrixEnabled ? computedColor : "gray" }}
                    >
                        <i className="fa-solid fa-globe" />
                    </Button>
                    <Button
                        onClick={() => setAsciiEnabled(prev => !prev)}
                        className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                        style={{ backgroundColor: asciiEnabled ? computedColor : "gray" }}
                    >
                        <i className="fa-solid fa-theater-masks" />
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex gap-4 flex-wrap">
                    <Button
                        onClick={() => setShowGiphyKeyboard(prev => !prev)}
                        className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                        style={{ backgroundColor: showGiphyKeyboard ? computedColor : "gray" }}
                    >
                        <i className="fa-solid fa-images" />
                    </Button>
                    <Button
                        onClick={() => setShowVirtualKeyboard(prev => !prev)}
                        className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                        style={{ backgroundColor: showVirtualKeyboard ? computedColor : "gray" }}
                    >
                        <i className="fa-solid fa-keyboard" />
                    </Button>
                    <Button
                        onClick={() => setShowMediaPanel(prev => !prev)}
                        className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                        style={{ backgroundColor: showMediaPanel ? computedColor : "gray" }}
                    >
                        <i className="fa-solid fa-photo-film" />
                    </Button>
                    <Button
                        onClick={() => setShowLayerPanel(prev => !prev)}
                        className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                        style={{ backgroundColor: showLayerPanel ? computedColor : "gray" }}
                    >
                        <i className="fa-solid fa-layer-group" />
                    </Button>
                </div>
            </div>
        </div>
    ), [
        isRecording, toggleRecording, useAsioProcessing, volume, eqFrequency, eqGain,
        handleClearAllMedia, handleClear404Media, isFullscreen, handleToggleFullscreen,
        zoomLevel, showWinamp, matrixEnabled, asciiEnabled, showGiphyKeyboard,
        showVirtualKeyboard, showMediaPanel, showLayerPanel, computedColor
    ]);

    useEffect(() => {
        const loadFFmpeg = async () => {
            const ffmpeg = new FFmpeg();
            await ffmpeg.load();
            ffmpegRef.current = ffmpeg;
            setIsFFmpegLoaded(true);
            console.log("FFmpeg loaded successfully");
        };
        loadFFmpeg().catch((err) => console.error("Failed to load FFmpeg:", err));
    }, []);

    useEffect(() => {
        const canvas = backgroundCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resizeCanvas = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
            ctx.scale(dpr, dpr);
        };

        const renderBackground = () => {
            if (!backgroundMedia && ctx) {
                ctx.fillStyle = backgroundColor;
                ctx.fillRect(0, 0, canvas.width / (window.devicePixelRatio || 1),
                    canvas.height / (window.devicePixelRatio || 1));
            }
        };

        resizeCanvas();
        renderBackground();
        window.addEventListener("resize", resizeCanvas);
        return () => window.removeEventListener("resize", resizeCanvas);
    }, [backgroundColor, backgroundMedia]);

    useEffect(() => {
        if (backgroundVideoRef.current) {
            backgroundVideoRef.current.loop = backgroundLoop;
            backgroundVideoRef.current.autoplay = backgroundAutoplay;
            isPlaying && backgroundAutoplay
                ? backgroundVideoRef.current.play().catch(console.error)
                : backgroundVideoRef.current.pause();
        }
    }, [isPlaying, backgroundMedia, backgroundLoop, backgroundAutoplay]);

    useEffect(() => {
        setIsClient(true);
        const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        if (!isStarted && countdown > 0) {
            const timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [isStarted, countdown]);

    useEffect(() => {
        if (!isStarted) {
            const tipTimer = setInterval(() => {
                setCurrentTipIndex((prev) => (prev + 1) % helpTips.length);
            }, 10000);
            return () => clearInterval(tipTimer);
        }
    }, [isStarted]);

    // Use a ref to persist asioAudio across renders
    const asioAudioRef = useRef<HTMLAudioElement | null>(null);

    // Initialize processor and asioAudio once on mount
    useEffect(() => {
        processorRef.current = new AsioAudioProcessor();

        // Create asioAudio only once
        asioAudioRef.current = new Audio();
        asioAudioRef.current.className = "hidden";
        document.body.appendChild(asioAudioRef.current);

        return () => {
            processorRef.current?.dispose();
            processorRef.current = null;
            if (asioAudioRef.current && document.body.contains(asioAudioRef.current)) {
                document.body.removeChild(asioAudioRef.current);
            }
            asioAudioRef.current = null;
        };
    }, []);

    // Connect media elements when useAsioProcessing or mediaList changes
    useEffect(() => {
        if (!useAsioProcessing) {
            if (audioRef.current) {
                audioRef.current.muted = false;
                audioRef.current.volume = volume;
            }
            document.querySelectorAll("audio").forEach((el) => {
                const mediaEl = el as HTMLMediaElement;
                if (mediaEl !== audioRef.current) mediaEl.muted = false;
            });
            setAudioReady(true);
            return;
        }

        if (!processorRef.current || !asioAudioRef.current) return;

        // Connect asioAudio only if not already connected
        if (!processorRef.current.isMediaElementConnected(asioAudioRef.current)) {
            processorRef.current.connectMediaElement(asioAudioRef.current);
            asioAudioRef.current.muted = false;
        }

        // Connect background video only if not already connected
        if (backgroundVideoRef.current && !processorRef.current.isMediaElementConnected(backgroundVideoRef.current)) {
            processorRef.current.connectMediaElement(backgroundVideoRef.current);
        }

        // Connect mediaList videos only if not already connected
        mediaList.forEach((item, index) => {
            const videoElement = document.querySelector(`#media-video-${index}`) as HTMLMediaElement;
            if (videoElement && !processorRef.current!.isMediaElementConnected(videoElement)) {
                processorRef.current!.connectMediaElement(videoElement);
            }
        });

        setAudioReady(true);

        // No cleanup needed here since asioAudio is handled in the mount effect
    }, [useAsioProcessing, mediaList]);

    // Sync audio source and handle playback
    useEffect(() => {
        if (!useAsioProcessing || !processorRef.current || !audioRef.current || !asioAudioRef.current) return;

        const syncAudio = () => {
            if (audioRef.current && asioAudioRef.current && audioRef.current.src !== asioAudioRef.current.src) {
                asioAudioRef.current.src = audioRef.current.src;
                if (isPlaying) asioAudioRef.current.play().catch(err => console.error("ASIO sync play error:", err));
            }
        };

        processorRef.current.resume();
        if (isPlaying) {
            audioRef.current.play().catch(err => console.error("Audio play error:", err));
            if (audioRef.current.src && asioAudioRef.current) {
                asioAudioRef.current.play().catch(err => console.error("ASIO play error:", err));
            }
        } else {
            audioRef.current.pause();
            asioAudioRef.current.pause();
        }

        audioRef.current.addEventListener("play", syncAudio);
        audioRef.current.addEventListener("pause", () => asioAudioRef.current?.pause());
        audioRef.current.addEventListener("ended", () => asioAudioRef.current?.pause());

        return () => {
            audioRef.current?.removeEventListener("play", syncAudio);
            audioRef.current?.removeEventListener("pause", () => asioAudioRef.current?.pause());
            audioRef.current?.removeEventListener("ended", () => asioAudioRef.current?.pause());
        };
    }, [useAsioProcessing, isPlaying]);


    // Update volume separately
    useEffect(() => {
        if (!processorRef.current) return;

        if (useAsioProcessing) {
            processorRef.current.setVolume(volume);
        } else if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [useAsioProcessing, volume]);

    useEffect(() => {
        let rafId: number;
        let frameCount = 0;
        let lastTime = performance.now();
        const updateFps = () => {
            frameCount++;
            const now = performance.now();
            if (now - lastTime >= 1000) {
                setFps(frameCount);
                frameCount = 0;
                lastTime = now;
            }
            rafId = requestAnimationFrame(updateFps);
        };
        rafId = requestAnimationFrame(updateFps);
        return () => cancelAnimationFrame(rafId);
    }, []);

    const handleBackgroundMediaDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!(e.target as HTMLElement).closest(".virtual-keyboard")) {
            const url = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text");
            if (url && /\.(mp4|webm|gif|jpg|jpeg|png)$/.test(url)) {
                setMediaList((prev: ExtendedMediaItem[]) => {
                    const newItem = {
                        type: url.match(/\.(mp4|webm)$/) ? "video" : "image",
                        src: url,
                        x: 0, // Top-left
                        y: 0, // Top-left
                        scale: 1,
                        rotation: 0,
                        opacity: 1,
                        visible: true,
                        interruptOnPlay: false,
                        isManuallyControlled: true,
                        showAt: 0,
                        hideAt: Infinity,
                        mixBlendMode: "normal" as MixBlendMode,
                        showControls: url.match(/\.(mp4|webm)$/) ? true : false,
                    } as ExtendedMediaItem;
                    const newList = [...prev, newItem];
                    checkMediaValidity(newItem, newList.length - 1);
                    return newList;
                });
            }
        }
    }, [setMediaList, checkMediaValidity]);

    const optimizeAndValidateMedia = async (src: string): Promise<string | null> => {
        const img = new Image();
        img.src = src;
        try {
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d")!;
            const maxSize = 1024;
            let { width, height } = img;
            if (width > height && width > maxSize) {
                height = (maxSize / width) * height;
                width = maxSize;
            } else if (height > maxSize) {
                width = (maxSize / height) * width;
                height = maxSize;
            }
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            return canvas.toDataURL("image/webp", 0.7);
        } catch {
            return null;
        }
    };

    const helpTips = [
        "NEW: Right click on the Winamp player to enable Desktop mode.",
        "Press 'Tab' to toggle all panels.",
        "Press 'F1' for help.",
        "Press 'F2' to toggle the launchpad keyboard.",
        "Press 'F3' to toggle media tabs.",
        "Press 'F4' to toggle unbound media items.",
        "Press 'F7' to toggle layer panel.",
        "Press 'Space' to play or pause.",
        "Press 'F9' to stop playback.",
        "Press 'F10' to stop and restart playback.",
        "Press 'F11' to toggle fullscreen mode.",
        "Press 'PageUp' to zoom in.",
        "Press 'PageDown' to zoom out.",
    ];
    const [currentTipIndex, setCurrentTipIndex] = useState(0);

    const [lastInteractionWasDoubleClick, setLastInteractionWasDoubleClick] = useState(false);

    const onSelectElement = useCallback((elem: SelectedElement, event?: React.MouseEvent) => {
        if (elem && elem.type === "media" && !mediaList[elem.index]?.visible) return;
        setSelectedElement(elem ? {
            type: elem.type,
            index: elem.index,
            fileName: elem.type === "media" && mediaList[elem.index] ? mediaList[elem.index].src.split("/").pop() : undefined,
        } : null);
        setSelectedLayer(null);
        if (event && event.detail === 2) {
            setShowLayerPanel(false);
            setShowPalette(true);
            setLastInteractionWasDoubleClick(true);
        } else {
            setLastInteractionWasDoubleClick(false);
        }
    }, [mediaList, setShowLayerPanel, setShowPalette]);

    const onSelectLayer = useCallback((layer: SelectedLayer) => {
        setSelectedLayer(layer);
        setSelectedElement(null);
        setLastInteractionWasDoubleClick(false);
    }, []);

    const togglePlayPause = useCallback(() => {
        setIsPlaying((prev) => {
            const newState = !prev;
            if (audioRef.current) {
                audioRef.current.loop = false;
                processorRef.current?.resume();
                if (newState) {
                    audioRef.current.play().catch((err) => {
                        if (err.name !== "AbortError") console.error("Audio play error:", err);
                    });
                } else {
                    audioRef.current.pause();
                }
            }
            return newState;
        });
    }, []);
    
    const handleStop = useCallback(() => {
        setIsPlaying(false);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    }, []);

    const handleStart = useCallback(() => {
        setIsStarted(true);
        if (webampReady && audioRef.current && audioReady) {
            processorRef.current?.resume();
            audioRef.current.play().catch((err) => {
                if (err.name !== "AbortError") {
                    console.error("Audio play error:", err);
                }
            });
            setIsPlaying(true);
        }
    }, [webampReady, audioReady]);

    const handleWebampReady = useCallback(() => {
        setWebampReady(true);
    }, []);

    const handleGifSelect = useCallback(
        async (gifUrl: string) => {
            const scaleToCover = Math.max(workspaceDimensions.width / 256, workspaceDimensions.height / 256);
            const optimizedSrc = await optimizeAndValidateMedia(gifUrl);
            if (optimizedSrc) {
                setMediaList((prev: ExtendedMediaItem[]) => {
                    const newItem = {
                        type: "image",
                        src: optimizedSrc,
                        x: 0, // Top-left
                        y: 0, // Top-left
                        scale: scaleToCover,
                        rotation: 0,
                        opacity: 1,
                        visible: true,
                        interruptOnPlay: false,
                        isManuallyControlled: true,
                        showAt: 0,
                        hideAt: Infinity,
                        mixBlendMode: "normal" as MixBlendMode,
                        showControls: false,
                    } as ExtendedMediaItem;
                    const newList = [...prev, newItem];
                    checkMediaValidity(newItem, newList.length - 1);
                    return newList;
                });
                setShowGiphyKeyboard(false);
            }
        },
        [setMediaList, workspaceDimensions, checkMediaValidity]
    );

    const onToggleMedia = useCallback(
        (index: number) => {
            setMediaList((prev) =>
                prev.map((item, i) =>
                    i === index ? { ...item, visible: !item.visible, isManuallyControlled: true } : item
                )
            );
        },
        [setMediaList]
    );

    const handleBailOut = useCallback(() => {
        setIsPreparingFile(false);
        setPrepStatus(null);
    }, []);

    const toggleStreaming = useCallback(async () => {
        if (!isStreaming) {
            if (!isFFmpegLoaded) {
                console.error("FFmpeg is still loading. Please wait.");
                return;
            }

            if (!streamServerUrl || !streamKey) {
                console.error("RTMP Server URL and Stream Key are required.");
                return;
            }

            console.log("Starting stream with settings:", {
                streamBitrate,
                streamResolution,
                streamServerUrl,
                streamKey,
            });

            try {
                const [width, height] = streamResolution.split("x").map(Number);
                const stream = await navigator.mediaDevices.getDisplayMedia({
                    video: { width, height, displaySurface: "monitor" },
                    audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 },
                });

                if (!ffmpegRef.current) {
                    console.error("FFmpeg unexpectedly null");
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }

                const rtmpUrl = `${streamServerUrl}/${streamKey}`;
                const mediaRecorder = new MediaRecorder(stream, {
                    mimeType: "video/webm;codecs=vp8,opus",
                    videoBitsPerSecond: streamBitrate,
                });

                mediaRecorder.ondataavailable = async (e) => {
                    if (e.data.size > 0 && ffmpegRef.current) {
                        const buffer = await e.data.arrayBuffer();
                        await ffmpegRef.current.writeFile("input.webm", new Uint8Array(buffer));
                        await ffmpegRef.current.exec([
                            "-i", "input.webm",
                            "-c:v", "libx264",
                            "-c:a", "aac",
                            "-b:v", `${streamBitrate / 1000}k`,
                            "-f", "flv",
                            rtmpUrl,
                        ]);
                        console.log("Stream chunk sent to RTMP:", rtmpUrl);
                    } else if (!ffmpegRef.current) {
                        console.error("FFmpeg is null during streaming");
                    }
                };

                mediaRecorder.onstop = () => {
                    stream.getTracks().forEach(track => track.stop());
                    setMediaRecorder(null);
                };

                mediaRecorder.start(1000);
                setMediaRecorder(mediaRecorder);
                setIsStreaming(true);
            } catch (err: any) {
                if (err.name === "NotAllowedError") {
                    console.error("Permission denied to capture screen/audio. Please allow access and try again.");
                } else {
                    console.error("Error starting RTMP streaming:", err);
                }
                setIsStreaming(false);
            }
        } else if (mediaRecorder) {
            mediaRecorder.stop();
            setIsStreaming(false);
        }
    }, [isStreaming, mediaRecorder, streamBitrate, streamResolution, streamServerUrl, streamKey, isFFmpegLoaded]);
    useEffect(() => {
        const keyMap = new Map<string, KeyMapping>(
            keyMappings
                .filter((m): m is KeyMapping => m != null && m.key !== undefined) // Exclude null and undefined
                .map(m => [m.key.toUpperCase(), m] as const)
        );

        const onKeyDown = (e: KeyboardEvent) => {
            const keyUpper = e.key.toUpperCase();
            switch (keyUpper) {
                case "ENTER": togglePlayPause(); break;
                case "TAB":
                    e.preventDefault();
                    setShowPalette(p => !p);
                    break;
                case "F1": console.log("Help: Press F1 again to hide this log."); break;
                case "F2": setShowVirtualKeyboard(p => !p); break;
                case "F3": setShowMediaPanel(p => !p); break;
                case "F4": setShowUnboundMediaList(p => !p); break;
                case "F7": setShowLayerPanel(p => !p); break;
                case "F9": handleStop(); break;
                case "F10": handleStop(); togglePlayPause(); break;
                case "F11": handleToggleFullscreen(); break;
                case "PAGEUP": setZoomLevel(p => clamp(p + 0.1, 0.5, 3)); break;
                case "PAGEDOWN": setZoomLevel(p => clamp(p - 0.1, 0.5, 3)); break;
                default:
                    const mapping = keyMap.get(keyUpper);
                    if (mapping && mapping.assignedIndex !== null) {
                        const mediaIndex = mapping.assignedIndex!; // Non-null assertion
                        setMediaList(prev => {
                            const newList = [...prev];
                            const media = newList[mediaIndex];
                            const shouldBeVisible = !media.visible;
                            const mediaElement = document.querySelector(`#media-${media.type}-${mediaIndex}`) as HTMLMediaElement;

                            switch (mapping.mode) {
                                case "toggle":
                                    newList[mediaIndex] = { ...media, visible: shouldBeVisible };
                                    if (mediaElement) {
                                        mediaElement.loop = true;
                                        if (!mediaElement.paused) mediaElement.play().catch(console.error);
                                    }
                                    break;
                                case "launchpad":
                                    newList.forEach((item, i) => {
                                        if (i !== mediaIndex && item.visible) {
                                            newList[i] = { ...item, visible: false };
                                            const otherElement = document.querySelector(`#media-${item.type}-${i}`) as HTMLMediaElement;
                                            if (otherElement) otherElement.pause();
                                        }
                                    });
                                    newList[mediaIndex] = { ...media, visible: shouldBeVisible };
                                    if (mediaElement) {
                                        mediaElement.loop = true;
                                        if (shouldBeVisible) mediaElement.play().catch(console.error);
                                        else if (!mediaElement.paused) mediaElement.play().catch(console.error);
                                    }
                                    setActiveMediaIndex(shouldBeVisible ? mediaIndex : null);
                                    break;
                                case "oneshot":
                                    if (shouldBeVisible) {
                                        newList[mediaIndex] = { ...media, visible: true };
                                        if (mediaElement) {
                                            mediaElement.loop = false;
                                            mediaElement.currentTime = 0;
                                            mediaElement.play().catch(console.error);
                                            mediaElement.addEventListener("ended", () => {
                                                setMediaList(p => {
                                                    const updated = [...p];
                                                    updated[mediaIndex] = { ...updated[mediaIndex], visible: false };
                                                    return updated;
                                                });
                                            }, { once: true });
                                        }
                                    }
                                    break;
                                case "playPause":
                                    newList[mediaIndex] = { ...media, visible: shouldBeVisible };
                                    if (mediaElement) {
                                        mediaElement.loop = shouldBeVisible;
                                        if (shouldBeVisible) mediaElement.play().catch(console.error);
                                        else mediaElement.pause();
                                    }
                                    break;
                            }
                            return newList;
                        });
                    }
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [keyMappings, mediaList, setMediaList, handleToggleFullscreen, togglePlayPause, handleStop, activeMediaIndex]);
    
    const { computedColor: effectsColor, analyserRef } = useEffects({
        matrixEnabled,
        visualizerEnabled: visualizerEnabled && !showWinamp,
        matrixCanvasRef,
        visualizerCanvasRef,
        barCanvasRef,
        audioContext: processorRef.current?.getAudioContext() || null,
        audioData,
        isFullscreen,
        isPlaying,
        computedColor,
    });

    // Add useMemo to stabilize mediaListForComponents if still used
    const mediaListForComponents = React.useMemo(() => mediaList
        .filter((item) => ["audio", "video", "image"].includes(item.type))
        .map((item) => ({
            type: item.type,
            src: item.src,
            x: item.x,
            y: item.y,
            scale: item.scale,
            rotation: item.rotation,
            visible: item.visible,
            interruptOnPlay: item.interruptOnPlay,
            isManuallyControlled: item.isManuallyControlled,
            showAt: item.showAt,
            hideAt: item.hideAt,
            opacity: item.opacity,
            mixBlendMode: item.mixBlendMode,
            showControls: item.showControls,
        })), [mediaList]);
        
    const handleMediaDrop = useCallback((newMedia: MediaItem, keyIndex: number) => {
        setMediaList((prev: ExtendedMediaItem[]) => {
            // Convert MediaItem to ExtendedMediaItem with default values for required fields
            const extendedNewMedia: ExtendedMediaItem = {
                ...newMedia,
                interruptOnPlay: newMedia.interruptOnPlay ?? false, // Default to false if undefined
                isManuallyControlled: newMedia.isManuallyControlled ?? true, // Default to true if undefined
                showAt: newMedia.showAt ?? 0, // Default to 0 if undefined
                hideAt: newMedia.hideAt ?? Infinity, // Default to Infinity if undefined
                opacity: newMedia.opacity ?? 1, // Default to 1 if undefined
                scale: newMedia.scale ?? 1, // Default to 1 if undefined
                rotation: newMedia.rotation ?? 0, // Default to 0 if undefined
                visible: newMedia.visible ?? true, // Default to true if undefined
                mixBlendMode: newMedia.mixBlendMode ?? "normal", // Default to "normal" if undefined
                // Add any other required ExtendedMediaItem fields not present in MediaItem
                showControls: newMedia.type === "video" ? true : false, // Example default based on type
            };

            const newList = [...prev, extendedNewMedia];
            const newIndex = newList.length - 1;

            setKeyMappings((prevMappings) => {
                const newMappings = [...prevMappings];
                newMappings[keyIndex] = {
                    ...newMappings[keyIndex],
                    assignedIndex: newIndex,
                    mappingType: newMedia.type === "audio" ? "audio" : "media",
                    mode: "toggle",
                };
                console.log(`Assigned ${newMedia.src} to key ${keyIndex} with index ${newIndex}`);
                return newMappings;
            });

            return newList;
        });
    }, [setMediaList, setKeyMappings]);



    // Update renderVirtualKeyboardPanel with memoization
    const renderVirtualKeyboardPanel = React.useCallback(
        () => (
            <VirtualKeyboard
                keyMappings={keyMappings}
                mediaList={mediaList}
                setKeyMappings={setKeyMappings}
                setMediaList={setMediaList}
                computedColor={computedColor}
                onSelectElement={onSelectElement}
                checkMediaValidity={checkMediaValidity}
            />
        ),
        [keyMappings, mediaList, setKeyMappings, setMediaList, computedColor, onSelectElement, checkMediaValidity]
    );

    const renderOptionsContent = useCallback(() => {
        if (!selectedElement || selectedElement.index >= mediaList.length) return null;
        const media = mediaList[selectedElement.index];

        const updateMediaProperty = (property: keyof ExtendedMediaItem, value: any) => {
            setMediaList(prev => {
                const newList = [...prev];
                newList[selectedElement.index] = { ...newList[selectedElement.index], [property]: value };
                return newList;
            });
        };

        const centerMedia = () => {
            updateMediaProperty("x", 50);
            updateMediaProperty("y", 50);
        };

        const scaleToCover = () => {
            const workspaceWidth = workspaceDimensions.width;
            const workspaceHeight = workspaceDimensions.height;
            const mediaElement = document.querySelector(`#media-${media.type}-${selectedElement.index}`) as HTMLImageElement | HTMLVideoElement;
            const scale = mediaElement
                ? Math.max(workspaceWidth / (mediaElement instanceof HTMLVideoElement ? mediaElement.videoWidth : mediaElement.naturalWidth),
                    workspaceHeight / (mediaElement instanceof HTMLVideoElement ? mediaElement.videoHeight : mediaElement.naturalHeight))
                : Math.max(workspaceWidth / 200, workspaceHeight / 200);
            updateMediaProperty("scale", scale);
        };

        const deleteMedia = () => {
            setMediaList(prev => prev.filter((_, i) => i !== selectedElement.index));
            setKeyMappings(prev => prev.map(mapping =>
                mapping && mapping.assignedIndex === selectedElement.index ? { ...mapping, assignedIndex: null } :
                    mapping && mapping.assignedIndex > selectedElement.index ? { ...mapping, assignedIndex: mapping.assignedIndex - 1 } :
                        mapping
            ));
            setSelectedElement(null);
        };

        const updateMode = (mode: "toggle" | "launchpad" | "oneshot" | "playPause") => {
            setKeyMappings(prev => {
                const mappingIndex = prev.findIndex(m => m && m.assignedIndex === selectedElement.index);
                if (mappingIndex !== -1) {
                    const newMappings = [...prev];
                    newMappings[mappingIndex] = { ...newMappings[mappingIndex]!, mode }; // Non-null assertion since we found it
                    return newMappings;
                }
                // If no mapping exists, add a new one
                return [...prev, {
                    key: `unmapped-${selectedElement.index}`,
                    assignedIndex: selectedElement.index,
                    mappingType: media.type === "audio" ? "audio" : "media",
                    mode,
                }];
            });
        };

        const currentMapping = keyMappings.find((m): m is KeyMapping => m != null && m.assignedIndex === selectedElement.index);
        const currentMode = currentMapping?.mode || "toggle"; // Fallback to "toggle" if no mapping

        return (
            <div className="flex flex-col gap-1" style={{ backgroundColor: "rgba(0, 0, 0, 0.8)", padding: "4px", minWidth: "220px" }}>
                {/* Common Controls */}
                <div className="flex items-center gap-1">
                    <i className="fa-solid fa-eye-slash text-xs" />
                    <Slider
                        min={0}
                        max={1}
                        step={0.01}
                        value={[media.opacity]}
                        onValueChange={(value) => updateMediaProperty("opacity", value[0])}
                        className="w-full h-2"
                        style={{ accentColor: computedColor }}
                    />
                </div>

                {/* Type-Specific Controls */}
                {media.type === "image" && (
                    <>
                        <div className="flex items-center gap-1">
                            <i className="fa-solid fa-expand text-xs" />
                            <Slider
                                min={0.1}
                                max={10}
                                step={0.1}
                                value={[media.scale]}
                                onValueChange={(value) => updateMediaProperty("scale", value[0])}
                                className="w-full h-2"
                                style={{ accentColor: computedColor }}
                            />
                        </div>
                        <div className="flex items-center gap-1">
                            <i className="fa-solid fa-rotate text-xs" />
                            <Slider
                                min={0}
                                max={360}
                                step={1}
                                value={[media.rotation]}
                                onValueChange={(value) => updateMediaProperty("rotation", value[0])}
                                className="w-full h-2"
                                style={{ accentColor: computedColor }}
                            />
                        </div>
                        <div className="flex items-center gap-1">
                            <i className="fa-solid fa-arrows-left-right text-xs" />
                            <Slider
                                min={0}
                                max={100}
                                step={1}
                                value={[media.x]}
                                onValueChange={(value) => updateMediaProperty("x", value[0])}
                                className="w-full h-2"
                                style={{ accentColor: computedColor }}
                            />
                        </div>
                        <div className="flex items-center gap-1">
                            <i className="fa-solid fa-arrows-up -down text-xs" />
                            <Slider
                                min={0}
                                max={100}
                                step={1}
                                value={[media.y]}
                                onValueChange={(value) => updateMediaProperty("y", value[0])}
                                className="w-full h-2"
                                style={{ accentColor: computedColor }}
                            />
                        </div>
                    </>
                )}

                {media.type === "video" && (
                    <>
                        <div className="flex items-center gap-1">
                            <i className="fa-solid fa-expand text-xs" />
                            <Slider
                                min={0.1}
                                max={10}
                                step={0.1}
                                value={[media.scale]}
                                onValueChange={(value) => updateMediaProperty("scale", value[0])}
                                className="w-full h-2"
                                style={{ accentColor: computedColor }}
                            />
                        </div>
                        <div className="flex items-center gap-1">
                            <i className="fa-solid fa-rotate text-xs" />
                            <Slider
                                min={0}
                                max={360}
                                step={1}
                                value={[media.rotation]}
                                onValueChange={(value) => updateMediaProperty("rotation", value[0])}
                                className="w-full h-2"
                                style={{ accentColor: computedColor }}
                            />
                        </div>
                        <div className="flex items-center gap-1">
                            <i className="fa-solid fa-sliders text-xs" />
                            <input
                                type="checkbox"
                                checked={media.showControls || false}
                                onChange={(e) => updateMediaProperty("showControls", e.target.checked)}
                            />
                        </div>
                    </>
                )}

                {media.type === "audio" && (
                    <div className="flex items-center gap-1">
                        <i className="fa-solid fa-volume-high text-xs" />
                        <Slider
                            min={0}
                            max={1}
                            step={0.01}
                            value={[media.opacity]} // Proxy for volume
                            onValueChange={(value) => updateMediaProperty("opacity", value[0])}
                            className="w-full h-2"
                            style={{ accentColor: computedColor }}
                        />
                    </div>
                )}

                {media.type === "text" && (
                    <>
                        <div className="flex items-center gap-1">
                            <i className="fa-solid fa-font text-xs" />
                            <input
                                type="number"
                                min={8}
                                max={72}
                                step={1}
                                value={parseInt(media.transform?.match(/font-size:(\d+)/)?.[1] || "16")}
                                onChange={(e) => updateMediaProperty("transform", `font-size:${e.target.value}px`)}
                                className="bg-gray-800 text-white p-1 rounded w-12"
                            />
                        </div>
                        <div className="flex items-center gap-1">
                            <i className="fa-solid fa-palette text-xs" />
                            <input
                                type="color"
                                value={media.textContent?.match(/color:(#[0-9A-Fa-f]{6})/)?.[1] || "#FFFFFF"}
                                onChange={(e) => updateMediaProperty("textContent", `${media.textContent || ""} color:${e.target.value}`)}
                                className="w-12 h-6"
                            />
                        </div>
                    </>
                )}

                {/* Action Buttons */}
                <div className="flex gap-1 mt-1">
                    <Button
                        onClick={centerMedia}
                        className="bg-transparent hover:bg-gray-900 flex-1 p-1"
                        title="Center"
                    >
                        <i className="fa-solid fa-align-center" />
                    </Button>
                    <Button
                        onClick={scaleToCover}
                        className="bg-transparent hover:bg-gray-900 flex-1 p-1"
                        title="Scale to Cover"
                    >
                        <i className="fa-solid fa-arrows-alt" />
                    </Button>
                    <Button
                        onClick={deleteMedia}
                        className="bg-transparent hover:bg-red-900 flex-1 p-1"
                        title="Delete"
                    >
                        <i className="fa-solid fa-trash" />
                    </Button>
                </div>

                {/* Mode Selection */}
                <div className="flex gap-1 mt-1">
                    <Button
                        onClick={() => updateMode("toggle")}
                        className={`bg-transparent hover:bg-gray-900 flex-1 p-1 ${currentMode === "toggle" ? "border-2 border-white" : ""}`}
                        title="Toggle"
                    >
                        <i className="fa-solid fa-toggle-on" />
                    </Button>
                    <Button
                        onClick={() => updateMode("launchpad")}
                        className={`bg-transparent hover:bg-gray-900 flex-1 p-1 ${currentMode === "launchpad" ? "border-2 border-white" : ""}`}
                        title="Launchpad"
                    >
                        <i className="fa-solid fa-rocket" />
                    </Button>
                    <Button
                        onClick={() => updateMode("oneshot")}
                        className={`bg-transparent hover:bg-gray-900 flex-1 p-1 ${currentMode === "oneshot" ? "border-2 border-white" : ""}`}
                        title="Oneshot"
                    >
                        <i className="fa-solid fa-arrow-right" />
                    </Button>
                    <Button
                        onClick={() => updateMode("playPause")}
                        className={`bg-transparent hover:bg-gray-900 flex-1 p-1 ${currentMode === "playPause" ? "border-2 border-white" : ""}`}
                        title="Play/Pause"
                    >
                        <i className="fa-solid fa-circle-pause" />
                    </Button>
                </div>
            </div>
        );
    }, [selectedElement, mediaList, setMediaList, computedColor, workspaceDimensions, setKeyMappings]);

    const webampProps: WebampMilkdropProps = {
        onTrackDrop: (url: string) => {
            setPrimaryAudioSrc(url);
            if (audioRef.current) {
                audioRef.current.src = url;
                audioRef.current.load();
                if (isPlaying) audioRef.current.play().catch(console.error);
            }
            document.querySelectorAll("#webamp-container audio").forEach((el) => {
                const mediaEl = el as HTMLMediaElement;
                if (mediaEl !== audioRef.current) {
                    mediaEl.muted = true;
                    mediaEl.pause();
                }
            });
        },
        isPlaying,
        onPlayPause: togglePlayPause,
        onStop: handleStop,
        onReady: handleWebampReady,
        visualizerCanvasRef,
        getAudioElement: (element: HTMLAudioElement) => {
            setWebampAudioElement(element);
            element.muted = false; // Webamp manages its own audio
        },
    };

    return (
        <div id="fullscreenContainer" className="w-screen h-screen relative">
            <style jsx global>{`
                @keyframes panel-rollout {
                    from {
                        max-height: 0;
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        max-height: 1000px;
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes panel-retract {
                    from {
                        max-height: 1000px;
                        opacity: 1;
                        transform: translateY(0);
                    }
                    to {
                        max-height: 0;
                        opacity: 0;
                        transform: translateY(20px);
                    }
                }
                .animate-panel {
                    animation: panel-rollout 0.3s ease-out forwards;
                }
                .animate-panel.hidden {
                    animation: panel-retract 0.3s ease-out forwards;
                }
                @keyframes pulseGlow {
                    0% { box-shadow: 0 0 20px ${countdown > 0 ? "#666" : "#ff0000"}, inset 0 0 15px ${countdown > 0 ? "#222" : "#800000"}; transform: scale(1); }
                    50% { box-shadow: 0 0 40px ${countdown > 0 ? "#999" : "#ff5555"}, inset 0 0 25px ${countdown > 0 ? "#444" : "#a00000"}; transform: scale(1.05); }
                    100% { box-shadow: 0 0 20px ${countdown > 0 ? "#666" : "#ff0000"}, inset 0 0 15px ${countdown > 0 ? "#222" : "#800000"}; transform: scale(1); }
                }
                @keyframes spinGlow {
                    0% { transform: rotate(0deg) scale(1.1); border-color: rgba(255, 255, 255, 0.5); }
                    50% { transform: rotate(180deg) scale(1.15); border-color: rgba(255, 255, 255, 0.8); }
                    100% { transform: rotate(360deg) scale(1.1); border-color: rgba(255, 255, 255, 0.5); }
                }
            `}</style>
            <audio ref={audioRef} className="hidden" />
            <audio ref={asioAudioRef} className="hidden" />
            <div className="relative text-white overflow-hidden w-full h-full">
                <div className="absolute inset-0 z-0"
                    style={{
                        mixBlendMode: backgroundMixBlendMode,
                        opacity: backgroundOpacity,
                        filter: `gamma(${backgroundGamma}) saturate(${backgroundSaturation})`,
                    }}>
                    {backgroundMedia ? (
                        <video
                            ref={backgroundVideoRef}
                            src={backgroundMedia}
                            className="w-full h-full object-cover"
                            style={{
                                transform: `translate(${backgroundX}px, ${backgroundY}px) scale(${backgroundScale}) rotate(${backgroundRotation}deg)`,
                            }}
                            muted={false}
                        />
                    ) : (
                        <canvas ref={backgroundCanvasRef} className="w-full h-full" />
                    )}
                </div>

                <Workspace
                    mediaList={mediaList.map(item => ({
                        id: `media-${item.type}-${mediaList.indexOf(item)}`,
                        type: item.type,
                        src: item.src,
                        x: item.x,
                        y: item.y,
                        scale: item.scale,
                        rotation: item.rotation,
                        opacity: item.opacity,
                        visible: item.visible,
                        showAt: item.showAt,
                        hideAt: item.hideAt,
                        isManuallyControlled: item.isManuallyControlled,
                        interruptOnPlay: item.interruptOnPlay,
                        showControls: item.showControls,
                        mixBlendMode: item.mixBlendMode,
                        optimizedSrc: item.optimizedSrc,
                        transform: item.transform,
                        textContent: item.textContent,
                    }))}
                    customTexts={customTexts}
                    setCustomTexts={setCustomTexts}
                    isFullscreen={isFullscreen}
                    workspaceDimensions={workspaceDimensions}
                    zoomLevel={zoomLevel}
                    asciiEnabled={asciiEnabled}
                    onMediaListUpdate={setMediaList as React.Dispatch<React.SetStateAction<WorkspaceMediaItem[]>>}
                    onCustomTextsUpdate={setCustomTexts}
                    onSelectElement={onSelectElement}
                    matrixCanvasRef={matrixCanvasRef}
                    visualizerCanvasRef={visualizerCanvasRef}
                    barCanvasRef={barCanvasRef}
                    containerWidth={windowSize.width}
                    containerHeight={windowSize.height}
                    matrixMixBlendMode={matrixMixBlendMode}
                    asciiMixBlendMode={asciiMixBlendMode}
                    allMediaMixBlendMode={allMediaMixBlendMode}
                    milkdropOpacity={milkdropOpacity}
                    matrixOpacity={matrixOpacity}
                    asciiOpacity={asciiOpacity}
                    allMediaOpacity={allMediaOpacity}
                    milkdropGamma={milkdropGamma}
                    matrixGamma={matrixGamma}
                    asciiGamma={asciiGamma}
                    allMediaGamma={allMediaGamma}
                    milkdropSaturation={milkdropSaturation}
                    matrixSaturation={matrixSaturation}
                    asciiSaturation={asciiSaturation}
                    allMediaSaturation={allMediaSaturation}
                    layerOrder={layerOrder}
                    milkdropMixBlendMode="color"
                    onDropMedia={handleBackgroundMediaDrop} // Use renamed prop
                    onDragOver={(e) => e.preventDefault()}
                />

                {audioReady && showWinamp && (
                    <div className="absolute inset-0 z-1 pointer-events-auto">
                        <WebampMilkdrop {...webampProps} />
                    </div>
                )}

                {isPreparingFile && (
                    <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-[10011] w-1/2 p-6 rounded-lg shadow-lg border border-gray-700 animate-panel">
                        <div className="text-center text-sm text-gray-300 mb-2">
                            {prepStatus === "preparing" && "Preparing File..."}
                            {prepStatus === "done" && "File Ready, Bro!"}
                            {prepStatus === "fucked" && "Shit’s Fucked"}
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-2.5">
                            {prepStatus === "preparing" && (
                                <div className="bg-blue-500 h-2.5 rounded-full animate-indeterminate" />
                            )}
                            {prepStatus === "done" && (
                                <div className="bg-green-600 h-2.5 rounded-full" style={{ width: "100%" }} />
                            )}
                            {prepStatus === "fucked" && (
                                <div className="bg-red-600 h-2.5 rounded-full" style={{ width: "100%" }} />
                            )}
                        </div>
                        {(prepStatus === "preparing" || prepStatus === "fucked") && (
                            <Button
                                className="mt-4 w-full p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                                style={{ backgroundColor: computedColor }}
                                onClick={handleBailOut}
                            >
                                <i className="fa-solid fa-trash" />
                            </Button>
                        )}
                    </div>
                )}

                <Suspense fallback={<div className="text-gray-300">Loading...</div>}>
                    <SkryrPalette
                        lastInteractionWasDoubleClick={lastInteractionWasDoubleClick}
                        isFullscreen={isFullscreen}
                        handleToggleFullscreen={handleToggleFullscreen}
                        showPalette={showPalette}
                        setShowPalette={setShowPalette}
                        backgroundEnabled={visualizerEnabled}
                        setBackgroundEnabled={setVisualizerEnabled}
                        computedColor={computedColor}
                        setComputedColor={setComputedColor}
                        selectedElement={selectedElement}
                        selectedLayer={selectedLayer}
                        renderOptionsContent={renderOptionsContent}
                        onDeselectElement={() => { setSelectedElement(null); setSelectedLayer(null); }}
                        showLayerPanel={showLayerPanel}
                        setShowLayerPanel={setShowLayerPanel}
                        milkdropOpacity={milkdropOpacity}
                        setMilkdropOpacity={setMilkdropOpacity}
                        matrixMixBlendMode={matrixMixBlendMode}
                        setMatrixMixBlendMode={setMatrixMixBlendMode}
                        asciiMixBlendMode={asciiMixBlendMode}
                        setAsciiMixBlendMode={setAsciiMixBlendMode}
                        allMediaMixBlendMode={allMediaMixBlendMode}
                        setAllMediaMixBlendMode={setAllMediaMixBlendMode}
                        backgroundMixBlendMode={backgroundMixBlendMode}
                        setBackgroundMixBlendMode={setBackgroundMixBlendMode}
                        matrixOpacity={matrixOpacity}
                        setMatrixOpacity={setMatrixOpacity}
                        asciiOpacity={asciiOpacity}
                        setAsciiOpacity={setAsciiOpacity}
                        allMediaOpacity={allMediaOpacity}
                        setAllMediaOpacity={setAllMediaOpacity}
                        backgroundOpacity={backgroundOpacity}
                        setBackgroundOpacity={setBackgroundOpacity}
                        milkdropGamma={milkdropGamma}
                        setMilkdropGamma={setMilkdropGamma}
                        matrixGamma={matrixGamma}
                        setMatrixGamma={setMatrixGamma}
                        asciiGamma={asciiGamma}
                        setAsciiGamma={setAsciiGamma}
                        allMediaGamma={allMediaGamma}
                        setAllMediaGamma={setAllMediaGamma}
                        backgroundGamma={backgroundGamma}
                        setBackgroundGamma={setBackgroundGamma}
                        milkdropSaturation={milkdropSaturation}
                        setMilkdropSaturation={setMilkdropSaturation}
                        matrixSaturation={matrixSaturation}
                        setMatrixSaturation={setMatrixSaturation}
                        asciiSaturation={asciiSaturation}
                        setAsciiSaturation={setAsciiSaturation}
                        allMediaSaturation={allMediaSaturation}
                        setAllMediaSaturation={setAllMediaSaturation}
                        backgroundSaturation={backgroundSaturation}
                        setBackgroundSaturation={setBackgroundSaturation}
                        layerOrder={layerOrder}
                        setLayerOrder={setLayerOrder}
                        matrixEnabled={matrixEnabled}
                        setMatrixEnabled={setMatrixEnabled}
                        asciiEnabled={asciiEnabled}
                        setAsciiEnabled={setAsciiEnabled}
                        backgroundColor={backgroundColor}
                        setBackgroundColor={setBackgroundColor}
                        backgroundMedia={backgroundMedia}
                        setBackgroundMedia={setBackgroundMedia}
                        backgroundScale={backgroundScale}
                        setBackgroundScale={setBackgroundScale}
                        backgroundRotation={backgroundRotation}
                        setBackgroundRotation={setBackgroundRotation}
                        backgroundX={backgroundX}
                        setBackgroundX={setBackgroundX}
                        backgroundY={backgroundY}
                        setBackgroundY={setBackgroundY}
                        backgroundLoop={backgroundLoop}
                        setBackgroundLoop={setBackgroundLoop}
                        backgroundAutoplay={backgroundAutoplay}
                        setBackgroundAutoplay={setBackgroundAutoplay}
                        fps={fps}
                        audioData={audioData}
                    >
                        <SkryrToolbar
                            isPlaying={isPlaying}
                            handlePlayPause={togglePlayPause}
                            handleStop={handleStop}
                            handleToggleFullscreen={handleToggleFullscreen}
                            isFullscreen={isFullscreen}
                            showToolsInFullscreen={true}
                            setShowToolsInFullscreen={() => { }}
                            showPalette={showPalette}
                            setShowPalette={setShowPalette}
                            backgroundEnabled={visualizerEnabled}
                            setBackgroundEnabled={setVisualizerEnabled}
                            embeddedMode={matrixEnabled}
                            setEmbeddedMode={setMatrixEnabled}
                            primaryAudioSrc={primaryAudioSrc}
                            primaryAudioRef={audioRef}
                            audioProgress={
                                audioRef.current && audioRef.current.duration
                                    ? audioRef.current.currentTime / audioRef.current.duration
                                    : 0
                            }
                            setAudioProgress={(progress: number) => {
                                if (audioRef.current && audioRef.current.duration) {
                                    audioRef.current.currentTime = progress * audioRef.current.duration;
                                }
                            }}
                            selectedElement={selectedElement}
                            setSelectedElement={setSelectedElement}
                            renderOptionsContent={renderOptionsContent}
                            mediaList={mediaList}
                            keyMappings={keyMappings}
                            setKeyMappings={setKeyMappings}
                            setMediaList={setMediaList}
                            showGiphyKeyboard={showGiphyKeyboard}
                            setShowGiphyKeyboard={setShowGiphyKeyboard}
                            handleGifSelect={handleGifSelect}
                            renderVirtualKeyboardPanel={renderVirtualKeyboardPanel}
                            toggleMatrixMode={() => setMatrixEnabled(prev => !prev)}
                            toggleAsciiMode={() => setAsciiEnabled(prev => !prev)}
                            isMatrixModeActive={matrixEnabled}
                            isAsciiModeActive={asciiEnabled}
                            onDeselectElement={() => { setSelectedElement(null); setSelectedLayer(null); }}
                            showVirtualKeyboard={showVirtualKeyboard}
                            setShowVirtualKeyboard={setShowVirtualKeyboard}
                            showMediaPanel={showMediaPanel}
                            setShowMediaPanel={setShowMediaPanel}
                            showUnboundMediaList={showUnboundMediaList}
                            setShowUnboundMediaList={setShowUnboundMediaList}
                            toggleWinamp={() => setShowWinamp(prev => !prev)}
                            showWinamp={showWinamp}
                            swapLayerOrder={() => setShowLayerPanel(true)}
                            onSelectLayer={onSelectLayer}
                            toggleLayerPanel={() => setShowLayerPanel(prev => !prev)}
                            showLayerPanel={showLayerPanel}
                            onToggleMedia={onToggleMedia}
                            fps={fps}
                            isRecording={isRecording}
                            toggleRecording={toggleRecording}
                            audioData={audioData}
                            renderAudioControls={renderAudioControls}
                            toggleAudioPanel={() => setShowAudioPanel(prev => !prev)}
                            isFFmpegLoaded={isFFmpegLoaded}
                            isStreaming={isStreaming}
                            toggleStreaming={toggleStreaming}
                            streamBitrate={streamBitrate}
                            setStreamBitrate={setStreamBitrate}
                            streamResolution={streamResolution}
                            setStreamResolution={setStreamResolution}
                            streamServerUrl={streamServerUrl}
                            setStreamServerUrl={setStreamServerUrl}
                            streamKey={streamKey}
                            setStreamKey={setStreamKey}
                            handleClearAllMedia={handleClearAllMedia}
                            handleClear404Media={handleClear404Media}
                            toggleAudioIntegration={() => setUseAsioProcessing(prev => !prev)}
                            isAudioIntegrationActive={useAsioProcessing}
                        />
                    </SkryrPalette>
                </Suspense>
                {audioRef.current && (
                    <WebampMilkdrop {...webampProps} />
                )}

                <canvas ref={barCanvasRef} className="fixed bottom-0 left-0 w-full h-[50px] z-10 bg-transparent pointer-events-none" />

                {!isStarted && (
                    <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-[10002]">
                        <div
                            className="relative w-[200px] h-[200px] rounded-full flex items-center justify-center"
                            style={{
                                background: countdown > 0 ? "radial-gradient(circle, #666, #333)" : "radial-gradient(circle, #ff0000, #cc0000)",
                                boxShadow: countdown > 0 ? "0 0 20px #666, inset 0 0 15px #222" : "0 0 20px #ff0000, inset 0 0 15px #800000",
                                border: "5px solid #333",
                                animation: "pulseGlow 2s infinite ease-in-out",
                                pointerEvents: countdown > 0 ? "none" : "auto",
                                cursor: countdown > 0 ? "not-allowed" : "pointer",
                            }}
                            onClick={countdown === 0 ? handleStart : undefined}
                            title={countdown === 0 ? "Launch Nuclear Audio" : "Please wait..."}
                        >
                            <span className="text-white text-2xl font-bold uppercase" style={{ textShadow: "0 0 5px #000" }}>
                                {countdown > 0 ? countdown : "LAUNCH"}
                            </span>
                            <div className="absolute w-full h-full rounded-full border-2 border-white/50" style={{ animation: "spinGlow 3s infinite linear" }} />
                        </div>
                        <div className="mt-5 text-center max-w-[600px] text-sm p-2 bg-black/70 rounded" style={{ color: computedColor }}>
                            {helpTips[currentTipIndex]}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SkryrPage;