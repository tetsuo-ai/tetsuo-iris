import { API_URL, BEARER_TOKEN } from "@/lib/serverConstants";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        // Validate critical environment variables
        if (!API_URL || !BEARER_TOKEN) {
            throw new Error("Missing API_URL or BEARER_TOKEN");
        }

        const body = await request.json();
        const { endpoint, ...params } = body;

        if (!endpoint) {
            return NextResponse.json({ error: "Endpoint is required" }, { status: 400 });
        }

        // Debugging the request payload
        console.log("API Payload:", { endpoint, params });

        // Construct query parameters for GET requests
        const queryString = new URLSearchParams(params).toString();
        const url = `${API_URL}/api/v1/websearch/${endpoint}?${queryString}`;

        // Add timeout to fetch
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000); // 5-second timeout

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${BEARER_TOKEN}`,
            },
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

        console.error("Error in search API route:", error);
        return NextResponse.json(
            { error: "Failed to fetch data" },
            { status: 500 }
        );
    }
}
