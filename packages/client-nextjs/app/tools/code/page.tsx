"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { AlertErrorMessage } from "@/components/shared/AlertErrorMessage";
import Breadcrumbs from "@/components/Breadcrumbs";

/**
 * Converts a string to sentence case and ensures text after colons is capitalized.
 */
function toSentenceCase(str: string) {
    return str.replace(/(^\s*\w|[\.\?\!]\s*\w|:\s*\s*\w)/g, (match) => match.toUpperCase());
}
/**
 * Parses markdown for Code Analysis.
 * Handles bold, italic, inline code, bullet points, nested lists, and consistent capitalization.
 */
function parseCodeAnalysisMarkdown(markdown: string) {
    // Remove "Scan results" section, if present
    // markdown = markdown.replace(/Scan results:\s*[\s\S]*?(?=(\n|Red Flags:|$))/i, "").trim();

    // Ensure headings like "Functionality," "Security," "Red flags," and "Summary" are bold
    markdown = markdown.replace(
        /^\s*\*?\s*(Functionality|Security|Red flags|Summary):/gim,
        (_, heading) => `<strong>${toSentenceCase(heading)}:</strong>`
    );

    // Convert inline markdown to HTML
    let html = toSentenceCase(markdown);

    // Handle inline code: `code`
    html = html.replace(/`(.*?)`/g, "<code>$1</code>");

    // Handle bold: **text** or __text__
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/__(.*?)__/g, "<strong>$1</strong>");

    // Handle italic: *text* or _text_
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    html = html.replace(/_(.*?)_/g, "<em>$1</em>");

    // Handle nested bullet points
    html = html.replace(/^(\s*)\*\s+(.*)$/gm, (_, spaces, text) => {
        const level = spaces.length / 2; // Determine nesting level
        return `<li style="margin-left: ${level * 1.5}em; line-height: 1.6;">${toSentenceCase(
            text.trim()
        )}</li>`;
    });

    // Ensure all <li> are wrapped in <ul>
    html = html.replace(/(<li.*?>.*?<\/li>)/g, "<ul style='list-style-type: disc; margin-left: 1em;'>$1</ul>");

    // Remove redundant wrapping of consecutive lists
    html = html.replace(/<\/ul>\s*<ul style='list-style-type: disc; margin-left: 1em;'>/g, "");

    // Trim any leading/trailing newlines before "Summary"
    html = html.replace(/\n+(Summary:)/g, "$1");

    // Convert newlines outside lists to a single <br/>
    html = html.replace(/(?<!<\/li>)\n+/g, "<br/>");

    return html;
}
/**
 * Parses markdown for GitHub Analysis.
 * Handles bold, italic, inline code, bullet points, nested lists, and consistent capitalization.
 */
function parseGithubAnalysisMarkdown(markdown: string) {
    markdown = markdown.replace(/Scan results:\s*[\s\S]*?(?=\*\s+\*\*|$)/i, "").trim();

    // Ensure headings are bold and not list items
    markdown = markdown.replace(
        /^\s*\*?\s*\*\*(Red Flags|Functional Issues|Security Analysis):\*\*/gim,
        (_, heading) => `<strong>${toSentenceCase(heading)}:</strong>`
    );

    // Convert inline markdown to HTML
    let html = markdown;

    // Handle inline code: `code`
    html = html.replace(/`(.*?)`/g, "<code>$1</code>");

    // Handle bold: **text** or __text__
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/__(.*?)__/g, "<strong>$1</strong>");

    // Handle italic: *text* or _text_
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    html = html.replace(/_(.*?)_/g, "<em>$1</em>");

    // Handle nested bullet points
    html = html.replace(/^(\s*)\*\s+(.*)$/gm, (_, spaces, text) => {
        const level = spaces.length / 2; // Determine nesting level
        return `<li style="margin-left: ${level * 1.5}em; line-height: 1.6;">${toSentenceCase(text.trim())}</li>`;
    });

    // Ensure all <li> are wrapped in <ul>
    html = html.replace(/(<li.*?>.*?<\/li>)/g, "<ul style='list-style-type: disc; margin-left: 1em;'>$1</ul>");

    // Remove redundant wrapping of consecutive lists
    html = html.replace(/<\/ul>\s*<ul style='list-style-type: disc; margin-left: 1em;'>/g, "");

    // Convert newlines outside lists to <br/>
    html = html.replace(/(?<!<\/li>)\n/g, "<br/>");

    return html;
}


/** CodePage Component */
const CodePage = () => {
    const [text, setText] = useState("");
    const [url, setUrl] = useState("");
    const [codeResponse, setCodeResponse] = useState<string | null>(null);
    const [githubResponse, setGithubResponse] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoadingCode, setIsLoadingCode] = useState(false);
    const [isLoadingGithub, setIsLoadingGithub] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleApiCall = async (endpoint: string, body: any, isCodeAnalysis: boolean) => {
        setError(null);
        if (isCodeAnalysis) {
            setCodeResponse(null);
            setIsLoadingCode(true);
        } else {
            setGithubResponse(null);
            setIsLoadingGithub(true);
        }

        try {
            const res = await fetch(`/api/v1/tools/code`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ endpoint, ...body }),
            });

            if (!res.ok) {
                const errorData = await res.text();
                setError(errorData);
                return;
            }

            const data = await res.json();
            if (isCodeAnalysis) {
                setCodeResponse(data.analysis || data);
            } else {
                setGithubResponse(data.analysis || data);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch data.");
        } finally {
            if (isCodeAnalysis) setIsLoadingCode(false);
            else setIsLoadingGithub(false);
        }
    };

    const createCodeDangerousHTML = (str: string | null) => {
        if (!str) return { __html: "" };
        return { __html: parseCodeAnalysisMarkdown(str) };
    };

    const createGithubDangerousHTML = (str: string | null) => {
        if (!str) return { __html: "" };
        return { __html: parseGithubAnalysisMarkdown(str) };
    };

    const handleCopy = (response: string | null, isCodeAnalysis: boolean) => {
        if (!response) return;
        const markdown = isCodeAnalysis
            ? parseCodeAnalysisMarkdown(response)
            : parseGithubAnalysisMarkdown(response);
        const plainMarkdown = markdown
            .replace(/<\/?strong>/g, "**") // Convert <strong> to markdown bold
            .replace(/<\/?em>/g, "*")     // Convert <em> to markdown italic
            .replace(/<\/?code>/g, "`")  // Convert <code> to inline code
            .replace(/<br\/?>/g, "\n")   // Convert <br> to newlines
            .replace(/<ul.*?>|<\/ul>/g, "") // Remove <ul> tags
            .replace(/<li.*?>(.*?)<\/li>/g, "* $1"); // Convert list items to markdown

        navigator.clipboard.writeText(plainMarkdown);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };


    return (
        <div className="space-y-8 p-8 max-w-4xl mx-auto">
            <Breadcrumbs /> {/* Breadcrumb Navigation */}

            <h1 className="text-2xl font-bold">Code Analysis Tool</h1>

            {/* Row-based Analyze Code and GitHub Repository */}
            <div className="flex flex-row space-x-8 items-start">
                {/* Analyze Code */}
                <div className="flex-1 space-y-4">
                    <h2 className="text-lg font-semibold">Analyze Code</h2>
                    <Textarea
                        placeholder="Paste your code here"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-full"
                    />
                    <Button
                        onClick={() => handleApiCall("code/analyze", { text, max_length: 500 }, true)}
                        disabled={isLoadingCode || !text.trim()}
                    >
                        {isLoadingCode ? "Analyzing..." : "Analyze Code"}
                    </Button>

                    {codeResponse && (
                        <div className="bg-gray-100 p-3 rounded-md space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold">Code Analysis Result:</h3>
                                <Button
                                    variant="outline"
                                    onClick={() => handleCopy(codeResponse, true)} // Pass `true` for Code Analysis
                                >
                                    {copied ? "Copied!" : "Copy"}
                                </Button>
                            </div>
                            <div
                                className="whitespace-pre-wrap"
                                dangerouslySetInnerHTML={createCodeDangerousHTML(codeResponse)}
                            />
                        </div>
                    )}
                </div>

                {/* Analyze GitHub Repository */}
                <div className="flex-1 space-y-4">
                    <h2 className="text-lg font-semibold">Analyze GitHub Repository</h2>
                    <Textarea
                        placeholder="Enter GitHub repository URL"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full"
                    />
                    <Button
                        onClick={() => handleApiCall("code/analyze_github", { url }, false)}
                        disabled={isLoadingGithub || !url.trim()}
                    >
                        {isLoadingGithub ? "Analyzing..." : "Analyze Repository"}
                    </Button>

                    {githubResponse && (
                        <div className="bg-gray-100 p-3 rounded-md space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold">GitHub Analysis Result:</h3>
                                <Button
                                    variant="outline"
                                    onClick={() => handleCopy(githubResponse, false)} // Pass `false` for GitHub Analysis
                                >
                                    {copied ? "Copied!" : "Copy"}
                                </Button>
                            </div>
                            <div
                                className="whitespace-pre-wrap"
                                dangerouslySetInnerHTML={createGithubDangerousHTML(githubResponse)}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Error Message */}
            {error && <AlertErrorMessage message={error} />}
        </div>
    );
};

export default CodePage;