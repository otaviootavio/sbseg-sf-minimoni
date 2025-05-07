import { useState, useEffect } from "react";
import { useWebsiteAuth } from "../context/WebsiteAuthContext";
import { Shield, X } from "lucide-react";

export const Auth = () => {
  const { grantBasicAccess } = useWebsiteAuth();
  const [url, setUrl] = useState("");

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const urlParam = queryParams.get("url");
    if (urlParam) {
      setUrl(urlParam);
    }
  }, []);

  const handleConnect = async () => {
    if (!url) return;
    const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    await grantBasicAccess(url, twentyFourHours);
    window.close();
  };

  const handleCancel = () => {
    window.close();
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Connection Request</h2>
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
            <Shield className="text-blue-600" size={24} />
            <div>
              <h3 className="font-semibold">Website Connection Request</h3>
              <p className="text-sm text-gray-600">
                This website is requesting access to your payment channel
                information. If approved, the site will be able to view and
                modify metadata related to your payment channels. Please verify
                you trust this website before allowing access
              </p>
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Website URL</h4>
            <div className="text-sm text-gray-600 font-mono break-all">
              {url}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConnect}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Connect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
