"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { AlertErrorMessage } from "@/components/shared/AlertErrorMessage";

const CodePage = () => {
    const [text, setText] = useState("");
    const [url, setUrl] = useState("");
    const [response, setResponse] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleApiCall = async (endpoint: string, body: any) => {
        setError(null);
        setResponse(null);
        setIsLoading(true);

        try {
            const res = await fetch(`/api/v1/tools/${endpoint}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const errorData = await res.json();
                setError(errorData.error || "Something went wrong.");
                return;
            }

            const data = await res.json();
            setResponse(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch data.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 p-8 max-w-lg mx-auto">
            <h1 className="text-2xl font-bold">Code Analysis Tool</h1>

            {/* Analyze Code */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold">Analyze Code</h2>
                <Textarea
                    placeholder="Paste your code here"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full"
                />
                <Button
                    onClick={() => handleApiCall("code/analyze", { text, max_length: 500 })}
                    disabled={isLoading || !text.trim()}
                    variant="default"
                >
                    {isLoading ? "Analyzing..." : "Analyze Code"}
                </Button>
            </div>

            {/* Analyze GitHub Repository */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold">Analyze GitHub Repository</h2>
                <Input
                    placeholder="Enter GitHub repository URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full"
                />
                <Button
                    onClick={() => handleApiCall("code/analyze_github", { url })}
                    disabled={isLoading || !url.trim()}
                    variant="default"
                >
                    {isLoading ? "Analyzing..." : "Analyze Repository"}
                </Button>
            </div>

            {/* Error Message */}
            {error && <AlertErrorMessage message={error} />}

            {/* Response Display */}
            {response && (
                <div className="mt-8">
                    <h3 className="text-lg font-semibold">Response:</h3>
                    <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                        {JSON.stringify(response, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default CodePage;
