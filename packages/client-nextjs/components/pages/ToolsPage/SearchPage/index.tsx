"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { AlertErrorMessage } from "@/components/shared/AlertErrorMessage";

const SearchPage = () => {
    const [topic, setTopic] = useState("");
    const [question, setQuestion] = useState("");
    const [guess, setGuess] = useState("");
    const [response, setResponse] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = async (endpoint: string, body: any) => {
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
            <h1 className="text-2xl font-bold">Web Search Tool</h1>

            {/* Topic Search */}
            <div className="space-y-4">
                <Input
                    placeholder="Enter a topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full"
                />
                <Button
                    onClick={() => handleSearch("topic", { topic })}
                    disabled={isLoading || !topic.trim()}
                    variant="default"
                >
                    {isLoading ? "Searching..." : "Get Trivia Topic"}
                </Button>
            </div>

            {/* Question Search */}
            <div className="space-y-4">
                <Input
                    placeholder="Enter a question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="w-full"
                />
                <Button
                    onClick={() => handleSearch("question", { topic: question })}
                    disabled={isLoading || !question.trim()}
                    variant="default"
                >
                    {isLoading ? "Searching..." : "Get Trivia Question"}
                </Button>
            </div>

            {/* Answer Search */}
            <div className="space-y-4">
                <Input
                    placeholder="Enter your guess"
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    className="w-full"
                />
                <Button
                    onClick={() => handleSearch("answer", { question, guess })}
                    disabled={isLoading || !question.trim() || !guess.trim()}
                    variant="default"
                >
                    {isLoading ? "Validating..." : "Submit Answer"}
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

export default SearchPage;
