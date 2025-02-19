import { API_URL, BEARER_TOKEN } from "@/lib/serverConstants";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        console.log("Parsing FormData from request...");
        const formData = await request.formData();

        // Extract data from FormData
        let file = formData.get("file"); // may be empty
        const gValues = formData.get("g_values");
        const bValues = formData.get("b_values");
        const frames = formData.get("frames");
        const impact = formData.get("impact");
        const urlField = formData.get("url"); // optional URL field

        // Validate required fields (file, g_values, b_values, impact)
        if ((!file || (file instanceof File && file.size === 0)) && !urlField) {
            console.warn("Missing file and no URL provided in the request body.");
            return NextResponse.json({ error: "Missing required file or URL" }, { status: 400 });
        }
        if (!gValues || !bValues || !impact) {
            console.warn("Missing required fields in the request body.");
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // If file is missing or empty and URL is provided, fetch file data server‑side
        if ((!file || (file instanceof File && file.size === 0)) && urlField) {
            const url = new URL(urlField.toString());
            console.log("File is empty—fetching file from URL on server:", url.toString());
            const fetchedResponse = await fetch(url.toString());
            if (!fetchedResponse.ok) {
                console.error("Failed to fetch file from URL", url.toString());
                return NextResponse.json({ error: "Could not fetch file from provided URL" }, { status: 400 });
            }
            const buffer = await fetchedResponse.arrayBuffer();
            const contentType = fetchedResponse.headers.get("content-type") || "application/octet-stream";
            // Create a new File (or Blob) from the buffer
            file = new File([buffer], url.pathname.split("/").pop() || "imported_file", { type: contentType });
        }

        console.log("Preparing FormData for the external API...");
        const apiFormData = new FormData();
        apiFormData.append("file", file as Blob);
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
        const contentTypeResponse = response.headers.get("content-type");

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Error response from API:", errorText);
            return NextResponse.json({ error: "Failed to generate animation" }, { status: response.status });
        }

        if (contentTypeResponse && contentTypeResponse.includes("application/json")) {
            const data = await response.json();
            console.log("JSON response from external API:", data);
            return NextResponse.json(data, { status: 200 });
        } else if (contentTypeResponse && contentTypeResponse.startsWith("image/")) {
            const arrayBuffer = await response.arrayBuffer();
            console.log("Binary response (image) received.");
            return new NextResponse(arrayBuffer, {
                headers: {
                    "Content-Type": contentTypeResponse,
                    "Content-Disposition": `inline; filename="animation_output"`,
                },
            });
        } else if (contentTypeResponse && contentTypeResponse === "video/mp4") {
            const arrayBuffer = await response.arrayBuffer();
            console.log("Binary response (video) received.");
            return new NextResponse(arrayBuffer, {
                headers: {
                    "Content-Type": contentTypeResponse,
                    "Content-Disposition": `inline; filename="animation.mp4"`,
                },
            });
        } else {
            console.warn("Unexpected content type:", contentTypeResponse);
            return NextResponse.json({ error: "Unexpected response format from API" }, { status: 500 });
        }
    } catch (error) {
        console.error("Error in /api/v1/animations route:", error);
        return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
    }
}
