-- CreateEnum
CREATE TYPE "ChannelStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "amountPerHash" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Channel" (
    "id" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "numHashes" INTEGER NOT NULL,
    "lastIndex" INTEGER NOT NULL,
    "tail" TEXT NOT NULL,
    "totalAmount" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "ChannelStatus" NOT NULL DEFAULT 'OPEN',
    "closedAt" TIMESTAMP(3),
    "settlementTx" TEXT,

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "xHash" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "index" INTEGER NOT NULL,
    "channelId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_address_key" ON "Vendor"("address");

-- CreateIndex
CREATE UNIQUE INDEX "Channel_contractAddress_key" ON "Channel"("contractAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Channel_settlementTx_key" ON "Channel"("settlementTx");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_xHash_key" ON "Payment"("xHash");

-- AddForeignKey
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
