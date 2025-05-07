import { StorageInterface } from "@/context/HashchainProvider";
import { MessageBus } from "@/lib/MessageBus";
import {
  HashchainData,
  HashchainId,
  ImportHashchainData,
  PublicHashchainData,
  VendorData,
} from "@/types";

export class ExtensionStorage implements StorageInterface {
  private hashchainChangeListeners: Set<() => void> = new Set();
  private authStatusListeners: Set<() => void> = new Set();
  private messageBus: MessageBus;

  constructor() {
    this.messageBus = new MessageBus("WEBSITE");

    // Register hashchain change listener
    this.messageBus.registerHandler("HASHCHAIN_SELECTION_CHANGED", async () => {
      this.notifyHashchainChangeListeners();
      return null;
    });

    // Register auth status listener
    this.messageBus.registerHandler("AUTH_STATUS_CHANGED", async (payload) => {
      console.log("Browser: received auth status change with payload:", payload);
      this.notifyAuthStatusListeners();
      return null;
    });
  }

  async createHashchain(
    vendorData: VendorData,
    secret: string
  ): Promise<HashchainId> {
    return this.messageBus.sendMessage<HashchainId>("CREATE_HASHCHAIN", {
      vendorData,
      secret,
    });
  }

  async requestConnection(): Promise<void> {
    return this.messageBus.sendMessage<void>("REQUEST_CONNECTION", {});
  }

  async requestSecretConnection(): Promise<void> {
    return this.messageBus.sendMessage<void>("REQUEST_SECRET_CONNECTION", {});
  }

  async getHashchain(
    hashchainId: HashchainId
  ): Promise<PublicHashchainData | null> {
    return this.messageBus.sendMessage<PublicHashchainData | null>(
      "GET_HASHCHAIN",
      { hashchainId }
    );
  }

  async selectHashchain(hashchainId: HashchainId | null): Promise<void> {
    return this.messageBus.sendMessage<void>("SELECT_HASHCHAIN", {
      hashchainId,
    });
  }

  async getSelectedHashchain(): Promise<{
    hashchainId: HashchainId;
    data: PublicHashchainData;
  } | null> {
    return this.messageBus.sendMessage<{
      hashchainId: HashchainId;
      data: PublicHashchainData;
    } | null>("GET_SELECTED_HASHCHAIN", {});
  }

  async getAuthStatus(): Promise<{
    basicAuth: boolean;
    secretAuth: boolean;
  } | null> {
    const res = await this.messageBus.sendMessage<{
      basicAuth: boolean;
      secretAuth: boolean;
    } | null>("GET_AUTH_STATUS", {});

    return res
  }
  async getSecret(hashchainId: HashchainId): Promise<string | null> {
    return this.messageBus.sendMessage<string | null>("GET_SECRET", {
      hashchainId,
    });
  }

  async getNextHash(hashchainId: HashchainId): Promise<string | null> {
    return this.messageBus.sendMessage<string | null>("GET_NEXT_HASH", {
      hashchainId,
    });
  }

  async getFullHashchain(hashchainId: HashchainId): Promise<string[]> {
    return this.messageBus.sendMessage<string[]>("GET_FULL_HASHCHAIN", {
      hashchainId,
    });
  }

  async syncHashchainIndex(
    hashchainId: HashchainId,
    newIndex: number
  ): Promise<void> {
    return this.messageBus.sendMessage<void>("SYNC_HASHCHAIN_INDEX", {
      hashchainId,
      newIndex,
    });
  }

  async updateHashchain(
    hashchainId: HashchainId,
    data: Partial<HashchainData>
  ): Promise<void> {
    return this.messageBus.sendMessage<void>("UPDATE_HASHCHAIN", {
      hashchainId,
      data,
    });
  }

  async importHashchain(data: ImportHashchainData): Promise<HashchainId> {
    return this.messageBus.sendMessage<HashchainId>("IMPORT_HASHCHAIN", {
      data,
    });
  }

  onHashchainChange(listener: () => void): () => void {
    this.hashchainChangeListeners.add(listener);
    return () => {
      this.hashchainChangeListeners.delete(listener);
    };
  }

  onAuthStatusChange(listener: () => void): () => void {
    this.authStatusListeners.add(listener);
    return () => {
      this.authStatusListeners.delete(listener);
    };
  }

  private notifyHashchainChangeListeners(): void {
    this.hashchainChangeListeners.forEach((listener) => listener());
  }

  private notifyAuthStatusListeners(): void {
    this.authStatusListeners.forEach((listener) => listener());
  }

  public destroy(): void {
    this.messageBus.destroy();
    this.hashchainChangeListeners.clear();
  }
}
