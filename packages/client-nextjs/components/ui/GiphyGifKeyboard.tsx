"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface GiphyGifKeyboardProps {
    onGifSelect: (gifUrl: string) => void;
}

const GiphyGifKeyboard: React.FC<GiphyGifKeyboardProps> = ({ onGifSelect }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [gifs, setGifs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchGifs = async () => {
            setLoading(true);
            try {
                const endpoint = `/api/v1/giphy?limit=25${searchQuery.trim() !== "" ? `&q=${encodeURIComponent(searchQuery)}` : ""}`;
                const response = await fetch(endpoint);
                const data = await response.json();
                setGifs(data.data || []);
            } catch (error) {
                console.error("Error fetching gifs: ", error);
            }
            setLoading(false);
        };

        fetchGifs();
    }, [searchQuery]);

    return (
        <div className="w-full p-4 bg-black/50 rounded-lg shadow-lg text-white max-w-screen-md mx-auto max-h-[400px] overflow-y-auto">
            {/* Header */}
            <div className="text-center mb-4">
                <h2 className="text-xl font-bold">Search GIFs</h2>
            </div>
            <div className="mb-4">
                <Input
                    type="text"
                    placeholder="Search GIFs"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10"
                />
            </div>
            {loading ? (
                <div className="text-center">Loading...</div>
            ) : (
                <div className="grid grid-cols-3 gap-2">
                    {gifs.map((gif) => {
                        const thumbnailUrl = gif.images.fixed_height_small.url;
                        const fullGifUrl = gif.images.original.url;
                        return (
                            <img
                                key={gif.id}
                                src={thumbnailUrl}
                                alt={gif.title}
                                className="cursor-pointer rounded"
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData("text/plain", fullGifUrl);
                                }}
                                onClick={() => onGifSelect(fullGifUrl)}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default GiphyGifKeyboard;
