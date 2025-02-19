"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertErrorMessage } from "@/components/shared/AlertErrorMessage";
import type { MediaItem } from "@/components/ui/UnboundMediaList";

export interface FluxPageProps {
    onMediaSelect: (media: MediaItem) => void;
    onMediaDragStart?: (media: MediaItem) => void;
}

const FluxPage: React.FC<FluxPageProps> = ({ onMediaSelect }) => {
    const [prompt, setPrompt] = useState("");
    const [response, setResponse] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerateFluxImage = async () => {
        setError(null);
        setResponse(null);
        setIsLoading(true);
        try {
            const res = await fetch("/api/v1/image/flux", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt,
                    response_format: "url",
                }),
            });
            if (!res.ok) {
                const errorData = await res.json();
                if (errorData?.detail) {
                    setError(errorData.detail[0]?.msg || "Validation Error.");
                } else {
                    setError("Something went wrong.");
                }
                return;
            }
            const data = await res.json();
            if (data?.imageUrl) {
                const fullUrl = `https://services.tetsuo.ai/${data.imageUrl}`;
                setResponse(fullUrl);
            } else {
                setError("Unexpected response format.");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate Flux image.");
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

    return (
        <div className="w-full space-y-4 max-w-screen-md mx-auto">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-2xl font-bold">Generate Flux Image</h1>
            </div>
            {/* Prompt & Button */}
            <div className="space-y-2">
                <Textarea
                    placeholder="Enter your prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full h-10"
                />
                <Button
                    onClick={handleGenerateFluxImage}
                    disabled={isLoading || !prompt.trim()}
                    variant="outline"
                    className="w-full h-10"
                >
                    {isLoading ? "Generating..." : "Generate"}
                </Button>
            </div>
            {error && <AlertErrorMessage message={error} />}
            {/* Generated Image Preview */}
            {response && (
                <div className="mt-4 text-center">
                    <img
                        src={response}
                        alt="Generated Flux"
                        className="rounded-md w-full cursor-pointer"
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
