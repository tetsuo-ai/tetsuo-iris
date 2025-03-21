import React from "react";
import { MediaItem, CustomTextItem } from "./hooks/useMediaState";
import { useDrag } from "./hooks/useDrag";

type MixBlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';

interface WorkspaceProps {
    mediaList: MediaItem[];
    customTexts: CustomTextItem[];
    isFullscreen: boolean;
    workspaceDimensions: { width: number; height: number };
    zoomLevel: number;
    asciiEnabled: boolean;
    onMediaListUpdate: (list: MediaItem[]) => void;
    onCustomTextsUpdate: (texts: CustomTextItem[]) => void;
    onSelectElement: (elem: { type: "media" | "customText"; index: number } | null) => void;
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
}

export const Workspace: React.FC<WorkspaceProps> = ({
    mediaList,
    customTexts,
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
}) => {
    const { onImageMouseDown, onCustomTextMouseDown } = useDrag(
        mediaList,
        customTexts,
        onMediaListUpdate,
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
                onMediaListUpdate([...mediaList, mediaToImport]);
            }
        }
    };

    // Adjusted z-index mapping to ensure proper stacking and visibility
    const zIndexMap: { [key: string]: number } = {};
    layerOrder.forEach((layer, index) => {
        zIndexMap[layer] = index * 10; // Increment by 10 to allow room for sub-elements
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
            onDragOver={(e) => e.preventDefault()}
        >
            {/* Milkdrop Layer */}
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
                    background: "transparent", // Ensure no solid background
                }}
            />
            {/* Matrix Layer */}
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
                    background: "transparent", // Ensure no solid background
                }}
            />
            {/* All Media Layer */}
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
                    background: "transparent", // Ensure no solid background
                }}
            >
                {mediaList.map((media, index) =>
                    media.visible ? (
                        <div
                            key={media.src || `media-${index}`} // Use src for uniqueness, fallback to index
                            style={{
                                position: "absolute",
                                top: `${media.y}%`,
                                left: `${media.x}%`,
                                transform: `translate(-50%, -50%) scale(${media.scale}) rotate(${media.rotation}deg)`,
                                opacity: media.opacity,
                                mixBlendMode: (media as ExtendedMediaItem).mixBlendMode || "normal",
                                zIndex: zIndexMap['allMedia'] + index, // Incremental z-index within layer
                                cursor: "move",
                                pointerEvents: "auto",
                            }}
                            onMouseDown={(e) => {
                                if (e.detail === 1) {
                                    onImageMouseDown(e, index);
                                }
                            }}
                            onDoubleClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onSelectElement({ type: "media", index });
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
                                    controls={(media as ExtendedMediaItem).showControls || false}
                                    style={{ width: "100px" }}
                                />
                            ) : null}
                        </div>
                    ) : null
                )}
            </div>
            {/* ASCII Layer */}
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
                        background: "transparent", // Ensure no solid background
                    }}
                >
                    {customTexts.map((text, index) => (
                        <div
                            key={text.id} // Assuming id is unique
                            style={{
                                position: "absolute",
                                top: `${text.y}%`,
                                left: `${text.x}%`,
                                transform: `translate(-50%, -50%) scale(${text.scale})`,
                                color: text.color,
                                zIndex: zIndexMap['ascii'] + index, // Incremental z-index within layer
                                cursor: "move",
                                pointerEvents: "auto",
                            }}
                            onMouseDown={(e) => {
                                if (e.detail === 1) {
                                    onCustomTextMouseDown(e, text.id);
                                }
                            }}
                            onDoubleClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onSelectElement({ type: "customText", index });
                            }}
                        >
                            <pre style={{ whiteSpace: "pre-wrap" }}>{text.text}</pre>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

interface ExtendedMediaItem extends MediaItem {
    showControls?: boolean;
    mixBlendMode?: MixBlendMode;
    optimizedSrc?: string;
}

export default Workspace;