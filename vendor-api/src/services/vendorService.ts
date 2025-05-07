import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { createVendorSchema, updateVendorSchema } from "../schemas/vendor";

export class VendorAlreadyExistsError extends Error {
  constructor(address: string) {
    super(`Vendor with address "${address}" already exists`);
    this.name = 'VendorAlreadyExistsError';
  }
}

export class VendorService {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: z.infer<typeof createVendorSchema>) {
    const existingVendor = await this.prisma.vendor.findUnique({
      where: { address: data.address }
    });
    
    if (existingVendor) {
      throw new VendorAlreadyExistsError(data.address);
    }
    
    return this.prisma.vendor.create({
      data,
      include: {
        channels: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.vendor.findUnique({
      where: { id },
      include: {
        channels: true,
      },
    });
  }

  async findByAddress(address: string) {
    return this.prisma.vendor.findUnique({
      where: { address },
      include: {
        channels: true,
      },
    });
  }

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [total, vendors] = await Promise.all([
      this.prisma.vendor.count(),
      this.prisma.vendor.findMany({
        skip,
        take: limit,
        include: {
          channels: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    const pages = Math.ceil(total / limit);

    return {
      vendors,
      pagination: {
        total,
        page,
        limit,
        pages,
      },
    };
  }

  async update(id: string, data: z.infer<typeof updateVendorSchema>) {
    return this.prisma.vendor.update({
      where: { id },
      data,
      include: {
        channels: true,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.vendor.delete({
      where: { id },
    });
  }
}
