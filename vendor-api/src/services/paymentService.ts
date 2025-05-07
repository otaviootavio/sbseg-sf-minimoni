import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { createPaymentSchema } from "../schemas/payment";
import { Address } from "viem";

export class PaymentService {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: z.infer<typeof createPaymentSchema>) {
    // First verify the vendor exists
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: data.vendorId },
    });

    if (!vendor) {
      throw new Error("Vendor not found");
    }

    // Verify the channel exists and belongs to the vendor
    const channel = await this.prisma.channel.findFirst({
      where: {
        vendorId: data.vendorId,
        contractAddress: data.contractAddress,
      },
    });

    if (!channel) {
      throw new Error("Channel not found or does not belong to the vendor");
    }

    // Verify hash hasn't been used before
    const existingPayment = await this.prisma.payment.findFirst({
      where: { xHash: data.xHash },
    });

    if (existingPayment) {
      throw new Error("Hash has already been used");
    }

    // Verify amount matches vendor's amountPerHash
    if (data.amount !== vendor.amountPerHash) {
      throw new Error(
        `Invalid amount. Expected ${vendor.amountPerHash}, got ${data.amount}`
      );
    }

    // Create payment and update channel in a transaction
    const [payment] = await this.prisma.$transaction([
      this.prisma.payment.create({
        data: {
          xHash: data.xHash,
          amount: data.amount,
          index: data.index,
          vendorId: data.vendorId,
          channelId: channel.id,
        },
        include: {
          vendor: true,
          channel: true,
        },
      }),
      this.prisma.channel.update({
        where: { id: channel.id },
        data: {
          lastIndex: data.index,
        },
      }),
    ]);

    return payment;
  }

  async findById(id: string) {
    return this.prisma.payment.findUnique({
      where: { id },
      include: {
        vendor: true,
        channel: true,
      },
    });
  }

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [total, payments] = await Promise.all([
      this.prisma.payment.count(),
      this.prisma.payment.findMany({
        skip,
        take: limit,
        include: {
          vendor: true,
          channel: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    const pages = Math.ceil(total / limit);

    return {
      payments,
      pagination: {
        total,
        page,
        limit,
        pages,
      },
    };
  }

  async findByVendor(vendorId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [total, payments] = await Promise.all([
      this.prisma.payment.count({
        where: { vendorId },
      }),
      this.prisma.payment.findMany({
        where: { vendorId },
        skip,
        take: limit,
        include: {
          vendor: true,
          channel: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    const pages = Math.ceil(total / limit);

    return {
      payments,
      pagination: {
        total,
        page,
        limit,
        pages,
      },
    };
  }

  async findByChannel(channelId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [total, payments] = await Promise.all([
      this.prisma.payment.count({
        where: { channelId },
      }),
      this.prisma.payment.findMany({
        where: { channelId },
        skip,
        take: limit,
        include: {
          vendor: true,
          channel: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    const pages = Math.ceil(total / limit);

    return {
      payments,
      pagination: {
        total,
        page,
        limit,
        pages,
      },
    };
  }

  async findBySmartContract(
    smartContractAddress: string,
    page = 1,
    limit = 10
  ) {
    const skip = (page - 1) * limit;

    const channel = await this.prisma.channel.findFirst({
      where: { contractAddress: smartContractAddress },
    });

    if (!channel) {
      throw new Error("Channel not found");
    }

    const [total, payments] = await Promise.all([
      this.prisma.payment.count({
        where: { channelId: channel.id },
      }),
      this.prisma.payment.findMany({
        where: { channelId: channel.id },
        skip,
        take: limit,
        include: {
          vendor: true,
          channel: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    const pages = Math.ceil(total / limit);

    return {
      payments,
      pagination: {
        total,
        page,
        limit,
        pages,
      },
    };
  }

  async verifyHash(xHash: string): Promise<boolean> {
    const existingPayment = await this.prisma.payment.findFirst({
      where: { xHash },
    });

    // Se existir um pagamento com esse hash, ele não é válido (já foi usado)
    return !existingPayment;
  }

  async getLatestPaymentBySmartContractAddress(smartContractAddress: Address) {
    const channel = await this.prisma.channel.findFirst({
      where: { contractAddress: smartContractAddress },
    });

    if (!channel) {
      throw new Error("Channel not found");
    }

    const payment = await this.prisma.payment.findFirst({
      where: { channelId: channel.id },
      include: {
        vendor: true,
        channel: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return payment;
  }
}
