import { z } from "zod";
import { VendorDataSchema } from "../../clients/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { formatDate } from "@/utils/formatDate";
import { useState } from "react";
import { Button } from "../ui/button";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { channelApi } from "@/clients/api";
import { Badge } from "../ui/badge";
import { formatEther } from "viem";

type Vendor = z.infer<typeof VendorDataSchema>;

interface VendorInfoProps {
  vendor: Vendor;
}

export const VendorInfo: React.FC<VendorInfoProps> = ({ vendor }) => {
  const [showChannels, setShowChannels] = useState(false);
  const [channels, setChannels] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVendorChannels = async () => {
    if (!showChannels) {
      setShowChannels(true);
      
      if (!channels) {
        setLoading(true);
        try {
          const response = await channelApi.listChannelsByVendor(vendor.id);
          if (response.success) {
            setChannels(response);
          } else {
            setError(response.message);
          }
        } catch (err) {
          setError("Failed to fetch vendor channels");
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    } else {
      setShowChannels(false);
    }
  };

  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <CardTitle>Vendor Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Vendor Address</TableHead>
                <TableHead>Chain ID</TableHead>
                <TableHead>Amount per Hash</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">{vendor.id.substring(0, 8)}...</TableCell>
                <TableCell className="font-mono">{vendor.address.substring(0, 10)}...</TableCell>
                <TableCell>{vendor.chainId}</TableCell>
                <TableCell>{vendor.amountPerHash} ETH</TableCell>
                <TableCell>{formatDate(new Date(vendor.createdAt))}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="mt-4">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={fetchVendorChannels}
          >
            {showChannels ? (
              <ChevronDown className="h-4 w-4 mr-2" />
            ) : (
              <ChevronRight className="h-4 w-4 mr-2" />
            )}
            {showChannels ? "Hide Channels" : "Show Channels"}
          </Button>
          
          {showChannels && (
            <div className="mt-4">
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                </div>
              ) : error ? (
                <div className="text-center py-2 text-red-500">{error}</div>
              ) : channels?.data?.length === 0 ? (
                <div className="text-center py-2 text-gray-500">No channels found for this vendor</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Channel ID</TableHead>
                      <TableHead>Contract Address</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {channels?.data.map((channel: any) => (
                      <TableRow key={channel.id}>
                        <TableCell className="font-medium">{channel.id.substring(0, 8)}...</TableCell>
                        <TableCell className="font-mono">{channel.contractAddress.substring(0, 10)}...</TableCell>
                        <TableCell>{formatEther(BigInt(channel.totalAmount))} ETH</TableCell>
                        <TableCell>
                          <Badge variant={channel.status === "OPEN" ? "default" : "destructive"}>
                            {channel.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(new Date(channel.createdAt))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
