import { WebsiteAuth } from "@src/pages/background/auth.types";
import { AuthRepository } from "@src/pages/background/authRepository";
import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
} from "react";

interface WebsiteAuthContextType {
  // State
  activeWebsites: WebsiteAuth[];
  loading: boolean;
  error: Error | null;

  // Methods
  grantBasicAccess: (url: string, duration: number) => Promise<void>;
  grantSecretAccess: (url: string, duration: number) => Promise<void>;
  hasValidBasicAccess: (url: string) => Promise<boolean>;
  hasValidSecretAccess: (url: string) => Promise<boolean>;
  getRemainingBasicTime: (url: string) => Promise<number | null>;
  getRemainingSecretTime: (url: string) => Promise<number | null>;
  deactivateAccess: (url: string) => Promise<void>;
  updateBasicDuration: (url: string, newDuration: number) => Promise<void>;
  updateSecretDuration: (url: string, newDuration: number) => Promise<void>;
  removeAuth: (url: string) => Promise<void>;
  refreshAuthList: () => Promise<void>;
}

const WebsiteAuthContext = createContext<WebsiteAuthContextType | null>(null);

export const WebsiteAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [repository] = useState(() => new AuthRepository());
  const [activeWebsites, setActiveWebsites] = useState<WebsiteAuth[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refreshAuthList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const websites = await repository.getAllActiveAuth();
      const sortedWebsites = [...websites].sort(
        (a, b) => b.startTime - a.startTime
      );
      setActiveWebsites(sortedWebsites);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch auth list")
      );
    } finally {
      setLoading(false);
    }
  }, [repository]);

  useEffect(() => {
    refreshAuthList();
  }, [refreshAuthList]);

  const grantBasicAccess = useCallback(
    async (url: string, duration: number) => {
      await repository.grantBasicAccess(url, duration);
      await refreshAuthList();
    },
    [repository, refreshAuthList]
  );

  const grantSecretAccess = useCallback(
    async (url: string, duration: number) => {
      await repository.grantSecretAccess(url, duration);
      await refreshAuthList();
    },
    [repository, refreshAuthList]
  );

  const hasValidBasicAccess = useCallback(
    (url: string) => {
      return repository.hasValidBasicAccess(url);
    },
    [repository]
  );

  const hasValidSecretAccess = useCallback(
    (url: string) => {
      return repository.hasValidSecretAccess(url);
    },
    [repository]
  );

  const getRemainingBasicTime = useCallback(
    (url: string) => {
      return repository.getRemainingBasicAccessTime(url);
    },
    [repository]
  );

  const getRemainingSecretTime = useCallback(
    (url: string) => {
      return repository.getRemainingSecretAccessTime(url);
    },
    [repository]
  );

  const deactivateAccess = useCallback(
    async (url: string) => {
      await repository.deactivateAccess(url);
      await refreshAuthList();
    },
    [repository, refreshAuthList]
  );

  const updateBasicDuration = useCallback(
    async (url: string, newDuration: number) => {
      await repository.updateBasicAccessDuration(url, newDuration);
      await refreshAuthList();
    },
    [repository, refreshAuthList]
  );

  const updateSecretDuration = useCallback(
    async (url: string, newDuration: number) => {
      await repository.updateSecretAccessDuration(url, newDuration);
      await refreshAuthList();
    },
    [repository, refreshAuthList]
  );

  const removeAuth = useCallback(
    async (url: string) => {
      await repository.removeAuth(url);
      await refreshAuthList();
    },
    [repository, refreshAuthList]
  );

  const contextValue: WebsiteAuthContextType = {
    activeWebsites,
    loading,
    error,
    grantBasicAccess,
    grantSecretAccess,
    hasValidBasicAccess,
    hasValidSecretAccess,
    getRemainingBasicTime,
    getRemainingSecretTime,
    deactivateAccess,
    updateBasicDuration,
    updateSecretDuration,
    removeAuth,
    refreshAuthList,
  };

  return (
    <WebsiteAuthContext.Provider value={contextValue}>
      {children}
    </WebsiteAuthContext.Provider>
  );
};

// Custom hooks
export const useWebsiteAuth = (): WebsiteAuthContextType => {
  const context = useContext(WebsiteAuthContext);
  if (!context)
    throw new Error("useWebsiteAuth must be used within a WebsiteAuthProvider");
  return context;
};

export const useActiveWebsites = () => {
  const { activeWebsites, loading, error } = useWebsiteAuth();
  return { websites: activeWebsites, loading, error };
};

export const useWebsiteStatus = (url: string) => {
  const { hasValidBasicAccess, getRemainingBasicTime, loading, error } =
    useWebsiteAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      const [access, time] = await Promise.all([
        hasValidBasicAccess(url),
        getRemainingBasicTime(url),
      ]);
      setHasAccess(access);
      setRemainingTime(time);
    };

    checkStatus();
    const interval = setInterval(checkStatus, 1000);
    return () => clearInterval(interval);
  }, [url, hasValidBasicAccess, getRemainingBasicTime]);

  return { hasAccess, remainingTime, loading, error };
};
