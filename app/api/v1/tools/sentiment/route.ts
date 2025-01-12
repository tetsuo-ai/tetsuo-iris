import { API_URL, BEARER_TOKEN } from "@/lib/serverConstants";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        // Validate critical environment variables
        if (!API_URL || !BEARER_TOKEN) {
            throw new Error("Missing API_URL or BEARER_TOKEN");
        }

        const body = await request.json();
        const { text } = body;

        if (!text) {
            console.warn("Invalid request body:", body);
            return NextResponse.json({ error: "Bad request" }, { status: 400 });
        }

        // Add timeout to fetch
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000); // 5-second timeout

        const response = await fetch(`${API_URL}/api/v1/sentiment/text`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${BEARER_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ text }),
            signal: controller.signal,
        });

        clearTimeout(timeout); // Clear the timeout once request completes

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Error response from API:", errorText);

            if (response.status === 404) {
                return NextResponse.json(
                    { error: "Endpoint not found" },
                    { status: 404 }
                );
            }

            throw new Error(`API call failed: ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        console.log("API Response Data:", data);

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            console.error("Request timed out");
            return NextResponse.json(
                { error: "Request timed out" },
                { status: 504 }
            );
        }

        console.error("Error in sentiment analysis:", error);
        return NextResponse.json(
            { error: "Failed to analyze sentiment" },
            { status: 500 }
        );
    }
}
