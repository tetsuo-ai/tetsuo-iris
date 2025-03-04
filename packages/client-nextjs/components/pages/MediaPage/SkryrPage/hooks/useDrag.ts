import { useCallback } from "react";

interface MediaItem {
    type: "image" | "video" | "audio";
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
}

interface CustomTextItem {
    id: number;
    text?: string;
    isAscii?: boolean;
    x: number;
    y: number;
    scale: number;
    flashSpeed: number;
    flashIntensity: number;
    color: string;
    isDefault?: boolean;
}

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

export const useDrag = (
    mediaList: MediaItem[],
    customTexts: CustomTextItem[],
    onMediaListUpdate: (mediaList: MediaItem[]) => void,
    onCustomTextsUpdate: (customTexts: CustomTextItem[]) => void
) => {
    const onImageMouseDown = useCallback(
        (e: React.MouseEvent, index: number) => {
            e.preventDefault();
            const start = { mouseX: e.clientX, mouseY: e.clientY, posX: mediaList[index].x, posY: mediaList[index].y };
            const onMouseMove = (ev: MouseEvent) => {
                const deltaX = ((ev.clientX - start.mouseX) / window.innerWidth) * 100;
                const deltaY = ((ev.clientY - start.mouseY) / window.innerHeight) * 100;
                const newX = clamp(start.posX + deltaX, 0, 100);
                const newY = clamp(start.posY + deltaY, 0, 100);
                onMediaListUpdate(mediaList.map((item, i) => (i === index ? { ...item, x: newX, y: newY } : item)));
            };
            const onMouseUp = () => {
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
            };
            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        },
        [mediaList, onMediaListUpdate]
    );

    const onCustomTextMouseDown = useCallback(
        (e: React.MouseEvent, id: number) => {
            e.preventDefault();
            const ct = customTexts.find((item) => item.id === id);
            if (!ct) return;
            const start = { mouseX: e.clientX, mouseY: e.clientY, posX: ct.x, posY: ct.y };
            const onMouseMove = (ev: MouseEvent) => {
                const deltaX = ((ev.clientX - start.mouseX) / window.innerWidth) * 100;
                const deltaY = ((ev.clientY - start.mouseY) / window.innerHeight) * 100;
                const newX = clamp(start.posX + deltaX, 0, 100);
                const newY = clamp(start.posY + deltaY, 0, 100);
                onCustomTextsUpdate(customTexts.map((item) => (item.id === id ? { ...item, x: newX, y: newY } : item)));
            };
            const onMouseUp = () => {
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
            };
            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        },
        [customTexts, onCustomTextsUpdate]
    );

    return { onImageMouseDown, onCustomTextMouseDown };
};