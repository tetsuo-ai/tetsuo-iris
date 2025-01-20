import { API_URL, BEARER_TOKEN } from "@/lib/serverConstants";
import { NextResponse } from "next/server";

/**
 * POST /api/v1/tools/speech/tts
 *
 * 1) Forwards text/params to an external TTS endpoint at `${API_URL}/api/v1/speech/tts`.
 * 2) If the response is JSON => parse and return it.
 * 3) If the response is binary => base64-encode it, return { audio_data, file_name, content_type }.
 * 4) The file_name defaults to a timestamped string, e.g. 2025-01-14-23-59-59.mp3
 */
export async function POST(request: Request) {
    try {
        // 1) Validate environment
        if (!API_URL || !BEARER_TOKEN) {
            console.error("Missing API_URL or BEARER_TOKEN");
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 }
            );
        }

        // 2) Parse incoming JSON from the client
        const body = await request.json();
        const {
            text,
            model = "tts-1",
            voice = "alloy",
            response_format = "mp3",
            speed = 1,
            stream = false,
        } = body || {};

        if (!text || typeof text !== "string") {
            console.warn("Invalid or missing 'text' parameter:", body);
            return NextResponse.json(
                { error: "Bad request: 'text' is required" },
                { status: 400 }
            );
        }

        // 3) Optional fetch timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        // 4) Forward to your external TTS
        //    (Adjust endpoint if your TTS is at a different path.)
        const externalRes = await fetch(`${API_URL}/api/v1/speech/tts`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${BEARER_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                text,
                model,
                voice,
                response_format,
                speed,
                stream,
            }),
            signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!externalRes.ok) {
            const errorText = await externalRes.text();
            console.error("Error from external TTS API:", errorText);
            return NextResponse.json(
                { error: `External TTS API error: ${errorText}` },
                { status: externalRes.status }
            );
        }

        // 5) Check response content type
        const contentType = externalRes.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
            // 6A) TTS returned JSON
            const jsonData = await externalRes.json();
            console.log("TTS API returned JSON:", jsonData);

            // Optionally include file_name if the JSON is actually audio metadata, etc.
            return NextResponse.json({
                ...jsonData,
            });
        } else {
            // 6B) TTS returned binary data => read as arrayBuffer, base64-encode
            const arrayBuffer = await externalRes.arrayBuffer();
            const base64Audio = Buffer.from(arrayBuffer).toString("base64");

            console.log("TTS API returned binary. Encoded to base64.");

            return NextResponse.json({
                audio_data: base64Audio,
                content_type: contentType
            });
        }
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            console.error("TTS request timed out");
            return NextResponse.json({ error: "Request timed out" }, { status: 504 });
        }

        console.error("Unhandled TTS server error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
