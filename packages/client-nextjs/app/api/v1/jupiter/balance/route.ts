import { API_URL, BEARER_TOKEN } from "@/lib/serverConstants";
import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";

export async function POST(request: Request) {
    try {
        console.log("[API ROUTE] Incoming request to Jupiter API Proxy (Balance)");

        const body = await request.json();
        console.log(`[API ROUTE] Parsed request body:`, body);

        const { walletAddress } = body;

        if (!walletAddress) {
            console.error("[API ROUTE] Missing wallet address");
            return NextResponse.json({ error: "Missing wallet address" }, { status: 400 });
        }

        // Validate Base58 Wallet Address
        try {
            new PublicKey(walletAddress);
        } catch (error) {
            console.error("[API ROUTE] Invalid Base58 wallet address:", error);
            return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
        }

        // Forward request to Jupiter API (renaming `walletAddress` to `wallet`)
        const apiEndpoint = `${API_URL}/api/v1/jupiter/balance`;
        console.log(`[API ROUTE] Fetching balance for wallet: ${walletAddress}`);

        const response = await fetch(apiEndpoint, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${BEARER_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ wallet: walletAddress }), // Fix field name
        });

        console.log(`[API ROUTE] Response status from external API: ${response.status}`);
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[API ROUTE] Error fetching balance:`, errorText);
            return NextResponse.json({ error: errorText || "Request failed" }, { status: response.status });
        }

        const data = await response.json();
        console.log(`[API ROUTE] Balance data:`, data);
        return NextResponse.json(data, { status: response.status });

    } catch (error) {
        console.error(`[API ROUTE] Error in Balance API route:`, error);
        return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
    }
}
