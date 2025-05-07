import {
  HashchainData,
  HashchainId,
  ImportHashchainData,
  PublicHashchainData,
  VendorData,
} from "@/types";
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";

export interface StorageInterface {
  createHashchain: (
    vendorData: VendorData,
    secret: string
  ) => Promise<HashchainId>;
  getHashchain: (
    hashchainId: HashchainId
  ) => Promise<PublicHashchainData | null>;
  selectHashchain: (hashchainId: HashchainId | null) => Promise<void>;
  getSelectedHashchain: () => Promise<{
    hashchainId: HashchainId;
    data: PublicHashchainData;
  } | null>;
  // NEED SECRET AUTH
  getSecret: (hashchainId: HashchainId) => Promise<string | null>;
  getNextHash: (hashchainId: HashchainId) => Promise<string | null>;
  getFullHashchain: (hashchainId: HashchainId) => Promise<string[]>;
  // END OF SECRET AUTH
  syncHashchainIndex: (
    hashchainId: HashchainId,
    newIndex: number
  ) => Promise<void>;
  updateHashchain: (
    hashchainId: HashchainId,
    data: Partial<HashchainData>
  ) => Promise<void>;
  importHashchain: (data: ImportHashchainData) => Promise<HashchainId>;
  onHashchainChange: (listener: () => void) => () => void;
  onAuthStatusChange: (listener: () => void) => () => void;
  requestConnection: () => Promise<void>;
  requestSecretConnection: () => Promise<void>;
  getAuthStatus: () => Promise<{
    basicAuth: boolean;
    secretAuth: boolean;
  } | null>;
}

interface HashchainContextType {
  selectedHashchain: {
    hashchainId: HashchainId;
    data: PublicHashchainData;
  } | null;
  loading: boolean;
  error: Error | null;
  initializeHashchain: (vendorData: VendorData) => Promise<HashchainId>;
  selectHashchain: (hashchainId: HashchainId) => Promise<void>;
  getSelectedHashchain: () => Promise<{
    hashchainId: HashchainId;
    data: PublicHashchainData;
  } | null>;
  getNextHash: () => Promise<string | null>;
  getAllHashes: () => Promise<string[]>;
  syncIndex: (newIndex: number) => Promise<void>;
  getSecret: () => Promise<string | null>;
  updateContractDetails: (details: {
    contractAddress?: string;
    numHashes: string;
    totalAmount: string;
  }) => Promise<void>;
  importHashchain: (data: ImportHashchainData) => Promise<void>;
  requestConnection: () => Promise<void>;
  authStatus: {
    basicAuth: boolean;
    secretAuth: boolean;
  } | null;
  requestSecretConnection: () => Promise<void>;
}

const HashchainContext = createContext<HashchainContextType | null>(null);

interface HashchainProviderProps {
  children: React.ReactNode;
  storage: StorageInterface;
}

export const HashchainProvider: React.FC<HashchainProviderProps> = ({
  children,
  storage,
}) => {
  const [selectedHashchain, setSelectedHashchain] = useState<{
    hashchainId: HashchainId;
    data: PublicHashchainData;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const initializationAttempted = useRef(false);
  const initializationTimeoutId = useRef<NodeJS.Timeout>();
  const [authStatus, setAuthStatus] = useState<{
    basicAuth: boolean;
    secretAuth: boolean;
  } | null>(null);

  const withLoadingAndError = async <T,>(
    operation: () => Promise<T>,
    skipLoading: boolean = false
  ): Promise<T> => {
    if (!skipLoading) setLoading(true);
    setError(null);
    try {
      return await operation();
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Unknown error occurred");
      setError(error);
      throw error;
    } finally {
      if (!skipLoading) setLoading(false);
    }
  };

  const requestConnection = useCallback(async () => {
    return withLoadingAndError(async () => {
      await storage.requestConnection();
    });
  }, [storage]);

  const requestSecretConnection = useCallback(async () => {
    return withLoadingAndError(async () => {
      await storage.requestSecretConnection();
    });
  }, [storage]);

  const refreshSelectedHashchain = useCallback(async () => {
    try {
      const stored = await storage.getSelectedHashchain();
      setSelectedHashchain(stored);
    } catch (error) {
      console.error("Failed to refresh selected hashchain:", error);
      if (error instanceof Error && !error.message.includes("timeout")) {
        setSelectedHashchain(null);
      }
    }
  }, [storage]);

  const refreshAuthStatus = useCallback(async () => {
    try {
      const status = await storage.getAuthStatus();
      // ✅ Always create new object
      setAuthStatus(
        status
          ? { basicAuth: status.basicAuth, secretAuth: status.secretAuth }
          : { basicAuth: false, secretAuth: false }
      );
    } catch (error) {
      setAuthStatus({ basicAuth: false, secretAuth: false });
    }
  }, [storage]);

  const initializeHashchain = useCallback(
    async (vendorData: VendorData) => {
      return withLoadingAndError(async () => {
        const secret = `initial_secret_${Date.now()}`;
        const hashchainId = await storage.createHashchain(vendorData, secret);

        const hashchain = await storage.getHashchain(hashchainId);
        if (!hashchain) throw new Error("Failed to create hashchain");

        await storage.selectHashchain(hashchainId);
        setSelectedHashchain({ hashchainId, data: hashchain });

        return hashchainId;
      });
    },
    [storage]
  );

  const selectHashchain = useCallback(
    async (hashchainId: HashchainId | null) => {
      return withLoadingAndError(async () => {
        if (hashchainId === null) {
          await storage.selectHashchain(null);
          setSelectedHashchain(null);
          return;
        }

        const hashchain = await storage.getHashchain(hashchainId);
        if (!hashchain) throw new Error("Hashchain not found");

        await storage.selectHashchain(hashchainId);
        setSelectedHashchain({ hashchainId, data: hashchain });
      });
    },
    [storage]
  );

  const getNextHash = useCallback(async () => {
    return withLoadingAndError(async () => {
      if (!selectedHashchain) throw new Error("No hashchain selected");

      const hash = await storage.getNextHash(selectedHashchain.hashchainId);
      if (hash) {
        const updatedHashchain = await storage.getHashchain(
          selectedHashchain.hashchainId
        );
        if (updatedHashchain) {
          setSelectedHashchain({
            hashchainId: selectedHashchain.hashchainId,
            data: updatedHashchain,
          });
        }
      }
      return hash;
    });
  }, [selectedHashchain, storage]);

  const getAllHashes = useCallback(async () => {
    return withLoadingAndError(async () => {
      if (!selectedHashchain) throw new Error("No hashchain selected");
      return storage.getFullHashchain(selectedHashchain.hashchainId);
    });
  }, [selectedHashchain, storage]);

  const getSecret = useCallback(async () => {
    return withLoadingAndError(async () => {
      if (!selectedHashchain) throw new Error("No hashchain selected");
      return storage.getSecret(selectedHashchain.hashchainId);
    });
  }, [selectedHashchain, storage]);

  const syncIndex = useCallback(
    async (newIndex: number) => {
      return withLoadingAndError(async () => {
        if (!selectedHashchain) throw new Error("No hashchain selected");

        await storage.syncHashchainIndex(
          selectedHashchain.hashchainId,
          newIndex
        );

        const updatedHashchain = await storage.getHashchain(
          selectedHashchain.hashchainId
        );
        if (!updatedHashchain) throw new Error("Failed to sync index");

        setSelectedHashchain({
          hashchainId: selectedHashchain.hashchainId,
          data: updatedHashchain,
        });
      });
    },
    [selectedHashchain, storage]
  );

  const updateContractDetails = useCallback(
    async (details: {
      contractAddress?: string;
      numHashes: string;
      totalAmount: string;
    }) => {
      return withLoadingAndError(async () => {
        if (!selectedHashchain) throw new Error("No hashchain selected");

        await storage.updateHashchain(selectedHashchain.hashchainId, details);
        
        const updatedHashchain = await storage.getHashchain(
          selectedHashchain.hashchainId
        );
        if (!updatedHashchain)
          throw new Error("Failed to update contract details");

        setSelectedHashchain({
          hashchainId: selectedHashchain.hashchainId,
          data: updatedHashchain,
        });
      });
    },
    [selectedHashchain, storage]
  );

  const getSelectedHashchain = useCallback(async () => {
    return withLoadingAndError(async () => {
      const hashchain = await storage.getSelectedHashchain();
      if (!hashchain) {
        setSelectedHashchain(null);
        throw new Error("No hashchain selected");
      }
      setSelectedHashchain(hashchain);
      return hashchain;
    });
  }, [storage, selectedHashchain]);

  const importHashchain = useCallback(
    async (data: ImportHashchainData) => {
      return withLoadingAndError(async () => {
        const hashchainId = await storage.importHashchain(data);

        const hashchain = await storage.getHashchain(hashchainId);
        if (!hashchain) throw new Error("Failed to import hashchain");

        await storage.selectHashchain(hashchainId);
        setSelectedHashchain({ hashchainId, data: hashchain });
      });
    },
    [storage]
  );

  const getAuthStatus = useCallback(async () => {
    return withLoadingAndError(async () => {
      const status = await storage.getAuthStatus();
      setAuthStatus(status);
      return status;
    });
  }, [storage]);

  React.useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      if (initializationAttempted.current) return;
      initializationAttempted.current = true;

      const auth = await getAuthStatus();
      if (!auth?.basicAuth) return;

      try {
        await new Promise((resolve) => setTimeout(resolve, 100));
        await refreshSelectedHashchain();
        await refreshAuthStatus();
      } catch (error) {
        console.error("Failed initial hashchain load:", error);
        if (
          mounted &&
          error instanceof Error &&
          error.message.includes("timeout")
        ) {
          if (initializationTimeoutId.current) {
            clearTimeout(initializationTimeoutId.current);
          }
          initializationTimeoutId.current = setTimeout(() => {
            initializationAttempted.current = false;
            initialize();
          }, 1000);
        }
      }
    };

    initialize();

    const unsubscribeFromHashchainChange = storage.onHashchainChange(() => {
      if (mounted) {
        console.log("Hashchain change detected, refreshing state");
        refreshSelectedHashchain();
      }
    });

    const unsubscribeFromAuthStatusChange = storage.onAuthStatusChange(
      async () => {
        if (mounted) {
          // Reset initialization flag to allow re-initialization
          initializationAttempted.current = false;
          await refreshAuthStatus();
          await refreshSelectedHashchain();
        }
      }
    );

    return () => {
      mounted = false;
      unsubscribeFromHashchainChange();
      unsubscribeFromAuthStatusChange();
      if (initializationTimeoutId.current) {
        clearTimeout(initializationTimeoutId.current);
      }
    };
  }, [storage, refreshSelectedHashchain, refreshAuthStatus, getAuthStatus]);

  const value: HashchainContextType = {
    selectedHashchain,
    loading,
    error,
    authStatus,
    initializeHashchain,
    selectHashchain,
    getNextHash,
    getAllHashes,
    syncIndex,
    updateContractDetails,
    importHashchain,
    getSelectedHashchain,
    getSecret,
    requestConnection,
    requestSecretConnection,
  };

  return (
    <HashchainContext.Provider value={value}>
      {children}
    </HashchainContext.Provider>
  );
};

export const useHashchain = () => {
  const context = useContext(HashchainContext);
  if (!context) {
    throw new Error("useHashchain must be used within a HashchainProvider");
  }
  return context;
};
