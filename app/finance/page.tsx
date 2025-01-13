import { TradingViewChart } from "@/components/TradingViewChart";
import { WhalesTransactions } from "@/components/WhalesTransactions";

export default function FinancePage() {
  return (
    <div className="flex flex-col gap-4">
      <TradingViewChart />
      <WhalesTransactions />
    </div>
  );
}
