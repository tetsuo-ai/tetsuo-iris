"use client";

import { FC, ReactNode, useEffect, useState } from "react";
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
const DEFAULT_SWAP_FROM_CONTRACT = "9a21gb7fWGm9dD2UFdZAzgFn5K1NwfmYkjyLbpAcKgnM";
const SOL_CONTRACT = "So11111111111111111111111111111111111111112";

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
  const [swapFromContract, setSwapFromContract] = useState(DEFAULT_SWAP_FROM_CONTRACT);
  const [validContract, setValidContract] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const priceRes = await fetch("/api/v1/jupiter/price", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contractAddresses: [TETSUO_CONTRACT, swapFromContract, SOL_CONTRACT] }),
        });

        const balanceRes = await fetch("/api/v1/jupiter/balance", {
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

    if (publicKey) {
      fetchData();
    }
  }, [publicKey, swapFromContract]);

  const getUSDValue = (token: string, amount: string) => {
    if (!amount || !priceData[token]) return "N/A";
    return (parseFloat(amount) * parseFloat(priceData[token])).toFixed(6);
  };

  const getTetsuoForSol = (solAmount: string) => {
    if (!solAmount || !priceData[SOL_CONTRACT] || !priceData[TETSUO_CONTRACT]) return "N/A";
    const solToUSD = parseFloat(solAmount) * parseFloat(priceData[SOL_CONTRACT]);
    return (solToUSD / parseFloat(priceData[TETSUO_CONTRACT])).toFixed(6);
  };

  const getTetsuoForSwap = (token: string, amount: string) => {
    if (!amount || !priceData[token] || !priceData[TETSUO_CONTRACT]) return "N/A";
    const tokenToUSD = parseFloat(amount) * parseFloat(priceData[token]);
    return (tokenToUSD / parseFloat(priceData[TETSUO_CONTRACT])).toFixed(6);
  };

  const handleBuy = async () => {
    if (!buyAmount) return;
    const estimatedTetsuo = getTetsuoForSol(buyAmount);
    if (estimatedTetsuo === "N/A") return;

    try {
      await fetch("/api/v1/jupiter/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ca: TETSUO_CONTRACT,
          amount: parseFloat(estimatedTetsuo),
          slippage: 1,
        }),
      });

      setBuyOpen(false);
    } catch (error) {
      console.error("Error executing buy:", error);
    }
  };

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
          <span>💰 Balance: {balance} TETSUO | 💲 Price: ${priceData[TETSUO_CONTRACT] || "N/A"}</span>
          <div className="flex gap-2">
            <Button onClick={() => setBuyOpen(true)}>Buy</Button>
            <Button onClick={() => setSwapOpen(true)}>Swap</Button>
          </div>
        </div>
      )}

      <main className="p-4 flex-1">{children}</main>

      {/* Buy Modal */}
      <Dialog open={buyOpen} onOpenChange={setBuyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buy Tetsuo (SOL → TETSUO)</DialogTitle>
          </DialogHeader>
          <div className="flex items-center">
            <img src={SOL_ICON} className="h-6 w-6 mr-2" />
            <span>From: SOL</span>
          </div>
          <Input placeholder="Enter amount" value={buyAmount} onChange={(e) => setBuyAmount(e.target.value)} />
          <p className="text-sm text-gray-500">
            ≈ {getUSDValue(SOL_CONTRACT, buyAmount)} USD <br />
            ≈ {getTetsuoForSol(buyAmount)} TETSUO
          </p>
          <DialogFooter>
            <Button onClick={() => setBuyOpen(false)}>Cancel</Button>
            <Button onClick={handleBuy}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Swap Modal */}
      <Dialog open={swapOpen} onOpenChange={setSwapOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Swap Tokens</DialogTitle>
          </DialogHeader>
          <div className="flex items-center">
            <span className="mr-2">From:</span>
            <Input
              placeholder="Enter contract address"
              value={swapFromContract}
              onChange={(e) => setSwapFromContract(e.target.value)}
            />
            {validContract ? <CheckCircle className="text-green-500 ml-2" size={18} /> : <XCircle className="text-red-500 ml-2" size={18} />}
          </div>
          <Input placeholder="Enter amount" value={swapAmount} onChange={(e) => setSwapAmount(e.target.value)} />
          <p className="text-sm text-gray-500">
            ≈ {getUSDValue(swapFromContract, swapAmount)} USD <br />
            ≈ {getTetsuoForSwap(swapFromContract, swapAmount)} TETSUO
          </p>
          <DialogFooter>
            <Button onClick={() => setSwapOpen(false)}>Cancel</Button>
            <Button>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
