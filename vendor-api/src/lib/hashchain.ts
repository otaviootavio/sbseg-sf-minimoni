import { Hash, keccak256 } from "viem";

type HashNode = {
  hash: Hash;
  index: number;
};

export function validateHashChain(node1: HashNode, node2: HashNode): boolean {
  const [earlier, later] =
    node1.index < node2.index ? [node1, node2] : [node2, node1];

  const hashSteps = later.index - earlier.index;
  let currentHash = later.hash;

  for (let i = 0; i < hashSteps; i++) {
    currentHash = keccak256(currentHash);
  }

  return currentHash.toLowerCase() === earlier.hash.toLowerCase();
}
