import { API_URL, BEARER_TOKEN } from "@/lib/serverConstants";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    if (!API_URL || !BEARER_TOKEN) {
      throw new Error("Missing API_URL or BEARER_TOKEN");
    }

    console.log("Requesting URL:", `${API_URL}/api/v1/whales/transactions`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${API_URL}/api/v1/whales/transactions`, {
      headers: {
        Authorization: `Bearer ${BEARER_TOKEN}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response from API:", errorText);

      if (response.status === 404) {
        return NextResponse.json(
          { error: "The requested resource was not found on the server" },
          { status: 404 }
        );
      }

      throw new Error(`API call failed: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    if (!data) {
      throw new Error("API returned an empty response");
    }

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("Request timed out");
      return NextResponse.json(
        { error: "Request timed out" },
        { status: 504 }
      );
    }

    console.error("Error fetching whale transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch whale transactions" },
      { status: 500 }
    );
  }
}
