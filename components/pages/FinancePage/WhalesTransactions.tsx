"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useWhalesTransactions } from "@/queries/useWhalesTransactions";
import dayjs from "dayjs";
import { formatDecimal, getSolscanTxnUrl, truncateAddress } from "@/lib/utils";
import { AlertErrorMessage } from "@/components/shared/AlertErrorMessage";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

export const WhalesTransactions = () => {
  const { data, isFetching, error } = useWhalesTransactions();

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

  if (!data?.length) {
    return <div>No whale transactions found.</div>;
  }

  return (
    <ScrollArea className="max-w-lg mx-auto h-[500px]">
      <Table aria-label="Whales Transactions Table" className="max-w-lg mx-auto">
        <TableCaption>Whales Transactions</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Txn Hash</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map(({ transaction_hash, amount_tokens, amount_usd, timestamp }) => (
            <TableRow key={transaction_hash}>
              <TableCell>
                {formatDecimal(amount_tokens)}
                <div className="text-muted-foreground text-sm">
                  (${formatDecimal(amount_usd, 2)})
                </div>
              </TableCell>
              <TableCell>
                {dayjs(timestamp).format("MM/DD/YYYY HH:mm")}
              </TableCell>
              <TableCell className="text-right">
                <a
                  href={getSolscanTxnUrl(transaction_hash)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {truncateAddress(transaction_hash)}
                </a>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};
