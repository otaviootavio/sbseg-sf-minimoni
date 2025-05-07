import { useState, useEffect, useRef } from "react";
import { Clock, Trash2, RefreshCw } from "lucide-react";
import {
  useActiveWebsites,
  useWebsiteAuth,
} from "@src/pages/auth/context/WebsiteAuthContext";
import type { WebsiteAuth } from "@src/pages/background/auth.types";

export const WebsiteList = () => {
  const { deactivateAccess, refreshAuthList } = useWebsiteAuth();
  const { websites, loading, error } = useActiveWebsites();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const forceUpdateRef = useRef<() => void>(() => {});
  const [, forceUpdate] = useState({});

  // Create a force update function using ref
  useEffect(() => {
    forceUpdateRef.current = () => forceUpdate({});
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshAuthList();
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    handleRefresh();

    // Set up live update interval
    intervalRef.current = setInterval(() => {
      forceUpdateRef.current();
    }, 50); // Update every 50ms for smooth seconds display

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const formatTime = (ms: number) => {
    if (ms <= 0) return "Expired";
    const absoluteMs = Math.abs(ms);
    const hours = Math.floor(absoluteMs / 3600000);
    const minutes = Math.floor((absoluteMs % 3600000) / 60000);
    const seconds = Math.floor((absoluteMs % 60000) / 1000);

    return [
      hours > 0 ? `${hours}h` : null,
      minutes > 0 ? `${minutes}m` : null,
      `${seconds}s`,
    ]
      .filter(Boolean)
      .join(" ");
  };

  const getAuthDetails = (website: WebsiteAuth) => {
    const now = Date.now();
    return {
      basic: website.basicAuth
        ? {
            remaining: website.startTime + website.basicAccessDuration - now,
            duration: website.basicAccessDuration,
          }
        : null,
      secret: website.secretAuth
        ? {
            remaining: website.startTime + website.secretAccessDuration - now,
            duration: website.secretAccessDuration,
          }
        : null,
    };
  };

  const renderContent = () => {
    if (loading || isRefreshing) {
      return (
        <div className="text-center p-4 text-gray-400">Loading websites...</div>
      );
    }

    if (error) {
      return <div className="text-red-400 p-4 text-sm">{error.message}</div>;
    }

    if (!websites || websites.length === 0) {
      return (
        <div className="text-center p-4 text-gray-400">No active websites</div>
      );
    }

    return (
      <ul className="w-full flex flex-col gap-2">
        {websites.map((website) => {
          const authDetails = getAuthDetails(website);
          return (
            <li
              key={website.url}
              className="bg-gray-800 rounded-lg transition-colors hover:bg-gray-700"
            >
              <div className="p-3 flex items-center justify-between">
                <div className="flex-1">
                  <div className="truncate text-sm text-gray-300 mb-1">
                    {website.url}
                  </div>
                  <div className="flex flex-col gap-1 text-xs text-gray-400">
                    {authDetails.basic && (
                      <div className="flex items-center gap-1">
                        <Clock size={14} className="flex-shrink-0" />
                        <span>
                          Basic: {formatTime(authDetails.basic.remaining)} /
                          <span className="text-gray-500 ml-1">
                            ({formatTime(authDetails.basic.duration)})
                          </span>
                        </span>
                      </div>
                    )}
                    {authDetails.secret && (
                      <div className="flex items-center gap-1 text-purple-400">
                        <Clock size={14} className="flex-shrink-0" />
                        <span>
                          Secret: {formatTime(authDetails.secret.remaining)} /
                          <span className="text-purple-300 ml-1">
                            ({formatTime(authDetails.secret.duration)})
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => deactivateAccess(website.url)}
                  className="p-1.5 text-red-400 hover:bg-red-900/50 rounded-md transition-colors"
                  title="Revoke Access"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="w-full mx-auto p-4 bg-gray-900 rounded-lg shadow-md flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-medium text-gray-400">Active Websites</h2>
        <button
          onClick={handleRefresh}
          disabled={loading || isRefreshing}
          className="p-1.5 bg-gray-800 text-gray-400 hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
          title="Refresh list"
        >
          <RefreshCw
            size={18}
            className={loading || isRefreshing ? "animate-spin" : ""}
          />
        </button>
      </div>

      {renderContent()}
    </div>
  );
};

export default WebsiteList;
