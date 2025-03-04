import { useState, useEffect } from "react";
import AsciiArt from "@/components/ui/asciis";

export interface MediaItem {
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

export interface CustomTextItem {
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

export interface KeyMapping {
    key: string;
    assignedIndex: number | null;
    mappingType: "media" | "audio";
    mode: "toggle" | "launchpad" | "oneshot" | "playPause";
}

export const topRow = ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="];
export const secondRow = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\"];
export const thirdRow = ["A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'"];
export const fourthRow = ["Z", "X", "C", "V", "B", "N", "M", ",", ".", "/"];
export const numpadRow = ["7", "8", "9", "-", "4", "5", "6", "+", "1", "2", "3", "0", "."];

export const useMediaState = (isFullscreen: boolean) => {
    const [mediaList, setMediaList] = useState<MediaItem[]>([]);
    const [customTexts, setCustomTexts] = useState<CustomTextItem[]>([]);
    const [currentTime, setCurrentTime] = useState<number>(0);

    const buildDefaultMappings = (): KeyMapping[] => {
        const mappings: KeyMapping[] = [];
        const addRow = (row: string[]) => {
            row.forEach((key) => mappings.push({ key, assignedIndex: null, mappingType: "media", mode: "toggle" }));
        };
        [topRow, secondRow, thirdRow, fourthRow, numpadRow].forEach(addRow);
        return mappings;
    };

    const [keyMappings, setKeyMappings] = useState<KeyMapping[]>(buildDefaultMappings());

    // Initialize default media items
    useEffect(() => {
        if (mediaList.length === 0) {
            const defaultMedia: MediaItem[] = [
                {
                    type: "image",
                    src: "https://eaccelerate.me/tetsuo/tetsuo-unit-frame.gif",
                    x: 90,
                    y: 10,
                    scale: 1,
                    rotation: 0,
                    opacity: 1,
                    visible: true,
                    showAt: 0,
                    hideAt: 120,
                    interruptOnPlay: true,
                },
                {
                    type: "image",
                    src: "https://eaccelerate.me/tetsuo/launchpad-SKRYR.gif",
                    x: 50,
                    y: 50,
                    scale: 1,
                    rotation: 0,
                    opacity: 1,
                    visible: true,
                    showAt: 0,
                    hideAt: 120,
                    interruptOnPlay: true,
                },
            ];
            setMediaList(defaultMedia);
            setKeyMappings((prev) => {
                const newMappings = [...prev];
                newMappings[0] = { ...newMappings[0], assignedIndex: 0, mappingType: "media", mode: "toggle" };
                newMappings[1] = { ...newMappings[1], assignedIndex: 1, mappingType: "media", mode: "toggle" };
                return newMappings;
            });
        }
    }, [mediaList.length]);

    // Initialize default custom text
    useEffect(() => {
        if (customTexts.length === 0) {
            setCustomTexts([
                {
                    id: Date.now(),
                    text: AsciiArt,
                    isAscii: true,
                    x: 50,
                    y: 50,
                    scale: isFullscreen ? 0.5 : 1.1,
                    flashSpeed: 3,
                    flashIntensity: 5,
                    color: "#00ff00",
                    isDefault: true,
                },
            ]);
        }
    }, [customTexts.length, isFullscreen]);

    // Update current time every second
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime((prev) => prev + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    // Update media visibility based on current time
    useEffect(() => {
        setMediaList((prev) =>
            prev.map((media) => ({
                ...media,
                visible: media.isManuallyControlled ? media.visible : media.showAt <= currentTime && media.hideAt >= currentTime,
            }))
        );
    }, [currentTime]);

    return { mediaList, setMediaList, customTexts, setCustomTexts, keyMappings, setKeyMappings };
};