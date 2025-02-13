"use client";

import { useState, useEffect } from "react";
import { TradingViewChart } from "@/components/TradingViewChart";
import { WhalesTransactions } from "@/components/WhalesTransactions";
import JupiterAPIInteraction from "@/components/JupiterAPIInteraction";
import "@jup-ag/terminal/css";
import { useWallet } from "@solana/wallet-adapter-react";

export default function FinancePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("buy");

  const endpoints = [
    { name: "Buy", value: "buy", parameters: { ca: "Contract Address", amount: "Amount", slippage: "Slippage (%)" } },
    { name: "Swap", value: "swap", parameters: { source: "Source Token", target: "Target Token", amount: "Amount" } },
    { name: "Token Data", value: "token_data", parameters: { ticker: "Token Ticker", address: "Token Address" } },
    { name: "Balance", value: "balance", parameters: { wallet: "Wallet Address" } },
    { name: "Price", value: "price", parameters: { ca: "Contract Address" } },
  ];

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setActiveTab("buy");
  };

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };

  const walletProps = useWallet();

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("@jup-ag/terminal").then((mod) => {
        const init = mod.init;

        init({
          displayMode: "integrated",
          integratedTargetId: "jupiter-integrated-terminal",
          endpoint: "https://api.mainnet-beta.solana.com",
          refetchIntervalForTokenAccounts: 10000,
          defaultExplorer: "Solscan",
          formProps: {
            initialSlippageBps: 0,
          },
        });
      });
    }
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener("keydown", handleEscape);
    } else {
      document.removeEventListener("keydown", handleEscape);
    }

    return () => document.removeEventListener("keydown", handleEscape);
  }, [isModalOpen]);

  return (
    <main className="p-4 flex-1">
      <div className="flex flex-row gap-4">
        {/* Left side: TradingView Chart */}
        <div id="tradingview_widget" className="w-3/4">
          <TradingViewChart />
        </div>

        {/* Right side: Whale Transactions */}
        <div className="w-1/4 flex flex-col">
          <div className="h-full overflow-auto">
            <div id="jupiter-integrated-terminal" className="bg-zinc-800" />
            <WhalesTransactions />
          </div>

          {/* Jupiter Buttons - Aligned in a Single Line */}
          <div className="flex flex-row space-x-2 mt-4 justify-center">
            <button
              onClick={openModal}
              className="bg-blue-500 text-white px-4 w-full mx-2 py-2 rounded-md hover:bg-blue-600"
            >
              Open Jupiter
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-md shadow-lg w-3/4 max-w-3xl h-[500px] flex flex-col"
            onClick={(e) => e.stopPropagation()} // Prevent click from closing modal
          >
            <div className="p-4 flex justify-between items-center border-b">
              <h2 className="text-lg font-bold">Jupiter API Endpoints</h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b">
              {endpoints.map((endpoint) => (
                <button
                  key={endpoint.value}
                  onClick={() => handleTabClick(endpoint.value)}
                  className={`p-4 flex-1 text-center border-r ${activeTab === endpoint.value
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  {endpoint.name}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-4 flex-1 overflow-y-auto">
              {endpoints.map(
                (endpoint) =>
                  activeTab === endpoint.value && (
                    <JupiterAPIInteraction
                      key={endpoint.value}
                      endpoint={endpoint.value}
                      parameters={Object.fromEntries(
                        Object.entries(endpoint.parameters).filter(
                          ([_, value]) => value !== undefined
                        )
                      )} // Pass simplified parameters
                    />
                  )
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
