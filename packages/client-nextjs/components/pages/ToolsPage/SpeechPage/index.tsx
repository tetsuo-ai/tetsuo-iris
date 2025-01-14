"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertErrorMessage } from "@/components/shared/AlertErrorMessage";

const SpeechPage = () => {
    // Form inputs
    const [text, setText] = useState("");
    const [model, setModel] = useState("tts-1");
    const [voice, setVoice] = useState("alloy");
    const [responseFormat, setResponseFormat] = useState("mp3");
    const [speed, setSpeed] = useState(1);
    const [stream, setStream] = useState(false);

    // Server responses
    const [audioData, setAudioData] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        setError(null);
        setAudioData(null);
        setMessage(null);
        setIsLoading(true);

        try {
            const res = await fetch("/api/v1/speech/tts", {
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
                // Parse error (e.g. 422 or 500)
                const errorData = await res.json();
                setError(errorData.error || "Something went wrong.");
                return;
            }

            const data = await res.json();
            // Suppose server returns { audio_data: base64String, message: "...", ... }
            setAudioData(data.audio_data || null);
            setMessage(data.message || null);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to process TTS request."
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-6 p-6">
            <h1 className="text-2xl font-bold">Text To Speech</h1>

            <div className="space-y-3">
                <label className="block">
                    Text:
                    <Input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Enter text to synthesize"
                        className="mt-1"
                    />
                </label>

                <label className="block">
                    Model:
                    <Input
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder="tts-1, tts-2, etc."
                        className="mt-1"
                    />
                </label>

                <label className="block">
                    Voice:
                    <Input
                        value={voice}
                        onChange={(e) => setVoice(e.target.value)}
                        placeholder="alloy, male, female, etc."
                        className="mt-1"
                    />
                </label>

                <label className="block">
                    Response Format:
                    <Input
                        value={responseFormat}
                        onChange={(e) => setResponseFormat(e.target.value)}
                        placeholder="mp3, wav, etc."
                        className="mt-1"
                    />
                </label>

                <label className="block">
                    Speed (1 = normal):
                    <Input
                        type="number"
                        value={speed}
                        onChange={(e) => setSpeed(Number(e.target.value))}
                        step="0.1"
                        className="mt-1"
                    />
                </label>

                <label className="inline-flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={stream}
                        onChange={(e) => setStream(e.target.checked)}
                    />
                    <span>Stream audio?</span>
                </label>
            </div>

            <Button onClick={handleSubmit} disabled={isLoading || !text.trim()}>
                {isLoading ? "Processing..." : "Submit TTS Request"}
            </Button>

            {/* Error Display */}
            {error && <AlertErrorMessage message={error} />}

            {/* Success Display */}
            {message && <p className="text-green-600">Server says: {message}</p>}

            {/* Audio Playback (if base64 data returned) */}
            {audioData && (
                <div className="mt-4">
                    <h2 className="font-semibold">Synthesized Audio:</h2>
                    {/* 
            Example usage: if it's base64-encoded MP3, 
            we can set src="data:audio/mp3;base64, <audioData>" 
          */}
                    <audio
                        controls
                        src={`data:audio/${responseFormat};base64,${audioData}`}
                    />
                </div>
            )}
        </div>
    );
};

export default SpeechPage;
