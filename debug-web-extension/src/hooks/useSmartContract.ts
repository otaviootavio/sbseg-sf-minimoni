import { useState } from "react";
import { Solc } from "solc-browserify";
import { useDeployContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { type Abi, type Address, type Hash } from "viem";
import { rainbowKitConfig } from "@/../config";
interface SmartContractProps {
  amountEthInWei: bigint;
  numersOfToken: number;
  toAddress: Address;
  tail: string;
  abi: Abi;
  bytecode: string;
}

export const useSmartContract = () => {
  const [isCompiling, setIsCompiling] = useState(false);
  const { deployContractAsync } = useDeployContract();

  const compileContract = async () => {
    setIsCompiling(true);
    try {
      const contract = `// SPDX-License-Identifier: UNLICENSED
      pragma solidity ^0.8.19;
      
      contract EthWord {
          address payable public channelSender;
          address payable public channelRecipient;
          uint public totalWordCount;
          bytes32 public channelTip;

          constructor(address to, uint wordCount, bytes32 tip) payable {
              require(to != address(0), "Recipient cannot be the zero address");
              require(wordCount > 0, "Word count must be positive");
              require(tip != 0, "Initial tip cannot be zero");

              channelRecipient = payable(to);
              channelSender = payable(msg.sender);
              totalWordCount = wordCount;
              channelTip = tip;
          }

          function closeChannel(bytes32 _word, uint _wordCount) public {
              require(
                  msg.sender == channelRecipient,
                  "Only the recipient can close the channel"
              );
              require(
                  _wordCount <= totalWordCount,
                  "Word count exceeds available words"
              );
              bool isValid = validateChannelClosure(_word, _wordCount);
              require(isValid, "Word or WordCount not valid!");

              uint amountToWithdraw = calculateWithdrawAmount(_wordCount);

              (bool sent, ) = channelRecipient.call{value: amountToWithdraw}("");
              require(sent, "Failed to send Ether");

              // Send remaining balance to the sender
              uint remainingBalance = address(this).balance;
              (bool sentToSender, ) = channelSender.call{value: remainingBalance}("");
              require(sentToSender, "Failed to send remaining Ether to sender");

              channelTip = _word;
              totalWordCount = totalWordCount - _wordCount;
          }

          function simulateCloseChannel(
              bytes32 _word,
              uint _wordCount
          ) public view returns (bool, uint) {
              require(
                  msg.sender == channelRecipient,
                  "Only the recipient can simulate closing the channel"
              );

              bool isValid = validateChannelClosure(_word, _wordCount);
              if (!isValid) {
                  return (false, 0);
              }

              uint amountToWithdraw = calculateWithdrawAmount(_wordCount);
              return (true, amountToWithdraw);
          }

          function validateChannelClosure(
              bytes32 _word,
              uint _wordCount
          ) private view returns (bool) {
              if (_wordCount == 0) {
                  return false;
              }
              bytes32 wordScratch = keccak256(abi.encodePacked(_word));

              for (uint i = 1; i < _wordCount; i++) {
                  wordScratch = keccak256(abi.encodePacked(wordScratch));
              }
              return wordScratch == channelTip;
          }

          function calculateWithdrawAmount(
              uint _wordCount
          ) private view returns (uint) {
              uint remainingWords = totalWordCount - _wordCount;
              if (remainingWords == 0) {
                  return address(this).balance;
              }
              uint initialWordPrice = address(this).balance / totalWordCount;
              return initialWordPrice * _wordCount;
          }
      }`;

      const solc = new Solc();
      const compiledContracts = await solc.compile(contract);
      const outBytecode =
        compiledContracts.contracts.Compiled_Contracts.EthWord.evm.bytecode
          .object;
      const outAbi: Abi = compiledContracts.contracts.Compiled_Contracts.EthWord
        .abi as Abi;
      return { abi: outAbi, bytecode: outBytecode };
    } catch (error) {
      console.error("Compilation failed:", error);
      throw error;
    } finally {
      setIsCompiling(false);
    }
  };

  const deployContract = async (props: SmartContractProps) => {
    const hash: Hash = await deployContractAsync({
      abi: props.abi,
      bytecode: `0x${props.bytecode}`,
      args: [props.toAddress, props.numersOfToken, props.tail],
      value: props.amountEthInWei,
    });

    const receipt = await waitForTransactionReceipt(rainbowKitConfig, {
      hash,
      confirmations: 1,
    });

    if (!receipt.contractAddress) throw new Error("Contract address not found");

    return receipt.contractAddress;
  };

  return {
    isCompiling,
    compileContract,
    deployContract,
  };
};
