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

        const response = await fetch(`${API_URL}/api/v1/${endpoint}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${BEARER_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(params),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json(
                { error: `API Error: ${errorText}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
