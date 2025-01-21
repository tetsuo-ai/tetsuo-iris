"use client";

import React, { useState } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
const ImagePage = () => {
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [memeUrl, setMemeUrl] = useState<string | null>(null);
    const [imageList, setImageList] = useState<string[]>([]);

    const fetchLogo = async () => {
        try {
            const response = await fetch("/api/v1/image/logo");
            if (response.ok && response.headers.get("Content-Type")?.includes("image/webp")) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                setLogoUrl(url);
            } else {
                console.error("Unexpected response format:", await response.text());
            }
        } catch (error) {
            console.error("Error fetching logo:", error);
        }
    };

    const fetchMeme = async () => {
        try {
            const response = await fetch("/api/v1/image/meme");
            if (response.ok && response.headers.get("Content-Type")?.includes("image/webp")) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                setMemeUrl(url);
            } else {
                console.error("Unexpected response format:", await response.text());
            }
        } catch (error) {
            console.error("Error fetching meme:", error);
        }
    };

    const fetchImageList = async () => {
        try {
            const response = await fetch("/api/v1/image/list");
            if (response.ok && response.headers.get("Content-Type")?.includes("application/json")) {
                const data = await response.json();
                if (data.images && Array.isArray(data.images)) {
                    setImageList(data.images);
                } else {
                    console.error("Unexpected image list format:", data);
                }
            } else {
                console.error("Unexpected response format:", await response.text());
            }
        } catch (error) {
            console.error("Error fetching image list:", error);
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Page Title */}
            <Breadcrumbs /> {/* Breadcrumb Navigation */}
            <h1 className="text-3xl font-bold mb-6">Image API Demonstration</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Get Logo */}
                <section className="border p-4 rounded-md bg-gray-50 shadow-sm space-y-2">
                    <h2 className="text-xl font-semibold">Get Logo</h2>
                    <button
                        onClick={fetchLogo}
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
                    >
                        Fetch
                    </button>
                    {logoUrl && <img src={logoUrl} alt="Logo" className="max-w-full h-auto border rounded-md" />}
                </section>

                {/* Get Meme */}
                <section className="border p-4 rounded-md bg-gray-50 shadow-sm space-y-2">
                    <h2 className="text-xl font-semibold">Get Meme</h2>
                    <button
                        onClick={fetchMeme}
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
                    >
                        Fetch
                    </button>
                    {memeUrl && <img src={memeUrl} alt="Meme" className="max-w-full h-auto border rounded-md" />}
                </section>

                {/* List Images */}
                <section className="border p-4 rounded-md bg-gray-50 shadow-sm space-y-2">
                    <h2 className="text-xl font-semibold">List Images</h2>
                    <button
                        onClick={fetchImageList}
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
                    >
                        Fetch
                    </button>
                    {imageList.length > 0 && (
                        <ul className="bg-gray-100 p-4 rounded-md text-sm space-y-2">
                            {imageList.map((image, index) => (
                                <li key={index} className="flex items-center gap-2">
                                    <span className="text-gray-700">{image}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

            </div>
        </div>
    );
};

export default ImagePage;
