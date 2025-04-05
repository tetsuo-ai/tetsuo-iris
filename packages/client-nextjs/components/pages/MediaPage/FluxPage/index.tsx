"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertErrorMessage } from "@/components/shared/AlertErrorMessage";
import { Select } from "@/components/ui/select";
import { MediaItem } from "../SkryrPage/Workspace"; // Import from Workspace.tsx

export interface FluxPageProps {
    onMediaSelect: (media: MediaItem) => void;
    onMediaDragStart?: (media: MediaItem) => void;
}

const FluxPage: React.FC<FluxPageProps> = ({ onMediaSelect }) => {
    const [prompt, setPrompt] = useState("");
    const [model, setModel] = useState("flux-1"); // Example model
    const [size, setSize] = useState("1024x1024"); // Example size
    const [response, setResponse] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const modelOptions = ["flux-1"]; // Adjust as per actual Flux models
    const sizeOptions = ["1024x1024", "512x512", "256x256"]; // Example sizes

    const handleGenerateFluxImage = async () => {
        setError(null);
        setResponse(null);
        setIsLoading(true);

        try {
            const res = await fetch("/api/v1/image/flux", { // Adjust endpoint as needed
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt,
                    model,
                    size,
                    response_format: "url",
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
                err instanceof Error ? err.message : "Failed to generate Flux image."
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectImage = (e: React.MouseEvent<HTMLImageElement>) => {
        e.stopPropagation();
        if (response) {
            const media: MediaItem = {
                id: `media-${Date.now()}`, // Required by Workspace
                type: "image",
                src: response,
                x: 50,
                y: 50,
                scale: 1,
                rotation: 0,
                opacity: 1, // Now valid with Workspace's MediaItem
                visible: true,
                showAt: 0,
                hideAt: 120,
            };
            onMediaSelect(media);
        }
    };

    const randomizeParams = () => {
        const randomChoice = (options: string[]) =>
            options[Math.floor(Math.random() * options.length)];

        setModel(randomChoice(modelOptions));
        setSize(randomChoice(sizeOptions));
    };

    return (
        <div className="space-y-6 p-4 max-w-md mx-auto">
            <div className="text-center">
                <h1 className="text-2xl font-bold">Generate Flux Image</h1>
            </div>
            <div>
                <Textarea
                    placeholder="Enter your prompt"
                    title="Enter a detailed prompt for image generation"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full h-10"
                />
            </div>
            <div className="w-full space-y-2">
                <div className="flex gap-2 items-center">
                    <Select
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        options={modelOptions}
                        className="flex-1"
                        computedColor={""}
                    />
                    <Select
                        value={size}
                        onChange={(e) => setSize(e.target.value)}
                        options={sizeOptions}
                        className="flex-1"
                        computedColor={""}
                    />
                </div>
                <div className="flex gap-2 items-center">
                    <Button
                        onClick={randomizeParams}
                        variant="outline"
                        className="w-full"
                    >
                        Random
                    </Button>
                    <Button
                        onClick={handleGenerateFluxImage}
                        disabled={isLoading || !prompt.trim()}
                        variant="outline"
                        className="w-full"
                    >
                        {isLoading ? "Generating..." : "Generate"}
                    </Button>
                </div>
            </div>
            {error && <AlertErrorMessage message={error} />}
            {response && (
                <div className="mt-4 text-center">
                    <img
                        src={response}
                        alt="Generated Flux Image"
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

export default FluxPage;