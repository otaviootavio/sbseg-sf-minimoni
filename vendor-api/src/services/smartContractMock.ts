export class SmartContractMock {
  private details: {
    vendorAddress: string;
    userAddress: string;
    tailHash: string;
    chainId: number;
    isClosed: boolean;
  };

  constructor(config: {
    vendorAddress: string;
    userAddress: string;
    tailHash: string;
    chainId: number;
  }) {
    this.details = { ...config, isClosed: false };
  }

  async getChannelDetails() {
    return {
      vendorAddress: this.details.vendorAddress,
      userAddress: this.details.userAddress,
      tailHash: this.details.tailHash,
      chainId: this.details.chainId,
      isClosed: this.details.isClosed,
    };
  }

  async closeChannel(finalHash: string, index: number) {
    if (this.details.isClosed) {
      throw new Error("Channel already closed");
    }

    if (finalHash !== this.details.tailHash) {
      throw new Error("Invalid final hash");
    }

    this.details.isClosed = true;
    return "0xmock_tx_hash";
  }
}
