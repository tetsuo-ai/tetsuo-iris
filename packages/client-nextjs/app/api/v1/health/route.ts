import { API_URL, BEARER_TOKEN } from "@/lib/serverConstants";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        // Validate critical environment variables
        if (!API_URL || !BEARER_TOKEN) {
            throw new Error("Missing API_URL or BEARER_TOKEN");
        }

        const body = await request.json();
        const { endpoint, method } = body;

        if (!endpoint || !method) {
            return NextResponse.json(
                { error: "Endpoint and method are required" },
                { status: 400 }
            );
        }

        // Construct the health-check URL
        const healthCheckUrl = `${API_URL.replace(/\/?$/, "/")}health`;
        console.log("Forwarding health check request to:", healthCheckUrl);

        // Prepare fetch options for the health check
        const fetchOptions: RequestInit = {
            method: "GET",
            headers: {
                Authorization: `Bearer ${BEARER_TOKEN}`,
                "Content-Type": "application/json",
            },
        };

        // Send the health check request to the health endpoint
        const response = await fetch(healthCheckUrl, fetchOptions);

        console.log("Response status from health endpoint:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Error response from health endpoint:", errorText);
            return NextResponse.json({ error: errorText }, { status: response.status });
        }

        const healthData = await response.json();
        console.log("Health check data:", healthData);

        // Attach specific information about the endpoint being checked
        const healthInfo = {
            endpoint,
            method,
            healthData,
        };

        return NextResponse.json(healthInfo, { status: 200 });
    } catch (error) {
        console.error("Error in /api/v1/health-check route:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unexpected server error" },
            { status: 500 }
        );
    }
}
