"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertErrorMessage } from "@/components/shared/AlertErrorMessage";
import Breadcrumbs from "@/components/Breadcrumbs";

const AnimationPage = () => {
    const [gValues, setGValues] = useState({ from: "", to: "" });
    const [bValues, setBValues] = useState({ from: "", to: "" });
    const [frames, setFrames] = useState<number | "">("");
    const [impact, setImpact] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmitAnimation = async () => {
        setError(null);
        setVideoUrl(null);

        if (!file || !gValues.from || !gValues.to || !bValues.from || !bValues.to || !impact) {
            setError("Please fill in all required fields.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("g_values", JSON.stringify([parseFloat(gValues.from), parseFloat(gValues.to)]));
        formData.append("b_values", JSON.stringify([parseFloat(bValues.from), parseFloat(bValues.to)]));
        if (frames) formData.append("frames", frames.toString());
        formData.append("impact", impact);

        setIsLoading(true);

        try {
            console.log("Submitting form data to backend route...");
            const res = await fetch("/api/v1/animations", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                setError(errorData?.error || "Something went wrong.");
                return;
            }

            const contentType = res.headers.get("content-type");
            if (contentType?.startsWith("video/mp4")) {
                console.log("Video response received. Preparing blob...");
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                setVideoUrl(url);
            } else {
                const data = await res.json();
                setError("Unexpected response format.");
                console.log("Unexpected response data:", data);
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
            <Breadcrumbs /> {/* Breadcrumb Navigation */}

            <h1 className="text-2xl font-bold">Create RGB Animation</h1>

            <div className="space-y-4">
                <div>
                    <h2 className="text-lg font-semibold">G Values (Green)</h2>
                    <div className="flex space-x-4">
                        <Input
                            placeholder="From (e.g., 0.1)"
                            value={gValues.from}
                            onChange={(e) => setGValues({ ...gValues, from: e.target.value })}
                            className="w-full"
                        />
                        <Input
                            placeholder="To (e.g., 1.0)"
                            value={gValues.to}
                            onChange={(e) => setGValues({ ...gValues, to: e.target.value })}
                            className="w-full"
                        />
                    </div>
                </div>

                <div>
                    <h2 className="text-lg font-semibold">B Values (Blue)</h2>
                    <div className="flex space-x-4">
                        <Input
                            placeholder="From (e.g., 0.2)"
                            value={bValues.from}
                            onChange={(e) => setBValues({ ...bValues, from: e.target.value })}
                            className="w-full"
                        />
                        <Input
                            placeholder="To (e.g., 0.8)"
                            value={bValues.to}
                            onChange={(e) => setBValues({ ...bValues, to: e.target.value })}
                            className="w-full"
                        />
                    </div>
                </div>

                <Input
                    type="number"
                    placeholder="Enter number of frames (e.g., 60)"
                    value={frames}
                    onChange={(e) => setFrames(Number(e.target.value) || "")}
                    className="w-full"
                />

                <Textarea
                    placeholder="Describe the impact (e.g., 'Smooth transition')"
                    value={impact}
                    onChange={(e) => setImpact(e.target.value)}
                    className="w-full"
                />

                <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full"
                />

                <Button
                    onClick={handleSubmitAnimation}
                    disabled={isLoading}
                    variant="default"
                >
                    {isLoading ? "Submitting..." : "Generate Animation"}
                </Button>
            </div>

            {error && <AlertErrorMessage message={error} />}
            {videoUrl && (
                <div className="mt-8">
                    <h3 className="text-lg font-semibold">Generated Video:</h3>
                    <video controls className="rounded-md max-w-full">
                        <source src={videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                    <a
                        href={videoUrl}
                        download="animation.mp4"
                        className="block text-blue-500 mt-4"
                    >
                        Download Video
                    </a>
                </div>
            )}
        </div>
    );
};

export default AnimationPage;
