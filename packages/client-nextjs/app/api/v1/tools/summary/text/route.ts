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
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        const { searchParams } = new URL(request.url);
        const textParam = searchParams.get("text");
        if (!textParam) {
            return NextResponse.json({ error: "Missing 'text' query param" }, { status: 400 });
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        // External GET /api/v1/summarize/text?text=...
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

        if (!externalRes.ok) {
            const errTxt = await externalRes.text();
            return NextResponse.json(
                { error: `External Summarize-Text GET error: ${errTxt}` },
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
