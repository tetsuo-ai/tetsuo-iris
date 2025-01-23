"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertErrorMessage } from "@/components/shared/AlertErrorMessage";
import Breadcrumbs from "@/components/Breadcrumbs";

const KensubPage = () => {
    const [url, setUrl] = useState("");
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [responseText, setResponseText] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmitKensub = async () => {
        setError(null);
        setVideoUrl(null);
        setResponseText(null);
        setIsLoading(true);

        try {
            console.log("Request Payload:", { url });

            const res = await fetch("/api/v1/video/kensub", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ url }),
            });

            console.log("Response Status:", res.status);

            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                console.error("Error Response Body:", errorData);
                setError(errorData?.error || "Something went wrong.");
                return;
            }

            const contentType = res.headers.get("content-type");

            if (contentType?.startsWith("application/json")) {
                const data = await res.json();
                console.log("Parsed JSON Response:", data);

                if (typeof data === "string") {
                    setResponseText(data);
                } else {
                    setError("Unexpected response format.");
                }
            } else if (contentType?.startsWith("video/mp4")) {
                console.log("Binary video response received. Preparing blob...");
                const blob = await res.blob();
                const videoBlobUrl = URL.createObjectURL(blob);
                setVideoUrl(videoBlobUrl);
            } else {
                console.warn("Unexpected content type:", contentType);
                setError("Unexpected response format from server.");
            }
        } catch (err) {
            console.error("Error while submitting form:", err);
            setError("An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 p-8 max-w-lg mx-auto">
            <Breadcrumbs />
            <h1 className="text-2xl font-bold">Kensub Video Processing</h1>

            <div className="space-y-4">
                <Input
                    placeholder="Enter video URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full"
                />

                <Button
                    onClick={handleSubmitKensub}
                    disabled={isLoading || !url.trim()}
                    variant="default"
                >
                    {isLoading ? "Processing..." : "Submit"}
                </Button>
            </div>

            {error && <AlertErrorMessage message={error} />}

            {responseText && (
                <div className="mt-8">
                    <h3 className="text-lg font-semibold">Response:</h3>
                    <p className="mt-4 p-4 bg-gray-100 rounded-md">{responseText}</p>
                </div>
            )}

            {videoUrl && (
                <div className="mt-8">
                    <h3 className="text-lg font-semibold">Generated Video:</h3>
                    <video controls className="rounded-md max-w-full">
                        <source src={videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                    <a
                        href={videoUrl}
                        download="kensub.mp4"
                        className="block text-blue-500 mt-4"
                    >
                        Download Video
                    </a>
                </div>
            )}
        </div>
    );
};

export default KensubPage;
