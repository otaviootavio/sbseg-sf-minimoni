import { Vendor } from "@prisma/client";
import {
  createPublicClient,
  http,
  PublicClient,
  Address,
  Hash,
  BaseError,
} from "viem";
import { EthWord$Type } from "./blockchain/EthWord";
import EthWordJson from "./blockchain/EthWord.json";
import { xrpEVMSidechain } from "../chains/xrpl-evm-sidechain";

const EthWordTyped = EthWordJson as EthWord$Type;
const abi = EthWordTyped.abi;

interface ContractData {
  channelRecipient: Address;
  channelSender: Address;
  channelTip: Hash;
  totalWordCount: bigint;
  balance: bigint;
}

export class BlockchainService {
  private publicClient: PublicClient;
  private chain = xrpEVMSidechain;

  constructor() {
    this.publicClient = createPublicClient({
      chain: this.chain,
      transport: http(),
    });
  }

  async getContractData(contractAddress: Address): Promise<ContractData> {
    try {
      // Read all contract state in parallel for efficiency
      const [
        channelRecipient,
        channelSender,
        channelTip,
        totalWordCount,
        balance,
      ] = await Promise.all([
        this.publicClient.readContract({
          address: contractAddress,
          abi,
          functionName: "channelRecipient",
          args: [],
        }) as Promise<Address>,
        this.publicClient.readContract({
          address: contractAddress,
          abi,
          functionName: "channelSender",
          args: [],
        }) as Promise<Address>,
        this.publicClient.readContract({
          address: contractAddress,
          abi,
          functionName: "channelTip",
          args: [],
        }) as Promise<Hash>,
        this.publicClient.readContract({
          address: contractAddress,
          abi,
          functionName: "totalWordCount",
          args: [],
        }) as Promise<bigint>,
        this.publicClient.getBalance({
          address: contractAddress,
        }),
      ]);

      return {
        channelRecipient,
        channelSender,
        channelTip,
        totalWordCount,
        balance,
      };
    } catch (error) {
      if (error instanceof BaseError) {
        throw new Error(`Failed to read contract data: ${error.message}`);
      }
      throw new Error("Failed to read contract data: Unknown error");
    }
  }

  async getBalance(contractAddress: Address): Promise<bigint> {
    try {
      return await this.publicClient.getBalance({
        address: contractAddress,
      });
    } catch (error) {
      if (error instanceof BaseError) {
        throw new Error(`Failed to get balance: ${error.message}`);
      }
      throw new Error("Failed to get balance: Unknown error");
    }
  }

  async verifyContract(
    contractAddress: Address,
    vendor: Vendor
  ): Promise<boolean> {
    try {
      const contractData = await this.getContractData(contractAddress);

      // Verify the vendor is the channel recipient
      if (
        contractData.channelRecipient.toLowerCase() !==
        vendor.address.toLowerCase()
      ) {
        throw new Error(
          "Contract recipient address doesn't match vendor's address"
        );
      }

      return true;
    } catch (error) {
      if (error instanceof BaseError) {
        throw new Error(`Contract verification failed: ${error.message}`);
      }
      throw new Error("Contract verification failed: Unknown error");
    }
  }

  async simulateCloseChannel(
    contractAddress: Address,
    word: Hash,
    wordCount: bigint
  ): Promise<{ isValid: boolean; amount: bigint }> {
    try {
      const [isValid, amount] = (await this.publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: "simulateCloseChannel",
        args: [word, wordCount],
      })) as [boolean, bigint];

      return { isValid, amount };
    } catch (error) {
      if (error instanceof BaseError) {
        throw new Error(`Simulation failed: ${error.message}`);
      }
      throw new Error("Simulation failed: Unknown error");
    }
  }
}
