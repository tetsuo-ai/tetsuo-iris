"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Slider from "@/components/ui/slider";
import Breadcrumbs from "@/components/Breadcrumbs";
import { AlertErrorMessage } from "@/components/shared/AlertErrorMessage";

// --- INTERFACES ---
interface MediaItem {
    type: string;
    src: string;
    x: number; // percent relative to workspace
    y: number; // percent relative to workspace
    scale: number;
    rotation: number;
    opacity: number;
    visible: boolean;
    showAt: number;
    hideAt: number;
}

interface CustomTextItem {
    id: number;
    text: string;
    x: number; // percent relative to workspace
    y: number; // percent relative to workspace
    scale: number;
    flashSpeed: number;
    flashIntensity: number;
    color: string;
    isDefault?: boolean;
}

type SelectedElement = { type: "media" | "customText"; index: number } | null;

const TetsuoAsciiPage = () => {

// --- CONSTANTS ---
const containerWidth = 800;
const containerHeight = 600;
const clamp = (val: number, min: number, max: number) =>
    Math.max(min, Math.min(max, val));

// Default startup ASCII text (as provided)
const defaultAscii = `##############################%@@@@@@@%%%%%##############%######**##################################
############################%%@@@@@@@@@@%%%%%%%##########%%######**#################################
###########################%@@@@@@@@@@@@@@@@@@@@@@@%%%%###%###**###*+###############################
##########################%@@@@@@@@@@@@@@@@@@@@@@@@@@@@%%@%%###++###*-*%############################
#########################%@@@@@@@@@@@@@@@@@@@@@@@%%%%#++=#%@%###*+###*-*############################
########################%@@@@@@@@@@@@@@@@@@@@%%##+=+=*=-==+*##+#%#%###*=*%##########################
#######################%@@@@@@@@@@@@@@@@@@@@@%%%%@%%%%%+=--=:===#*+%%##+:*##########################
######################%@@@@@@@@@@@@@@%@@#%#%%@@@@%@%%%@@@%*#+=*--*:*@%##=-##########################
#####################%@@@@@@@@@@@@@@@%%#%@#+**#%%%###*#%%@@%%%%#==+-%@+*%**#########################
#####################@@@@@@@@@@@@@@@@%%+*****##**+++++*#*#@@@@@%%**=#@#:*%##########################
####################%@@@@@@@@@@@@@@@@*%*++*%%*+++***#%@+-*%%%@@@@@%**@%+=++#########################
####################@@@@@@@@@%@@@@@#%**+*%@#***#%%@@@@*..+%%%@@@@@@%%%@%%*-=*#######################
###################%@@@@@@@@@#%%@@##*+*#@@%*#%%%@@%%#%-  =%%@@@@@@@@@#%@@@#:-*######################
###################%@@@@@@@%@#*##%#***%@@%##%%*####*%*:. =%%@@@@@@@@@##@@@%=--######################
###################@@@@@@@%###++*****####*##%===##%%*-  .+*%@@@@@@@@@*#%@@@##--*####################
###################@@@@@@%%%%%#**#*********#######**+. .+-*#@@@@@@@@@*%@@@@%%*:-+###################
#%%%+*#############@@@@@@%%###%%%%%#**+*++******+***=.-+=:+#@@@@@@@@@#%@@@@%@@+--=*#################
#%@@#*#############%@%@@@#**#%%%%%%#*******+++++****++*+:--#@@@@@@@@%%@@@@@@@@*-=++*################
##@@%###############%%@@@@%%@%++####*+=+***++++**+++***--:-@@@@@@@@@%%@@@@@@@%+==+**################
%@%@@#+#############%#%@@@@%@%*+###**- .-**+++**+++++*+=: +@@@@@@@%@%@@@@@@@@@=:+-=*################
#@#%@@*################%%@@@%%###****+++=*+++*++++++*+-. .%@@@@%@@%@%@@@@@@@@@-.-=-=################
#%%#@@##%################%@@%#******##***++++++++++++:   -%@@@%@@%%@@@@@@@@@@#::===:=*##############
##%#%@%*#################%@@@%****++**++*#**+++++++=:   .*@@@%%@@%%@@@@@@@@@%*:-----:==*############
###@*%@#*################%@@@@***+++++*%@%%@%%#++++:   .=#@@@@%@%%%@@@@@%@@%#**%#=.--=+++*##########
###%%#@@**##############@@@@@@%***++++#@@%%%%*++++-    -*%@@%%%%%%@@@@@@%%%*##%@%#=:--+**++#########
###%@#%@@*#############%@%%@@@@@#+++++*%%##**+++=:    :+#@@%%%%%%%@@@@%%%*#*%%@@%%#=:-=####++*######
###%@%%@@%#%%%########%%%%%@@@@@@%*+++++*****=::.    .*#@@%#%%%%%%@@@%%##=*%%@@@%%@%=::+###%#++*####
%%@@@%%%@@%@%#@%###########%@@@@@@@%*++++*+++-     .-*#%%%##%%%%%%%#%%##*#%%%@@@@%%%#-:.+####%#*++##
@@@%%%%@@@@%@*%%###########@@@@@@@@@@@#*++++++:..-=*####%#*%%%%@@%%%%%%%%%%%%%%%#%%%@*:..+*####%#***
@@@@@@@@@@@%#%#############%@@@@@@@@@@@@%#*+++**#%###***#*#%@@@%%#####%%#%%%%%%%%#%#%%+:-:+*#######%
@@@@@@@@@@@@#%%%############@@@@@@@@@@@@@@@%%@@@%###**+*#%%@@@%%%#++==+#%%%%%%%%%%###%%--+:+*#####**
@@@@@@@%%@@@@#@%%###########%%%@@@@@@@@@@@@@@@@@@##*+++#%@@@%%%%%%#%####%%%%%%%%%%%*#%@#-+*=+**####*
@@@%@@@@#@@@@%#@%###########%#%@@@@@@@@@@@@@@@@@@%**++#@@@%%%%%%%%%%@%%%%%%%%%%%%%%%##%@*=%#++**####
@@@@@@@@%%@@@@#%@%############@@@@@@@@@@@@@@@@@@@%+**#@@@%%%%%%%%%%@@%%%%%%%%%%%%%%%%##%%**%#++**###
@@@@@@@@@@@@@@%#@@###########%%%@@@@@@@@@@@@@@@@@@*#%@@@@%%@%%%%%%@@%#%%%%%%%%%%%%%%%%%%@%##@#*+**##
@@@@@@@@@@@@@@@@@@#@@###########%%%@@@@@@@@@@@@@@@@@@*#%@@@@%%@%%%%%%@@%#%%%%%%%%%%%%%%%%%%@%##@#*+**##
@@@@@@@@@@@@@@@@@@@@#%@%#########%%#%%%@@@@@@@@@@@@@@%%%@@@@@%%%%%%%%%#+-#%##%%%%%%%%%%%%%%%%@%%%%%%*++##
@@@@@@@@@@@@@@@#@@@@########%###%#%@@@@@@@@@@@@@%#*#@@@@@%%%%%%*++=. :*%%%%%%%%%%%%%%#%%%@@%%%%%%****
@@@##%@@@@@@@@@@%%@%##########%##%@@@@@@@@@@%#*++*%@@@@@%%%%%*.=+:    =##++*#%%##%#::=+%%@%%%%%%%+##
##%###@@@@@@@%@@@@@@@%@%########%###@%%@@@@@%%#**#*#%@@@@@%%%%%* .+=.     -:.=+##=.=%+ .=.:%@@%%@%#%%*#
##%%#%@@@@@@@%@@@%@@%#######%###%%%@@@%#**++#%%@@@@@@@@%%@@#- -+-..     :=+#+. ..**. =- :%@%%@%##@@#
###@@%%@@%@@@%@@@@@@@%#####%%#####@@%#***+++==#@@@@@@@@%%@#+: =+::.    :++*=.  . .+- -*: -%@%%@#*@@@
###@@###@%@@@@%@@@@@@@##########%@%#**+++++-.=%%@@@@@@@@@#++..+=::   .-+++:   ..  := .++. #@@%%%+#@@
###%@%#%@@%@@@@@@@@@@@%########%@%*+++====-. -#%@@@@@@@@#+++.=+-:  .-=+++: .-.:    =: -+= *@@@%@**@@`;

// --- STATE DECLARATIONS ---
const [mediaList, setMediaList] = useState<MediaItem[]>([]);
const [mediaUrl, setMediaUrl] = useState<string>("");

const [customTexts, setCustomTexts] = useState<CustomTextItem[]>([]);
const [customTextInput, setCustomTextInput] = useState<string>("");

const [videoSpeed, setVideoSpeed] = useState<number>(1);
const [currentTime, setCurrentTime] = useState<number>(0);
const [globalGlitch, setGlobalGlitch] = useState<number>(0);
const [backgroundEnabled, setBackgroundEnabled] = useState<boolean>(true);
const [cyberGlitchMode, setCyberGlitchMode] = useState<boolean>(false);
const [flashSpeed, setFlashSpeed] = useState<number>(3);
const [flashIntensity, setFlashIntensity] = useState<number>(5);

const [asciiPos, setAsciiPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
const [dashboardPos, setDashboardPos] = useState<{ x: number; y: number }>({ x: 20, y: 20 });
const [videoPos, setVideoPos] = useState<{ x: number; y: number }>({ x: 50, y: 30 });
const [asciiScale, setAsciiScale] = useState<number>(1);
const [spinSpeed, setSpinSpeed] = useState<number>(1);
const [zoom, setZoom] = useState<number>(1);
const [customTextPos, setCustomTextPos] = useState<{ x: number; y: number }>({ x: 50, y: 80 });

const [isPlaying, setIsPlaying] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);
const [embeddedMode, setEmbeddedMode] = useState<boolean>(false);

// Selected element for contextual options
const [selectedElement, setSelectedElement] = useState<SelectedElement>(null);

// --- DRAG REFS ---
const dashboardDragStart = useRef<{ mouseX: number; mouseY: number; posX: number; posY: number } | null>(null);
const videoDragStart = useRef<{ mouseX: number; mouseY: number; posX: number; posY: number } | null>(null);
const imageDragStarts = useRef<{ [key: number]: { mouseX: number; mouseY: number; posX: number; posY: number } }>({});
const customTextDragStarts = useRef<{ [id: number]: { mouseX: number; mouseY: number; posX: number; posY: number } }>({});
const asciiDragStart = useRef<{ mouseX: number; mouseY: number; posX: number; posY: number } | null>(null);

// --- Add default ASCII as a custom text element on mount if none exist ---
useEffect(() => {
    if (customTexts.length === 0) {
        setCustomTexts([
            {
                id: Date.now(),
                text: defaultAscii,
                x: 50,
                y: 50,
                scale: 1,
                flashSpeed: 3,
                flashIntensity: 5,
                color: "#00ff00",
                isDefault: true,
            },
        ]);
    }
}, []);

// --- FPS COUNTER ---
const fpsRef = useRef<number>(performance.now());
const [fps, setFps] = useState<number>(0);
useEffect(() => {
    const updateFps = () => {
        const now = performance.now();
        setFps(Math.round(1000 / (now - fpsRef.current)));
        fpsRef.current = now;
        requestAnimationFrame(updateFps);
    };
    updateFps();
}, []);

// --- VIDEO PLAYBACK SPEED ---
useEffect(() => {
    const video = document.getElementById("video-player") as HTMLVideoElement;
    if (video) {
        video.playbackRate = videoSpeed;
    }
}, [videoSpeed]);

// --- GLOBAL MEDIA TIMER ---
useEffect(() => {
    const timer = setInterval(() => setCurrentTime(prev => prev + 1), 1000);
    return () => clearInterval(timer);
}, []);
useEffect(() => {
    setMediaList(prev =>
        prev.map(media => ({
            ...media,
            visible: media.showAt <= currentTime && media.hideAt >= currentTime,
        }))
    );
}, [currentTime]);

// --- CYBER GLITCH / MATRIX RAIN BACKGROUND ---
useEffect(() => {
    if (!backgroundEnabled) return;
    const overlay = document.createElement("div");
    overlay.id = "cyberpunk-overlay";
    document.body.appendChild(overlay);

    const matrixCanvas = document.createElement("canvas");
    matrixCanvas.id = "matrixCanvas";
    document.body.appendChild(matrixCanvas);

    const cyberpunkCSS = `
      #cyberpunk-overlay {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100vw;
        background: rgba(0, 0, 0, 0.9);
        color: #0ff;
        font-family: 'Orbitron', monospace;
        font-size: 16px;
        text-shadow: 0 0 5px #0ff, 0 0 10px #0ff;
        z-index: 1;
        padding: 10px;
        display: flex;
        justify-content: center;
        align-items: center;
        opacity: 0;
        transition: opacity 1s;
      }
      #matrixCanvas {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 0;
        opacity: 0.44;
        pointer-events: none;
      }
      body {
        color: #fff !important;
      }
    `;
    const style = document.createElement("style");
    style.id = "cyberpunk-style";
    style.innerHTML = cyberpunkCSS;
    document.head.appendChild(style);

    overlay.innerHTML = `<pre id="cyberpunk-terminal">Loading quantum encryption keys...</pre>`;
    setTimeout(() => {
        overlay.style.opacity = "1";
    }, 100);

    const terminalText = [
        "Decrypting mainframe...",
        "Hacking firewall...",
        "Uploading synthetic consciousness...",
        "ERROR: Human intervention detected..."
    ];
    let i = 0;
    function fakeTerminal() {
        const termElem = document.getElementById("cyberpunk-terminal");
        if (termElem && i < terminalText.length) {
            termElem.innerHTML += `\n${terminalText[i]}`;
            i++;
            setTimeout(fakeTerminal, 1000);
        } else {
            setTimeout(() => overlay.parentNode && overlay.parentNode.removeChild(overlay), 3000);
        }
    }
    fakeTerminal();

    const ctx = matrixCanvas.getContext("2d");
    let matrixInterval: number | null = null;
    function setCanvasSize() {
        matrixCanvas.width = window.innerWidth;
        matrixCanvas.height = window.innerHeight;
    }
    setCanvasSize();
    window.addEventListener("resize", setCanvasSize);
    if (ctx) {
        const fontSize = 20;
        const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        ctx.font = `${fontSize}px monospace`;
        const columns = Math.floor(window.innerWidth / fontSize);
        const drops = Array(columns).fill(0);
        const drawMatrix = () => {
            ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
            ctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
            ctx.fillStyle = "#0ff";
            for (let i = 0; i < drops.length; i++) {
                const text = chars.charAt(Math.floor(Math.random() * chars.length));
                const x = i * fontSize;
                const y = drops[i] * fontSize;
                ctx.fillText(text, x, y);
                if (y > matrixCanvas.height || Math.random() > 0.975) drops[i] = 0;
                drops[i]++;
            }
        };
        drawMatrix();
        matrixInterval = window.setInterval(drawMatrix, 50);
    }
    const escHandler = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
            overlay.parentNode && overlay.parentNode.removeChild(overlay);
            matrixCanvas.parentNode && matrixCanvas.parentNode.removeChild(matrixCanvas);
            style.parentNode && style.parentNode.removeChild(style);
        }
    };
    document.addEventListener("keydown", escHandler);
    return () => {
        document.removeEventListener("keydown", escHandler);
        window.removeEventListener("resize", setCanvasSize);
        if (matrixInterval) window.clearInterval(matrixInterval);
        overlay.parentNode && overlay.parentNode.removeChild(overlay);
        matrixCanvas.parentNode && matrixCanvas.parentNode.removeChild(matrixCanvas);
        style.parentNode && style.parentNode.removeChild(style);
    };
}, [backgroundEnabled]);

// --- GLOBAL GLITCH EFFECT (workspace shake) ---
useEffect(() => {
    if (globalGlitch > 0) {
        const container = document.getElementById("workspace");
        if (!container) return;
        const interval = setInterval(() => {
            const dx = (Math.random() - 0.5) * 5 * globalGlitch;
            const dy = (Math.random() - 0.5) * 5 * globalGlitch;
            container.style.transform = `translate(${dx}px, ${dy}px)`;
            setTimeout(() => (container.style.transform = ""), 100);
        }, 500);
        return () => clearInterval(interval);
    }
}, [globalGlitch]);

/* ================================
   DRAG HANDLERS (workspace-relative)
=================================== */
const getDeltaPercentages = (
    startX: number,
    startY: number,
    currentX: number,
    currentY: number
) => {
    const deltaX = ((currentX - startX) / containerWidth) * 100;
    const deltaY = ((currentY - startY) / containerHeight) * 100;
    return { deltaX, deltaY };
};

// Video player dragging
const onVideoMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    videoDragStart.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        posX: videoPos.x,
        posY: videoPos.y,
    };
    const onMouseMove = (event: MouseEvent) => {
        if (videoDragStart.current) {
            const { deltaX, deltaY } = getDeltaPercentages(
                videoDragStart.current.mouseX,
                videoDragStart.current.mouseY,
                event.clientX,
                event.clientY
            );
            setVideoPos({
                x: clamp(videoDragStart.current.posX + deltaX, 0, 100),
                y: clamp(videoDragStart.current.posY + deltaY, 0, 100),
            });
        }
    };
    const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        videoDragStart.current = null;
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
};

// Media items dragging
const onImageMouseDown = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    imageDragStarts.current[index] = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        posX: mediaList[index].x,
        posY: mediaList[index].y,
    };
    const onMouseMove = (event: MouseEvent) => {
        const start = imageDragStarts.current[index];
        if (start) {
            const { deltaX, deltaY } = getDeltaPercentages(
                start.mouseX,
                start.mouseY,
                event.clientX,
                event.clientY
            );
            setMediaList(prev =>
                prev.map((item, i) =>
                    i === index
                        ? {
                            ...item,
                            x: clamp(start.posX + deltaX, 0, 100),
                            y: clamp(start.posY + deltaY, 0, 100),
                        }
                        : item
                )
            );
        }
    };
    const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        delete imageDragStarts.current[index];
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
};

// Custom text elements dragging
const onCustomTextMouseDown = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    customTextDragStarts.current[id] = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        posX: customTexts.find(ct => ct.id === id)?.x ?? 50,
        posY: customTexts.find(ct => ct.id === id)?.y ?? 50,
    };
    const onMouseMove = (event: MouseEvent) => {
        const start = customTextDragStarts.current[id];
        if (start) {
            const { deltaX, deltaY } = getDeltaPercentages(
                start.mouseX,
                start.mouseY,
                event.clientX,
                event.clientY
            );
            setCustomTexts(prev =>
                prev.map(ct =>
                    ct.id === id
                        ? { ...ct, x: clamp(start.posX + deltaX, 0, 100), y: clamp(start.posY + deltaY, 0, 100) }
                        : ct
                )
            );
        }
    };
    const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        delete customTextDragStarts.current[id];
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
};

// Dashboard dragging
const onDashboardMouseDown = (e: React.MouseEvent) => {
    const tag = (e.target as HTMLElement).tagName.toLowerCase();
    if (tag === "input" || tag === "button") return;
    e.preventDefault();
    dashboardDragStart.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        posX: dashboardPos.x,
        posY: dashboardPos.y,
    };
    const onMouseMove = (event: MouseEvent) => {
        if (dashboardDragStart.current) {
            const dx = event.clientX - dashboardDragStart.current.mouseX;
            const dy = event.clientY - dashboardDragStart.current.mouseY;
            setDashboardPos({
                x: dashboardDragStart.current.posX + dx,
                y: dashboardDragStart.current.posY + dy,
            });
        }
    };
    const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        dashboardDragStart.current = null;
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
};

/* ================================
   MEDIA FUNCTIONS
=================================== */
const addMedia = () => {
    if (mediaUrl.trim()) {
        let type = "";
        if (mediaUrl.match(/\.(jpeg|jpg|png|gif)$/i)) type = "image";
        else if (mediaUrl.match(/\.(mp4|webm|ogg)$/i)) type = "video";
        else if (mediaUrl.match(/\.(mp3|wav|ogg)$/i)) type = "audio";
        if (type) {
            setMediaList(prev => [
                ...prev,
                {
                    type,
                    src: mediaUrl,
                    x: 50,
                    y: 50,
                    scale: 1,
                    rotation: 0,
                    opacity: 1,
                    visible: true,
                    showAt: 0,
                    hideAt: 120,
                },
            ]);
            setMediaUrl("");
        }
    }
};

const removeMedia = (index: number) => {
    setMediaList(prev => prev.filter((_, i) => i !== index));
};

// Dummy play handler for video/audio
    const handlePlay = () => {
        setError(null);
        setIsPlaying(true);
        try {
            const video = document.getElementById("video-player") as HTMLVideoElement;
            const audio = document.getElementById("audio-player") as HTMLAudioElement;

            if (video && video.paused) {
                video.play();
            }

            if (audio && audio.paused) {
                audio.play();
            }
        } catch (err) {
            console.error("Error while starting playback:", err);
            setError("An unexpected error occurred during playback.");
        }
    };


// Add a new custom text element
const addCustomText = () => {
    if (customTextInput.trim() === "") return;
    const newItem: CustomTextItem = {
        id: Date.now(),
        text: customTextInput,
        x: 50,
        y: 50,
        scale: 1,
        flashSpeed: 3,
        flashIntensity: 5,
        color: "#00ff00",
    };
    setCustomTexts(prev => [...prev, newItem]);
    setCustomTextInput("");
};

// --- CONTEXTUAL OPTIONS PANEL ---
const renderOptionsPanel = () => {
    if (!selectedElement) return null;
    if (selectedElement.type === "media") {
        const media = mediaList[selectedElement.index];
        return (
            <div
                className="absolute z-50 bg-gray-900 p-2 border border-yellow-500"
                style={{ right: "10px", bottom: "10px", width: "300px" }}
            >
                <h2 className="text-lg font-bold mb-2">Media Options</h2>
                <Input
                    type="text"
                    placeholder="Media URL"
                    value={media.src}
                    onChange={(e) =>
                        setMediaList(prev =>
                            prev.map((item, i) =>
                                i === selectedElement.index ? { ...item, src: e.target.value } : item
                            )
                        )
                    }
                />
                <div className="mt-2">
                    <p className="text-sm">Scale</p>
                    <Slider
                        min={0.5}
                        max={3}
                        step={0.1}
                        value={[media.scale]}
                        onValueChange={(value: number[]) =>
                            setMediaList(prev =>
                                prev.map((item, i) =>
                                    i === selectedElement.index ? { ...item, scale: value[0] } : item
                                )
                            )
                        }
                    />
                </div>
                <div className="mt-2">
                    <p className="text-sm">Rotation</p>
                    <Slider
                        min={0}
                        max={360}
                        step={1}
                        value={[media.rotation]}
                        onValueChange={(value: number[]) =>
                            setMediaList(prev =>
                                prev.map((item, i) =>
                                    i === selectedElement.index ? { ...item, rotation: value[0] } : item
                                )
                            )
                        }
                    />
                </div>
                <div className="mt-2">
                    <p className="text-sm">Opacity</p>
                    <Slider
                        min={0}
                        max={1}
                        step={0.1}
                        value={[media.opacity]}
                        onValueChange={(value: number[]) =>
                            setMediaList(prev =>
                                prev.map((item, i) =>
                                    i === selectedElement.index ? { ...item, opacity: value[0] } : item
                                )
                            )
                        }
                    />
                </div>
                <Button
                    onClick={() => {
                        removeMedia(selectedElement.index);
                        setSelectedElement(null);
                    }}
                    className="bg-red-600 mt-2 w-full"
                >
                    Remove Media
                </Button>
                <Button
                    onClick={() => setSelectedElement(null)}
                    className="bg-gray-600 mt-2 w-full"
                >
                    Close Options
                </Button>
            </div>
        );
    } else if (selectedElement.type === "customText") {
        const ct = customTexts[selectedElement.index];
        return (
            <div
                className="absolute z-50 bg-gray-900 p-2 border border-yellow-500"
                style={{ right: "10px", bottom: "10px", width: "300px" }}
            >
                <h2 className="text-lg font-bold mb-2">Text Options</h2>
                <Input
                    type="text"
                    placeholder="Edit Text"
                    value={ct.text}
                    onChange={(e) =>
                        setCustomTexts(prev =>
                            prev.map((item, i) =>
                                i === selectedElement.index ? { ...item, text: e.target.value } : item
                            )
                        )
                    }
                />
                <div className="mt-2">
                    <p className="text-sm">Text Color</p>
                    <Input
                        type="color"
                        value={ct.color}
                        onChange={(e) =>
                            setCustomTexts(prev =>
                                prev.map((item, i) =>
                                    i === selectedElement.index ? { ...item, color: e.target.value } : item
                                )
                            )
                        }
                    />
                </div>
                <div className="mt-2">
                    <p className="text-sm">Scale</p>
                    <Slider
                        min={0.5}
                        max={3}
                        step={0.1}
                        value={[ct.scale]}
                        onValueChange={(value: number[]) =>
                            setCustomTexts(prev =>
                                prev.map((item, i) =>
                                    i === selectedElement.index ? { ...item, scale: value[0] } : item
                                )
                            )
                        }
                    />
                </div>
                <div className="mt-2">
                    <p className="text-sm">Flash Speed</p>
                    <Slider
                        min={0.5}
                        max={10}
                        step={0.1}
                        value={[ct.flashSpeed]}
                        onValueChange={(value: number[]) =>
                            setCustomTexts(prev =>
                                prev.map((item, i) =>
                                    i === selectedElement.index ? { ...item, flashSpeed: value[0] } : item
                                )
                            )
                        }
                    />
                </div>
                <div className="mt-2">
                    <p className="text-sm">Flash Intensity</p>
                    <Slider
                        min={1}
                        max={10}
                        step={1}
                        value={[ct.flashIntensity]}
                        onValueChange={(value: number[]) =>
                            setCustomTexts(prev =>
                                prev.map((item, i) =>
                                    i === selectedElement.index ? { ...item, flashIntensity: value[0] } : item
                                )
                            )
                        }
                    />
                </div>
                <Button
                    onClick={() => {
                        setCustomTexts(prev => prev.filter((_, i) => i !== selectedElement.index));
                        setSelectedElement(null);
                    }}
                    className="bg-red-600 mt-2 w-full"
                >
                    Remove Text
                </Button>
                <Button
                    onClick={() => setSelectedElement(null)}
                    className="bg-gray-600 mt-2 w-full"
                >
                    Close Options
                </Button>
            </div>
        );
    }
    return null;
};

// --- CLEAR ALL ELEMENTS (except default custom text) ---
const clearAllElements = () => {
    setMediaList([]);
    setCustomTexts(prev => prev.filter(ct => ct.isDefault));
    setSelectedElement(null);
};

/* ================================
   RENDER
=================================== */
return (
    <div className="relative w-full min-h-screen bg-black text-white overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-black bg-opacity-80 rounded-md z-50 relative">
            <Breadcrumbs />
            <h1 className="text-2xl font-bold">Tetsuo ASCII Experience</h1>
            <p className="text-yellow-400">FPS: {fps}</p>
            {error && <AlertErrorMessage message={error} />}
        </div>

        {/* Control Panel / Dashboard */}
        <div
            className="absolute bg-gray-800 p-2 rounded-md cursor-move z-50"
            style={{ left: `${dashboardPos.x}px`, top: `${dashboardPos.y}px` }}
            onMouseDown={onDashboardMouseDown}
        >
            <Input
                type="text"
                placeholder="Media URL"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
            />
            <Button
                onClick={addMedia}
                className="bg-blue-500 mt-2"
                onMouseDown={(e) => e.stopPropagation()}
            >
                Add Media
            </Button>
            <Button
                onClick={() => setBackgroundEnabled(!backgroundEnabled)}
                className={`w-full mt-2 ${backgroundEnabled ? "bg-green-600" : "bg-red-600"}`}
            >
                {backgroundEnabled ? "Disable Background" : "Enable Background"}
            </Button>
            <div className="mt-4">
                <p className="text-sm">Video Speed</p>
                <Slider
                    min={0.5}
                    max={3}
                    step={0.1}
                    value={[videoSpeed]}
                    onValueChange={(value: number[]) => setVideoSpeed(value[0])}
                />
            </div>
            <div className="mt-4">
                <p className="text-sm">Global Glitch</p>
                <Slider
                    min={0}
                    max={10}
                    step={1}
                    value={[globalGlitch]}
                    onValueChange={(value: number[]) => setGlobalGlitch(value[0])}
                />
            </div>
            <Button
                onClick={() => setCyberGlitchMode(!cyberGlitchMode)}
                className={`w-full mt-2 ${cyberGlitchMode ? "bg-green-600" : "bg-red-600"}`}
            >
                {cyberGlitchMode ? "Disable Cyber Glitch Mode" : "Enable Cyber Glitch Mode"}
            </Button>
            <Button onClick={handlePlay} className="w-full bg-blue-600 mt-2">
                Play
            </Button>
            <div className="mt-4">
                <Input
                    type="text"
                    placeholder="Enter Custom ASCII/Text"
                    value={customTextInput}
                    onChange={(e) => setCustomTextInput(e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                />
                <Button
                    onClick={addCustomText}
                    className="bg-blue-500 mt-2"
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    Add Custom Text
                </Button>
            </div>
            <Button onClick={clearAllElements} className="bg-red-700 mt-2 w-full">
                Clear All Elements
            </Button>
        </div>

        {/* Workspace Container (centered drop zone) */}
        <div
            id="workspace"
            style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: `${containerWidth}px`,
                height: `${containerHeight}px`,
                border: "1px solid white",
                background: "transparent",
            }}
        >
            {/* Draggable Video Player (resizable) */}
            <div
                style={{
                    position: "absolute",
                    left: `${videoPos.x}%`,
                    top: `${videoPos.y}%`,
                    transform: "translate(-50%, -50%)",
                    resize: "both",
                    overflow: "auto",
                    border: "1px solid gray",
                }}
                onMouseDown={onVideoMouseDown}
            >
                <video
                    id="video-player"
                    src="https://eaccelerate.me/euroacc/KenSub%20Engage%20_Mental%20Physics_.wav"
                    className="w-96 border border-gray-700 rounded-md"
                    controls={false}
                    loop
                    muted={!isPlaying}
                ></video>
            </div>

            {/* Draggable Media Items (resizable) */}
            {mediaList.map((item, index) =>
                item.visible ? (
                    <div
                        key={index}
                        style={{
                            position: "absolute",
                            left: `${item.x}%`,
                            top: `${item.y}%`,
                            transform: "translate(-50%, -50%)",
                            resize: "both",
                            overflow: "auto",
                            border:
                                selectedElement &&
                                    selectedElement.type === "media" &&
                                    selectedElement.index === index
                                    ? "2px solid yellow"
                                    : "1px solid gray",
                        }}
                        onDoubleClick={() => setSelectedElement({ type: "media", index })}
                        onMouseDown={(e) => onImageMouseDown(e, index)}
                    >
                        {item.type === "video" ? (
                            <video
                                src={item.src}
                                className="w-64 rounded-md"
                                controls
                                loop
                                muted
                            ></video>
                        ) : (
                            <img src={item.src} alt={item.type} className="max-w-[300px] max-h-[300px]" />
                        )}
                    </div>
                ) : null
            )}

            {/* Draggable Custom Text Elements */}
            {customTexts.map((ct, index) => (
                <div
                    key={ct.id}
                    className={`absolute cursor-grab select-none animate-pulse ${selectedElement &&
                            selectedElement.type === "customText" &&
                            selectedElement.index === index
                            ? "border-2 border-yellow-500"
                            : ""
                        }`}
                    style={{
                        left: `${ct.x}%`,
                        top: `${ct.y}%`,
                        transform: `translate(-50%, -50%) scale(${ct.scale})`,
                        whiteSpace: "pre",
                        fontFamily: "monospace",
                        fontSize: "12px",
                        lineHeight: "1",
                        color: ct.color,
                        background: "transparent",
                        zIndex: 30,
                    }}
                    onDoubleClick={() => setSelectedElement({ type: "customText", index })}
                    onMouseDown={(e) => onCustomTextMouseDown(e, ct.id)}
                >
                    <pre>{ct.text}</pre>
                </div>
            ))}

            {/* Contextual Options Panel */}
            {renderOptionsPanel()}
        </div>

        {/* Embedded ASCII/Text Section (non-draggable) */}
        {embeddedMode && (
            <div
                style={{
                    position: "absolute",
                    bottom: "10px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "90%",
                    border: "1px solid white",
                    background: "transparent",
                    padding: "10px",
                    fontFamily: "monospace",
                    zIndex: 40,
                }}
            >
                {customTexts.map((ct) => (
                    <pre key={ct.id}>{ct.text}</pre>
                ))}
            </div>
        )}

        {/* Audio Player */}
        <div className="absolute bottom-0 left-0 z-50 p-2">
            <audio
                id="audio-player"
                src="https://eaccelerate.me/euroacc/KenSub%20Engage%20_Mental%20Physics_.wav"
                onLoadedData={() => console.log("Audio Loaded")}
                controls
            ></audio>
            <p className="text-sm text-green-400">Audio Loaded</p>
        </div>
    </div>
);
};

export default TetsuoAsciiPage;
