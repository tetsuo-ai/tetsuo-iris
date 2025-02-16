"use client";

import { memo, useEffect, useRef } from "react";

declare global {
  interface Window {
    TradingView: any;
  }
}

function TradingViewWidget() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeTradingView = () => {
      if (!containerRef.current || !window.TradingView) return;

      new window.TradingView.widget({
        container_id: containerRef.current.id,
        symbol: "RAYDIUM:TETSUOSOL_2KB3I5.USD",
        interval: "5",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        range: "5D",
        toolbar_bg: "#f1f3f6",
        enable_publishing: false,
        allow_symbol_change: true,
        width: "100%",
        height: "100%",
      });
    };

    if (window.TradingView) {
      initializeTradingView();
    } else {
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/tv.js";
      script.async = true;
      script.onload = initializeTradingView;
      document.head.appendChild(script);

      return () => {
        document.head.removeChild(script);
      };
    }
  }, []);

  return <div id="tradingview-widget" ref={containerRef} style={{ height: "100%", width: "100%" }}></div>;
}

export default memo(TradingViewWidget);
