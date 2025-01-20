"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertErrorMessage } from "@/components/shared/AlertErrorMessage";

/** Converts a string to sentence case. */
function toSentenceCase(str: string) {
    return str.replace(/(^\s*\w|[\.\?\!]\s*\w)/g, (c) => c.toUpperCase());
}

/** 
 * Parses markdown to formatted HTML with sentence casing applied.
 * Handles bold, italic, bullet points, and newlines.
 */
function parseMarkdown(markdown: string) {
    let html = toSentenceCase(markdown);

    // Bold: **text** or __text__
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/__(.*?)__/g, "<strong>$1</strong>");

    // Italic: *text* or _text_
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    html = html.replace(/_(.*?)_/g, "<em>$1</em>");

    // Bullet points
    html = html.replace(/^\-\s+(.*)$/gm, "<li>$1</li>");

    // Newlines to <br/>
    html = html.replace(/\n/g, "<br/>");

    return html;
}

/** 
 * SummaryPage Component: Handles URL summarization, text summarization (GET/POST), 
 * and copying of formatted outputs.
 */
export default function SummaryPage() {
    // ======= URL Summarization =======
    const [urlValue, setUrlValue] = useState("");
    const [urlMaxLen, setUrlMaxLen] = useState(500);
    const [urlResult, setUrlResult] = useState<string | null>(null);
    const [urlError, setUrlError] = useState<string | null>(null);
    const [isLoadingUrl, setIsLoadingUrl] = useState(false);
    const [urlCopied, setUrlCopied] = useState(false);

    // ======= Text Summarization (GET) =======
    const [textGet, setTextGet] = useState("");
    const [getResult, setGetResult] = useState<string | null>(null);
    const [getError, setGetError] = useState<string | null>(null);
    const [isLoadingGet, setIsLoadingGet] = useState(false);
    const [getCopied, setGetCopied] = useState(false);

    // ======= Text Summarization (POST) =======
    const [textPost, setTextPost] = useState("");
    const [postMaxLen, setPostMaxLen] = useState(500);
    const [postResult, setPostResult] = useState<string | null>(null);
    const [postError, setPostError] = useState<string | null>(null);
    const [isLoadingPost, setIsLoadingPost] = useState(false);
    const [postCopied, setPostCopied] = useState(false);

    // Summarize URL
    async function handleSummarizeUrl() {
        setUrlError(null);
        setUrlResult(null);
        setIsLoadingUrl(true);
        try {
            const res = await fetch("/api/v1/tools/urlsummary", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: urlValue.trim(),
                    max_length: Number(urlMaxLen),
                }),
            });
            if (!res.ok) {
                const errorMsg = await res.text();
                setUrlError(errorMsg);
                return;
            }
            const data = await res.json();
            setUrlResult(toSentenceCase(data.summary || ""));
        } catch (err) {
            setUrlError(
                err instanceof Error ? err.message : "Failed to summarize URL."
            );
        } finally {
            setIsLoadingUrl(false);
        }
    }

    // Summarize Text (GET)
    async function handleSummarizeTextGET() {
        setGetError(null);
        setGetResult(null);
        setIsLoadingGet(true);
        try {
            const res = await fetch(
                `/api/v1/tools/summary/text?text=${encodeURIComponent(textGet)}`
            );
            if (!res.ok) {
                const errMsg = await res.text();
                setGetError(errMsg);
                return;
            }
            const data = await res.json();
            setGetResult(toSentenceCase(data.summary || ""));
        } catch (err) {
            setGetError(
                err instanceof Error ? err.message : "Failed to GET summarize text."
            );
        } finally {
            setIsLoadingGet(false);
        }
    }

    // Summarize Text (POST)
    async function handleSummarizeTextPOST() {
        setPostError(null);
        setPostResult(null);
        setIsLoadingPost(true);
        try {
            const res = await fetch("/api/v1/tools/summary/text", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: textPost.trim(),
                    max_length: Number(postMaxLen),
                }),
            });
            if (!res.ok) {
                const errMsg = await res.text();
                setPostError(errMsg);
                return;
            }
            const data = await res.json();
            setPostResult(toSentenceCase(data.summary || ""));
        } catch (err) {
            setPostError(
                err instanceof Error ? err.message : "Failed to POST summarize text."
            );
        } finally {
            setIsLoadingPost(false);
        }
    }

    // Create dangerously set HTML
    function createDangerousHTML(str: string | null) {
        if (!str) return { __html: "" };
        return { __html: parseMarkdown(str) };
    }

    // Copy the final formatted output
    function handleCopy(result: string | null, setCopied: (v: boolean) => void) {
        if (!result) return;
        navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-8">
            <h1 className="text-2xl font-bold">Summary Page</h1>

            {/* Summarize URL */}
            <div className="p-4 border rounded-md space-y-4">
                <h2 className="text-lg font-semibold">Summarize URL</h2>
                <div className="space-y-2">
                    <Input
                        placeholder="Enter URL"
                        value={urlValue}
                        onChange={(e) => setUrlValue(e.target.value)}
                    />
                    <Input
                        type="number"
                        placeholder="Max Length (500)"
                        value={urlMaxLen}
                        onChange={(e) => setUrlMaxLen(Number(e.target.value))}
                    />
                    <Button
                        onClick={handleSummarizeUrl}
                        disabled={!urlValue.trim() || isLoadingUrl}
                    >
                        {isLoadingUrl ? "Summarizing..." : "Summarize URL"}
                    </Button>
                </div>
                {urlError && <AlertErrorMessage message={urlError} />}

                {urlResult && (
                    <div className="bg-gray-100 p-3 rounded-md space-y-2">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold">URL Summary Result:</h3>
                            <Button
                                variant="outline"
                                onClick={() => handleCopy(urlResult, setUrlCopied)}
                            >
                                {urlCopied ? "Copied!" : "Copy"}
                            </Button>
                        </div>

                        <div
                            className="whitespace-pre-wrap"
                            dangerouslySetInnerHTML={createDangerousHTML(urlResult)}
                        />
                    </div>
                )}
            </div>

            {/* Summarize Text (GET) */}
            <div className="p-4 border rounded-md space-y-4">
                <h2 className="text-lg font-semibold">Summarize Text (GET)</h2>
                <div className="space-y-2">
                    <Input
                        placeholder="Enter text for GET"
                        value={textGet}
                        onChange={(e) => setTextGet(e.target.value)}
                    />
                    <Button
                        onClick={handleSummarizeTextGET}
                        disabled={!textGet.trim() || isLoadingGet}
                    >
                        {isLoadingGet ? "Summarizing..." : "GET Summarize Text"}
                    </Button>
                </div>
                {getError && <AlertErrorMessage message={getError} />}

                {getResult && (
                    <div className="bg-gray-100 p-3 rounded-md space-y-2">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold">GET Summary Result:</h3>
                            <Button
                                variant="outline"
                                onClick={() => handleCopy(getResult, setGetCopied)}
                            >
                                {getCopied ? "Copied!" : "Copy"}
                            </Button>
                        </div>

                        <div
                            className="whitespace-pre-wrap"
                            dangerouslySetInnerHTML={createDangerousHTML(getResult)}
                        />
                    </div>
                )}
            </div>

            {/* Summarize Text (POST) */}
            <div className="p-4 border rounded-md space-y-4">
                <h2 className="text-lg font-semibold">Summarize Text (POST)</h2>
                <div className="space-y-2">
                    <Input
                        placeholder="Enter text for POST"
                        value={textPost}
                        onChange={(e) => setTextPost(e.target.value)}
                    />
                    <Input
                        type="number"
                        placeholder="Max Length (500)"
                        value={postMaxLen}
                        onChange={(e) => setPostMaxLen(Number(e.target.value))}
                    />
                    <Button
                        onClick={handleSummarizeTextPOST}
                        disabled={!textPost.trim() || isLoadingPost}
                    >
                        {isLoadingPost ? "Summarizing..." : "POST Summarize Text"}
                    </Button>
                </div>
                {postError && <AlertErrorMessage message={postError} />}

                {postResult && (
                    <div className="bg-gray-100 p-3 rounded-md space-y-2">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold">POST Summary Result:</h3>
                            <Button
                                variant="outline"
                                onClick={() => handleCopy(postResult, setPostCopied)}
                            >
                                {postCopied ? "Copied!" : "Copy"}
                            </Button>
                        </div>

                        <div
                            className="whitespace-pre-wrap"
                            dangerouslySetInnerHTML={createDangerousHTML(postResult)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
