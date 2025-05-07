import { HashchainRepository } from "@src/pages/background/hashchainRepository";
import type {
  HashchainData,
  ImportHashchainData,
  PublicHashchainData,
  VendorData,
  HashchainId,
} from "@src/pages/background/types";
import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
} from "react";

// Helper function to generate HashchainId
const generateHashchainId = (): HashchainId => {
  return `${Date.now()}_${crypto.randomUUID()}`;
};

interface SelectedHashchain {
  hashchainId: HashchainId;
  data: PublicHashchainData;
}

interface HashchainListItem {
  id: HashchainId;
  data: PublicHashchainData;
}

interface HashchainContextType {
  // State
  selectedHashchain: SelectedHashchain | null;
  allHashchains: HashchainListItem[];
  loading: boolean;
  error: Error | null;

  // Methods
  createHashchain: (
    vendorData: VendorData,
    secret: string
  ) => Promise<HashchainId>;
  selectHashchain: (hashchainId: HashchainId | null) => Promise<void>;
  getSecret: (hashchainId: HashchainId) => Promise<string | null>;
  getNextHash: (hashchainId: HashchainId) => Promise<string | null>;
  getFullHashchain: (hashchainId: HashchainId) => Promise<string[]>;
  syncHashchainIndex: (
    hashchainId: HashchainId,
    newIndex: number
  ) => Promise<void>;
  updateHashchain: (
    hashchainId: HashchainId,
    updateData: Partial<HashchainData>
  ) => Promise<void>;
  importHashchain: (data: ImportHashchainData) => Promise<HashchainId>;
  refreshHashchains: () => Promise<void>;
  deleteHashchain: (hashchainId: HashchainId) => Promise<void>;
}

const HashchainContext = createContext<HashchainContextType | null>(null);

export const HashchainProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [repository] = useState(() => new HashchainRepository());
  const [selectedHashchain, setSelectedHashchain] =
    useState<SelectedHashchain | null>(null);
  const [allHashchains, setAllHashchains] = useState<HashchainListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refreshHashchains = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [selected, all] = await Promise.all([
        repository.getSelectedHashchain(),
        repository.getAllHashchains(),
      ]);

      // Sort hashchains by creation date (newest first)
      const sortedHashchains = [...all].sort((a, b) => {
        // Safely extract timestamps, default to 0 if format is invalid
        const timestampA = a.id?.split("_")?.[0] || "0";
        const timestampB = b.id?.split("_")?.[0] || "0";
        return Number(timestampB) - Number(timestampA);
      });

      setSelectedHashchain(selected);
      setAllHashchains(sortedHashchains);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch hashchains")
      );
    } finally {
      setLoading(false);
    }
  }, [repository]);

  useEffect(() => {
    refreshHashchains();
  }, [refreshHashchains]);

  const createHashchain = useCallback(
    async (vendorData: VendorData, secret: string): Promise<HashchainId> => {
      const hashchainId = await repository.createHashchain(vendorData, secret);
      await refreshHashchains();
      return hashchainId;
    },
    [repository, refreshHashchains]
  );

  const selectHashchain = useCallback(
    async (hashchainId: HashchainId | null): Promise<void> => {
      await repository.selectHashchain(hashchainId);
      await refreshHashchains();
    },
    [repository, refreshHashchains]
  );

  const getSecret = useCallback(
    (hashchainId: HashchainId): Promise<string | null> => {
      return repository.getSecret(hashchainId);
    },
    [repository]
  );

  const getNextHash = useCallback(
    async (hashchainId: HashchainId): Promise<string | null> => {
      const hash = await repository.getNextHash(hashchainId);
      await refreshHashchains();
      return hash;
    },
    [repository, refreshHashchains]
  );

  const getFullHashchain = useCallback(
    (hashchainId: HashchainId): Promise<string[]> => {
      return repository.getFullHashchain(hashchainId);
    },
    [repository]
  );

  const syncHashchainIndex = useCallback(
    async (hashchainId: HashchainId, newIndex: number): Promise<void> => {
      await repository.syncHashchainIndex(hashchainId, newIndex);
      await refreshHashchains();
    },
    [repository, refreshHashchains]
  );

  const updateHashchain = useCallback(
    async (
      hashchainId: HashchainId,
      updateData: Partial<HashchainData>
    ): Promise<void> => {
      await repository.updateHashchain(hashchainId, updateData);
      await refreshHashchains();
    },
    [repository, refreshHashchains]
  );

  const importHashchain = useCallback(
    async (data: ImportHashchainData): Promise<HashchainId> => {
      const hashchainId = await repository.importHashchain(data);
      await refreshHashchains();
      return hashchainId;
    },
    [repository, refreshHashchains]
  );

  const deleteHashchain = useCallback(
    async (hashchainId: HashchainId): Promise<void> => {
      // If we're deleting the currently selected hashchain, clear the selection first
      if (selectedHashchain?.hashchainId === hashchainId) {
        await repository.selectHashchain(null);
      }

      await repository.deleteHashchain(hashchainId);
      await refreshHashchains();
    },
    [repository, refreshHashchains, selectedHashchain?.hashchainId]
  );

  const contextValue: HashchainContextType = {
    selectedHashchain,
    allHashchains,
    loading,
    error,
    createHashchain,
    selectHashchain,
    getSecret,
    getNextHash,
    getFullHashchain,
    syncHashchainIndex,
    updateHashchain,
    importHashchain,
    refreshHashchains,
    deleteHashchain,
  };

  return (
    <HashchainContext.Provider value={contextValue}>
      {children}
    </HashchainContext.Provider>
  );
};

// Custom hooks
export const useHashchain = (): HashchainContextType => {
  const context = useContext(HashchainContext);
  if (!context) {
    throw new Error("useHashchain must be used within a HashchainProvider");
  }
  return context;
};

export const useHashchainList = () => {
  const { allHashchains, loading, error } = useHashchain();
  return {
    hashchains: allHashchains,
    loading,
    error,
  };
};

export const useSelectedHashchain = () => {
  const { selectedHashchain, loading, error } = useHashchain();
  return {
    selectedHashchain,
    loading,
    error,
  };
};
