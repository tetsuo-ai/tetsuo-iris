import { API_URL, BEARER_TOKEN } from "@/lib/serverConstants";
import { NextResponse } from "next/server";

/**
 * POST /api/v1/tools/urlsummary
 * -> Forwards to external POST /api/v1/summarize/url
 *    with { url, max_length } in the JSON body.
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

        // 2) Read { url, max_length }
        const body = await request.json();
        const { url, max_length } = body;

        if (!url || typeof max_length !== "number") {
            console.warn("Invalid request body:", body);
            return NextResponse.json({ error: "Bad request" }, { status: 400 });
        }

        // 3) Timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        // 4) Forward to external POST /api/v1/summarize/url
        const externalRes = await fetch(`${API_URL}/api/v1/summarize/url`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${BEARER_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ url, max_length }),
            signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!externalRes.ok) {
            const errorText = await externalRes.text();
            console.error("Error from Summarize URL API:", errorText);
            return NextResponse.json(
                { error: `External API error: ${errorText}` },
                { status: externalRes.status }
            );
        }

        const data = await externalRes.json();
        console.log("Summarize URL response:", data);

        // 5) Possibly a string or object
        if (typeof data === "string") {
            // Wrap it in { summary: data }
            return NextResponse.json({ summary: data }, { status: 200 });
        }
        // Otherwise assume data is { summary: ... } or something
        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            console.error("URL Summarize request timed out");
            return NextResponse.json({ error: "Request timed out" }, { status: 504 });
        }
        console.error("Unhandled URL Summarize error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
