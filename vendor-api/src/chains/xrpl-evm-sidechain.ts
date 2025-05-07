import { Chain } from "viem";

export const xrpEVMSidechain: Chain = {
  id: 1440002,
  name: "XRP EVM Sidechain",
  nativeCurrency: {
    decimals: 18,
    name: "XRP",
    symbol: "XRP",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc-evm-sidechain.xrpl.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "XRP Ledger Explorer",
      url: "https://evm-sidechain.xrpl.org",
    },
  },
};
