import { API_URL, BEARER_TOKEN } from "@/lib/serverConstants";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        console.log("[API ROUTE] Incoming request to Jupiter API Proxy (Swap)");

        const body = await request.json();
        console.log(`[API ROUTE] Parsed request body:`, body);

        let { source, target, amount } = body;

        if (!source || !target || !amount) {
            console.error("[API ROUTE] Missing required fields");
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Ensure correct format for the API
        const enrichedBody = {
            source,
            target,
            amount: Number(amount),
        };

        console.log("[API ROUTE] Enriched request body:", enrichedBody);

        // Forward request to Jupiter API
        const apiEndpoint = `${API_URL}/api/v1/jupiter/swap`;
        console.log(`[API ROUTE] Forwarding request to: ${apiEndpoint}`);

        const response = await fetch(apiEndpoint, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${BEARER_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(enrichedBody),
        });

        console.log(`[API ROUTE] Response status from external API: ${response.status}`);
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[API ROUTE] Error response from API:`, errorText);
            return NextResponse.json({ error: errorText || "Request failed" }, { status: response.status });
        }

        const data = await response.json();
        console.log(`[API ROUTE] Successful response from API:`, data);
        return NextResponse.json(data, { status: response.status });

    } catch (error) {
        console.error(`[API ROUTE] Error in Swap API route:`, error);
        return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
    }
}
