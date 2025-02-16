"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useWhalesTransactions } from "@/queries/useWhalesTransactions";
import { AlertErrorMessage } from "@/components/shared/AlertErrorMessage";

export const WhalesTransactions = () => {
  const { data: transactions, isFetching, error } = useWhalesTransactions();

  if (isFetching) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[50px] w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    console.error("Error fetching whale transactions:", error);
    return <AlertErrorMessage message="Issue fetching whales transactions" />;
  }

  if (!transactions?.length) {
    return <div>No whale transactions found.</div>;
  }

  return (
    <table className="w-full table-auto jetbrains-mono-400 text-zinc-200">
      <thead className="sticky top-0 bg-zinc-900">
        <tr className="text-left">
          <th className="p-2">Date</th>
          <th className="p-2">Price</th>
          <th className="p-2">Volume (USD)</th>
          <th className="p-2">Amount (TETSUO)</th>
          <th className="p-2">Txn Hash</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map(({ transaction_hash, amount_tokens, amount_usd, price_usd, timestamp }) => (
          <tr key={transaction_hash} className="outline outline-1 outline-zinc-900">
            <td className="p-2">{new Date(timestamp).toLocaleString(navigator.languages)}</td>
            <td className="p-2">${price_usd.toFixed(5)}</td>
            <td className="p-2">${amount_usd.toFixed(2)}</td>
            <td className="p-2">
              {Intl.NumberFormat(navigator.languages, {
                notation: "compact",
                compactDisplay: "short",
              }).format(amount_tokens)}
            </td>
            <td className="p-2">
              <a
                href={`https://solscan.io/tx/${transaction_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-500"
              >
                {transaction_hash.slice(0, 4)}...{transaction_hash.slice(-4)}
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
