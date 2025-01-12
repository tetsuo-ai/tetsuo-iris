import { API_URL, BEARER_TOKEN } from "@/lib/serverConstants";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Validate critical environment variables
    if (!API_URL || !BEARER_TOKEN) {
      throw new Error("Missing API_URL or BEARER_TOKEN");
    }

    const body = await request.json();
    const { chatType, chatCompletionRequest } = body;

    if (!chatType || !chatCompletionRequest) {
      console.warn("Invalid request body:", body);
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }

    // Add timeout to fetch
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5-second timeout

    const response = await fetch(`${API_URL}/api/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${BEARER_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chatCompletionRequest),
      signal: controller.signal,
    });

    clearTimeout(timeout); // Clear the timeout once request completes

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response from API:", errorText);

      if (response.status === 404) {
        return NextResponse.json(
          { error: "Endpoint not found" },
          { status: 404 }
        );
      }

      throw new Error(`API call failed: ${response.statusText} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error("API response has no body");
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        try {
          const text = decoder.decode(chunk, { stream: true });
          const lines = text.split("\n");

          for (const line of lines) {
            if (line.trim() === "") continue;
            if (line.includes("[DONE]")) {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              continue;
            }

            const jsonString = line.replace(/^data: /, "").trim();
            if (!jsonString) continue;

            try {
              JSON.parse(jsonString); // Validate JSON
              controller.enqueue(encoder.encode(`data: ${jsonString}\n\n`));
            } catch (e) {
              console.warn("Invalid JSON chunk:", jsonString, e);
            }
          }
        } catch (e) {
          console.error("Error processing stream chunk:", e);
        }
      },
    });

    return new Response(response.body.pipeThrough(transformStream), {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("Request timed out");
      return NextResponse.json(
        { error: "Request timed out" },
        { status: 504 }
      );
    }

    console.error("Error in chat completion:", error);
    return NextResponse.json(
      { error: "Failed to process chat completion" },
      { status: 500 }
    );
  }
}
