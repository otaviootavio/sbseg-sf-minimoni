import { IndexedDBClient } from "./indexedDBClient";
import {
  HashchainData,
  ImportHashchainData,
  PublicHashchainData,
  VendorData,
} from "./types";
import { keccak256, toHex } from "viem";

export class HashchainRepository {
  public readonly SELECTED_KEY = "selected_hashchain";
  private db: IndexedDBClient;

  constructor() {
    this.db = new IndexedDBClient("hashchain_db", "hashchains", 1);
  }

  private generateHashChain(
    secret: string,
    length: number
  ): { chain: string[]; tail: string } {
    const chain: string[] = [];
    let currentHash = toHex(secret);

    for (let i = 0; i < length; i++) {
      currentHash = keccak256(currentHash);
      chain.unshift(currentHash);
    }

    const tail = keccak256(currentHash);

    return { chain, tail };
  }

  private toPublicData(data: HashchainData): PublicHashchainData {
    const { hashes, secret, ...publicData } = data;
    return { ...publicData, hasSecret: !!secret };
  }

  async createHashchain(
    vendorData: VendorData,
    secret: string
  ): Promise<string> {
    const hashchainId = `${Date.now()}_${crypto.randomUUID()}`;
    await this.db.put(hashchainId, {
      vendorData,
      secret,
      hashes: [],
      lastIndex: 0,
      createdAt: Date.now(),
    });
    return hashchainId;
  }

  async getHashchain(hashchainId: string): Promise<PublicHashchainData | null> {
    const data = await this.db.get<HashchainData>(hashchainId);
    if (!data) return null;
    return this.toPublicData(data);
  }

  async selectHashchain(hashchainId: string | null): Promise<void> {
    await this.db.put(this.SELECTED_KEY, { selectedHashchainId: hashchainId });

    // Directly broadcast to all tabs since we're already in the background
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id) {
          console.log(
            "Background: sending hashchain selection change to tab",
            tab.id
          );
          chrome.tabs.sendMessage(
            tab.id,
            {
              type: "HASHCHAIN_SELECTION_CHANGED",
              hashchainId: hashchainId,
            },
            () => {
              const lastError = chrome.runtime.lastError;
              // Ignore the error - this just means the tab isn't ready
              if (lastError) {
                console.debug(
                  `Could not send message to tab ${tab.id}:`,
                  lastError.message
                );
              }
            }
          );
        }
      });
    });
  }

  async getSelectedHashchain(): Promise<{
    hashchainId: string;
    data: PublicHashchainData;
  } | null> {
    const selected = await this.db.get<{ selectedHashchainId: string }>(
      this.SELECTED_KEY
    );
    if (!selected?.selectedHashchainId) return null;

    const data = await this.db.get<HashchainData>(selected.selectedHashchainId);
    if (!data) return null;

    return {
      hashchainId: selected.selectedHashchainId,
      data: this.toPublicData(data),
    };
  }

  async getSecret(hashchainId: string): Promise<string | null> {
    const data = await this.db.get<HashchainData>(hashchainId);
    return data?.secret || null;
  }

  async getNextHash(hashchainId: string): Promise<string | null> {
    const data = await this.db.get<HashchainData>(hashchainId);
    if (!data || data.lastIndex >= data.hashes.length) return null;

    const hash = data.hashes[data.lastIndex];
    await this.db.put(hashchainId, {
      ...data,
      lastIndex: data.lastIndex + 1,
    });

    return hash;
  }

  async getFullHashchain(hashchainId: string): Promise<string[]> {
    const data = await this.db.get<HashchainData>(hashchainId);
    return data?.hashes || [];
  }

  async syncHashchainIndex(
    hashchainId: string,
    newIndex: number
  ): Promise<void> {
    const data = await this.db.get<HashchainData>(hashchainId);
    if (!data) return;

    await this.db.put(hashchainId, {
      ...data,
      lastIndex: newIndex,
    });
  }

  async updateHashchain(
    hashchainId: string,
    updateData: Partial<HashchainData>
  ): Promise<void> {
    const existingData = await this.db.get<HashchainData>(hashchainId);
    if (!existingData) return;

    // if there exists a contract address, we can't update it
    if (!!existingData.contractAddress && !!updateData.contractAddress) {
      throw new Error("Contract address already exists");
    }

    // TODO: Here we are storing all data
    // In the future we may just store the secret and then
    // compute the hashes on the fly
    if (updateData.numHashes) {
      const { chain, tail } = this.generateHashChain(
        existingData.secret,
        parseInt(updateData.numHashes.toString())
      );
      updateData.hashes = chain;
      updateData.lastIndex = 0;
      updateData.tail = tail;
    }

    console.log("Updating hashchain", hashchainId, updateData);
    await this.db.put(hashchainId, {
      ...existingData,
      ...updateData,
    });
  }

  async importHashchain(data: ImportHashchainData): Promise<string> {
    const hashchainId = `${Date.now()}_${crypto.randomUUID()}`;
    await this.db.put(hashchainId, {
      vendorData: data.vendorData,
      secret: data.hash,
      hashes: [data.hash],
      lastIndex: data.lastIndex,
      contractAddress: data.contractAddress,
      numHashes: data.numHashes,
      totalAmount: data.totalAmount,
      createdAt: Date.now(),
    });
    return hashchainId;
  }

  async getAllHashchains(): Promise<
    { id: string; data: PublicHashchainData }[]
  > {
    const allData = await this.db.getAll<{ id: string } & HashchainData>();

    console.log(allData);
    return allData.map(({ id, ...data }) => ({
      id,
      data: this.toPublicData(data),
    }));
  }

  async deleteHashchain(hashchainId: string): Promise<void> {
    await this.db.delete(hashchainId);
  }
}
