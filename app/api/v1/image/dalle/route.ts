import { API_URL, BEARER_TOKEN } from "@/lib/serverConstants";
import { NextResponse } from "next/server";

export const POST = async (request: Request) => {
    try {
        console.log("Validating environment variables...");
        // Validate critical environment variables
        if (!API_URL || !BEARER_TOKEN) {
            throw new Error("Missing API_URL or BEARER_TOKEN");
        }

        console.log("Parsing request body...");
        const body = await request.json();
        const { prompt, model, size, quality, style, response_format, n } = body;

        console.log("Request body:", body);

        // Validate required fields
        if (!prompt || !model || !size || !quality || !style || !response_format || !n) {
            console.warn("Missing required fields in request body.");
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Construct the endpoint for DALL-E API
        const endpoint = `${API_URL}api/v1/image/dalle`;

        console.log("API endpoint:", endpoint);

        console.log("Sending request to external API...");
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${BEARER_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                prompt,
                model,
                size,
                quality,
                style,
                response_format,
                n,
            }),
        });

        console.log("Response status:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Error response from API:", errorText);

            if (response.status === 404) {
                console.warn("API endpoint not found.");
                return NextResponse.json(
                    { error: "Endpoint not found" },
                    { status: 404 }
                );
            }

            throw new Error(`API call failed: ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        console.log("API Response Data:", data);

        // Extract the URL from the response
        if (response_format === "url" && typeof data === "object" && data.url) {
            console.log("Successfully retrieved image URL:", data.url);
            return NextResponse.json({ imageUrl: data.url }, { status: 200 });
        }

        console.warn("Unexpected response format from API:", data);
        // If unexpected response, return an error
        return NextResponse.json(
            { error: "Unexpected response format from API" },
            { status: 500 }
        );
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            console.error("Request timed out");
            return NextResponse.json(
                { error: "Request timed out" },
                { status: 504 }
            );
        }

        console.error("Error in DALL-E image generation:", error);
        return NextResponse.json(
            { error: "Failed to generate DALL-E image" },
            { status: 500 }
        );
    }
};
