"use client";

import { TradingViewChart } from "@/components/TradingViewChart";
import { WhalesTransactions } from "./WhalesTransactions";

export const FinancePage = () => {
  return (
    <div className="flex flex-col gap-4">
      <TradingViewChart />
      <WhalesTransactions />
    </div>
  );
};
