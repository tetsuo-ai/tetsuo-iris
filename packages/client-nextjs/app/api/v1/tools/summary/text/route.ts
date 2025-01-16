import { API_URL, BEARER_TOKEN } from "@/lib/serverConstants";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET or POST /api/v1/tools/summary/text
 * -> Forwards to external Tetsuo Summarize Text:
 *    GET  /api/v1/summarize/text?text=...
 *    POST /api/v1/summarize/text with { text, max_length }
 */
export async function GET(request: NextRequest) {
    try {
        if (!API_URL || !BEARER_TOKEN) {
            console.error("API_URL or BEARER_TOKEN missing.");
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        const { searchParams } = new URL(request.url);
        const textParam = searchParams.get("text");

        // Validate input text
        if (!textParam || textParam.length > 500) {
            console.error("Invalid 'text' query parameter:", textParam);
            return NextResponse.json(
                { error: "Invalid 'text' query parameter. Maximum length is 500 characters." },
                { status: 400 }
            );
        }

        console.log("Forwarding GET request to external API:", {
            url: `${API_URL}/api/v1/summarize/text?text=${textParam}`,
        });

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const externalRes = await fetch(
            `${API_URL}/api/v1/summarize/text?text=${encodeURIComponent(textParam)}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${BEARER_TOKEN}`,
                },
                signal: controller.signal,
            }
        );

        clearTimeout(timeout);

        console.log("External API Response Status:", externalRes.status);
        const responseText = await externalRes.text();
        console.log("External API Response Body:", responseText);

        if (!externalRes.ok) {
            return NextResponse.json(
                { error: `External Summarize-Text GET error: ${responseText}` },
                { status: externalRes.status }
            );
        }

        const data = JSON.parse(responseText);
        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            console.error("Request timed out.");
            return NextResponse.json({ error: "Request timed out" }, { status: 504 });
        }
        console.error("Unexpected server error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        if (!API_URL || !BEARER_TOKEN) {
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        const body = await request.json();
        const { text, max_length } = body || {};

        if (!text || typeof text !== "string") {
            return NextResponse.json({ error: "Bad request: 'text' is required" }, { status: 400 });
        }
        const safeLen = typeof max_length === "number" ? max_length : 500;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        // External POST /api/v1/summarize/text
        const externalRes = await fetch(`${API_URL}/api/v1/summarize/text`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${BEARER_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ text, max_length: safeLen }),
            signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!externalRes.ok) {
            const errTxt = await externalRes.text();
            return NextResponse.json(
                { error: `External Summarize-Text POST error: ${errTxt}` },
                { status: externalRes.status }
            );
        }

        const data = await externalRes.json();
        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            return NextResponse.json({ error: "Request timed out" }, { status: 504 });
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
