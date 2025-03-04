import React from "react";
import { MediaItem, CustomTextItem } from "./hooks/useMediaState";
import { useDrag } from "./hooks/useDrag";

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
                zIndex: 0, // Neutral z-index to avoid overlap issues
                pointerEvents: "none",
            }}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
        >
            <canvas
                ref={visualizerCanvasRef}
                style={{
                    position: "absolute",
                    top: "0",
                    left: "0",
                    width: "100%",
                    height: "100%",
                    zIndex: -3,
                    pointerEvents: "none",
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
                    zIndex: -2,
                    pointerEvents: "none",
                }}
            />
            {mediaList.map((media, index) =>
                media.visible ? (
                    <div
                        key={index}
                        style={{
                            position: "absolute",
                            top: `${media.y}%`,
                            left: `${media.x}%`,
                            transform: `translate(-50%, -50%) scale(${media.scale}) rotate(${media.rotation}deg)`,
                            opacity: media.opacity,
                            zIndex: 5,
                            cursor: "move",
                            pointerEvents: "auto",
                        }}
                        onMouseDown={(e) => {
                            // Allow double-click to take precedence
                            if (e.detail === 1) {
                                onImageMouseDown(e, index);
                            }
                        }}
                        onDoubleClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault(); // Prevent drag initiation
                            onSelectElement({ type: "media", index });
                        }}
                    >
                        {media.type === "image" ? (
                            <img src={media.src} alt="Media" style={{ maxWidth: "300px" }} draggable={false} />
                        ) : media.type === "video" ? (
                            <video src={media.src} autoPlay loop muted style={{ width: "100px" }} />
                        ) : null}
                    </div>
                ) : null
            )}
            {asciiEnabled &&
                customTexts.map((text, index) => (
                    <div
                        key={text.id}
                        style={{
                            position: "absolute",
                            top: `${text.y}%`,
                            left: `${text.x}%`,
                            transform: `translate(-50%, -50%) scale(${text.scale})`,
                            color: text.color,
                            zIndex: 5,
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
    );
};