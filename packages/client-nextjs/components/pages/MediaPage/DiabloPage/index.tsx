"use client";

import { useEffect, useRef, useState } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";

const DIABLO_URL = "https://d07riv.github.io/diabloweb/";

const DiabloPage = () => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        // Disable scrolling when iframe loads
        const disableScroll = () => {
            document.body.style.overflow = "hidden";
        };

        const enableScroll = () => {
            document.body.style.overflow = ""; // Re-enable scrolling if needed
        };

        const iframe = iframeRef.current;
        if (iframe) {
            iframe.addEventListener("load", disableScroll);
        }

        // Listen for fullscreen changes
        const handleFullscreenChange = () => {
            const isInFullscreen =
                document.fullscreenElement === iframe ||
                (document as any).webkitFullscreenElement === iframe ||
                (document as any).mozFullScreenElement === iframe ||
                (document as any).msFullscreenElement === iframe;
            setIsFullscreen(isInFullscreen);
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
        document.addEventListener("mozfullscreenchange", handleFullscreenChange);
        document.addEventListener("MSFullscreenChange", handleFullscreenChange);

        // Cleanup listeners on unmount
        return () => {
            enableScroll();
            if (iframe) {
                iframe.removeEventListener("load", disableScroll);
            }
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
            document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
            document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
        };
    }, []);

    // Function to toggle fullscreen
    const toggleFullscreen = () => {
        const iframe = iframeRef.current;
        if (!isFullscreen && iframe) {
            if (iframe.requestFullscreen) {
                iframe.requestFullscreen();
            } else if ((iframe as any).webkitRequestFullscreen) {
                (iframe as any).webkitRequestFullscreen();
            } else if ((iframe as any).msRequestFullscreen) {
                (iframe as any).msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if ((document as any).webkitExitFullscreen) {
                (document as any).webkitExitFullscreen();
            } else if ((document as any).msExitFullscreen) {
                (document as any).msExitFullscreen();
            }
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-black">
            {/* Breadcrumbs and Title */}
            <Breadcrumbs />
            <h1 className="text-2xl font-bold text-center my-4 text-white">Play Diablo</h1>

            {/* Fullscreen Button */}
            <div className="flex justify-center mb-4">
                <button
                    onClick={toggleFullscreen}
                    className="px-4 py-2 bg-purple-600 text-white font-semibold rounded hover:bg-purple-700"
                >
                    {isFullscreen ? "Exit Fullscreen" : "Go Fullscreen"}
                </button>
            </div>

            {/* Wrapper for iframe */}
            <div className="relative w-full h-full overflow-hidden">
                <iframe
                    ref={iframeRef}
                    src={DIABLO_URL}
                    className="w-full h-full border-none"
                    style={{
                        transform: "translateY(-100%)", // Adjust iframe to hide iframe text. like this only go fullscreen button is visible all cool there.
                    }}
                    allowFullScreen
                />
            </div>
        </div>
    );
};

export default DiabloPage;
