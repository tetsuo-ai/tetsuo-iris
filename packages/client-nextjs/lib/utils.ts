import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getSolscanTxnUrl = (txnHash: string) => {
  return `https://solscan.io/tx/${txnHash}`;
};

export const truncateAddress = (address: string) => {
  return `${address.slice(0, 4)}..${address.slice(-4)}`;
};

export const formatDecimal = (num: number, maxDecimals: number = 9): string => {
  return num.toFixed(maxDecimals).replace(/\.?0+$/, "");
};
