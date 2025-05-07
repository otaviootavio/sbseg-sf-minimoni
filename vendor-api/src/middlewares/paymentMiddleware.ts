import { MiddlewareHandler } from "hono";
import { Address, isAddress, isHash, type Hash } from "viem";
import { PaymentService } from "../services/paymentService";
import { PrismaClient } from "@prisma/client";
import { validateHashChain } from "../lib/hashchain";
import { ChannelService } from "../services/channelService";
import { BlockchainService } from "../services/blockchainService";

const prisma = new PrismaClient();
const paymentService = new PaymentService(prisma);
const blockchainService = new BlockchainService();
const channelService = new ChannelService(prisma, blockchainService);

/*
Known issues:
The web extension might run out of sync.
For instance, the video player can withdraw one Hash, and for some reason
the hash does not react the api. So the api is seeing the token N while the
extension has the hash n+1. This can be solved by adding a new endpoint of sync.
But for now, we are just getting the n+1 hash, computing if they belong to the same hashchain,
and then update the api database with the incomming hash.
*/
export const paymentMiddleware: MiddlewareHandler = async (c, next) => {
  try {
    const xHash = c.req.header("x-hash");
    const xSmartContractAddress = c.req.header("x-smart-contract-address");
    const xIndex = c.req.header("x-hash-index");

    // Validate required headers
    if (!xHash || !xSmartContractAddress || !xIndex) {
      return c.json(
        {
          success: false,
          message: "Missing required headers: x-hash, x-smart-contract-address",
        },
        400
      );
    }

    // Validate and convert hash format
    if (!isHash(xHash)) {
      return c.json(
        {
          success: false,
          message: "Invalid hash format in x-hash header",
        },
        400
      );
    }

    if (!isAddress(xSmartContractAddress)) {
      return c.json(
        {
          success: false,
          message:
            "Invalid smart contract address format in x-smart-contract-address header",
        },
        400
      );
    }

    // The hash is already validated by isHash, so we can safely cast it
    const normalizedHash = xHash as Hash;
    const normalizedSmartContractAddress = xSmartContractAddress as Address;
    const normailizedIndex = parseInt(xIndex);

    // Verify if the incomming hash follows the channel's hash sequence
    const channel = await channelService.findByContractAddress(
      normalizedSmartContractAddress
    );

    if (!channel) {
      return c.json(
        {
          success: false,
          message: "Channel not found",
        },
        404
      );
    }

    if (channel.status == "CLOSED") {
      return c.json(
        {
          success: false,
          message: "Channel is closed",
        },
        400
      );
    }

    const payment = await paymentService.getLatestPaymentBySmartContractAddress(
      normalizedSmartContractAddress
    );

    if (!payment) {
      if (
        !validateHashChain(
          {
            hash: channel?.tail,
            index: 0,
          },
          { hash: normalizedHash, index: normailizedIndex }
        )
      ) {
        return c.json(
          {
            success: false,
            message: "Invalid hash chain",
          },
          400
        );
      }

      const result = await paymentService.create({
        xHash: normalizedHash,
        amount: channel.vendor.amountPerHash,
        index: normailizedIndex,
        contractAddress: xSmartContractAddress,
        vendorId: channel.vendorId,
      });

      if (!result) {
        return c.json(
          {
            success: false,
            message: "Failed to create payment",
          },
          400
        );
      }

      await next();
      return;
    }

    if (payment.index > normailizedIndex) {
      return c.json(
        {
          success: false,
          message: "Index out of order",
        },
        400
      );
    }

    if (
      !validateHashChain(
        {
          hash: normalizedHash,
          index: normailizedIndex,
        },
        { hash: payment.xHash as Hash, index: payment.index }
      )
    ) {
      return c.json(
        {
          success: false,
          message: "Invalid hash chain",
        },
        400
      );
    }

    const result = await paymentService.create({
      xHash: normalizedHash,
      amount: payment.vendor.amountPerHash,
      index: normailizedIndex,
      contractAddress: xSmartContractAddress,
      vendorId: payment.vendorId,
    });

    if (!result) {
      return c.json(
        {
          success: false,
          message: "Failed to create payment",
        },
        400
      );
    }

    await next();
  } catch (error) {
    console.error("Payment middleware error:", error);
    return c.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      500
    );
  }
};

// Optional: Export a type for the enhanced context
declare module "hono" {
  interface ContextVariableMap {
    payment: {
      id: string;
      xHash: Hash;
      amount: number;
      index: number;
      channelId: string;
      vendorId: string;
      createdAt: string;
      updatedAt: string;
      channel: {
        id: string;
        contractAddress: `0x${string}`;
        numHashes: number;
        lastIndex: number;
        tail: Hash;
        totalAmount: number;
        vendorId: string;
        createdAt: string;
        updatedAt: string;
      };
      vendor: {
        id: string;
        chainId: number;
        address: `0x${string}`;
        amountPerHash: number;
        createdAt: string;
        updatedAt: string;
      };
    };
  }
}
