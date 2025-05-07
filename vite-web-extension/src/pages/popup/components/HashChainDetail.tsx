import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useHashchain } from "../context/HashChainContext";
import type { HashchainId, PublicHashchainData } from "@src/pages/background/types";
import FullHashchain from './FullHashchain';

interface DetailFieldProps {
  label: string;
  value: string | number | undefined;
  className?: string;
}

const DetailField: React.FC<DetailFieldProps> = ({ label, value, className }) => (
  <div className={`bg-gray-800 rounded-lg p-3 ${className || ''}`}>
    <label className="text-gray-400 text-sm block mb-1">{label}</label>
    <p className="font-mono text-white truncate">
      {value?.toString() || 'Not set'}
    </p>
  </div>
);

const HashChainDetail: React.FC = () => {
  const { key } = useParams<{ key: string }>();
  const navigate = useNavigate();
  const { 
    selectHashchain, 
    deleteHashchain,
    allHashchains,
    getSecret,
    getFullHashchain,
    loading: contextLoading 
  } = useHashchain();

  const [currentHashchain, setCurrentHashchain] = useState<{
    id: HashchainId;
    data: PublicHashchainData;
  } | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [fullHashchain, setFullHashchain] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHashchainData = async () => {
      if (!key) {
        setError("No hashchain ID provided");
        setLoading(false);
        return;
      }

      const fullHashchain = await getFullHashchain(key);
      setFullHashchain(fullHashchain);

      try {
        const hashchain = allHashchains.find(h => h.id === key);
        if (!hashchain) {
          setError("Hashchain not found");
          setLoading(false);
          return;
        }

        setCurrentHashchain(hashchain);

        // Load secret if available
        if (hashchain.data.hasSecret) {
          const secretValue = await getSecret(key);
          setSecret(secretValue);
        }
      } catch (err) {
        setError("Failed to load hashchain details");
      } finally {
        setLoading(false);
      }
    };

    if (!contextLoading) {
      loadHashchainData();
    }
  }, [key, allHashchains, contextLoading, getSecret]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading || contextLoading) {
    return (
      <div className="w-full p-4 bg-gray-900 rounded-lg shadow-md">
        <div className="text-center text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error || !currentHashchain) {
    return (
      <div className="w-full p-4 bg-gray-900 rounded-lg shadow-md">
        <div className="text-red-500 text-center">{error || "Hashchain not found"}</div>
        <button
          onClick={() => navigate("/manage")}
          className="mt-4 w-full py-2 px-4 bg-gray-600 text-white font-semibold rounded-md shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Back to management
        </button>
      </div>
    );
  }

  const { data } = currentHashchain;
  
  return (
    <div className="w-full p-4 bg-gray-900 rounded-lg shadow-md">
      <div className="gap-4 flex flex-col">
        {data.hasSecret && secret && (
          <DetailField 
            label="Secret" 
            value={secret}
            className="bg-indigo-900/30"
          />
        )}
        
        <DetailField 
          label="Vendor Address" 
          value={data.vendorData.vendorAddress}
        />
        
        <DetailField 
          label="Chain ID" 
          value={data.vendorData.chainId}
        />
        
        <DetailField 
          label="Amount Per Hash" 
          value={data.vendorData.amountPerHash}
        />
        
        <DetailField 
          label="Contract Address" 
          value={data.contractAddress}
        />
        
        <DetailField 
          label="Number of Hashes" 
          value={data.numHashes}
        />
        
        <DetailField 
          label="Last Index" 
          value={data.lastIndex}
        />

        <DetailField 
          label="Tail" 
          value={data.tail}
        />
        
        {data.totalAmount && (
          <DetailField 
            label="Total Amount" 
            value={data.totalAmount}
          />
        )}

        <DetailField 
          label="Created At" 
          value={formatDate(data.createdAt)}
        />
        <FullHashchain label="Full Hashchain" value={fullHashchain} />
      </div>

      <div className="flex flex-col gap-2 mt-6">
        <button
          onClick={async () => {
            if (!key) throw new Error("No hashchain ID provided");
            await selectHashchain(key);
            navigate("/manage");
          }}
          className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Select this hash chain
        </button>
        
        <button
          onClick={async () => {
            if (!key) throw new Error("No hashchain ID provided");

            // Delete the hashchain
            await deleteHashchain(key);

            navigate("/manage");
          }}
          className="w-full py-2 px-4 bg-red-600 text-white font-semibold rounded-md shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Delete this hash chain
        </button>
      </div>
    </div>
  );
};

export default HashChainDetail;