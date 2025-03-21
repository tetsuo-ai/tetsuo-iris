"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface SkryrRecordingPanelProps {
    isRecording: boolean;
    startRecording: () => void;
    stopRecording: () => void;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    audioData: Uint8Array;
    computedColor: string;
}

const SkryrRecordingPanel: React.FC<SkryrRecordingPanelProps> = ({
    isRecording,
    startRecording,
    stopRecording,
    canvasRef,
    audioData,
    computedColor,
}) => {
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !audioData) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const barWidth = canvas.width / audioData.length;
            for (let i = 0; i < audioData.length; i++) {
                const height = (audioData[i] / 255) * canvas.height;
                ctx.fillStyle = computedColor;
                ctx.fillRect(i * barWidth, canvas.height - height, barWidth - 1, height);
            }
            requestAnimationFrame(draw);
        };
        draw();
    }, [audioData, computedColor, canvasRef]);

    return (
        <div
            className="flex flex-col items-center"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.8)", padding: "8px", borderRadius: "4px" }}
        >
            <div className="flex items-center gap-2">
                <canvas ref={canvasRef} width={200} height={40} style={{ border: `1px solid ${computedColor}` }} />
                <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-8 h-8 text-sm ${isRecording ? "border-2 border-red-500 text-red-500" : "border-0 text-gray-500"} hover:bg-gray-700`}
                >
                    <i className={`fa-solid ${isRecording ? "fa-stop" : "fa-circle"}`} />
                </Button>
            </div>
        </div>
    );
};

export default SkryrRecordingPanel;