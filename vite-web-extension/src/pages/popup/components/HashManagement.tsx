import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useHashchainList, useSelectedHashchain, useHashchain } from "../context/HashChainContext";
import type { HashchainId } from "@src/pages/background/types";

const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
};

const HashManagement: React.FC = () => {
  const navigate = useNavigate();
  const { hashchains, loading, error } = useHashchainList();
  const { selectedHashchain } = useSelectedHashchain();
  const { selectHashchain } = useHashchain();

  const sortedHashchains = useMemo(() => {
    return [...hashchains].sort((a, b) => {
      return b.data.createdAt - a.data.createdAt;
    });
  }, [hashchains]);

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error.message}</div>;
  }

  return (
    <div className="w-full mx-auto p-4 bg-gray-900 rounded-lg shadow-md flex flex-col">
      <div className="bg-gray-800 rounded-lg p-2 mb-4">
        <h2 className="text-sm font-medium text-gray-400 mb-1">Selected Hash Chain:</h2>
        {selectedHashchain ? (
          <p className="truncate text-sm text-gray-300">
            {selectedHashchain.hashchainId}
          </p>
        ) : (
          <p className="text-gray-400 text-center text-sm">No Hash Chain Selected</p>
        )}
      </div>

      <ul className="text-gray-300 w-full flex flex-col gap-2">
        {sortedHashchains.length > 0 ? (
          sortedHashchains.map(({ id, data }) => (
            <li 
              key={id} 
              className={`bg-gray-800 rounded-lg transition-colors ${
                id === selectedHashchain?.hashchainId 
                  ? "ring-2 ring-indigo-500" 
                  : ""
              }`}
            >
              <div className="p-2">
                <div className="truncate text-sm mb-1">{id}</div>
                <div className="text-xs text-gray-400 mb-2">
                  {formatRelativeTime(data.createdAt)}
                </div>
                <div className="flex gap-2">
                  <button
                    className={`flex-1 py-1 px-2 text-xs font-medium rounded-md
                      ${id === selectedHashchain?.hashchainId
                        ? "bg-indigo-900 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    onClick={() => selectHashchain(id)}
                  >
                    {id === selectedHashchain?.hashchainId ? "Selected" : "Select"}
                  </button>
                  <button
                    className="flex-1 py-1 px-2 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700"
                    onClick={() => navigate(`/hashchain/${encodeURIComponent(id)}`)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            </li>
          ))
        ) : (
          <li className="bg-gray-800 rounded-lg text-center p-4 text-gray-400">
            No hash chains found
          </li>
        )}
      </ul>
    </div>
  );
};

export default HashManagement;