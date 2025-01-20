"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertErrorMessage } from "@/components/shared/AlertErrorMessage";

/**
 * Converts the given text from all-lowercase to a naive “sentence case”.
 * 
 * For example: 
 *   "hello. this is a test! is it working? yes it is."
 *   becomes
 *   "Hello. This is a test! Is it working? Yes it is."
 *
 * This will fail on bullet points, lines without punctuation, etc.
 */
function toSentenceCase(str: string) {
    return str.replace(/(^\s*\w|[\.\?\!]\s*\w)/g, (c) => c.toUpperCase());
}

/**
 * A naive markdown-to-HTML converter. 
 * Replaces a few patterns (bold, italic, list items) without sanitization.
 */
function parseMarkdownToHTML(markdown: string) {
    // Convert from all-lowercase to naive sentence case first.
    let html = toSentenceCase(markdown);

    // Bold: **text** or __text__
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/__(.*?)__/g, "<strong>$1</strong>");

    // Italic: *text* or _text_
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    html = html.replace(/_(.*?)_/g, "<em>$1</em>");

    // Simple list items (start of line with "- "):
    html = html.replace(/^-\s+(.*)$/gm, "<li>$1</li>");

    // Convert newlines to <br>:
    html = html.replace(/\n/g, "<br/>");

    return html;
}

const LinkSummaryPage = () => {
    const [url, setUrl] = useState("");
    const [maxLength, setMaxLength] = useState(500);
    const [response, setResponse] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSummarizeUrl = async () => {
        setError(null);
        setResponse(null);
        setIsLoading(true);

        try {
            const res = await fetch("/api/v1/summarize/url", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ url, max_length: maxLength }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                if (res.status === 422) {
                    setError(
                        errorData.detail
                            ?.map((err: { msg: string }) => err.msg)
                            .join(", ") || "Validation error."
                    );
                } else {
                    setError("Something went wrong.");
                }
                return;
            }

            // The endpoint returns lowercase text
            const data = await res.json(); // data is expected to be a string
            setResponse(data);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to summarize URL."
            );
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Dangerously set inner HTML (insecure in production, naive approach).
     */
    const getDangerousHTML = () => {
        if (!response) return { __html: "" };
        return { __html: parseMarkdownToHTML(response) };
    };

    return (
        <div className="space-y-8 p-8 max-w-lg mx-auto">
            <h1 className="text-2xl font-bold">Summarize URL</h1>

            {/* Input Fields */}
            <div className="space-y-4">
                <Input
                    placeholder="Enter URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full"
                />
                <Input
                    type="number"
                    placeholder="Max Length (e.g., 500)"
                    value={maxLength}
                    onChange={(e) => setMaxLength(Number(e.target.value))}
                    className="w-full"
                />
                <Button
                    onClick={handleSummarizeUrl}
                    disabled={isLoading || !url.trim()}
                    variant="default"
                >
                    {isLoading ? "Summarizing..." : "Summarize URL"}
                </Button>
            </div>

            {/* Error Message */}
            {error && <AlertErrorMessage message={error} />}

            {/* Response Display */}
            {response && (
                <div className="mt-8">
                    <h3 className="text-lg font-semibold">Summary Result:</h3>
                    <div
                        className="bg-gray-100 p-4 rounded-md overflow-x-auto"
                        dangerouslySetInnerHTML={getDangerousHTML()}
                    />
                </div>
            )}
        </div>
    );
};

export default LinkSummaryPage;
