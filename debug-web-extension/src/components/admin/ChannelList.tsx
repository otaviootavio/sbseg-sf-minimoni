import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ChevronDown, ChevronRight, Loader2, ExternalLink } from 'lucide-react';
import { ChannelListResponse, PaymentListResponse, ErrorResponse } from '../../clients/schemas';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatEther } from "viem";
import { formatDate } from "@/utils/formatDate";

interface ChannelListProps {
  channelsData: ChannelListResponse | ErrorResponse | null;
  paymentsData: Record<string, PaymentListResponse | ErrorResponse | null>;
  onCloseChannelClick: (channelId: string) => void;
  onDeleteChannel: (channelId: string) => void;
  loadingPayments: Record<string, boolean>; // Track loading per channel
}

const ChannelList: React.FC<ChannelListProps> = ({ 
  channelsData, 
  paymentsData, 
  onCloseChannelClick, 
  onDeleteChannel, 
  loadingPayments 
}) => {
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null);

  const toggleChannel = (channelId: string) => {
    if (expandedChannel === channelId) {
      setExpandedChannel(null);
    } else {
      setExpandedChannel(channelId);
    }
  };

  if (!channelsData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Channels</CardTitle>
          <CardDescription>Channels associated with this vendor.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!channelsData.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Channels</CardTitle>
          <CardDescription>Channels associated with this vendor.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Channels</AlertTitle>
            <AlertDescription>
              {channelsData.message || "Failed to load channels."}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Channels</CardTitle>
        <CardDescription>
          Channels associated with this vendor.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {channelsData.data.length === 0 ? (
          <p className="text-center py-4 text-gray-500">No channels found for this vendor.</p>
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
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channelsData.data.map((channel) => (
                  <React.Fragment key={channel.id}>
                    <TableRow className="cursor-pointer hover:bg-gray-50">
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleChannel(channel.id)}
                        >
                          {expandedChannel === channel.id ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium" onClick={() => toggleChannel(channel.id)}>
                        {channel.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell onClick={() => toggleChannel(channel.id)}>
                        {channel.contractAddress.substring(0, 10)}...
                      </TableCell>
                      <TableCell onClick={() => toggleChannel(channel.id)}>
                        {formatEther(BigInt(channel.totalAmount))} ETH
                      </TableCell>
                      <TableCell onClick={() => toggleChannel(channel.id)}>
                        <Badge variant={channel.status === "OPEN" ? "default" : "destructive"}>
                          {channel.status}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={() => toggleChannel(channel.id)}>
                        {formatDate(new Date(channel.createdAt))}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {channel.status === "OPEN" && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => onCloseChannelClick(channel.id)}
                            >
                              Close
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDeleteChannel(channel.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    {/* Expanded payments section */}
                    {expandedChannel === channel.id && (
                      <TableRow className="bg-slate-50">
                        <TableCell colSpan={7}>
                          <div className="p-4">
                            {channel.status !== "OPEN" && channel.settlementTx && (
                              <div className="mb-4 p-3 bg-slate-100 rounded border border-slate-200">
                                <h3 className="text-md font-semibold mb-2">Channel Settlement</h3>
                                <div className="flex items-center text-sm">
                                  <span className="font-medium mr-2">Transaction ID:</span>
                                  <span className="font-mono">{channel.settlementTx}</span>
                                  <a 
                                    href={`https://explorer.devnet.xrplevm.org/tx/${channel.settlementTx}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-blue-500 hover:text-blue-700"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                                {channel.closedAt && (
                                  <div className="text-sm mt-1">
                                    <span className="font-medium mr-2">Closed on:</span>
                                    <span>{formatDate(new Date(channel.closedAt))}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            <h3 className="text-md font-semibold mb-3">Payment History</h3>
                            
                            {loadingPayments[channel.id] ? (
                              <div className="flex justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                              </div>
                            ) : !paymentsData[channel.id] ? (
                              <div className="text-center py-2 text-gray-500">Payment data unavailable</div>
                            ) : !paymentsData[channel.id]?.success ? (
                              <Alert variant="destructive" className="mt-2">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error Loading Payments</AlertTitle>
                                <AlertDescription>
                                  {(paymentsData[channel.id] as ErrorResponse)?.message || "Failed to load payments"}
                                </AlertDescription>
                              </Alert>
                            ) : (paymentsData[channel.id] as PaymentListResponse)?.data?.length === 0 ? (
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
                                  {(paymentsData[channel.id] as PaymentListResponse)?.success && 
                                   (paymentsData[channel.id] as PaymentListResponse)?.data?.map((payment: any) => (
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
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChannelList; 