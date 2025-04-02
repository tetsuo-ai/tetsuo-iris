"use client";

import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Workspace from "./Workspace";
import { useEffects } from "./hooks/useEffects";
import { WebampMilkdrop, WebampMilkdropProps } from "./WebampMilkdrop";
import VirtualKeyboard, { KeyMapping, MediaItem, MediaItem as VirtualKeyboardMediaItem } from "./VirtualKeyboard";
import { useFullscreen } from "./hooks/useFullscreen";
import { useMediaState, CustomTextItem } from "./hooks/useMediaState";
import { useDrag } from "./hooks/useDrag";
import AsioAudioProcessor from "./AsioAudioProcess";
import { Button } from "@/components/ui/button";
import Slider from "@/components/ui/slider";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import type { ExtendedMediaItem } from "@/components/pages/MediaPage/SkryrPage/ui/skryr-toolbar";

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

const SkryrToolbar = dynamic(() => import("@/components/pages/MediaPage/SkryrPage/ui/skryr-toolbar"), { ssr: false });
const SkryrPalette = dynamic(() => import("@/components/pages/MediaPage/SkryrPage/ui/skryr-palette"), { ssr: false });

type SelectedElement = { type: "media" | "customText"; index: number } | null;
type SelectedLayer = "milkdrop" | "matrix" | "ascii" | "allMedia" | "background" | null;
type MixBlendMode = "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" |
    "color-dodge" | "color-burn" | "hard-light" | "soft-light" | "difference" |
    "exclusion" | "hue" | "saturation" | "color" | "luminosity";

interface SkryrPageProps {
    backgroundEnabled?: boolean;
}

const defaultMediaItems: ExtendedMediaItem[] = [
    {
        type: "image",
        src: "https://via.placeholder.com/150",
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
        type: "video",
        src: "https://www.w3schools.com/html/mov_bbb.mp4",
        x: 20,
        y: 20,
        scale: 1,
        rotation: 0,
        opacity: 1,
        visible: false,
        interruptOnPlay: true,
        isManuallyControlled: true,
        showAt: 0,
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
    const asioAudioRef = useRef<HTMLAudioElement>(null);
    const matrixCanvasRef = useRef<HTMLCanvasElement>(null);
    const barCanvasRef = useRef<HTMLCanvasElement>(null);
    const visualizerCanvasRef = useRef<HTMLCanvasElement>(null);
    const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
    const backgroundVideoRef = useRef<HTMLVideoElement>(null);
    const processorRef = useRef<AsioAudioProcessor | null>(null);

    const { isFullscreen, workspaceDimensions, handleToggleFullscreen } = useFullscreen();
    const { mediaList: baseMediaList, setMediaList: setBaseMediaList, customTexts, setCustomTexts, keyMappings, setKeyMappings } =
        useMediaState(isFullscreen);

    // Cast mediaList to ExtendedMediaItem[] and ensure setMediaList matches
    const mediaList = baseMediaList as ExtendedMediaItem[];
    const setMediaList = setBaseMediaList as React.Dispatch<React.SetStateAction<ExtendedMediaItem[]>>;
    
    // Filter for useDrag to match MediaItem
    const mediaListForDrag: MediaItem[] = mediaList
        .filter((item) => ["audio", "video", "image"].includes(item.type))
        .map((item) => ({
            type: item.type as "audio" | "video" | "image",
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
            opacity: 1
        }));

    const { onImageMouseDown, onCustomTextMouseDown } = useDrag(
        mediaListForDrag, // Use filtered list
        customTexts,
        setMediaList as React.Dispatch<React.SetStateAction<MediaItem[]>>, // Adjust type for useDrag
        setCustomTexts
    );

    useEffect(() => {
        let asioAudio: HTMLAudioElement | null = null;

        if (!useAsioProcessing) {
            if (processorRef.current) {
                processorRef.current.dispose();
                processorRef.current = null;
            }
            if (audioRef.current) {
                audioRef.current.muted = false;
                audioRef.current.volume = volume;
            }
            document.querySelectorAll("audio").forEach((el) => {
                const mediaEl = el as HTMLMediaElement;
                if (mediaEl !== audioRef.current) {
                    mediaEl.muted = false;
                }
            });
            setAudioReady(true);
            return;
        }

        if (!processorRef.current) {
            processorRef.current = new AsioAudioProcessor();
        }

        asioAudio = new Audio();
        asioAudio.className = "hidden";
        document.body.appendChild(asioAudio);

        if (!processorRef.current.isMediaElementConnected(asioAudio)) {
            processorRef.current.connectMediaElement(asioAudio);
            asioAudio.muted = false;
            processorRef.current.setVolume(volume);
            if (audioRef.current && audioRef.current.src) {
                asioAudio.src = audioRef.current.src;
                if (isPlaying) {
                    asioAudio.play().catch((err) => console.error("ASIO play error:", err));
                }
            }
        } else {
            processorRef.current.setVolume(volume);
        }

        if (backgroundVideoRef.current && !processorRef.current.isMediaElementConnected(backgroundVideoRef.current)) {
            processorRef.current.connectMediaElement(backgroundVideoRef.current);
        }
        mediaList.forEach((item, index) => {
            const videoElement = document.querySelector(`#media-video-${index}`) as HTMLMediaElement;
            if (videoElement && !processorRef.current!.isMediaElementConnected(videoElement)) {
                processorRef.current!.connectMediaElement(videoElement);
            }
        });

        document.querySelectorAll("#webamp-container audio").forEach((el) => {
            const mediaEl = el as HTMLMediaElement;
            if (mediaEl !== audioRef.current && mediaEl !== asioAudio) {
                mediaEl.muted = true;
                mediaEl.pause();
            }
        });

        setAudioReady(true);

        return () => {
            if (processorRef.current) {
                processorRef.current.dispose();
                processorRef.current = null;
            }
            if (audioRef.current) {
                audioRef.current.muted = false;
            }
            if (asioAudio) {
                document.body.removeChild(asioAudio);
                asioAudio = null;
            }
        };
    }, [useAsioProcessing, mediaList, volume, isPlaying]);

    const handleClearAllMedia = useCallback(() => {
        setMediaList([]);
        setSelectedElement(null);
        setActiveMediaIndex(null);
    }, [setMediaList]);

    const handleClear404Media = useCallback(() => {
        setMediaList(prev => prev.filter(item => !media404List.includes(item.src)));
        setMedia404List([]);
    }, [setMediaList, media404List]);

    const toggleRecording = useCallback(async () => {
        if (!isRecording && !isStreaming) {
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({
                    video: { displaySurface: "monitor" },
                    audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 },
                });

                const recorder = new MediaRecorder(stream, {
                    mimeType: "video/webm;codecs=vp8,opus",
                    videoBitsPerSecond: 2500000,
                    audioBitsPerSecond: 128000,
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
                                "-b:a", "128k",
                                "-preset", "fast",
                                "output.mp4",
                            ]);
                            const mp4Data = (await ffmpegRef.current.readFile("output.mp4")) as Uint8Array;
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
                    setTimeout(() => {
                        setIsPreparingFile(false);
                        setPrepStatus(null);
                    }, 2000);
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
    }, [isRecording, mediaRecorder, isStreaming]);

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
        const savedMedia = localStorage.getItem("skryrMediaList");
        const savedMappings = localStorage.getItem("skryrKeyMappings");
        const savedPanels = localStorage.getItem("skryrPanels");

        if (savedMedia) {
            const parsedMedia: ExtendedMediaItem[] = JSON.parse(savedMedia);
            setMediaList(parsedMedia.length > 0 ? parsedMedia : defaultMediaItems);
        } else {
            setMediaList(defaultMediaItems);
        }

        if (savedMappings) setKeyMappings(JSON.parse(savedMappings));
        if (savedPanels) {
            const { giphy, keyboard, media, unbound, layer } = JSON.parse(savedPanels);
            setShowGiphyKeyboard(giphy);
            setShowVirtualKeyboard(keyboard);
            setShowMediaPanel(media);
            setShowUnboundMediaList(unbound);
            setShowLayerPanel(layer);
        }
    }, [setMediaList, setKeyMappings]);

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

    useEffect(() => {
        mediaList.forEach(item => {
            fetch(item.src, { method: "HEAD" })
                .then(response => {
                    if (!response.ok) {
                        setMedia404List(prev => [...new Set([...prev, item.src])]);
                    }
                })
                .catch(() => setMedia404List(prev => [...new Set([...prev, item.src])]));
        });
    }, [mediaList]);

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

    useEffect(() => {
        let asioAudio: HTMLAudioElement | null = null;

        if (!useAsioProcessing) {
            if (processorRef.current) {
                processorRef.current.dispose();
                processorRef.current = null;
            }
            if (audioRef.current) {
                audioRef.current.muted = false;
                audioRef.current.volume = volume;
            }
            document.querySelectorAll("audio").forEach((el) => {
                const mediaEl = el as HTMLMediaElement;
                if (mediaEl !== audioRef.current) {
                    mediaEl.muted = false;
                }
            });
            setAudioReady(true);
            return;
        }

        if (!processorRef.current) {
            processorRef.current = new AsioAudioProcessor();
        }

        asioAudio = new Audio();
        asioAudio.className = "hidden";
        document.body.appendChild(asioAudio);

        if (!processorRef.current.isMediaElementConnected(asioAudio)) {
            processorRef.current.connectMediaElement(asioAudio);
            asioAudio.muted = false;
            processorRef.current.setVolume(volume);
            if (audioRef.current && audioRef.current.src) {
                asioAudio.src = audioRef.current.src;
                if (isPlaying) asioAudio.play().catch((err) => console.error("ASIO play error:", err));
            }
        }

        // Sync asioAudio with audioRef.current changes
        const syncAudio = () => {
            if (audioRef.current && asioAudio && audioRef.current.src !== asioAudio.src) {
                asioAudio.src = audioRef.current.src;
                if (isPlaying) asioAudio.play().catch((err) => console.error("ASIO sync play error:", err));
            }
        };
        if (audioRef.current) {
            audioRef.current.addEventListener("play", syncAudio);
            audioRef.current.addEventListener("pause", () => asioAudio?.pause());
            audioRef.current.addEventListener("ended", () => asioAudio?.pause());
        }

        // Don’t connect audioRef.current directly to avoid conflicts
        // if (audioRef.current && !processorRef.current.isMediaElementConnected(audioRef.current) && audioRef.current !== webampAudioElement) {
        //     processorRef.current.connectMediaElement(audioRef.current);
        // }

        return () => {
            if (processorRef.current) {
                processorRef.current.dispose();
                processorRef.current = null;
            }
            if (audioRef.current) {
                audioRef.current.muted = false;
                audioRef.current.removeEventListener("play", syncAudio);
                audioRef.current.removeEventListener("pause", () => asioAudio?.pause());
                audioRef.current.removeEventListener("ended", () => asioAudio?.pause());
            }
            if (asioAudio && document.body.contains(asioAudio)) {
                document.body.removeChild(asioAudio);
            }
        };
    }, [useAsioProcessing, mediaList, volume, isPlaying, webampAudioElement]);

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

    const handleBackgroundMediaDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const url = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text");
        if (url && /\.(mp4|webm|gif)$/.test(url)) {
            setBackgroundMedia(url);
        }
    };

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
        setSelectedElement(elem);
        setSelectedLayer(null);
        if (event && event.detail === 2) {
            setShowLayerPanel(false); // Close Layers & Effects
            setShowPalette(true);
            setLastInteractionWasDoubleClick(true);
        } else {
            setLastInteractionWasDoubleClick(false);
        }
    }, []);

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
                setMediaList((prev: ExtendedMediaItem[]) => [
                    ...prev,
                    {
                        type: "image",
                        src: optimizedSrc,
                        x: 0,
                        y: 0,
                        scale: scaleToCover,
                        rotation: 0,
                        opacity: 1,
                        visible: true,
                        interruptOnPlay: false,
                        isManuallyControlled: true,
                        showAt: 0,
                        hideAt: Infinity,
                        mixBlendMode: "normal",
                    } as ExtendedMediaItem,
                ]);
                setShowGiphyKeyboard(false);
            }
        },
        [setMediaList, workspaceDimensions]
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
        const onKeyDown = (e: KeyboardEvent) => {
            switch (e.key.toLowerCase()) {
                case "enter": togglePlayPause(); break;
                case "tab":
                    e.preventDefault();
                    setShowPalette(p => !p);
                    break;
                case "f1": console.log("Help: Press F1 again to hide this log."); break;
                case "f2": setShowVirtualKeyboard(p => !p); break;
                case "f3": setShowMediaPanel(p => !p); break;
                case "f4": setShowUnboundMediaList(p => !p); break;
                case "f7": setShowLayerPanel(p => !p); break;
                case "f9": handleStop(); break;
                case "f10": handleStop(); togglePlayPause(); break;
                case "f11": handleToggleFullscreen(); break;
                case "pageup": setZoomLevel(p => clamp(p + 0.1, 0.5, 3)); break;
                case "pagedown": setZoomLevel(p => clamp(p - 0.1, 0.5, 3)); break;
                default:
                    const mapping = keyMappings.find(m => m.key.toUpperCase() === e.key.toUpperCase());
                    if (mapping && mapping.assignedIndex !== null) {
                        const mediaIndex = mapping.assignedIndex;
                        setMediaList(prev =>
                            prev.map((item, i) => {
                                if (i === mediaIndex) {
                                    const shouldBeVisible = !item.visible;
                                    setActiveMediaIndex(shouldBeVisible ? mediaIndex : null);
                                    return { ...item, visible: shouldBeVisible, isManuallyControlled: true };
                                }
                                return item.interruptOnPlay && activeMediaIndex !== i && activeMediaIndex !== null
                                    ? { ...item, visible: false }
                                    : item;
                            })
                        );
                    }
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [keyMappings, mediaList, setMediaList, handleToggleFullscreen, togglePlayPause, handleStop, activeMediaIndex]);


    const { computedColor: effectsColor } = useEffects({
        matrixEnabled,
        visualizerEnabled: visualizerEnabled && !showWinamp,
        matrixCanvasRef,
        visualizerCanvasRef,
        barCanvasRef,
        audioContext: processorRef.current ? processorRef.current.getAudioContext() : null,
        audioData,
        isFullscreen,
        isPlaying,
        computedColor,
    });

    // Adjust mediaListForComponents to match VirtualKeyboard's MediaItem (with opacity)
    const mediaListForComponents: VirtualKeyboardMediaItem[] = mediaList
        .filter((item) => ["audio", "video", "image"].includes(item.type))
        .map((item) => ({
            type: item.type as "audio" | "video" | "image",
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
            opacity: item.opacity, // Include required opacity
        }));

    const renderVirtualKeyboardPanel = useCallback(
        () => (
            <VirtualKeyboard
                keyMappings={keyMappings}
                mediaList={mediaListForComponents}
                setKeyMappings={setKeyMappings}
                setMediaList={(list: VirtualKeyboardMediaItem[]) => setMediaList(list as ExtendedMediaItem[])} // Adjust type
                computedColor={computedColor}
                onSelectElement={onSelectElement}
            />
        ),
        [keyMappings, mediaListForComponents, setKeyMappings, setMediaList, computedColor, onSelectElement]
    );

    // In SkryrPage.tsx
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

        const scaleToCover = () => {
            const workspaceWidth = workspaceDimensions.width;
            const workspaceHeight = workspaceDimensions.height;
            const scaleFactor = Math.min(workspaceWidth, workspaceHeight) / 200; // Adjusted for tighter fit
            updateMediaProperty("scale", scaleFactor);
        };

        const centerMedia = () => {
            updateMediaProperty("x", 50);
            updateMediaProperty("y", 50);
        };

        const isMediaType = ["image", "gif", "video"].includes(media.type);

        return (
            <div
                className="flex flex-col gap-1 p-2 text-white"
                style={{ backgroundColor: "rgba(0, 0, 0, 0.8)", color: computedColor, minWidth: "220px" }}
            >
                <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-bold truncate" title={media.src || "Text"}>
                        {media.src ? media.src.split("/").pop()?.substring(0, 10) : "Text"}
                    </span>
                    <Button
                        onClick={() => {
                            setSelectedElement(null);
                            setLastInteractionWasDoubleClick(false);
                        }}
                        className="p-1 bg-transparent hover:bg-gray-600 transition-colors"
                    >
                        <i className="fa-solid fa-times" />
                    </Button>
                </div>

                {isMediaType && (
                    <>
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
                            <i className="fa-solid fa-arrows-up-down text-xs" />
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
                        <div className="flex gap-1">
                            <Button
                                onClick={scaleToCover}
                                className="p-1 bg-transparent hover:bg-gray-600 transition-colors flex-1"
                            >
                                <i className="fa-solid fa-arrows-alt text-xs" /> Cover
                            </Button>
                            <Button
                                onClick={centerMedia}
                                className="p-1 bg-transparent hover:bg-gray-600 transition-colors flex-1"
                            >
                                <i className="fa-solid fa-align-center text-xs" /> Center
                            </Button>
                        </div>
                    </>
                )}

                {media.type === "text" && (
                    <div className="flex flex-col gap-1">
                        <span className="text-xs">Text</span>
                        <textarea
                            value={media.textContent || ""}
                            onChange={(e) => updateMediaProperty("textContent", e.target.value)}
                            className="bg-gray-800 text-white p-1 rounded h-16 resize-y text-xs"
                            placeholder="ASCII/text"
                            style={{ borderColor: computedColor }}
                        />
                    </div>
                )}

                <Button
                    onClick={() => {
                        setMediaList((prev) => prev.filter((_, i) => i !== selectedElement.index));
                        setSelectedElement(null);
                        setLastInteractionWasDoubleClick(false);
                    }}
                    className="p-1 bg-red-600 hover:bg-red-700 transition-colors mt-1"
                >
                    <i className="fa-solid fa-trash text-xs" />
                </Button>
            </div>
        );
    }, [selectedElement, mediaList, setMediaList, workspaceDimensions, computedColor]);

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
                    mediaList={mediaListForComponents.map((item, index) => ({
                        ...item,
                        id: `media-${item.type}-${index}`,
                    }))}
                    customTexts={customTexts}
                    isFullscreen={isFullscreen}
                    workspaceDimensions={workspaceDimensions}
                    zoomLevel={zoomLevel}
                    asciiEnabled={asciiEnabled}
                    onMediaListUpdate={(list: MediaItem[]) => setMediaList(list as ExtendedMediaItem[])} // Adjust type
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
                    milkdropMixBlendMode="color" setCustomTexts={function (value: React.SetStateAction<CustomTextItem[]>): void {
                        throw new Error("Function not implemented.");
                    } }                />

                {audioReady && showWinamp && (
                    <div
                        className="absolute inset-0 z-1 pointer-events-auto"

                    >
                        <WebampMilkdrop {...webampProps} />
                    </div>
                )}

                {isPreparingFile && (
                    <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-[10003] w-1/2 bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 animate-panel">
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
                            audioProgress={audioRef.current ? audioRef.current.currentTime / (audioRef.current.duration || 1) : 0}
                            setAudioProgress={(progress: number) => {
                                if (audioRef.current) audioRef.current.currentTime = progress * (audioRef.current.duration || 1);
                            }}
                            selectedElement={selectedElement}
                            renderOptionsContent={renderOptionsContent} // Added
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
                            audioData={new Uint8Array()}
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
                            isAudioIntegrationActive={useAsioProcessing} setSelectedElement={function (value: React.SetStateAction<{ type: "media" | "customText"; index: number; } | null>): void {
                                throw new Error("Function not implemented.");
                            } }                        />
                    </SkryrPalette>
                    <div className="flex flex-row gap-4">
                        <div className="flex gap-2">
                            <Button
                                onClick={handleClearAllMedia}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                            >
                                Clear All Media
                            </Button>
                            <Button
                                onClick={handleClear404Media}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                            >
                                Clear 404 Media
                            </Button>
                        </div>
                    </div>
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