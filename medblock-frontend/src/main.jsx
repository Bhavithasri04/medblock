// src/main.jsx
import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

import {
  AptosWalletAdapterProvider,
  useWallet, // used inside AutoDisconnectIfConnected
} from "@aptos-labs/wallet-adapter-react";
import { PetraWallet } from "petra-plugin-wallet-adapter";

const wallets = [new PetraWallet()];

/**
 * AutoDisconnectIfConnected
 * Optional safety-net: if the wallet is already connected when the app mounts
 * this will immediately disconnect it so the user must click "Connect" manually.
 * Keep or remove this component depending on whether you want to force-disconnect
 * previously-authorized sessions on page load.
 */
function AutoDisconnectIfConnected() {
  const { connected, disconnect } = useWallet();

  useEffect(() => {
    if (connected) {
      console.debug("AutoDisconnectIfConnected: found existing wallet session — disconnecting to enforce manual connect");
      disconnect().catch((e) => console.warn("Auto-disconnect failed:", e));
    }
  }, [connected, disconnect]);

  return null;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AptosWalletAdapterProvider
      plugins={wallets}
      autoConnect={false}    // <-- IMPORTANT: explicitly disable autoConnect
      onError={(e) => console.error("Wallet error:", e)}
    >
      <AutoDisconnectIfConnected />
      <App />
    </AptosWalletAdapterProvider>
  </React.StrictMode>
);
