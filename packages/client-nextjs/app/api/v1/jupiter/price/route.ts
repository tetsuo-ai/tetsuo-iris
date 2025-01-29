import { API_URL, BEARER_TOKEN } from "@/lib/serverConstants";
import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";

export async function POST(request: Request) {
    try {
        console.log("[API ROUTE] Incoming request to Jupiter API Proxy (Price)");

        const body = await request.json();
        console.log(`[API ROUTE] Parsed request body:`, body);

        let { contractAddresses } = body;

        if (!Array.isArray(contractAddresses) || contractAddresses.length === 0) {
            console.error("[API ROUTE] Missing or invalid contract addresses");
            return NextResponse.json({ error: "Missing or invalid contract addresses" }, { status: 400 });
        }

        // Validate each Base58 address
        for (const address of contractAddresses) {
            try {
                new PublicKey(address);
            } catch (error) {
                console.error("[API ROUTE] Invalid Base58 address:", address, error);
                return NextResponse.json({ error: `Invalid Base58 address: ${address}` }, { status: 400 });
            }
        }

        let prices: { [key: string]: string } = {};

        // Fetch price for each contract individually
        for (const contractAddress of contractAddresses) {
            console.log(`[API ROUTE] Fetching price for contract: ${contractAddress}`);

            const response = await fetch(`${API_URL}/api/v1/jupiter/price`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${BEARER_TOKEN}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ ca: contractAddress }), // Fix: Send single string
            });

            console.log(`[API ROUTE] Response status from external API: ${response.status}`);
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[API ROUTE] Error fetching price for ${contractAddress}:`, errorText);
                continue;
            }

            const data = await response.json();
            prices[contractAddress] = data?.price || "N/A";
        }

        console.log(`[API ROUTE] Final Price Data:`, prices);
        return NextResponse.json(prices, { status: 200 });

    } catch (error) {
        console.error(`[API ROUTE] Error in Price API route:`, error);
        return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
    }
}
