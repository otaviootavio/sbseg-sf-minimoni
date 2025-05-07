import hre from "hardhat";
import { parseEther, stringToBytes, keccak256, bytesToHex } from "viem";

export const hashM = 100;
const chainSize: number = 1000;
const secret: Uint8Array = stringToBytes("segredo", { size: 32 });
const ammount: bigint = parseEther("1");

export function createHashchain(
  secret: Uint8Array,
  length: number
): Uint8Array[] {
  let currentHash: Uint8Array = keccak256(secret, "bytes");
  const hashChain: Uint8Array[] = [currentHash];

  for (let i = 1; i < length; i++) {
    currentHash = keccak256(currentHash, "bytes");
    hashChain.push(currentHash);
  }

  return hashChain;
}

export async function deployEthWord() {
  // Contracts are deployed using the first signer/account by default
  const [owner, otherAccount] = await hre.viem.getWalletClients();

  const defaultRecipient: `0x${string}` = otherAccount.account.address;

  const hashChain = createHashchain(secret, chainSize + 1);
  const tip = hashChain[chainSize];
  const wordCount = BigInt(chainSize);

  const ethWord = await hre.viem.deployContract(
    "EthWord",
    [defaultRecipient, wordCount, bytesToHex(tip, { size: 32 })],
    {
      value: ammount,
    }
  );

  const publicClient = await hre.viem.getPublicClient();
  return {
    chainSize,
    hashChain,
    ethWord,
    secret,
    ammount,
    owner,
    otherAccount,
    publicClient,
  };
}
