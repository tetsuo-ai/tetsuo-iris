"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertErrorMessage } from "@/components/shared/AlertErrorMessage";
import { Select } from "@/components/ui/select";
import type { MediaItem } from "@/components/ui/UnboundMediaList";

export interface DallePageProps {
    onMediaSelect: (media: MediaItem) => void; 
    onMediaDragStart?: (media: MediaItem) => void;
}

const DallePage: React.FC<DallePageProps> = ({ onMediaSelect }) => {
    const [prompt, setPrompt] = useState("");
    const [model, setModel] = useState("dall-e-3");
    const [size, setSize] = useState("1024x1024");
    const [quality, setQuality] = useState("standard");
    const [style, setStyle] = useState("vivid");
    const [n, setN] = useState("1");
    const [response, setResponse] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const modelOptions = ["dall-e-3"];
    const sizeOptions = ["1024x1024", "512x512", "256x256"];
    const qualityOptions = ["standard", "high"];
    const styleOptions = ["vivid", "artistic", "realistic"];

    const handleGenerateDalleImage = async () => {
        setError(null);
        setResponse(null);
        setIsLoading(true);

        try {
            const res = await fetch("/api/v1/image/dalle", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt,
                    model,
                    size,
                    quality,
                    style,
                    response_format: "url",
                    n: Number(n),
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                setError(errorData.error || "Something went wrong.");
                return;
            }

            const data = await res.json();
            if (data?.imageUrl) {
                setResponse(data.imageUrl);
            } else {
                setError("Unexpected response format.");
            }
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to generate DALL‑E image."
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectImage = (e: React.MouseEvent<HTMLImageElement>) => {
        e.stopPropagation();
        if (response) {
            const media: MediaItem = {
                type: "image",
                src: response,
                x: 50,
                y: 50,
                scale: 1,
                rotation: 0,
                opacity: 1,
                visible: true,
                showAt: 0,
                hideAt: 120,
                interruptOnPlay: true,
            };
            onMediaSelect(media);
        }
    };

    const randomizeParams = () => {
        const randomChoice = (options: string[]) =>
            options[Math.floor(Math.random() * options.length)];

        setModel(randomChoice(modelOptions));
        setSize(randomChoice(sizeOptions));
        setQuality(randomChoice(qualityOptions));
        setStyle(randomChoice(styleOptions));
    };

    return (
        <div className="space-y-6 p-4 max-w-md mx-auto">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-2xl font-bold">Generate DALL‑E Image</h1>
            </div>

            {/* Prompt */}
            <div>
                <Textarea
                    placeholder="Enter your prompt"
                    title="Enter a detailed prompt for image generation"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full h-10"
                />
            </div>

            {/* Controls */}
            <div className="w-full space-y-2">
                {/* Row 1: Model, Size, Quality */}
                <div className="flex gap-2 items-center">
                    <Select
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        options={modelOptions}
                        className="flex-1" computedColor={""}                    />
                    <Select
                        value={size}
                        onChange={(e) => setSize(e.target.value)}
                        options={sizeOptions}
                        className="flex-1" computedColor={""}                    />
                    <Select
                        value={quality}
                        onChange={(e) => setQuality(e.target.value)}
                        options={qualityOptions}
                        className="flex-1" computedColor={""}                    />
                </div>

                {/* Row 2: Style, Number of Images */}
                <div className="flex gap-2 items-center">
                    <Select
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                        options={styleOptions}
                        className="flex-1" computedColor={""}                    />
                    <Select
                        value={n}
                        onChange={(e) => setN(e.target.value)}
                        options={["1"]}
                        className="flex-1" computedColor={""}                    />
                </div>

                {/* Row 3: Random and Generate Buttons */}
                <div className="flex gap-2 items-center">
                    <Button
                        onClick={randomizeParams}
                        variant="outline"
                        className="w-full"
                    >
                        Random
                    </Button>
                    <Button
                        onClick={handleGenerateDalleImage}
                        disabled={isLoading || !prompt.trim()}
                        variant="outline"
                        className="w-full"
                    >
                        {isLoading ? "Generating..." : "Generate"}
                    </Button>
                </div>
            </div>

            {error && <AlertErrorMessage message={error} />}

            {/* Generated Image Preview */}
            {response && (
                <div className="mt-4 text-center">
                    <img
                        src={response}
                        alt="Generated DALL‑E"
                        className="rounded-md max-w-full cursor-pointer"
                        onClick={handleSelectImage}
                    />
                    <p className="mt-2 text-sm text-muted">
                        Click this image to send it as unbound media.
                    </p>
                </div>
            )}
        </div>
    );
};

export default DallePage;
