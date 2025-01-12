"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    TradingView: any;
  }
}

export const TradingViewChart = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeTradingView = () => {
      if (!containerRef.current || !window.TradingView) return;

      new window.TradingView.widget({
        container_id: containerRef.current.id,
        symbol: "MEXC:TETSUOUSDT",
        interval: "30",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        toolbar_bg: "#f1f3f6",
        enable_publishing: false,
        allow_symbol_change: true,
        hide_volume: true,
        width: "100%",
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

  return <div id="tradingview_widget" ref={containerRef} className="w-full" />;
};
