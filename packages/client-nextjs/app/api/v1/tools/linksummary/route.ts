import { API_URL, BEARER_TOKEN } from "@/lib/serverConstants";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        // Validate critical environment variables
        if (!API_URL || !BEARER_TOKEN) {
            console.error("Missing API_URL or BEARER_TOKEN");
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        const body = await request.json();
        const { url, max_length } = body;

        if (!url || typeof max_length !== "number") {
            console.warn("Invalid request body:", body);
            return NextResponse.json({ error: "Bad request" }, { status: 400 });
        }

        // Add timeout to fetch
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000); // 5-second timeout

        const response = await fetch(`${API_URL}/api/v1/summarize/url`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${BEARER_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ url, max_length }),
            signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Error response from external API:", errorText);
            return NextResponse.json(
                { error: `External API error: ${errorText}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        console.log("API Response Data:", data);

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            console.error("Request timed out");
            return NextResponse.json({ error: "Request timed out" }, { status: 504 });
        }

        console.error("Unhandled server error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
