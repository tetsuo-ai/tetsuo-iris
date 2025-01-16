"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertErrorMessage } from "@/components/shared/AlertErrorMessage";
import Breadcrumbs from "@/components/Breadcrumbs";



/**
 * A simple page to test the TTS route: POST /api/v1/tools/speech/tts
 */
export default function SpeechPage() {
    // Form fields
    const [text, setText] = useState("");
    const [model, setModel] = useState("tts-1");
    const [voice, setVoice] = useState("alloy");
    const [responseFormat, setResponseFormat] = useState("mp3");
    const [speed, setSpeed] = useState(1);
    const [stream, setStream] = useState(false);

    // Response data
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [responseData, setResponseData] = useState<any>(null);

    async function handleSubmit() {
        setError(null);
        setResponseData(null);
        setIsLoading(true);

        try {
            // IMPORTANT: Must match your route at /api/v1/tools/speech/tts
            const res = await fetch("/api/v1/tools/speech/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text,
                    model,
                    voice,
                    response_format: responseFormat,
                    speed,
                    stream,
                }),
            });

            if (!res.ok) {
                const errorText = await res.text();
                setError(`Error: ${errorText}`);
                return;
            }

            const data = await res.json();
            setResponseData(data);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to process TTS request."
            );
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="max-w-xl mx-auto p-6 space-y-6">
            <Breadcrumbs /> {/* Breadcrumb Navigation */}

            <h1 className="text-2xl font-bold">Speech Page</h1>

            <div className="space-y-3">
                <label className="block">
                    Text:
                    <Input
                        className="mt-1"
                        placeholder="Enter some text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                </label>

                <label className="block">
                    Model:
                    <Input
                        className="mt-1"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                    />
                </label>

                <label className="block">
                    Voice:
                    <Input
                        className="mt-1"
                        value={voice}
                        onChange={(e) => setVoice(e.target.value)}
                    />
                </label>

                <label className="block">
                    Response Format:
                    <Input
                        className="mt-1"
                        value={responseFormat}
                        onChange={(e) => setResponseFormat(e.target.value)}
                    />
                </label>

                <label className="block">
                    Speed (1 = normal):
                    <Input
                        className="mt-1"
                        type="number"
                        step="0.1"
                        value={speed}
                        onChange={(e) => setSpeed(Number(e.target.value))}
                    />
                </label>

                <label className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={stream}
                        onChange={(e) => setStream(e.target.checked)}
                    />
                    <span>Stream?</span>
                </label>
            </div>

            <Button
                variant="default"
                onClick={handleSubmit}
                disabled={isLoading || !text.trim()}
            >
                {isLoading ? "Processing..." : "Submit"}
            </Button>

            {error && <AlertErrorMessage message={error} />}

            {responseData && (
                <div className="mt-4 space-y-2">
                    <p className="font-semibold">Server Response:</p>
                    <pre className="bg-gray-100 p-2 rounded-md overflow-x-auto">
                        {JSON.stringify(responseData, null, 2)}
                    </pre>

                    {responseData.audio_data && (
                        <div>
                            <p className="font-semibold">Audio Preview:</p>
                            <audio
                                controls
                                src={`data:audio/${responseFormat};base64,${responseData.audio_data}`}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
