import { useQuery } from "@tanstack/react-query";

export type WhaleTransactionResponse = {
  transaction_hash: string;
  amount_tokens: number;
  amount_usd: number;
  price_usd: number;
  timestamp: string;
};

const fetchWhaleTransactions = async (): Promise<WhaleTransactionResponse[]> => {
  const response = await fetch("/api/v1/whales/transactions");
  if (!response.ok) {
    throw new Error("Failed to fetch whale transactions");
  }
  return response.json();
};

export const useWhalesTransactions = () => {
  return useQuery({
    queryKey: ["whales-transactions"],
    queryFn: fetchWhaleTransactions,
  });
};
