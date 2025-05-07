import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { channelApi, paymentApi } from "@/clients/api";
import { type ChannelListResponse } from "@/clients/schemas";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/utils/formatDate";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { formatEther } from "viem";
import { Button } from "@/components/ui/button";

export const UserChannels = () => {
  const { address } = useAccount();
  const [loading, setLoading] = useState(false);
  const [channels, setChannels] = useState<ChannelListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null);
  const [paymentsMap, setPaymentsMap] = useState<Record<string, any>>({});
  const [loadingPayments, setLoadingPayments] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchChannels();
  }, [address]);

  const fetchChannels = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      const response = await channelApi.listChannelsBySender(address);
      if (!response.success) {
        setError(response.message);
      } else {
        setChannels(response);
      }
    } catch (err) {
      setError("Failed to fetch channels");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandChannel = async (channelId: string) => {
    // Close currently expanded channel if clicking on the same one
    if (expandedChannel === channelId) {
      setExpandedChannel(null);
      return;
    }
    
    setExpandedChannel(channelId);
    
    // Fetch payments if they haven't been loaded yet
    if (!paymentsMap[channelId] && !loadingPayments[channelId]) {
      setLoadingPayments(prev => ({ ...prev, [channelId]: true }));
      
      try {
        const paymentsResponse = await paymentApi.listPaymentsByChannel(channelId);
        setPaymentsMap(prev => ({
          ...prev,
          [channelId]: paymentsResponse
        }));
      } catch (err) {
        console.error("Failed to fetch payments for channel", channelId, err);
      } finally {
        setLoadingPayments(prev => ({ ...prev, [channelId]: false }));
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Channels</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : error ? (
          <div className="text-center py-4 text-red-500">{error}</div>
        ) : !address ? (
          <div className="text-center py-4 text-gray-500">Connect your wallet to view your channels</div>
        ) : channels?.data?.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No channels found where you are the sender</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Channel ID</TableHead>
                  <TableHead>Contract Address</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channels?.data.map((channel) => (
                  <>
                    <TableRow key={channel.id} className="cursor-pointer hover:bg-gray-50">
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleExpandChannel(channel.id)}
                        >
                          {expandedChannel === channel.id ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium" onClick={() => toggleExpandChannel(channel.id)}>
                        {channel.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell onClick={() => toggleExpandChannel(channel.id)}>
                        {channel.contractAddress.substring(0, 10)}...
                      </TableCell>
                      <TableCell onClick={() => toggleExpandChannel(channel.id)}>
                        {formatEther(BigInt(channel.totalAmount))} ETH
                      </TableCell>
                      <TableCell onClick={() => toggleExpandChannel(channel.id)}>
                        <Badge
                          variant={channel.status === "OPEN" ? "default" : "destructive"}
                        >
                          {channel.status}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={() => toggleExpandChannel(channel.id)}>
                        {formatDate(new Date(channel.createdAt))}
                      </TableCell>
                    </TableRow>
                    
                    {/* Expanded payments section */}
                    {expandedChannel === channel.id && (
                      <TableRow className="bg-slate-50">
                        <TableCell colSpan={6}>
                          <div className="p-4">
                            <h3 className="text-md font-semibold mb-3">Payment History</h3>
                            
                            {loadingPayments[channel.id] ? (
                              <div className="flex justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                              </div>
                            ) : paymentsMap[channel.id]?.data.length === 0 ? (
                              <div className="text-center py-2 text-gray-500">No payments found for this channel</div>
                            ) : (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Payment ID</TableHead>
                                    <TableHead>Hash</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Index</TableHead>
                                    <TableHead>Created At</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {paymentsMap[channel.id]?.data.map((payment: {
                                    id: string;
                                    xHash: string;
                                    amount: number;
                                    index: number;
                                    createdAt: string;
                                  }) => (
                                    <TableRow key={payment.id}>
                                      <TableCell className="font-medium">
                                        {payment.id.substring(0, 8)}...
                                      </TableCell>
                                      <TableCell>
                                        {payment.xHash.substring(0, 8)}...
                                      </TableCell>
                                      <TableCell>
                                        {payment.amount} ETH
                                      </TableCell>
                                      <TableCell>
                                        {payment.index}
                                      </TableCell>
                                      <TableCell>
                                        {formatDate(new Date(payment.createdAt))}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 