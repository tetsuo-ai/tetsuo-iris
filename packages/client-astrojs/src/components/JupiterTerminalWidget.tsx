"use client";

import React, { useEffect } from 'react';

import { useWallet } from "@jup-ag/wallet-adapter";
import { init, syncProps } from "@jup-ag/terminal";
import "@jup-ag/terminal/css";

export default function JupiterTerminalWidget() {
  const passthroughWalletContextState = useWallet();

  useEffect(() => {
    init({
      enableWalletPassthrough: true,
      displayMode: "integrated",
      integratedTargetId: "integrated-terminal",
      // TODO: switch endpoint to something more stable and less rate-limited
      endpoint: "https://api.mainnet-beta.solana.com",
      refetchIntervalForTokenAccounts: 10000,
      defaultExplorer: "Solscan",
      formProps: {
        initialSlippageBps: 0,
      },
      passthroughWalletContextState,
      useUserSlippage: true,
    });
  }, []);

  // Make sure passthrough wallet are synced
  useEffect(() => {
    syncProps({ passthroughWalletContextState });
  }, [passthroughWalletContextState]);

  return (
    <div
      id="integrated-terminal"
      className={`w-full h-full max-w-[384px] overflow-auto justify-center`}
    />
  );
}
