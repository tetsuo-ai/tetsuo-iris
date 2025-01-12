"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertErrorMessage } from "@/components/shared/AlertErrorMessage";

const FluxPage = () => {
    const [prompt, setPrompt] = useState("");
    const [response, setResponse] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerateFluxImage = async () => {
        setError(null);
        setResponse(null);
        setIsLoading(true);

        try {
            console.log("Request Payload:", { prompt, response_format: "url" });

            const res = await fetch("/api/v1/image/flux", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    prompt,
                    response_format: "url",
                }),
            });

            console.log("Response Status:", res.status);

            if (!res.ok) {
                const errorData = await res.json();
                console.error("Error Response Body:", errorData);

                if (errorData?.detail) {
                    setError(errorData.detail[0]?.msg || "Validation Error.");
                } else {
                    setError("Something went wrong.");
                }
                return;
            }

            const data = await res.json(); // Parse JSON response
            console.log("Parsed Response Data:", data);

            if (data?.imageUrl) {
                const fullUrl = `https://services.tetsuo.ai/${data.imageUrl}`;
                console.log("Constructed Image URL:", fullUrl);
                setResponse(fullUrl);
            } else {
                setError("Unexpected response format. Please try again.");
            }
        } catch (err) {
            console.error("Fetch Error:", err);
            setError(err instanceof Error ? err.message : "Failed to generate Flux image.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 p-8 max-w-lg mx-auto">
            <h1 className="text-2xl font-bold">Generate Flux Image</h1>

            {/* Input Fields */}
            <div className="space-y-4">
                <Textarea
                    placeholder="Enter your prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full"
                />

                <Button
                    onClick={handleGenerateFluxImage}
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
                        <img
                            src={response}
                            alt="Generated Flux"
                            className="rounded-md max-w-full"
                        />
                        <p className="mt-2 text-sm text-muted">
                            The image has been successfully generated and rendered below.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FluxPage;
