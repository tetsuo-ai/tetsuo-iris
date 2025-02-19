import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        // Parse query parameters from the URL
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q") || "";
        const limit = searchParams.get("limit") || "25";

        // Get the Giphy API key from environment variables.
        // (Ensure you have set GIPHY_API_KEY on your server; do not prefix with NEXT_PUBLIC_ so it remains secret.)
        const GIPHY_API_KEY = process.env.GIPHY_KEY;
        if (!GIPHY_API_KEY) {
            throw new Error("Missing GIPHY_API_KEY in environment variables.");
        }

        // Build the endpoint URL
        const endpoint =
            query.trim() === ""
                ? `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=${limit}`
                : `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&limit=${limit}&q=${encodeURIComponent(
                    query
                )}`;

        const res = await fetch(endpoint);
        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json(
                { error: data.message || "Failed to fetch GIFs" },
                { status: res.status }
            );
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
