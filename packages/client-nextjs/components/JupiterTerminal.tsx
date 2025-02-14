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
      endpoint: "https://api.mainnet-beta.solana.com",
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

  return <div id="jupiter-terminal" className="bg-zinc-800 h-[568px] w-[350px]"></div>
}
