import { useState } from "react";
import { VendorManager } from "./VendorManager";
import { VendorProfile } from "./VendorList";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const VendorManagement = () => {
  const [selectedVendorId, setSelectedVendorId] = useState<string | undefined>(
    undefined
  );
  const [isCreating, setIsCreating] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleEditVendor = (vendorId: string) => {
    setSelectedVendorId(vendorId);
    setIsCreating(false);
  };

  const handleCreateVendor = () => {
    setSelectedVendorId(undefined);
    setIsCreating(true);
  };

  const handleBack = () => {
    setSelectedVendorId(undefined);
    setIsCreating(false);
    // Trigger refresh of vendor profile
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {!isCreating && !selectedVendorId ? (
        <VendorProfile 
          onEditVendor={handleEditVendor} 
          onCreateVendor={handleCreateVendor}
          refreshTrigger={refreshTrigger}
        />
      ) : (
        <>
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Button>
            <h2 className="text-xl font-semibold">
              {isCreating ? "Create Vendor Profile" : "Edit Vendor Profile"}
            </h2>
          </div>
          <VendorManager vendorId={selectedVendorId} />
        </>
      )}
    </div>
  );
}; 