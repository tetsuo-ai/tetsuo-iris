"use client";

import { FC, ReactNode, useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import Logo from "@/app/images/logo.webp";
import { ThemeDropdown } from "./ThemeDropdown";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

const TETSUO_CONTRACT = "8i51XNNpGaKaj4G4nDdmQh95v4FKAxw8mhtaRoKd9tE8";
const SOL_CONTRACT = "So11111111111111111111111111111111111111112";
const RAYDIUM_SWAP_API = "https://transaction-v1.raydium.io/compute/swap-base-in";
const JUPITER_PRICE_API = "/api/v1/jupiter/price";
const JUPITER_BALANCE_API = "/api/v1/jupiter/balance";

const SOL_ICON = "https://cryptologos.cc/logos/solana-sol-logo.png";
const TETSUO_ICON = Logo.src;

export const Layout: FC<{ children: ReactNode }> = ({ children }) => {
  const { publicKey } = useWallet();
  const [priceData, setPriceData] = useState<{ [key: string]: string }>({});
  const [balance, setBalance] = useState<string | null>(null);
  const [buyOpen, setBuyOpen] = useState(false);
  const [swapOpen, setSwapOpen] = useState(false);
  const [buyAmount, setBuyAmount] = useState("");
  const [swapAmount, setSwapAmount] = useState("");
  const [swapFromContract, setSwapFromContract] = useState(TETSUO_CONTRACT);
  const [validContract, setValidContract] = useState(false);
  const [provider, setProvider] = useState<"Jupiter" | "Raydium">("Raydium");
  const [estimatedTetsuo, setEstimatedTetsuo] = useState({ tokens: "N/A", usd: "N/A" });
  const [estimatedSwap, setEstimatedSwap] = useState({ tokens: "N/A", usd: "N/A" });
const fetchPrices = async () => {
    try {
        const priceRes = await fetch(JUPITER_PRICE_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contractAddresses: [TETSUO_CONTRACT, swapFromContract, SOL_CONTRACT] }),
        });

        const balanceRes = await fetch(JUPITER_BALANCE_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ wallet: publicKey?.toString() }),
        });

        const priceData = await priceRes.json();
        const balanceData = await balanceRes.json();

        console.log("[API RESPONSE] Prices:", priceData);
        console.log("[API RESPONSE] Balance:", balanceData);

        setPriceData(priceData);
        setBalance(balanceData?.balance || "0");
        setValidContract(!!priceData[swapFromContract]);
    } catch (error) {
        console.error("Error fetching data:", error);
    }
};

useEffect(() => {
    if (publicKey) {
        fetchPrices();
    }
}, [publicKey, swapFromContract, provider]);

  useEffect(() => {
    const fetchBuyEstimate = async () => {
      if (!buyAmount) return setEstimatedTetsuo({ tokens: "N/A", usd: "N/A" });

      if (provider === "Raydium") {
        try {
          const res = await fetch(
            `${RAYDIUM_SWAP_API}?inputMint=${SOL_CONTRACT}&outputMint=${TETSUO_CONTRACT}&amount=${parseFloat(
              buyAmount
            ) * 1e9}&slippageBps=50&txVersion=V0`
          );
          const data = await res.json();
          if (data.success) {
            const tetsuoAmount = parseFloat(data.data.outputAmount) / 1e6; // Assuming TETSUO has 6 decimal places
            const usdValue = tetsuoAmount * parseFloat(priceData[TETSUO_CONTRACT]); // Corrected USD calculation

            setEstimatedTetsuo({
              tokens: tetsuoAmount.toFixed(6),
              usd: usdValue.toFixed(6),
            });
          } else {
            setEstimatedTetsuo({ tokens: "N/A", usd: "N/A" });
          }
        } catch (error) {
          console.error("Raydium estimation failed:", error);
          setEstimatedTetsuo({ tokens: "N/A", usd: "N/A" });
        }
      } else {
        if (!priceData[SOL_CONTRACT] || !priceData[TETSUO_CONTRACT]) return setEstimatedTetsuo({ tokens: "N/A", usd: "N/A" });

        const solToUsd = parseFloat(buyAmount) * parseFloat(priceData[SOL_CONTRACT]);
        const tetsuoTokens = solToUsd / parseFloat(priceData[TETSUO_CONTRACT]); // Fix token calculation
        const usdValue = tetsuoTokens * parseFloat(priceData[TETSUO_CONTRACT]); // Fix USD calculation

        setEstimatedTetsuo({
          tokens: tetsuoTokens.toFixed(6),
          usd: usdValue.toFixed(6),
        });
      }
    };

    fetchBuyEstimate();
  }, [buyAmount, provider, priceData]);

 const [tokenDecimals, setTokenDecimals] = useState<{ [key: string]: number }>({});

// Fetch token decimals from Raydium API or Solana RPC
const fetchTokenDecimals = async () => {
  try {
    const res = await fetch("https://api.raydium.io/v2/sdk/tokenList");
    const data = await res.json();
    const decimalsMap = data.reduce((acc: { [x: string]: any; }, token: { mint: string | number; decimals: any; }) => {
      acc[token.mint] = token.decimals;
      return acc;
    }, {});
    setTokenDecimals(decimalsMap);
  } catch (error) {
    console.error("Failed to fetch token decimals:", error);
  }
};

useEffect(() => {
  fetchTokenDecimals();
}, []);
  const SOL_DECIMALS = 9;
  const TETSUO_DECIMALS = 6;

  const getTokenDecimal = (tokenMint: string) => {
    if (tokenMint === SOL_CONTRACT) return SOL_DECIMALS;
    return tokenDecimals[tokenMint] || 6; // Default to 6 decimals if unknown
  };

  useEffect(() => {
    const fetchBuyEstimate = async () => {
      if (!buyAmount) return setEstimatedTetsuo({ tokens: "N/A", usd: "N/A" });

      const solAmountScaled = parseFloat(buyAmount) * 10 ** SOL_DECIMALS;

      if (provider === "Raydium") {
        try {
          const res = await fetch(
            `${RAYDIUM_SWAP_API}?inputMint=${SOL_CONTRACT}&outputMint=${TETSUO_CONTRACT}&amount=${solAmountScaled}&slippageBps=50&txVersion=V0`
          );
          const data = await res.json();
          if (data.success) {
            const tetsuoTokens = parseFloat(data.data.outputAmount) / 10 ** TETSUO_DECIMALS;
            const usdValue = parseFloat(buyAmount) * parseFloat(priceData[SOL_CONTRACT]);

            setEstimatedTetsuo({
              tokens: tetsuoTokens.toFixed(6),
              usd: usdValue.toFixed(6),
            });
          } else {
            setEstimatedTetsuo({ tokens: "N/A", usd: "N/A" });
          }
        } catch (error) {
          console.error("Raydium estimation failed:", error);
          setEstimatedTetsuo({ tokens: "N/A", usd: "N/A" });
        }
      } else {
        if (!priceData[SOL_CONTRACT] || !priceData[TETSUO_CONTRACT]) return setEstimatedTetsuo({ tokens: "N/A", usd: "N/A" });

        const solToUsd = parseFloat(buyAmount) * parseFloat(priceData[SOL_CONTRACT]);
        const tetsuoTokens = solToUsd / parseFloat(priceData[TETSUO_CONTRACT]);

        setEstimatedTetsuo({
          tokens: tetsuoTokens.toFixed(6),
          usd: solToUsd.toFixed(6),
        });
      }
    };

    fetchBuyEstimate();
  }, [buyAmount, provider, priceData]);

  useEffect(() => {
    const fetchSwapEstimate = async () => {
      if (!swapAmount) return setEstimatedSwap({ tokens: "N/A", usd: "N/A" });

      const tokenDecimals = getTokenDecimal(swapFromContract);
      const swapAmountScaled = parseFloat(swapAmount) * 10 ** tokenDecimals;

      if (provider === "Raydium") {
        try {
          const res = await fetch(
            `${RAYDIUM_SWAP_API}?inputMint=${swapFromContract}&outputMint=${TETSUO_CONTRACT}&amount=${swapAmountScaled}&slippageBps=50&txVersion=V0`
          );
          const data = await res.json();
          if (data.success) {
            const tetsuoTokens = parseFloat(data.data.outputAmount) / 10 ** TETSUO_DECIMALS;
            const usdValue = tetsuoTokens * parseFloat(priceData[TETSUO_CONTRACT]);

            setEstimatedSwap({
              tokens: tetsuoTokens.toFixed(6),
              usd: usdValue.toFixed(6),
            });
          } else {
            setEstimatedSwap({ tokens: "N/A", usd: "N/A" });
          }
        } catch (error) {
          console.error("Raydium swap estimation failed:", error);
          setEstimatedSwap({ tokens: "N/A", usd: "N/A" });
        }
      } else {
        if (!priceData[swapFromContract] || !priceData[TETSUO_CONTRACT]) return setEstimatedSwap({ tokens: "N/A", usd: "N/A" });

        const tokenToUsd = parseFloat(swapAmount) * parseFloat(priceData[swapFromContract]);
        const tetsuoTokens = tokenToUsd / parseFloat(priceData[TETSUO_CONTRACT]);

        setEstimatedSwap({
          tokens: tetsuoTokens.toFixed(6),
          usd: tokenToUsd.toFixed(6),
        });
      }
    };

    fetchSwapEstimate();
  }, [swapAmount, swapFromContract, provider, priceData]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [countdown, setCountdown] = useState(900); // 15 minutes = 900 seconds
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const resetEstimates = () => {
    setEstimatedTetsuo({ tokens: "N/A", usd: "N/A" });
    setEstimatedSwap({ tokens: "N/A", usd: "N/A" });
  };

  const startCountdown = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(900); // Reset to 15 minutes

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          resetEstimates();
          clearInterval(countdownRef.current as NodeJS.Timeout);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const switchProvider = (newProvider: "Jupiter" | "Raydium") => {
    if (provider !== newProvider) {
      setIsUpdating(true);
      setProvider(newProvider);
      resetEstimates(); // Reset price estimates
      fetchPrices().then(() => {
        setIsUpdating(false);
        startCountdown(); // Restart countdown
      });
    }
  };

  useEffect(() => {
    startCountdown(); // Initialize countdown when component loads
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);
  return (
    <div className="min-h-screen flex flex-col pb-20">
      <header className="flex justify-between items-center p-4">
        <Link href="/finance">
          <img src={Logo.src} alt="Tetsuo Logo" className="w-14" />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeDropdown />
          <WalletMultiButton />
        </div>
      </header>

      {publicKey && (
        <div className="bg-blue-100 text-blue-800 text-sm p-3 text-center flex justify-between items-center">
          <span>
            💰 Balance: {balance} TETSUO | 💲 Price: ${priceData[TETSUO_CONTRACT] || "N/A"} USD
            (via {provider}) | ⏳ Expires in: {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
          </span>
          <div className="flex gap-2">
            <Button onClick={() => setBuyOpen(true)}>Buy</Button>
            <Button onClick={() => setSwapOpen(true)}>Swap</Button>
            <Button onClick={() => switchProvider(provider === "Jupiter" ? "Raydium" : "Jupiter")}>
              {isUpdating ? "Updating pricing..." : `Using: ${provider}`}
            </Button>
          </div>
        </div>
      )}

      <main className="p-4 flex-1">{children}</main>


      {/* Buy Modal */}
      <Dialog open={buyOpen} onOpenChange={setBuyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buy Tetsuo (SOL → TETSUO) via {provider}</DialogTitle>
          </DialogHeader>
          <Input placeholder="Enter amount" value={buyAmount} onChange={(e) => setBuyAmount(e.target.value)} />
          <p className="text-sm text-gray-500">
            ≈ {estimatedTetsuo.tokens} TETSUO <br />
            ≈ ${estimatedTetsuo.usd} USD <br />
            ⏳ Price valid for: {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
          </p>
          <DialogFooter>
            <Button onClick={() => setBuyOpen(false)}>Cancel</Button>
            <Button>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Swap Modal */}
      <Dialog open={swapOpen} onOpenChange={setSwapOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Swap Tokens via {provider}</DialogTitle>
          </DialogHeader>
          <Input placeholder="Enter contract address" value={swapFromContract} onChange={(e) => setSwapFromContract(e.target.value)} />
          {validContract ? <CheckCircle className="text-green-500 ml-2" size={18} /> : <XCircle className="text-red-500 ml-2" size={18} />}
          <Input placeholder="Enter amount" value={swapAmount} onChange={(e) => setSwapAmount(e.target.value)} />
          <p className="text-sm text-gray-500">
            ≈ {estimatedSwap.tokens} TETSUO <br />
            ≈ ${estimatedSwap.usd} USD <br />
            ⏳ Price valid for: {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
          </p>
          <DialogFooter>
            <Button onClick={() => setSwapOpen(false)}>Cancel</Button>
            <Button>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}