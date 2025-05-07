import { useState, useMemo, useEffect } from "react";
import { Plus } from "lucide-react";
import { useWebsiteAuth } from "../context/WebsiteAuthContext";

export const Auth = () => {
  const { grantSecretAccess } = useWebsiteAuth();
  const [newUrl, setNewUrl] = useState("");
  const [sliderValue, setSliderValue] = useState(0);

  useEffect(() => {
    // Parse URL parameters when component mounts
    const queryParams = new URLSearchParams(window.location.search);
    const urlParam = queryParams.get("url");
    if (urlParam) {
      setNewUrl(urlParam);
    }
  }, []);

  // Create time intervals mapping
  const timeIntervals = useMemo(() => {
    const intervals = [];

    for (let i = 0; i <= 10; i++) {
      intervals.push(i);
    }
    // Add 10-minute intervals up to 1 hour (0-6 on slider)
    for (let i = 1; i <= 6; i++) {
      intervals.push(i * 10);
    }

    // Add 2-hour intervals from 2h to 24h (7-17 on slider)
    for (let i = 1; i <= 12; i++) {
      intervals.push(i * 120);
    }

    return intervals;
  }, []);

  // Convert slider position to duration in minutes
  const durationInMinutes = timeIntervals[sliderValue];

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    return `${minutes / 60} hours`;
  };

  const handleAddWebsite = async () => {
    if (!newUrl) return;
    const durationInMs = durationInMinutes * 60000; // Convert minutes to milliseconds
    await grantSecretAccess(newUrl, durationInMs);
    window.close();
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Website Access Management</h2>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Website URL
            </label>
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border rounded-md"
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Duration: {formatDuration(durationInMinutes)}
            </label>
            <input
              type="range"
              min={0}
              max={timeIntervals.length - 1}
              value={sliderValue}
              onChange={(e) => setSliderValue(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <button
            onClick={handleAddWebsite}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Website
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
