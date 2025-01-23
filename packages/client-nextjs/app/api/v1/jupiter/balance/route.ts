import { API_URL, BEARER_TOKEN } from "@/lib/serverConstants";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        console.log("[API ROUTE] Incoming request to Jupiter API Proxy");

        // Extract the endpoint from the URL
        const urlParts = request.url.split("/");
        const endpoint = urlParts[urlParts.length - 1];
        console.log(`[API ROUTE] Extracted endpoint: ${endpoint}`);

        const body = await request.json();
        console.log(`[API ROUTE] Parsed request body:`, body);

        // Validate the endpoint
        const validEndpoints = [
            "buy",
            "swap",
            "token_data",
            "balance",
            "price",
        ];
        if (!validEndpoints.includes(endpoint)) {
            console.error(`[API ROUTE] Invalid endpoint: ${endpoint}`);
            return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 });
        }

        // Construct the full API URL
        const apiEndpoint = `${API_URL.replace(/\/?$/, "/")}api/v1/jupiter/${endpoint}`;
        console.log(`[API ROUTE] Forwarding request to: ${apiEndpoint}`);

        // Forward the request to the external API
        const response = await fetch(apiEndpoint, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${BEARER_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        console.log(`[API ROUTE] Response status from external API: ${response.status}`);
        const contentType = response.headers.get("content-type");
        console.log(`[API ROUTE] Response content-type: ${contentType}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[API ROUTE] Error response from API:`, errorText);
            return NextResponse.json({ error: errorText || "Request failed" }, { status: response.status });
        }

        const data = await response.json();
        console.log(`[API ROUTE] Successful response from API:`, data);

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error(`[API ROUTE] Error in API route:`, error);
        return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
    }
}
