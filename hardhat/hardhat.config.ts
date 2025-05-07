import { HardhatUserConfig, vars } from "hardhat/config";
import "@nomicfoundation/hardhat-viem";
import "@nomicfoundation/hardhat-ignition";
import "hardhat-gas-reporter";

// const ALCHEMY_API_KEY = vars.get("ALCHEMY_API_KEY");
// const PRIVATE_KEY = vars.get("PRIVATE_KEY");
//const COINMARKETCAP_API = vars.get("COINMARKETCAP_API");

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  gasReporter: {
    // outputJSON: true,
    // outputJSONFile: ",out.json",
    enabled: true,
    // includeBytecodeInJSON: false,
    // suppressTerminalOutput: true,
    currency: "USD",
    //coinmarketcap: COINMARKETCAP_API,
    L1: "polygon",
    offline: false,
  },
  networks: {
    hardhat: {},
    // sepolia: {
    //   url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    //   accounts: [PRIVATE_KEY],
    // },
  },
};

export default config;
