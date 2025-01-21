import { API_URL, BEARER_TOKEN } from "@/lib/serverConstants";
import { NextResponse } from "next/server";

export const GET = async (request: Request) => {
    try {
        if (!API_URL || !BEARER_TOKEN) {
            throw new Error("Missing API_URL or BEARER_TOKEN");
        }

        const endpoint = `${API_URL}/api/v1/image/meme`;
        const response = await fetch(endpoint, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${BEARER_TOKEN}`,
                Accept: "image/webp",
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json(
                { error: "Failed to fetch meme", details: errorText },
                { status: response.status }
            );
        }

        return new Response(response.body, {
            headers: { "Content-Type": "image/webp" },
            status: 200,
        });
    } catch (error) {
        if (error instanceof Error) {
            return NextResponse.json(
                { error: "Internal server error", details: error.message },
                { status: 500 }
            );
        } else {
            return NextResponse.json(
                { error: "Internal server error", details: "Unknown error" },
                { status: 500 }
            );
        }
    }
}
