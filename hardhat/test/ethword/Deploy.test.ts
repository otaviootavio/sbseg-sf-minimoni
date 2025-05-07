import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { keccak256, bytesToHex } from "viem";
import { deployEthWord } from "../utils/deployEthWord";

function createHashchain(secret: Uint8Array, length: number): Uint8Array[] {
  let currentHash: Uint8Array = keccak256(secret, "bytes");
  const hashChain: Uint8Array[] = [currentHash];

  for (let i = 1; i < length; i++) {
    currentHash = keccak256(currentHash, "bytes");
    hashChain.push(currentHash);
  }

  return hashChain;
}

describe("Deploy", function () {
  it("Should deploy it correctely the word count", async function () {
    const { ethWord, chainSize } = await loadFixture(deployEthWord);

    expect(await ethWord.read.totalWordCount()).to.equal(BigInt(chainSize));
  });

  it("Should deploy it correctely the word tip", async function () {
    const { ethWord, hashChain, chainSize } = await loadFixture(deployEthWord);

    expect(await ethWord.read.channelTip()).to.equal(
      bytesToHex(hashChain[chainSize])
    );
  });

  it("Should deploy it correctely the balance", async function () {
    const { publicClient, ethWord, ammount } = await loadFixture(deployEthWord);

    expect(
      await publicClient.getBalance({ address: ethWord.address })
    ).to.equal(ammount);
  });

  it("Should deploy it correctely the receipient", async function () {
    const { ethWord, otherAccount } = await loadFixture(deployEthWord);

    expect(
      (await ethWord.read.channelRecipient()).toLocaleLowerCase()
    ).to.deep.equal(otherAccount.account.address);
  });
});
