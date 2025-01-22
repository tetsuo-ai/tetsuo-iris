import { API_URL, BEARER_TOKEN } from "@/lib/serverConstants";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        console.log("Parsing JSON body from request...");
        const body = await request.json();

        // Extract the URL from the body
        const { url } = body;

        // Validate required fields
        if (!url) {
            console.warn("Missing required fields: url.");
            return NextResponse.json({ error: "Missing required field: url" }, { status: 400 });
        }

        console.log("Preparing payload for the external API...");
        const payload = JSON.stringify({ url });

        // Ensure the API_URL has a trailing slash
        const endpoint = `${API_URL.replace(/\/?$/, "/")}api/v1/video/kensub`;

        console.log("Forwarding request to external API:", endpoint);

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${BEARER_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: payload,
        });

        console.log("Response status from external API:", response.status);

        const contentType = response.headers.get("content-type");

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Error response from API:", errorText);
            return NextResponse.json({ error: "Failed to process Kensub request" }, { status: response.status });
        }

        if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            console.log("JSON response from external API:", data);
            return NextResponse.json(data, { status: 200 });
        } else if (contentType && contentType === "video/mp4") {
            const arrayBuffer = await response.arrayBuffer();
            console.log("Binary response (video) received.");
            return new NextResponse(arrayBuffer, {
                headers: {
                    "Content-Type": contentType,
                    "Content-Disposition": `inline; filename="kensub_output.mp4"`,
                },
            });
        } else {
            console.warn("Unexpected content type:", contentType);
            return NextResponse.json({ error: "Unexpected response format from API" }, { status: 500 });
        }
    } catch (error) {
        console.error("Error in /api/v1/video/kensub route:", error);
        return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
    }
}
