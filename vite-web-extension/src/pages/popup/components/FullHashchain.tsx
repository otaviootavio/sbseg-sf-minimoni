import React, { useState } from 'react';

interface DetailFieldProps {
  label: string;
  value?: string | string[];
  className?: string;
}

const FullHashchain: React.FC<DetailFieldProps> = ({ label, value, className }) => {
  const INITIAL_DISPLAY_COUNT = 3;
  const LOAD_MORE_COUNT = 3;
  
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isReversed, setIsReversed] = useState(false);
  
  // Handle both single value and array of hashes
  const isHashArray = Array.isArray(value);
  
  if (!isHashArray) {
    return (
      <div className={`bg-gray-800 rounded-lg p-3 ${className || ''}`}>
        <label className="text-gray-400 text-sm block mb-1">{label}</label>
        <p className="font-mono text-white truncate">
          {value?.toString() || 'Not set'}
        </p>
      </div>
    );
  }

  const hashes = value as string[];
  const sortedHashes = isReversed ? [...hashes].reverse() : hashes;
  const visibleHashes = sortedHashes.slice(0, displayCount);
  const hasMoreHashes = displayCount < hashes.length;
  
  const handleSeeMore = () => {
    setDisplayCount(prev => Math.min(prev + LOAD_MORE_COUNT, hashes.length));
  };

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(hashes.join('\n'));
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const toggleOrder = () => {
    setIsReversed(prev => !prev);
    // Reset display count when toggling order
    setDisplayCount(INITIAL_DISPLAY_COUNT);
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-3 ${className || ''}`}>
      <label className="text-gray-400 text-sm block mb-1">{label}</label>
      <div className="flex flex-col gap-2">
        {visibleHashes.map((hash, index) => (
          <p key={index} className="font-mono text-white text-xs truncate">
            {isReversed ? hashes.length - 1 - index : index} {hash}
          </p>
        ))}
        
        <div className="flex flex-col place-items-start gap-2">
          {hasMoreHashes && (
            <button
              onClick={handleSeeMore}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
            >
              See More ({hashes.length - displayCount} remaining)
            </button>
          )}
          
          <div className="flex gap-2">
            <button
              onClick={handleCopyAll}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
            >
              {copySuccess ? 'Copied!' : 'Copy All Hashes'}
            </button>
            
            <button
              onClick={toggleOrder}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
            >
              {isReversed ? 'Show Oldest First' : 'Show Latest First'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullHashchain;