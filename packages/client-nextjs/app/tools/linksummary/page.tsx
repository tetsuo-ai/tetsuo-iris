"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertErrorMessage } from "@/components/shared/AlertErrorMessage";

/**
 * Converts a raw, *lowercase* Markdown string into “sentence case” Markdown, capitalizing:
 * (A) The first letter of the entire string or after . ? !
 * (B) The first letter of bullet lines ( - , * , or numbered 1. ), skipping non-alpha (e.g. "**").
 * (C) If a line is NOT a bullet but starts with a letter, capitalize that letter.
 * (D) The first letter after colon+space (": ").
 */
function toSentenceCase(markdown: string) {
    let result = markdown;

    // (A) Capitalize after sentence-ending punctuation or start of string
    //     e.g., "this is one. here is two!" => "This is one. Here is two!"
    result = result.replace(/(^\s*\w|[\.\?\!]\s+\w)/g, (match) => {
        return match.toUpperCase();
    });

    // (B) Bullet lines: e.g. "- **something**" => "- **Something**"
    //     ^(\s*([\-\*]|\d+\.)\s+) => bullet prefix (e.g. "- " or "1. ")
    //     ([^a-zA-Z]*)([a-zA-Z]) => skip non-alpha until first alpha
    result = result.replace(
        /^(\s*([\-\*]|\d+\.)\s+)([^a-zA-Z]*)([a-zA-Z])/gm,
        (_, bulletPrefix, _bulletType, nonAlpha, firstLetter) => {
            return bulletPrefix + nonAlpha + firstLetter.toUpperCase();
        }
    );

    // (C) Capitalize lines that start with a letter (but are NOT bullet lines).
    //     Example: "additionally, ..." => "Additionally, ..."
    //     We skip lines that have a bullet prefix.
    //     Negative lookahead (?!([\-\*]|\d+\.)) ensures we don't re-capitalize bullet lines.
    result = result.replace(
        /^(\s*)(?!([\-\*]|\d+\.))([a-zA-Z])/gm,
        (match, leadingSpaces, _skip, firstLetter) => {
            return leadingSpaces + firstLetter.toUpperCase();
        }
    );

    // (D) Capitalize after colon+space, e.g. "using corepack: since node.js..." => "...: Since node.js..."
    result = result.replace(/:\s+([a-z])/g, (fullMatch, letter) => {
        return `: ${letter.toUpperCase()}`;
    });

    return result;
}

/**
 * Converts the final (capitalized) Markdown → HTML (naively).
 * WARNING: Uses dangerouslySetInnerHTML with no sanitization => XSS risk if content is untrusted.
 */
function parseMarkdownToHTML(markdown: string) {
    let html = markdown;

    // Bold: **text** or __text__
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/__(.*?)__/g, "<strong>$1</strong>");

    // Italic: *text* or _text_
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    html = html.replace(/_(.*?)_/g, "<em>$1</em>");

    // Lines starting with dash/asterisk or a numbered bullet => <li>...</li>
    // (Naive approach: no <ul>/<ol> wrappers.)
    html = html.replace(/^(\s*[\-\*]|\s*\d+\.)\s+(.*)$/gm, "<li>$2</li>");

    // Convert newlines => <br/>
    html = html.replace(/\n/g, "<br/>");

    // Remove extra <br/> right after a closing </li> to prevent extra blank lines
    html = html.replace(/<\/li>\s*<br\s*\/?>/g, "</li>");

    return html;
}

export default function LinkSummaryPage() {
    const [url, setUrl] = useState("");
    const [maxLength, setMaxLength] = useState(500);

    // We'll store the raw (lowercase) text and the final (capitalized) text
    const [rawMarkdown, setRawMarkdown] = useState<string | null>(null);
    const [finalMarkdown, setFinalMarkdown] = useState<string | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // For "Copied!" feedback on the button
    const [copied, setCopied] = useState(false);

    async function handleSummarizeUrl() {
        setError(null);
        setRawMarkdown(null);
        setFinalMarkdown(null);
        setIsLoading(true);

        try {
            const res = await fetch("/api/v1/tools/linksummary", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url, max_length: maxLength }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                setError(errorData.error || "Something went wrong.");
                return;
            }

            const data = await res.json();
            // The server presumably returns data.summary in all-lowercase
            const raw = data.summary as string;

            // Capitalize it (including bullet lines, colon usage, etc.)
            const capitalized = toSentenceCase(raw);

            setRawMarkdown(raw);
            setFinalMarkdown(capitalized);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to summarize URL."
            );
        } finally {
            setIsLoading(false);
        }
    }

    // Turn final Markdown → HTML
    const getDangerousHTML = () => {
        if (!finalMarkdown) return { __html: "" };
        return { __html: parseMarkdownToHTML(finalMarkdown) };
    };

    // Copy the *final* (capitalized) Markdown to the clipboard
    function handleCopyMarkdown() {
        if (finalMarkdown) {
            navigator.clipboard.writeText(finalMarkdown);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }
    }

    return (
        <div className="space-y-8 p-8 max-w-lg mx-auto">
            <h1 className="text-2xl font-bold">URL Summarization</h1>

            {/* Input Fields */}
            <div className="space-y-4">
                <Input
                    placeholder="Enter the URL to summarize"
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

            {/* Final Markdown Display */}
            {finalMarkdown && (
                <div className="mt-8">
                    <div className="flex items-center space-x-4 mb-2">
                        <h3 className="text-lg font-semibold">Summary Result:</h3>
                        <Button variant="outline" onClick={handleCopyMarkdown}>
                            {copied ? "Copied!" : "Copy"}
                        </Button>
                    </div>
                    {/* Render final (capitalized) Markdown as HTML */}
                    <div
                        className="bg-gray-100 p-4 rounded-md overflow-x-auto"
                        dangerouslySetInnerHTML={getDangerousHTML()}
                    />
                </div>
            )}
        </div>
    );
}
