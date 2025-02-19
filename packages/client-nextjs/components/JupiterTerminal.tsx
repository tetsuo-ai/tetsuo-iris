"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect } from "react";
import { init, syncProps } from "@jup-ag/terminal";
import "@jup-ag/terminal/css";

export function JupiterTerminal() {
  const walletContextState = useWallet();

  useEffect(() => {
    init({
      enableWalletPassthrough: true,
      displayMode: "integrated",
      integratedTargetId: "jupiter-terminal",
      endpoint: "https://solitary-ultra-mansion.solana-mainnet.quiknode.pro/ee35b1f9f74c08dcdd688eafb161edf99dd3c3f6",
      refetchIntervalForTokenAccounts: 10000,
      defaultExplorer: "Solscan",
      formProps: {
        initialSlippageBps: 0,
      },
    });
  }, []);

  // Make sure passthrough wallet are synced
  useEffect(() => {
    syncProps({ passthroughWalletContextState: walletContextState });
  }, [walletContextState]);

  return <div id="jupiter-terminal" className="h-full w-full"></div>
}
