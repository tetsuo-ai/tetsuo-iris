import { useState, useEffect } from "react";

export const useFullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Initialize with fallback values to avoid SSR issues
  const [workspaceDimensions, setWorkspaceDimensions] = useState({ width: 0, height: 0 });

  const handleToggleFullscreen = () => {
    // Guard against SSR by checking if document is available
    if (typeof document === "undefined") return;

    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    // Ensure this only runs on the client
    if (typeof window === "undefined") return;

    // Set initial dimensions on mount
    setWorkspaceDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    const handleFullscreenChange = () => {
      const fullscreen = !!document.fullscreenElement;
      setIsFullscreen(fullscreen);
      setWorkspaceDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    const handleResize = () => {
      setWorkspaceDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("resize", handleResize);

    // Cleanup event listeners
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("resize", handleResize);
    };
  }, []); // Empty dependency array since this runs once on mount

  return { isFullscreen, workspaceDimensions, handleToggleFullscreen };
};