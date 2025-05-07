import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { HashchainProvider } from "./context/HashchainProvider";
import { ExtensionStorage } from "./storage/ExtensionStorage";

async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register(
        import.meta.env.MODE === "production"
          ? "/service-worker.js"
          : "/dev-sw.js?dev-sw",
        {
          type: import.meta.env.MODE === "production" ? "classic" : "module",
        }
      );
      console.log("[Page] Service Worker registered successfully");
    } catch (error) {
      console.error("[Page] Service Worker registration failed:", error);
    }
  }
}

registerServiceWorker();
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashchainProvider storage={new ExtensionStorage()}>
      <App />
    </HashchainProvider>
  </React.StrictMode>
);
