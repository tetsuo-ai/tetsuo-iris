"use client";

import { useState, useEffect } from "react";
import TradingViewWidget from "@/components/TradingViewWidget";
import { WhalesTransactions } from "@/components/WhalesTransactions";
import JupiterAPIInteraction from "@/components/JupiterAPIInteraction";
import { JupiterTerminal } from "@/components/JupiterTerminal";
import Navbar from "@/components/Navbar";

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
    <main className="bg-zinc-950">
      <div className="p-4 h-screen flex flex-col gap-4 overflow-hidden">
        <Navbar />
        <div className="grow flex gap-4">
          <div className="grow flex flex-col gap-4">
            <div className="h-full w-full">
              <TradingViewWidget />
            </div>
            <div className="h-[30rem] overflow-auto rounded">
              <WhalesTransactions />
            </div>
          </div>

          <div className="flex flex-col">
            <div className="bg-zinc-900 h-full w-[350px] rounded overflow-auto">
              <JupiterTerminal />
            </div>

            {/* Jupiter Buttons - Aligned in a Single Line */}
            <div className="flex flex-row space-x-2 mt-4 justify-center">
              <button
                onClick={openModal}
                className="bg-blue-500 text-white px-4 w-full py-2 rounded hover:bg-blue-600 orbitron-500"
              >
                Open Jupiter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-zinc-950/25 backdrop-blur flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <div
            className="bg-zinc-900 rounded shadow-lg w-3/4 max-w-3xl h-[500px] flex flex-col"
            onClick={(e) => e.stopPropagation()} // Prevent click from closing modal
          >
            <div className="p-4 flex justify-between place-items-center">
              <h2 className="text-zinc-200 text-xl orbitron-700">Jupiter API Endpoints</h2>
              <button
                onClick={closeModal}
                className="text-red-500 hover:text-red-600 text-3xl px-2"
              >
                &times;
              </button>
            </div>

            {/* Tabs */}
            <div className="flex">
              {endpoints.map((endpoint) => (
                <button
                  key={endpoint.value}
                  onClick={() => handleTabClick(endpoint.value)}
                  className={`p-4 flex-1 text-center orbitron-500
                    ${activeTab === endpoint.value
                      ? "bg-gradient-to-br from-cyan-500 to-emerald-600 text-zinc-200"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                  }`}
                >
                  {endpoint.name}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-4 overflow-y-auto">
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
