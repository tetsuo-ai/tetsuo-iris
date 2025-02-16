"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";

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
    <main className="bg-zinc-950">
      <div className="p-4 h-screen flex flex-col gap-4 overflow-hidden">
        <Navbar />
        <div className="grow grid place-items-center">
          <div>
            <h1 className="orbitron-600 text-8xl text-center text-zinc-50">
              Play Diablo
            </h1>

            {/* Fullscreen Button */}
            <div className="mt-12 flex justify-center">
              <button
                onClick={toggleFullscreen}
                className="px-6 py-3 bg-blue-700 hover:bg-blue-800 orbitron-500 text-2xl text-zinc-200 rounded"
              >
                {isFullscreen ? "Exit Fullscreen" : "Go Fullscreen"}
              </button>
            </div>
          </div>
        </div>

        {/* Wrapper for iframe */}
        <div className="absolute top-0 overflow-hidden">
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
    </main>
  );
};

export default DiabloPage;
