import { useState, useEffect } from "react";

export const useFullscreen = () => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [workspaceDimensions, setWorkspaceDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

    const handleToggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            const fullscreen = !!document.fullscreenElement;
            setIsFullscreen(fullscreen);
            setWorkspaceDimensions({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, []);

    return { isFullscreen, workspaceDimensions, handleToggleFullscreen };
};