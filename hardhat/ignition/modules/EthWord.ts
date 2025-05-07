import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther, keccak256, toHex } from "viem";

function createHashchain(secret: string, length: number): string[] {
  let currentHash = keccak256(toHex(secret));
  const hashChain = [currentHash];

  for (let i = 1; i < length; i++) {
    currentHash = keccak256(`0x${currentHash.slice(2)}`);
    hashChain.push(currentHash);
  }

  return hashChain;
}

const defaultRecipient = "0xdD2FD4581271e230360230F9337D5c0430Bf44C0";
const hashChain = createHashchain("secret", 21);
const tip = hashChain[20];
const wordCount = 20;
const initialBalance = parseEther("20");

const EthWordModule = buildModule("EthWord", (m) => {
  const recipient = m.getParameter("recipient", defaultRecipient);
  const wordCountParam = m.getParameter("wordCount", wordCount);
  const tipParam = m.getParameter("tip", tip);

  const ethWord = m.contract("EthWord", [recipient, wordCountParam, tipParam], {
    value: initialBalance,
  });

  console.log("Receipient:" + JSON.stringify(recipient.defaultValue));
  console.log("Word count:" + JSON.stringify(wordCountParam.defaultValue));
  console.log("Tip:" + JSON.stringify(tipParam.defaultValue));
  console.log("Hashchain: " + hashChain);

  return { ethWord };
});

export default EthWordModule;
