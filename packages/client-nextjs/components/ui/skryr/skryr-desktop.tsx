"use client";

import React, { useEffect, useRef } from "react";

// Helper: load an external script (ensures it’s loaded only once)
const loadScript = (src: string): Promise<void> =>
    new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.body.appendChild(script);
    });

const SkryrDesktop: React.FC = () => {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        async function initWebamp() {
            try {
                // Load the lazy bundle from CDN (which attaches Webamp to window).
                await loadScript("https://unpkg.com/webamp@1.5.0/built/webamp.lazy-bundle.min.js");
                // Load Butterchurn libraries.
                await loadScript("https://unpkg.com/butterchurn@2.6.7/lib/butterchurn.min.js");
                await loadScript("https://unpkg.com/butterchurn-presets@2.4.7/lib/butterchurnPresets.min.js");

                // Now, the lazy bundle should have attached Webamp to window.
                const WebampConstructor = (window as any).Webamp;
                if (typeof WebampConstructor !== "function") {
                    console.error("Webamp constructor not found.");
                    return;
                }

                const webamp = new WebampConstructor({
                    initialTracks: [
                        {
                            metaData: {
                                artist: "DJ Mike Llama",
                                title: "Llama Whippin' Intro",
                            },
                            url: "https://cdn.jsdelivr.net/gh/captbaritone/webamp@43434d82cfe0e37286dbbe0666072dc3190a83bc/mp3/llama-2.91.mp3",
                            duration: 5.322286,
                        },
                    ],
                    __butterchurnOptions: {
                        importButterchurn: () =>
                            Promise.resolve((window as any).butterchurn),
                        getPresets: () => {
                            if ((window as any).butterchurnPresets?.getPresets) {
                                const presets = (window as any).butterchurnPresets.getPresets();
                                const result = Object.keys(presets).map((name) => ({
                                    name,
                                    butterchurnPresetObject: presets[name],
                                }));
                                return Promise.resolve(result);
                            }
                            return Promise.resolve([]);
                        },
                        butterchurnOpen: true,
                    },
                    // Dummy functions to satisfy InjectableDependencies.
                    requireJSZip: () => Promise.resolve({}),
                    requireMusicMetadata: () => Promise.resolve({}),
                    windowLayout: {
                        main: { position: { top: -1000, left: -1000 } },
                        equalizer: { position: { top: -1000, left: -1000 } },
                        playlist: { position: { top: -1000, left: -1000 } },
                        milkdrop: { position: { top: 0, left: 0 }, size: { extraWidth: 0, extraHeight: 0 } },
                    },
                    enableHotkeys: true,
                    zIndex: 99999,
                });

                if (containerRef.current) {
                    await webamp.renderWhenReady(containerRef.current);
                } else {
                    console.error("Container not found");
                }
            } catch (err) {
                console.error("Error initializing Webamp:", err);
            }
        }

        if (containerRef.current) {
            initWebamp();
        } else {
            const interval = setInterval(() => {
                if (containerRef.current) {
                    clearInterval(interval);
                    initWebamp();
                }
            }, 100);
        }
    }, []);

    return (
        <>
            <style jsx global>{`
        html,
        body {
          margin: 0;
          padding: 0;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background-color: black;
        }
      `}</style>
            {/* Outer container matching expected markup */}
            <div
                id="webamp"
                role="application"
                style={{
                    zIndex: 0,
                    right: "auto",
                    bottom: "auto",
                    overflow: "visible",
                    width: "100%",
                    height: "100%",
                }}
                ref={containerRef}
            />
        </>
    );
};

export default SkryrDesktop;
