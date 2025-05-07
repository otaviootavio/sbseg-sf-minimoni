import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { bytesToHex } from "viem";
import { deployEthWord, hashM } from "../utils/deployEthWord";

describe("Close Channel", function () {
  describe("Channel balance", function () {
    it("Should close the channel after send h0 and change balance to 0", async function () {
      const { ethWord, chainSize, otherAccount, publicClient, hashChain } =
        await loadFixture(deployEthWord);

      await ethWord.write.closeChannel(
        [bytesToHex(hashChain[0], { size: 32 }), BigInt(chainSize)],
        { account: otherAccount.account }
      );

      expect(
        await publicClient.getBalance({ address: ethWord.address })
      ).to.equal(0n);
    });

    it("Should send one of n hash and change its balance", async function () {
      const {
        ethWord,
        chainSize,
        otherAccount,
        publicClient,
        hashChain,
        ammount,
      } = await loadFixture(deployEthWord);

      await ethWord.write.closeChannel(
        [bytesToHex(hashChain[chainSize - 1], { size: 32 }), BigInt(1)],
        { account: otherAccount.account }
      );

      expect(
        await publicClient.getBalance({ address: ethWord.address })
      ).to.equal(ammount - ammount / BigInt(chainSize));
    });

    it("Should send m of n hash and change its balance", async function () {
      const {
        ethWord,
        chainSize,
        otherAccount,
        publicClient,
        hashChain,
        ammount,
      } = await loadFixture(deployEthWord);

      await ethWord.write.closeChannel(
        [bytesToHex(hashChain[chainSize - hashM], { size: 32 }), BigInt(hashM)],
        { account: otherAccount.account }
      );

      expect(
        await publicClient.getBalance({ address: ethWord.address })
      ).to.equal(ammount - (BigInt(hashM) * ammount) / BigInt(chainSize));
    });
  });

  describe("Channel hash tip and total word count", function () {
    it("Should change hashtip to hn and word count to 0", async function () {
      const { ethWord, chainSize, otherAccount, hashChain } = await loadFixture(
        deployEthWord
      );

      await ethWord.write.closeChannel(
        [bytesToHex(hashChain[0], { size: 32 }), BigInt(chainSize)],
        { account: otherAccount.account }
      );

      const totalWordCount = await ethWord.read.totalWordCount();
      const channelTip = await ethWord.read.channelTip();

      expect(totalWordCount).to.equal(0n);
      expect(channelTip).to.equal(bytesToHex(hashChain[0]));
    });

    it("Should send one of N hash and change its hashtip to hN-1 and wordcount to N-1", async function () {
      const { ethWord, chainSize, otherAccount, hashChain } = await loadFixture(
        deployEthWord
      );

      await ethWord.write.closeChannel(
        [bytesToHex(hashChain[chainSize - 1], { size: 32 }), BigInt(1)],
        { account: otherAccount.account }
      );

      const totalWordCount = await ethWord.read.totalWordCount();
      const channelTip = await ethWord.read.channelTip();

      expect(totalWordCount).to.equal(BigInt(chainSize - 1));
      expect(channelTip).to.equal(bytesToHex(hashChain[chainSize - 1]));
    });

    it("Should send m of n hash and change its hashtip to HN-hashM and ", async function () {
      const { ethWord, chainSize, hashChain, otherAccount } = await loadFixture(
        deployEthWord
      );

      await ethWord.write.closeChannel(
        [bytesToHex(hashChain[chainSize - hashM], { size: 32 }), BigInt(hashM)],
        { account: otherAccount.account }
      );

      const totalWordCount = await ethWord.read.totalWordCount();
      const channelTip = await ethWord.read.channelTip();

      expect(totalWordCount).to.equal(BigInt(chainSize - hashM));
      expect(channelTip).to.equal(bytesToHex(hashChain[chainSize - hashM]));
    });
  });
});
