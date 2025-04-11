import React from "react";
import { CustomTextItem } from "./hooks/useMediaState";
import { useDrag } from "./hooks/useDrag";

export type MixBlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';

export interface MediaItem {
    id: string;
    type: "image" | "video" | "audio" | "text";
    src: string;
    x: number;
    y: number;
    scale: number;
    rotation: number;
    opacity: number;
    visible: boolean;
    showAt: number;
    hideAt: number;
    isManuallyControlled?: boolean;
    interruptOnPlay?: boolean;
    showControls?: boolean;
    mixBlendMode?: MixBlendMode;
    optimizedSrc?: string;
    transform?: string;
    textContent?: string;
    color?: string;
    fontStyle?: string;
}

interface WorkspaceProps {
    mediaList: MediaItem[];
    customTexts: CustomTextItem[];
    setCustomTexts: React.Dispatch<React.SetStateAction<CustomTextItem[]>>;
    isFullscreen: boolean;
    workspaceDimensions: { width: number; height: number };
    zoomLevel: number;
    asciiEnabled: boolean;
    onMediaListUpdate: React.Dispatch<React.SetStateAction<MediaItem[]>>;
    onCustomTextsUpdate: (texts: CustomTextItem[]) => void;
    onSelectElement: (elem: { type: "media" | "customText"; index: number } | null, event?: React.MouseEvent) => void;
    matrixCanvasRef: React.RefObject<HTMLCanvasElement>;
    visualizerCanvasRef: React.RefObject<HTMLCanvasElement>;
    barCanvasRef: React.RefObject<HTMLCanvasElement>;
    containerWidth: number;
    containerHeight: number;
    milkdropMixBlendMode: MixBlendMode;
    matrixMixBlendMode: MixBlendMode;
    asciiMixBlendMode: MixBlendMode;
    allMediaMixBlendMode: MixBlendMode;
    milkdropOpacity: number;
    matrixOpacity: number;
    asciiOpacity: number;
    allMediaOpacity: number;
    milkdropGamma: number;
    matrixGamma: number;
    asciiGamma: number;
    allMediaGamma: number;
    milkdropSaturation: number;
    matrixSaturation: number;
    asciiSaturation: number;
    allMediaSaturation: number;
    layerOrder: string[];
    onDropMedia?: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
}

export const Workspace: React.FC<WorkspaceProps> = ({
    mediaList,
    customTexts,
    setCustomTexts,
    isFullscreen,
    workspaceDimensions,
    zoomLevel,
    asciiEnabled,
    onMediaListUpdate,
    onCustomTextsUpdate,
    onSelectElement,
    matrixCanvasRef,
    visualizerCanvasRef,
    barCanvasRef,
    containerWidth,
    containerHeight,
    milkdropMixBlendMode,
    matrixMixBlendMode,
    asciiMixBlendMode,
    allMediaMixBlendMode,
    milkdropOpacity,
    matrixOpacity,
    asciiOpacity,
    allMediaOpacity,
    milkdropGamma,
    matrixGamma,
    asciiGamma,
    allMediaGamma,
    milkdropSaturation,
    matrixSaturation,
    asciiSaturation,
    allMediaSaturation,
    layerOrder,
    onDropMedia,
    onDragOver,
}) => {
    const { onImageMouseDown, onCustomTextMouseDown } = useDrag(
        mediaList,
        customTexts,
        (updatedList) => {
            const transformedList = updatedList.map((item, index) => ({
                ...item,
                id: mediaList.find(m => m.src === item.src)?.id || `media-${item.type}-${index}`,
            }));
            onMediaListUpdate(transformedList);
        },
        onCustomTextsUpdate
    );

    const width = isFullscreen ? "100vw" : `${containerWidth}px`;
    const height = isFullscreen ? "100vh" : `${containerHeight}px`;

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const mediaIndexData = e.dataTransfer.getData("application/x-media-index");
        if (mediaIndexData) {
            const mediaIndex = parseInt(mediaIndexData, 10);
            if (!isNaN(mediaIndex) && mediaList[mediaIndex]) {
                const mediaToImport = { ...mediaList[mediaIndex], visible: false };
                onMediaListUpdate(prev => [...prev, mediaToImport]);
            }
        } else if (onDropMedia) {
            onDropMedia(e);
        }
    };

    const zIndexMap: { [key: string]: number } = {};
    layerOrder.forEach((layer, index) => {
        zIndexMap[layer] = index * 10;
    });

    return (
        <div
            style={{
                position: "absolute",
                width: width,
                height: height,
                top: "0",
                left: "0",
                transform: `scale(${zoomLevel})`,
                transformOrigin: "top left",
                overflow: "hidden",
                background: "transparent",
                zIndex: 0,
                pointerEvents: "none",
            }}
            onDrop={handleDrop}
            onDragOver={onDragOver || ((e) => e.preventDefault())}
        >
            <canvas
                ref={visualizerCanvasRef}
                style={{
                    position: "absolute",
                    top: "0",
                    left: "0",
                    width: "100%",
                    height: "100%",
                    zIndex: zIndexMap['milkdrop'],
                    pointerEvents: "none",
                    mixBlendMode: milkdropMixBlendMode,
                    opacity: milkdropOpacity,
                    filter: `contrast(${milkdropGamma}) saturate(${milkdropSaturation})`,
                    background: "transparent",
                }}
            />
            <canvas
                ref={matrixCanvasRef}
                style={{
                    position: "absolute",
                    top: "0",
                    left: "0",
                    width: "100%",
                    height: "100%",
                    zIndex: zIndexMap['matrix'],
                    pointerEvents: "none",
                    mixBlendMode: matrixMixBlendMode,
                    opacity: matrixOpacity,
                    filter: `contrast(${matrixGamma}) saturate(${matrixSaturation})`,
                    background: "transparent",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    top: "0",
                    left: "0",
                    width: "100%",
                    height: "100%",
                    mixBlendMode: allMediaMixBlendMode,
                    opacity: allMediaOpacity,
                    filter: `contrast(${allMediaGamma}) saturate(${allMediaSaturation})`,
                    zIndex: zIndexMap['allMedia'],
                    pointerEvents: "none",
                    background: "transparent",
                }}
            >
                {mediaList.map((media, index) =>
                    media.visible && media.type !== "text" ? (
                        <div
                            key={media.id}
                            style={{
                                position: "absolute",
                                top: `${media.y}%`,
                                left: `${media.x}%`,
                                transform: `translate(-50%, -50%) scale(${media.scale}) rotate(${media.rotation}deg)`,
                                opacity: media.opacity,
                                mixBlendMode: media.mixBlendMode || "normal",
                                zIndex: zIndexMap['allMedia'] + index,
                                cursor: "move",
                                pointerEvents: "auto",
                            }}
                            onMouseDown={(e) => {
                                if (e.detail === 1 && ["audio", "video", "image"].includes(media.type)) {
                                    onImageMouseDown(e, index);
                                }
                            }}
                            onDoubleClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                if (media.visible) {
                                    console.log("Double-clicked media:", media);
                                    onSelectElement({ type: "media", index }, e);
                                }
                            }}
                        >
                            {media.type === "image" ? (
                                <img src={media.src} alt="Media" style={{ maxWidth: "300px" }} draggable={false} />
                            ) : media.type === "video" ? (
                                <video
                                    src={media.src}
                                    autoPlay
                                    loop
                                    muted
                                    controls={media.showControls || false}
                                    style={{ width: "100px" }}
                                />
                            ) : null}
                        </div>
                    ) : null
                )}
            </div>
            {asciiEnabled && (
                <div
                    style={{
                        position: "absolute",
                        top: "0",
                        left: "0",
                        width: "100%",
                        height: "100%",
                        mixBlendMode: asciiMixBlendMode,
                        opacity: asciiOpacity,
                        filter: `contrast(${asciiGamma}) saturate(${asciiSaturation})`,
                        zIndex: zIndexMap['ascii'],
                        pointerEvents: "none",
                        background: "transparent",
                    }}
                >
                    {customTexts.map((text, index) => (
                        <div
                            key={text.id}
                            style={{
                                position: "absolute",
                                top: `${text.y}%`,
                                left: `${text.x}%`,
                                transform: `translate(-50%, -50%) scale(${text.scale})`,
                                color: text.color || "#ffffff",
                                fontFamily: text.fontStyle || "monospace",
                                fontWeight: text.fontWeight || "normal",
                                zIndex: zIndexMap['ascii'] + index,
                                cursor: "move",
                                pointerEvents: "auto",
                                userSelect: "none",
                            }}
                            onMouseDown={(e) => {
                                if (e.detail === 1) {
                                    onCustomTextMouseDown(e, text.id);
                                }
                            }}
                            onDoubleClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                if (text.text) {
                                    console.log("Double-clicked customText:", text);
                                    onSelectElement({ type: "customText", index }, e);
                                }
                            }}
                        >
                            <pre style={{ whiteSpace: "pre-wrap", background: "transparent", userSelect: "none", fontFamily: text.fontStyle || "monospace", fontWeight: text.fontWeight || "normal" }}>
                                {text.text}
                            </pre>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Workspace;