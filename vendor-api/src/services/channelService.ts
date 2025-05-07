import { ChannelStatus, PrismaClient } from "@prisma/client";
import {
  transformChannelResponse,
  type CreateChannelInput,
  type UpdateChannelInput,
} from "../schemas/channel";
import { type BlockchainService } from "./blockchainService";
import { isHex } from "viem";

export class ChannelService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly blockchain: BlockchainService
  ) {}

  async create(data: CreateChannelInput) {
    // First verify the vendor exists
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: data.vendorId },
    });

    if (!vendor) {
      throw new Error("Vendor not found");
    }

    if (!isHex(data.contractAddress)) {
      throw new Error("Contract address is not a contract address");
    }

    console.log(data);

    const smartContract = await this.blockchain.getContractData(
      data.contractAddress
    );

    if (
      smartContract.channelRecipient.toLowerCase() !==
      vendor.address.toLowerCase()
    ) {
      throw new Error("Vendor address does not match contract recipient");
    }
    

    const channel = await this.prisma.channel.create({
      data: {
        ...data,
        recipient: smartContract.channelRecipient.toLowerCase(),
        sender: smartContract.channelSender.toLowerCase(),
      },
      include: {
        vendor: true,
      },
    });

    return transformChannelResponse(channel);
  }

  async findByContractAddress(contractAddress: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { contractAddress },
      include: {
        vendor: true,
      },
    });

    if (!channel) return null;
    return transformChannelResponse(channel);
  }

  async findById(id: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id },
      include: {
        vendor: true,
      },
    });

    if (!channel) return null;
    return transformChannelResponse(channel);
  }

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [total, channels] = await Promise.all([
      this.prisma.channel.count(),
      this.prisma.channel.findMany({
        skip,
        take: limit,
        include: {
          vendor: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    const pages = Math.ceil(total / limit);

    return {
      channels: channels.map(transformChannelResponse),
      pagination: {
        total,
        page,
        limit,
        pages,
      },
    };
  }

  async update(id: string, data: UpdateChannelInput) {
    // If vendorId is being updated, verify the new vendor exists
    if (data.vendorId) {
      const vendor = await this.prisma.vendor.findUnique({
        where: { id: data.vendorId },
      });

      if (!vendor) {
        throw new Error("Vendor not found");
      }
    }

    const channel = await this.prisma.channel.update({
      where: { id },
      data,
      include: {
        vendor: true,
      },
    });

    return transformChannelResponse(channel);
  }

  async delete(id: string) {
    await this.prisma.channel.delete({
      where: { id },
    });
  }

  async findByVendor(vendorId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [total, channels] = await Promise.all([
      this.prisma.channel.count({
        where: { vendorId },
      }),
      this.prisma.channel.findMany({
        where: { vendorId },
        skip,
        take: limit,
        include: {
          vendor: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    const pages = Math.ceil(total / limit);

    return {
      channels: channels.map(transformChannelResponse),
      pagination: {
        total,
        page,
        limit,
        pages,
      },
    };
  }

  async findBySender(sender: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [total, channels] = await Promise.all([
      this.prisma.channel.count({
        where: { sender: sender.toLowerCase() },
      }),
      this.prisma.channel.findMany({
        where: { sender: sender.toLowerCase() },
        skip,
        take: limit,
        include: {
          vendor: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    const pages = Math.ceil(total / limit);

    return {
      channels: channels.map(transformChannelResponse),
      pagination: {
        total,
        page,
        limit,
        pages,
      },
    };
  }

  async closeChannel(
    channelId: string,
    vendorId: string,
    settlementTx?: string
  ) {
    // Verify channel exists and belongs to the vendor
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new Error("Channel not found");
    }

    if (channel.vendorId !== vendorId) {
      throw new Error("Unauthorized: Vendor does not own this channel");
    }

    if (channel.status === ChannelStatus.CLOSED) {
      throw new Error("Channel is already closed");
    }

    const closedChannel = await this.prisma.channel.update({
      where: { id: channelId },
      data: {
        status: ChannelStatus.CLOSED,
        closedAt: new Date(),
        settlementTx: settlementTx || undefined,
      },
      include: {
        vendor: true,
      },
    });

    return transformChannelResponse(closedChannel);
  }
}
