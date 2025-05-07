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
  });
});
