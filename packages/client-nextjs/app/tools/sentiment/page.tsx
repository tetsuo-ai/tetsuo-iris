"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertErrorMessage } from "@/components/shared/AlertErrorMessage";

const SentimentPage = () => {
    const [text, setText] = useState("");
    const [response, setResponse] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleAnalyzeSentiment = async () => {
        setError(null);
        setResponse(null);
        setIsLoading(true);

        try {
            const res = await fetch("/api/v1/tools/sentiment", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ text }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                setError(errorData.error || "Something went wrong.");
                return;
            }

            const data = await res.json();
            setResponse(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to analyze sentiment.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 p-8 max-w-lg mx-auto">
            <h1 className="text-2xl font-bold">Text Sentiment Analysis</h1>

            {/* Input Fields */}
            <div className="space-y-4">
                <Textarea
                    placeholder="Enter the text to analyze"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full"
                />

                <Button
                    onClick={handleAnalyzeSentiment}
                    disabled={isLoading || !text.trim()}
                    variant="default"
                >
                    {isLoading ? "Analyzing..." : "Analyze Sentiment"}
                </Button>
            </div>

            {/* Error Message */}
            {error && <AlertErrorMessage message={error} />}

            {/* Response Display */}
            {response && (
                <div className="mt-8">
                    <h3 className="text-lg font-semibold">Analysis Result:</h3>
                    <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                        {JSON.stringify(response, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default SentimentPage;
