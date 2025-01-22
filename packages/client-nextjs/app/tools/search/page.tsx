"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertErrorMessage } from "@/components/shared/AlertErrorMessage";
import Breadcrumbs from "@/components/Breadcrumbs";

const SearchPage = () => {
    const [topic, setTopic] = useState("");
    const [questionSearch, setQuestionSearch] = useState("");
    const [answerQuestion, setAnswerQuestion] = useState("");
    const [guess, setGuess] = useState("");
    const [response, setResponse] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = async (endpoint: string, body: any) => {
        setError(null);
        setResponse(null);
        setIsLoading(true);

        // Ensure correct payload formatting
        const formattedBody = {
            ...body,
            guess: body.guess === "true" ? true : body.guess === "false" ? false : body.guess,
        };

        try {
            const res = await fetch(`/api/v1/tools/search`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ endpoint, ...formattedBody }),
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
            <Breadcrumbs /> {/* Breadcrumb Navigation */}

            <h1 className="text-2xl font-bold">Web Search Tool</h1>

            {/* Topic Search */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold">Search by Topic</h2>
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
                <h2 className="text-lg font-semibold">Search by Question</h2>
                <Input
                    placeholder="Enter a question to search"
                    value={questionSearch}
                    onChange={(e) => setQuestionSearch(e.target.value)}
                    className="w-full"
                />
                <Button
                    onClick={() => handleSearch("question", { topic: questionSearch })}
                    disabled={isLoading || !questionSearch.trim()}
                    variant="default"
                >
                    {isLoading ? "Searching..." : "Get Trivia Question"}
                </Button>
            </div>

            {/* Submit an Answer */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold">Submit an Answer</h2>
                <Input
                    placeholder="Enter the question for the answer"
                    value={answerQuestion}
                    onChange={(e) => setAnswerQuestion(e.target.value)}
                    className="w-full"
                />
                <Input
                    placeholder="Enter your answer guess"
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    className="w-full"
                />
                <Button
                    onClick={() => handleSearch("answer", { question: answerQuestion, guess })}
                    disabled={isLoading || !answerQuestion.trim() || !guess.trim()}
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
