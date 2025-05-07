import { useState, useEffect } from "react";
import { vendorApi } from "@/clients/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Pencil, Plus } from "lucide-react";
import { VendorDataSchema } from "@/clients/schemas";
import { z } from "zod";
import { useAccount } from "wagmi";

interface VendorProfileProps {
  onEditVendor: (vendorId: string) => void;
  onCreateVendor: () => void;
  refreshTrigger?: number;
}

type Vendor = z.infer<typeof VendorDataSchema>;

export const VendorProfile: React.FC<VendorProfileProps> = ({ 
  onEditVendor, 
  onCreateVendor,
  refreshTrigger = 0 
}) => {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(false);
  const { address } = useAccount();

  useEffect(() => {
    const fetchVendorForCurrentUser = async () => {
      if (!address) return;
      
      try {
        setLoading(true);
        const response = await vendorApi.listVendors();
        if (response.success) {
          const currentUserVendor = response.data.find(
            v => v.address.toLowerCase() === address.toLowerCase()
          );
          
          if (currentUserVendor) {
            setVendor(currentUserVendor);
          } else {
            setVendor(null);
          }
        } else {
          toast.error("Failed to fetch vendors: " + response.message);
        }
      } catch (error) {
        console.error("Error fetching vendors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorForCurrentUser();
  }, [address, refreshTrigger]);

  if (loading) {
    return <div className="text-center p-4">Loading vendor profile...</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Your Vendor Profile</CardTitle>
      </CardHeader>
      <CardContent>
        {!vendor ? (
          <div className="text-center p-6 space-y-4">
            <p>You don't have a vendor profile yet.</p>
            <Button onClick={onCreateVendor}>
              <Plus className="h-4 w-4 mr-2" />
              Create Vendor Profile
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium mb-3">Vendor Details</h3>
                  <p><span className="font-semibold">Address:</span> {vendor.address}</p>
                  <p><span className="font-semibold">Chain ID:</span> {vendor.chainId}</p>
                  <p><span className="font-semibold">Amount per Hash:</span> {vendor.amountPerHash} ETH</p>
                  <p><span className="font-semibold">Created:</span> {new Date(vendor.createdAt).toLocaleString()}</p>
                  {vendor.updatedAt && (
                    <p><span className="font-semibold">Updated:</span> {new Date(vendor.updatedAt).toLocaleString()}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditVendor(vendor.id)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 