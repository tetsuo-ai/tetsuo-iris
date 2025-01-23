"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertErrorMessage } from "@/components/shared/AlertErrorMessage";
import Breadcrumbs from "@/components/Breadcrumbs";

const endpointOptions = [
    { label: "Root", value: "/", method: "GET" },
    { label: "Health", value: "/health", method: "GET" },
    { label: "Health (POST)", value: "/health", method: "POST" },
    { label: "Websearch: Topic", value: "/api/v1/websearch/topic", method: "GET" },
    { label: "Websearch: Question", value: "/api/v1/websearch/question", method: "GET" },
    { label: "Websearch: Answer", value: "/api/v1/websearch/answer", method: "GET" },
    { label: "Trivia: Topic", value: "/api/v1/trivia/topic", method: "GET" },
    { label: "Trivia: Question", value: "/api/v1/trivia/question", method: "GET" },
    { label: "Trivia: Answer", value: "/api/v1/trivia/answer", method: "GET" },
    { label: "Code: Analyze", value: "/api/v1/code/analyze", method: "POST" },
    { label: "Code: Analyze GitHub", value: "/api/v1/code/analyze_github", method: "POST" },
    { label: "Jupiter: Buy", value: "/api/v1/jupiter/buy", method: "POST" },
    { label: "Jupiter: Swap", value: "/api/v1/jupiter/swap", method: "POST" },
    { label: "Jupiter: Token Data", value: "/api/v1/jupiter/token_data", method: "POST" },
    { label: "Jupiter: Balance", value: "/api/v1/jupiter/balance", method: "POST" },
    { label: "Jupiter: Price", value: "/api/v1/jupiter/price", method: "POST" },
    { label: "Whales: Transactions", value: "/api/v1/whales/transactions", method: "GET" },
    { label: "Whales: Statistics", value: "/api/v1/whales/statistics", method: "GET" },
    { label: "Whales: Hourly Volume", value: "/api/v1/whales/volume/hourly", method: "GET" },
    { label: "Sentiment: Text", value: "/api/v1/sentiment/text", method: "POST" },
    { label: "Sentiment: Gecko", value: "/api/v1/sentiment/gecko", method: "GET" },
    { label: "Sentiment: CMC", value: "/api/v1/sentiment/cmc", method: "GET" },
    { label: "Sentiment: GMGN", value: "/api/v1/sentiment/gmgn", method: "GET" },
    { label: "Sentiment: Dextools", value: "/api/v1/sentiment/dextools", method: "GET" },
    { label: "Sentiment: Twitter", value: "/api/v1/sentiment/twitter", method: "GET" },
    { label: "Image: Flux", value: "/api/v1/image/flux", method: "POST" },
    { label: "Image: Dalle", value: "/api/v1/image/dalle", method: "POST" },
    { label: "Image: Logo", value: "/api/v1/image/logo", method: "GET" },
    { label: "Image: Meme", value: "/api/v1/image/meme", method: "GET" },
    { label: "Image: List", value: "/api/v1/image/list", method: "GET" },
    { label: "Video: Kensub", value: "/api/v1/video/kensub", method: "POST" },
    { label: "Animations: RGB", value: "/api/v1/animations/rgb", method: "POST" },
    { label: "Chat: Completions", value: "/api/v1/chat/completions", method: "POST" },
    { label: "Chat: Trader", value: "/api/v1/chat/trader", method: "POST" },
    { label: "Chat: Professor", value: "/api/v1/chat/professor", method: "POST" },
    { label: "Chat: Planner", value: "/api/v1/chat/planner", method: "POST" },
    { label: "Chat: Self-help", value: "/api/v1/chat/self-help", method: "POST" },
    { label: "Summarize: Text (GET)", value: "/api/v1/summarize/text", method: "GET" },
    { label: "Summarize: Text (POST)", value: "/api/v1/summarize/text", method: "POST" },
    { label: "Summarize: URL", value: "/api/v1/summarize/url", method: "POST" },
    { label: "Speech: TTS", value: "/api/v1/speech/tts", method: "POST" },
];

const HealthPage = () => {
    const [selectedOption, setSelectedOption] = useState(endpointOptions[0]);
    const [response, setResponse] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleHealthCheck = async () => {
        setError(null);
        setResponse(null);
        setIsLoading(true);

        try {
            const { value: endpoint, method } = selectedOption;
            console.log("Health check request payload:", { endpoint, method });

            const res = await fetch("/api/v1/health", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ endpoint, method }),
            });

            console.log("Response status:", res.status);

            if (!res.ok) {
                const errorData = await res.json();
                setError(errorData?.error || "An error occurred.");
                return;
            }

            const data = await res.json();
            console.log("Response data:", data);
            setResponse(data);
        } catch (err) {
            console.error("Fetch error:", err);
            setError("An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 p-8 max-w-lg mx-auto">
            <Breadcrumbs /> {/* Add Breadcrumbs here */}
            <h1 className="text-2xl font-bold">Health Check Tool</h1>
            <p>Select an endpoint to check its health information.</p>

            {/* Dropdown for Endpoint Selection */}
            <div className="space-y-2">
                <label htmlFor="endpoint-select" className="block text-sm font-medium">
                    Select an Endpoint
                </label>
                <select
                    id="endpoint-select"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={selectedOption.value}
                    onChange={(e) => {
                        const option = endpointOptions.find((opt) => opt.value === e.target.value);
                        if (option) {
                            setSelectedOption(option);
                        }
                    }}
                >
                    {endpointOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {`${option.method} ${option.label}`}
                        </option>
                    ))}
                </select>
            </div>

            {/* Submit Button */}
            <Button
                onClick={handleHealthCheck}
                disabled={isLoading}
                variant="default"
            >
                {isLoading ? "Checking..." : "Check Health"}
            </Button>

            {/* Error Message */}
            {error && <AlertErrorMessage message={error} />}

            {/* Response Display */}
            {response && (
                <div className="mt-8">
                    <h3 className="text-lg font-semibold">Response:</h3>
                    <pre className="mt-4 p-4 bg-gray-100 rounded-md">
                        {JSON.stringify(response, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default HealthPage;
