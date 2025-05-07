import '@rainbow-me/rainbowkit/styles.css';

import {
  getDefaultConfig,
} from '@rainbow-me/rainbowkit';

import { http, createConfig } from "wagmi";
import { hardhat, mainnet, sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

// Network Name : XRPL EVM Sidechain Devnet
// New RPC URL : https://rpc-evm-sidechain.xrpl.org
// Chain ID : 1440002
// Currency Symbol : XRP
// Block Explorer : https://evm-sidechain.xrpl.org

import { defineChain } from "viem";

export const xrplEvmSidechain = defineChain({
  id: 1440002,
  name: "XRPL EVM Sidechain Devnet",
  nativeCurrency: { name: "XRP", symbol: "XRP", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc-evm-sidechain.xrpl.org"] },
  },
  blockExplorers: {
    default: {
      name: "XRPL EVM Sidechain Devnet Explorer",
      url: "https://evm-sidechain.xrpl.org",
    },
  },
});

export const config = createConfig({
  connectors: [
    injected(),
    // coinbaseWallet({ appName: "Create Wagmi" }),
    // walletConnect({ projectId: import.meta.env.VITE_WC_PROJECT_ID }),
  ],
  chains: [mainnet, sepolia, hardhat, xrplEvmSidechain],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [hardhat.id]: http(),
    [xrplEvmSidechain.id]: http(),
  },
});

export const rainbowKitConfig = getDefaultConfig({
  appName: 'MiniMoni',
  projectId: 'YOUR_PROJECT_ID',
  chains: [xrplEvmSidechain],
  ssr: true, // If your dApp uses server side rendering (SSR)
});