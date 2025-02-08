"use client";

import { useEffect, useRef } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";

const DOS_GAMES_URL = "https://dos.zone/";

const DOSGamesPage = () => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        const cleanIframe = () => {
            try {
                const iframe = iframeRef.current;
                const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;

                if (iframeDoc) {
                    // Remove unwanted elements
                    const unwantedSelectors = [
                        ".navbar", // Top navigation bar
                        ".footer", // Footer
                        ".install-pwa", // Install app section
                        ".download-app", // Boost performance section
                        "#support", // Support the project section
                        ".prose", // About, FAQ, and related sections
                    ];

                    unwantedSelectors.forEach((selector) => {
                        const elements = iframeDoc.querySelectorAll(selector);
                        elements.forEach((el) => el.remove());
                    });

                    // Adjust iframe's main content to span the full viewport
                    const pageBody = iframeDoc.querySelector(".page-body");
                    if (pageBody) {
                        pageBody.setAttribute(
                            "style",
                            "position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden;"
                        );
                    }

                    // Disable scrolling in the iframe
                    iframeDoc.body.style.overflow = "hidden";
                }
            } catch (error) {
                console.error("Could not clean iframe:", error);
            }
        };

        // Clean the iframe after it loads
        const iframe = iframeRef.current;
        if (iframe) {
            iframe.addEventListener("load", cleanIframe);
        }

        return () => {
            if (iframe) {
                iframe.removeEventListener("load", cleanIframe);
            }
        };
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-black">
            {/* Breadcrumbs and Title */}
            <Breadcrumbs />
            <h1 className="text-2xl font-bold text-center my-4 text-white">DOS Games</h1>

            {/* Iframe Wrapper */}
            <div className="relative w-full h-full overflow-hidden">
                <iframe
                    ref={iframeRef}
                    src={DOS_GAMES_URL}
                    className="w-full h-[90vh] border-none"
                    allowFullScreen
                />
            </div>
        </div>
    );
};

export default DOSGamesPage;
