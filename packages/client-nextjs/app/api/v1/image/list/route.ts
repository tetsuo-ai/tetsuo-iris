import { API_URL, BEARER_TOKEN } from "@/lib/serverConstants";
import { NextResponse } from "next/server";

export const GET = async (request: Request) => {
    try {
        console.log("Validating environment variables...");
        if (!API_URL || !BEARER_TOKEN) {
            throw new Error("Missing API_URL or BEARER_TOKEN");
        }

        const endpoint = `${API_URL}/api/v1/image/list`; // Assuming this is the correct endpoint
        console.log(`Fetching from: ${endpoint}`);

        const response = await fetch(endpoint, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${BEARER_TOKEN}`,
                Accept: "application/json",
            },
        });

        const contentType = response.headers.get("content-type") || "";
        console.log(`Response Content-Type: ${contentType}`);
        console.log(`Response Status: ${response.status}`);

        // Log the full response body
        const responseBody = await response.text();
        console.log(`Raw Response Body: ${responseBody}`);

        if (!contentType.includes("application/json")) {
            console.error("Unexpected response format:", contentType);
            return NextResponse.json(
                {
                    error: `Unexpected response format: ${contentType}`,
                    details: responseBody,
                },
                { status: 500 }
            );
        }

        if (!response.ok) {
            console.error("Error response from API:", responseBody);
            return NextResponse.json(
                { error: "Failed to fetch data from external API" },
                { status: response.status }
            );
        }

        const data = JSON.parse(responseBody); // Parsing the JSON response
        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error("Error fetching image data:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
};
