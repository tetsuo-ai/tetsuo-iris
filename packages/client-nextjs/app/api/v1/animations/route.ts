import { API_URL, BEARER_TOKEN } from "@/lib/serverConstants";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        console.log("Parsing FormData from request...");
        const formData = await request.formData();

        // Extract data from FormData
        const file = formData.get("file");
        const gValues = formData.get("g_values");
        const bValues = formData.get("b_values");
        const frames = formData.get("frames");
        const impact = formData.get("impact");

        // Validate required fields
        if (!file || !gValues || !bValues || !impact) {
            console.warn("Missing required fields in the request body.");
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        console.log("Preparing FormData for the external API...");
        const apiFormData = new FormData();
        apiFormData.append("file", file);
        apiFormData.append("g_values", gValues);
        apiFormData.append("b_values", bValues);
        if (frames) apiFormData.append("frames", frames.toString());
        apiFormData.append("impact", impact);

        // Ensure the API_URL has a trailing slash
        const endpoint = `${API_URL.replace(/\/?$/, "/")}api/v1/animations/rgb`;

        console.log("Forwarding request to external API:", endpoint);

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${BEARER_TOKEN}`,
            },
            body: apiFormData,
        });

        console.log("Response status from external API:", response.status);

        const contentType = response.headers.get("content-type");

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Error response from API:", errorText);
            return NextResponse.json({ error: "Failed to generate animation" }, { status: response.status });
        }

        if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            console.log("JSON response from external API:", data);
            return NextResponse.json(data, { status: 200 });
        } else if (contentType && contentType.startsWith("image/")) {
            const arrayBuffer = await response.arrayBuffer();
            console.log("Binary response (image) received.");
            return new NextResponse(arrayBuffer, {
                headers: {
                    "Content-Type": contentType,
                    "Content-Disposition": `inline; filename="animation_output"`,
                },
            });
        } else if (contentType && contentType === "video/mp4") {
            const arrayBuffer = await response.arrayBuffer();
            console.log("Binary response (video) received.");
            return new NextResponse(arrayBuffer, {
                headers: {
                    "Content-Type": contentType,
                    "Content-Disposition": `inline; filename="animation.mp4"`,
                },
            });
        } else {
            console.warn("Unexpected content type:", contentType);
            return NextResponse.json({ error: "Unexpected response format from API" }, { status: 500 });
        }
    } catch (error) {
        console.error("Error in /api/v1/animations route:", error);
        return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
    }
}
