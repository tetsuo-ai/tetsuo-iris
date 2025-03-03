"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertErrorMessage } from "@/components/shared/AlertErrorMessage";
import type { MediaItem } from "@/components/ui/UnboundMediaList";

export interface AnimationPageProps {
    onMediaSelect: (media: MediaItem) => void;
    initialMedia?: MediaItem;
    onMediaDragStart?: (media: MediaItem) => void;
}

const AnimationPage: React.FC<AnimationPageProps> = ({ onMediaSelect, initialMedia }) => {
    const [gValues, setGValues] = useState({ from: "", to: "" });
    const [bValues, setBValues] = useState({ from: "", to: "" });
    const [frames, setFrames] = useState<number | "">("");
    const [impact, setImpact] = useState("");
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDragActive, setIsDragActive] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
    const [droppedURL, setDroppedURL] = useState<string | null>(null);

    useEffect(() => {
        if (selectedMedia && selectedMedia.type === "video") {
            setVideoUrl(selectedMedia.src);
        }
    }, [selectedMedia]);

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragActive(false);
        // Clear previous selections
        setFile(null);
        setSelectedMedia(null);
        setDroppedURL(null);

        const mediaData = e.dataTransfer.getData("application/x-media");
        if (mediaData) {
            try {
                const mediaItem: MediaItem = JSON.parse(mediaData);
                fetch(mediaItem.src)
                    .then((res) => {
                        if (!res.ok) throw new Error("Network response not ok");
                        return res.blob();
                    })
                    .then((blob) => {
                        const fileName = mediaItem.src.split("/").pop() || "media";
                        const newFile = new File([blob], fileName, { type: blob.type });
                        setFile(newFile);
                        setSelectedMedia(null);
                        setDroppedURL(mediaItem.src);
                    })
                    .catch(() => {
                        setSelectedMedia(mediaItem);
                    });
            } catch (err) {
                console.error("Error parsing custom media data:", err);
            }
            return;
        }

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type.startsWith("image/") || droppedFile.type.startsWith("video/")) {
                setFile(droppedFile);
                setSelectedMedia(null);
                setDroppedURL(null);
            } else {
                setError("Unsupported file type.");
            }
            e.dataTransfer.clearData();
            return;
        }

        const text = e.dataTransfer.getData("text/plain");
        if (text && text.trim() !== "") {
            (async () => {
                try {
                    const url = new URL(text);
                    let blob: Blob | undefined;
                    try {
                        const res = await fetch(url.toString(), { mode: "no-cors" });
                        blob = await res.blob();
                    } catch { }
                    if (blob) {
                        const mimeType = blob.type || "application/octet-stream";
                        const fileName = url.pathname.split("/").pop() || "media";
                        const newFile = new File([blob], fileName, { type: mimeType });
                        setFile(newFile);
                        setSelectedMedia(null);
                        setDroppedURL(text);
                    } else {
                        if (text.startsWith("http")) {
                            const isVideo = text.match(/\.(mp4|webm)$/i);
                            const newMedia: MediaItem = {
                                type: isVideo ? "video" : "image",
                                src: text,
                                x: 50,
                                y: 50,
                                scale: 1,
                                rotation: 0,
                                opacity: 1,
                                visible: true,
                                showAt: 0,
                                hideAt: 120,
                                interruptOnPlay: true,
                            };
                            setSelectedMedia(newMedia);
                            setFile(null);
                            setDroppedURL(text);
                        }
                    }
                } catch (err) {
                    if (text.startsWith("http")) {
                        const isVideo = text.match(/\.(mp4|webm)$/i);
                        const newMedia: MediaItem = {
                            type: isVideo ? "video" : "image",
                            src: text,
                            x: 50,
                            y: 50,
                            scale: 1,
                            rotation: 0,
                            opacity: 1,
                            visible: true,
                            showAt: 0,
                            hideAt: 120,
                            interruptOnPlay: true,
                        };
                        setSelectedMedia(newMedia);
                        setFile(null);
                        setDroppedURL(text);
                    }
                }
            })();
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!isDragActive) setIsDragActive(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragActive(false);
    };

    const randomizeParams = () => {
        const randomDecimal = () => Math.random();
        const format = (n: number) => n.toFixed(1);
        const gFromNum = randomDecimal();
        const gToNum = gFromNum + randomDecimal() * (1 - gFromNum);
        const bFromNum = randomDecimal();
        const bToNum = bFromNum + randomDecimal() * (1 - bFromNum);
        const randomFrames = Math.floor(Math.random() * 90 + 30);
        const randomImpact = ["Smooth transition", "Bold impact", "Gentle fade", "Vibrant shift"][Math.floor(Math.random() * 4)];
        setGValues({ from: format(gFromNum), to: format(gToNum) });
        setBValues({ from: format(bFromNum), to: format(bToNum) });
        setFrames(randomFrames);
        setImpact(randomImpact);
    };

    const handleSubmitAnimation = async () => {
        setError(null);
        setVideoUrl(null);
        if (!file && !selectedMedia) {
            setError("Please provide an image/video file or drag & drop a media item.");
            return;
        }
        if (!gValues.from || !gValues.to || !bValues.from || !bValues.to || !impact) {
            setError("Please fill in all required fields.");
            return;
        }
        const formData = new FormData();
        if (file) {
            let fileToUpload = file;
            if (file.type === "application/octet-stream") {
                const ext = file.name.split(".").pop()?.toLowerCase();
                let guessedType = "application/octet-stream";
                if (ext === "gif") guessedType = "image/gif";
                else if (ext === "jpg" || ext === "jpeg") guessedType = "image/jpeg";
                else if (ext === "png") guessedType = "image/png";
                else if (ext === "mp4") guessedType = "video/mp4";
                else if (ext === "webm") guessedType = "video/webm";
                if (guessedType !== "application/octet-stream") {
                    fileToUpload = new File([file], file.name, { type: guessedType });
                }
            }
            formData.append("file", fileToUpload);
            if (fileToUpload.size === 0 && droppedURL) {
                formData.append("url", droppedURL);
            }
        } else {
            setError("Please upload a file for animation processing.");
            return;
        }
        formData.append("g_values", JSON.stringify([parseFloat(gValues.from), parseFloat(gValues.to)]));
        formData.append("b_values", JSON.stringify([parseFloat(bValues.from), parseFloat(bValues.to)]));
        if (frames) formData.append("frames", frames.toString());
        formData.append("impact", impact);
        setIsLoading(true);
        try {
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
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                setVideoUrl(url);
            } else {
                const data = await res.json();
                setError("Unexpected response format.");
            }
        } catch (err) {
            setError("An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectVideo = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (videoUrl) {
            const media: MediaItem = {
                type: "video",
                src: videoUrl,
                x: 50,
                y: 50,
                scale: 1,
                rotation: 0,
                opacity: 1,
                visible: true,
                showAt: 0,
                hideAt: 120,
                interruptOnPlay: true,
            };
            onMediaSelect(media);
        }
    };

    const handleVideoDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        if (videoUrl) {
            const mediaItem: MediaItem = {
                type: "video",
                src: videoUrl,
                x: 50,
                y: 50,
                scale: 1,
                rotation: 0,
                opacity: 1,
                visible: true,
                showAt: 0,
                hideAt: 120,
                interruptOnPlay: true,
            };
            const data = JSON.stringify(mediaItem);
            e.dataTransfer.setData("application/x-media", data);
            e.dataTransfer.setData("text/plain", videoUrl);
            e.dataTransfer.effectAllowed = "copy";
        }
    };

    const truncateFileName = (name: string) =>
        name.length > 32 ? name.substring(0, 32) + "..." : name;

    return (
        <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`"w-full space-y-4 max-w-screen-md mx-auto transition-colors ${isDragActive ? "p-4 border-dashed border-2 border-gray-300" : ""}`}
        >
            <div className="text-center">
                <h1 className="text-2xl font-bold">Create RGB Animation</h1>
            </div>
            {/* Row 3: File Handler */}
            <div className="mt-4" onDrop={(e) => e.preventDefault()} onDragOver={(e) => e.preventDefault()}>
                {file ? (
                    <p className="text-sm text-gray-700 truncate">Selected: {truncateFileName(file.name)}</p>
                ) : (
                    <Input
                        type="file"
                        accept="image/*,video/*"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="w-full"
                    />
                )}
            </div>
            {/* Row 2: Impact prompt */}
            <div className="mt-4">
                <Textarea
                    title="Describe the impact (e.g., 'Smooth transition')"
                    placeholder="Smooth transition"
                    value={impact}
                    onChange={(e) => setImpact(e.target.value)}
                    className="w-full"
                />
            </div>

            {/* Row 1: G/B Inputs & Frames */}
            <div className="flex gap-2">
                <Input
                    title="G From (e.g., 0.1)"
                    placeholder="0.1"
                    value={gValues.from}
                    onChange={(e) => setGValues({ ...gValues, from: e.target.value })}
                    className="w-1/5"
                />
                <Input
                    title="G To (e.g., 1.0)"
                    placeholder="1.0"
                    value={gValues.to}
                    onChange={(e) => setGValues({ ...gValues, to: e.target.value })}
                    className="w-1/5"
                />
                <Input
                    title="B From (e.g., 0.2)"
                    placeholder="0.2"
                    value={bValues.from}
                    onChange={(e) => setBValues({ ...bValues, from: e.target.value })}
                    className="w-1/5"
                />
                <Input
                    title="B To (e.g., 0.8)"
                    placeholder="0.8"
                    value={bValues.to}
                    onChange={(e) => setBValues({ ...bValues, to: e.target.value })}
                    className="w-1/5"
                />
                <Input
                    title="Number of frames (e.g., 60)"
                    type="number"
                    placeholder="60"
                    value={frames}
                    onChange={(e) => setFrames(Number(e.target.value) || "")}
                    className="w-1/5"
                />
            </div>
                {/* Row 4: Action Buttons */}
                <div className="flex gap-2 mt-4">
 
                <Button onClick={randomizeParams} variant="outline" className="flex-1 h-10">
                    Random
                </Button>
                <Button onClick={handleSubmitAnimation} disabled={isLoading} variant="outline" className="flex-1 h-10">
                    {isLoading ? "Submitting..." : "Generate"}
                </Button>
                </div>
        
            {error && <AlertErrorMessage message={error} />}
            {/* Video Preview */}
            {videoUrl && (
                <div className="mt-4 text-center" onClick={handleSelectVideo} draggable onDragStart={handleVideoDragStart}>
                    <div className="relative">
                        <video autoPlay muted loop playsInline className="rounded-md max-w-full" controls={false} style={{ pointerEvents: "none" }}>
                            <source src={videoUrl} type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    </div>
                    <div className="mt-2">
                        <a href={videoUrl} download className="text-sm text-blue-600 underline">
                            Download Video
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnimationPage;
