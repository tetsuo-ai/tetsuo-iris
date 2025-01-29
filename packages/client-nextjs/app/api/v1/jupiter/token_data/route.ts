import { API_URL, BEARER_TOKEN } from "@/lib/serverConstants";
import { NextResponse } from "next/server";

// Default image for TETSUO (site logo)
const TETSUO_IMAGE = "/images/logo.webp";

// Fallback image for other tokens (if necessary)
const DEFAULT_IMAGE = "/images/default-token.png";

export async function POST(request: Request) {
    try {
        console.log("[API ROUTE] Incoming request to Jupiter API Proxy (Token Data)");

        const body = await request.json();
        console.log(`[API ROUTE] Parsed request body:`, body);

        let { ticker, address } = body;

        if (!ticker || !address) {
            console.error("[API ROUTE] Missing required fields");
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        let tokenData: { [key: string]: any } = {};

        // Directly assign TETSUO's image as the site logo
        if (address === "8i51XNNpGaKaj4G4nDdmQh95v4FKAxw8mhtaRoKd9tE8") {
            tokenData[address] = {
                name: "TETSUO",
                symbol: "TETSUO",
                image: TETSUO_IMAGE,
            };
            console.log(`[API ROUTE] Using site logo for TETSUO.`);
            return NextResponse.json(tokenData, { status: 200 });
        }

        try {
            // Fetch token metadata from Metaplex
            console.log(`[API ROUTE] Fetching metadata for: ${address}`);
            const response = await fetch(`${API_URL}/api/v1/jupiter/token_metadata`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${BEARER_TOKEN}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ address }),
            });

            console.log(`[API ROUTE] Response status from Metaplex: ${response.status}`);

            if (!response.ok) {
                console.warn(`[WARNING] Metadata not found for ${address}. Using fallback.`);
                tokenData[address] = {
                    name: ticker || "Unknown Token",
                    symbol: ticker || "???",
                    image: DEFAULT_IMAGE, // Default fallback
                };
                return NextResponse.json(tokenData, { status: 200 });
            }

            const metadata = await response.json();
            tokenData[address] = {
                name: metadata?.data?.name || ticker || "Unknown Token",
                symbol: metadata?.data?.symbol || ticker || "???",
                image: DEFAULT_IMAGE, // No need to fetch from IPFS, just use default
            };

        } catch (error) {
            console.error(`[ERROR] Fetching metadata for ${address}:`, error);
            tokenData[address] = {
                name: ticker || "Unknown Token",
                symbol: ticker || "???",
                image: DEFAULT_IMAGE,
            };
        }

        console.log(`[API ROUTE] Final Token Data:`, tokenData);
        return NextResponse.json(tokenData, { status: 200 });

    } catch (error) {
        console.error(`[API ROUTE] Error in Token Data API route:`, error);
        return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
    }
}
