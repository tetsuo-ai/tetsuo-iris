"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertErrorMessage } from "@/components/shared/AlertErrorMessage";
import { Select } from "@/components/ui/select";

const DallePage = () => {
    const [prompt, setPrompt] = useState("");
    const [model, setModel] = useState("dall-e-3");
    const [size, setSize] = useState("1024x1024");
    const [quality, setQuality] = useState("standard");
    const [style, setStyle] = useState("vivid");
    const [responseFormat, setResponseFormat] = useState("url");
    const [n, setN] = useState(1);
    const [response, setResponse] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerateDalleImage = async () => {
        setError(null);
        setResponse(null);
        setIsLoading(true);

        try {
            console.log("Request Payload:", {
                prompt,
                model,
                size,
                quality,
                style,
                response_format: responseFormat,
                n,
            });

            const res = await fetch("/api/v1/image/dalle", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    prompt,
                    model,
                    size,
                    quality,
                    style,
                    response_format: responseFormat,
                    n,
                }),
            });

            console.log("Response Status:", res.status);

            if (!res.ok) {
                const errorData = await res.json();
                setError(errorData.error || "Something went wrong.");
                return;
            }

            const data = await res.json();
            console.log("Parsed Response Data:", data);

            if (data?.imageUrl) {
                setResponse(data.imageUrl);
            } else {
                setError("Unexpected response format.");
            }
        } catch (err) {
            console.error("Fetch Error:", err);
            setError(err instanceof Error ? err.message : "Failed to generate DALL-E image.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 p-8 max-w-lg mx-auto">
            <h1 className="text-2xl font-bold">Generate DALL-E Image</h1>

            {/* Selected Parameters */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold">Selected Parameters</h2>
                <div className="bg-gray-100 p-4 rounded-md">
                    <p><strong>Prompt:</strong> {prompt}</p>
                    <p><strong>Model:</strong> {model}</p>
                    <p><strong>Size:</strong> {size}</p>
                    <p><strong>Quality:</strong> {quality}</p>
                    <p><strong>Style:</strong> {style}</p>
                    <p><strong>Response Format:</strong> {responseFormat}</p>
                    <p><strong>Number of Images:</strong> {n}</p>
                </div>
            </div>

            {/* Input Fields */}
            <div className="space-y-4">
                <Textarea
                    placeholder="Enter your prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full"
                />

                <Select
                    label="Model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    options={["dall-e-3"]}
                />

                <Select
                    label="Size"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    options={["1024x1024", "512x512", "256x256"]}
                />

                <Select
                    label="Quality"
                    value={quality}
                    onChange={(e) => setQuality(e.target.value)}
                    options={["standard", "high"]}
                />

                <Select
                    label="Style"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    options={["vivid", "artistic", "realistic"]}
                />

                <input
                    type="number"
                    value={n}
                    onChange={(e) => setN(Number(e.target.value))}
                    min={1}
                    max={10}
                    className="w-full border p-2 rounded-md"
                    placeholder="Number of Images"
                />

                <Button
                    onClick={handleGenerateDalleImage}
                    disabled={isLoading || !prompt.trim()}
                    variant="default"
                >
                    {isLoading ? "Generating..." : "Generate"}
                </Button>
            </div>

            {/* Error Message */}
            {error && <AlertErrorMessage message={error} />}

            {/* Response Display */}
            {response && (
                <div className="mt-8">
                    <h3 className="text-lg font-semibold">Generated Image:</h3>
                    <div className="mt-4">
                        <img src={`${response}`} alt="Generated DALL-E" className="rounded-md max-w-full" />
                        <p className="mt-2 text-sm text-muted">The image has been successfully generated and rendered below.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DallePage;
