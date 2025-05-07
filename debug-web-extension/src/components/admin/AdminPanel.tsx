import React, { useEffect, useState } from "react";
import { vendorApi, channelApi } from "../../clients/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { z } from "zod";
import { VendorDataSchema } from "@/clients/schemas";
import { ChannelCard } from "./ChannelCard";
import { ChannelDataSchema } from "../../clients/schemas";
import { VendorInfo } from "./VendorInfo";

type Vendor = z.infer<typeof VendorDataSchema>;
type Channel = z.infer<typeof ChannelDataSchema>;

// Hardcoded vendor ID as mentioned
const VENDOR_ID = import.meta.env.VITE_VENDOR_ID as string;

export const formatErrorMessage = (error: unknown): string => {
  if (error instanceof z.ZodError) {
    return error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (Array.isArray(error)) {
    return JSON.stringify(error);
  }
  return "An unknown error occurred";
};

// Main AdminPanel Component
export const AdminPanel: React.FC = () => {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const vendorResponse = await vendorApi.getVendor(VENDOR_ID);

      if ("success" in vendorResponse && !vendorResponse.success) {
        throw new Error(
          vendorResponse.message || "Failed to fetch vendor data"
        );
      }

      setVendor(vendorResponse.data);

      const channelsResponse = await channelApi.listChannelsByVendor(VENDOR_ID);

      if ("success" in channelsResponse && !channelsResponse.success) {
        throw new Error(channelsResponse.message || "Failed to fetch channels");
      }

      setChannels(channelsResponse.data);
    } catch (err) {
      const errorMessage = formatErrorMessage(err);
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Detailed error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertDescription className="whitespace-pre-wrap font-mono text-sm">
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {vendor && <VendorInfo vendor={vendor} />}

      <Card>
        <CardHeader>
          <CardTitle>Channel Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {channels.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No channels found for this vendor
            </div>
          ) : (
            channels.map((channel) => (
              <ChannelCard
                key={channel.id}
                channel={channel}
                onChannelClose={fetchData}
              />
            ))
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={fetchData} variant="outline" className="gap-2">
          <Loader2 className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Data
        </Button>
      </div>
    </div>
  );
};

export default AdminPanel;
