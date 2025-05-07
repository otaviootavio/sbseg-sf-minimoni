import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { useHashchain } from "@/context/HashchainProvider";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { vendorApi } from "@/clients/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

// Update the interface to match the schema
interface VendorData {
  id: string;
  amountPerHash: number;
  chainId: number;
  vendorAddress: string;
}

export const VendorRealData: React.FC = () => {
  const { initializeHashchain, loading } = useHashchain();
  const { toast } = useToast();
  const [vendors, setVendors] = useState<VendorData[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [selectedVendor, setSelectedVendor] = useState<VendorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all vendors
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setIsLoading(true);
        const response = await vendorApi.listVendors();

        if (!response.success) {
          throw new Error(response.message);
        }

        // Transform the data to match our interface
        const transformedVendors = response.data.map((vendor) => ({
          id: vendor.id,
          amountPerHash: vendor.amountPerHash,
          chainId: vendor.chainId,
          vendorAddress: vendor.address,
        }));

        setVendors(transformedVendors);

        // If we have vendors and none selected yet, select the first one
        if (transformedVendors.length > 0 && !selectedVendorId) {
          setSelectedVendorId(transformedVendors[0].id);
        }
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to fetch vendors. Please try again later.",
          variant: "destructive",
        });
        console.error("Error fetching vendors:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVendors();
  }, [toast]);

  // When selected vendor ID changes, update the selected vendor data
  useEffect(() => {
    if (selectedVendorId && vendors.length > 0) {
      const vendor = vendors.find((v) => v.id === selectedVendorId) || null;
      setSelectedVendor(vendor);
    } else {
      setSelectedVendor(null);
    }
  }, [selectedVendorId, vendors]);

  const handleVendorChange = (value: string) => {
    setSelectedVendorId(value);
  };

  const handleSubmit = async () => {
    if (!selectedVendor) return;

    try {
      const hashchainId = await initializeHashchain({
        amountPerHash: selectedVendor.amountPerHash.toString(),
        chainId: selectedVendor.chainId.toString(),
        vendorAddress: selectedVendor.vendorAddress,
      });

      toast({
        title: "Success",
        description: `Hashchain initialized successfully with ID: ${hashchainId}`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to initialize hashchain. Please try again.",
        variant: "destructive",
      });
      console.error("Error initializing hashchain:", err);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Vendor Data</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading vendors...</span>
        </CardContent>
      </Card>
    );
  }

  if (vendors.length === 0) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Vendor Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            No vendors available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>1. Import vendor data</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="font-medium">Select Vendor</h3>
          <Select value={selectedVendorId} onValueChange={handleVendorChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a vendor" />
            </SelectTrigger>
            <SelectContent>
              {vendors.map((vendor) => (
                <SelectItem key={vendor.id} value={vendor.id}>
                  Vendor {vendor.id.substring(0, 8)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedVendor && (
          <>
            <div className="space-y-2">
              <h3 className="font-medium">Chain ID</h3>
              <p className="text-sm text-muted-foreground">
                {selectedVendor.chainId}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Vendor Address</h3>
              <p className="text-sm text-muted-foreground break-all">
                {selectedVendor.vendorAddress}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Amount per Hash (ETH)</h3>
              <p className="text-sm text-muted-foreground">
                {selectedVendor.amountPerHash}
              </p>
            </div>

            <Button onClick={handleSubmit} className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initializing...
                </>
              ) : (
                "Import"
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
