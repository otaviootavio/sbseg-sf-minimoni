import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { useAccount, useChainId } from "wagmi";
import { vendorApi } from "@/clients/api";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

// Helper function to convert address to 0x prefixed string
const toHexAddress = (address: string): `0x${string}` => {
  return `0x${address.replace("0x", "")}` as `0x${string}`;
};

// Create a form schema based on VendorCreateRequestSchema
const formSchema = z.object({
  address: z
    .string()
    .trim()
    .describe("Ethereum address of the vendor"),
  amountPerHash: z.coerce.number().min(0).describe("Amount per hash in ETH"),
});

type FormValues = z.infer<typeof formSchema>;

interface VendorManagerProps {
  vendorId?: string;
}

export const VendorManager: React.FC<VendorManagerProps> = ({ vendorId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentVendor, setCurrentVendor] = useState<any>(null);
  const { address } = useAccount();
  const chainId = useChainId();
  const isEditing = !!vendorId;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: "",
      amountPerHash: 0.0001,
    },
  });

  // Fetch vendor data if editing
  useEffect(() => {
    if (isEditing && vendorId) {
      const fetchVendor = async () => {
        try {
          setIsLoading(true);
          const response = await vendorApi.getVendor(vendorId);
          if (response.success) {
            setCurrentVendor(response.data);
            form.reset({
              address: response.data.address,
              amountPerHash: response.data.amountPerHash,
            });
          } else {
            toast.error("Failed to fetch vendor: " + response.message);
          }
        } catch (error) {
          console.error("Error fetching vendor:", error);
          toast.error("Error fetching vendor data");
        } finally {
          setIsLoading(false);
        }
      };

      fetchVendor();
    } else if (address) {
      // Set the user's wallet address if creating a new vendor
      form.setValue("address", address);
    }
  }, [vendorId, address, form, isEditing]);

  const onSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true);
      
      // Format the address correctly for the API and add the chain ID
      const formattedValues = {
        ...values,
        address: toHexAddress(values.address),
        chainId: chainId
      };
      
      if (isEditing && vendorId) {
        // Update existing vendor
        const response = await vendorApi.updateVendor(vendorId, formattedValues);
        if (response.success) {
          toast.success("Vendor updated successfully");
          setCurrentVendor(response.data);
        } else {
          console.error("Update vendor error:", response);
          toast.error(`Failed to update vendor: ${response.message || "Unknown error"}`);
        }
      } else {
        // Create new vendor
        const response = await vendorApi.createVendor(formattedValues);
        if (response.success) {
          toast.success("Vendor created successfully");
          setCurrentVendor(response.data);
        } else {
          console.error("Create vendor error:", response);
          toast.error(`Failed to create vendor: ${response.message || "Unknown error"}`);
        }
      }
    } catch (error) {
      console.error("Vendor operation error:", error);
      let errorMessage = "Unknown error";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error(`Error ${isEditing ? "updating" : "creating"} vendor: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Vendor Profile" : "Create Vendor Profile"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="mb-4">
              <p className="text-sm font-medium mb-1">Connected Network</p>
              <p className="text-sm bg-gray-100 p-2 rounded">Chain ID: {chainId}</p>
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wallet Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0x..."
                      {...field}
                      disabled={!!address}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amountPerHash"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount per Hash (ETH)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.0001"
                      placeholder="Amount per hash in ETH"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading
                ? isEditing
                  ? "Updating..."
                  : "Creating..."
                : isEditing
                ? "Update Vendor Profile"
                : "Create Vendor Profile"}
            </Button>
          </form>
        </Form>

        {currentVendor && (
          <div className="mt-6 p-4 border rounded-md">
            <h3 className="text-lg font-medium">Current Vendor Details</h3>
            <div className="mt-2 space-y-2 text-sm">
              <p><span className="font-semibold">ID:</span> {currentVendor.id}</p>
              <p><span className="font-semibold">Chain ID:</span> {currentVendor.chainId}</p>
              <p><span className="font-semibold">Address:</span> {currentVendor.address}</p>
              <p><span className="font-semibold">Amount per Hash:</span> {currentVendor.amountPerHash} ETH</p>
              <p><span className="font-semibold">Created:</span> {new Date(currentVendor.createdAt).toLocaleString()}</p>
              <p><span className="font-semibold">Updated:</span> {new Date(currentVendor.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 