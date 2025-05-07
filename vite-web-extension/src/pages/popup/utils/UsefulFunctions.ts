import { keccak256, toBytes, toHex } from "viem";

function createHashChainFromSecretAndMaxIndex(
  secret: Uint8Array,
  maxIndex: number
): `0x${string}`[] {
  let currentHash: Uint8Array = keccak256(secret, "bytes");
  const hashChain: Uint8Array[] = [currentHash];

  for (let i = 1; i <= maxIndex; i++) {
    currentHash = keccak256(currentHash, "bytes");
    hashChain.push(currentHash);
  }

  return hashChain.map((hash) => toHex(hash));
}

export function createHashChainFromItemAndLength(
  hashItem: `0x${string}`,
  length: number
): `0x${string}`[] {
  let currentHash: Uint8Array = toBytes(hashItem, { size: 32 });
  const hashChain: Uint8Array[] = [currentHash];

  for (let i = 1; i < length; i++) {
    currentHash = keccak256(currentHash, "bytes");
    hashChain.push(currentHash);
  }

  return hashChain.map((hash) => toHex(hash));
}

export { createHashChainFromSecretAndMaxIndex };
