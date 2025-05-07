import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle } from 'lucide-react';
import { ChannelDataSchema, PaymentListResponse, ErrorResponse, PaymentDataSchema } from '../../clients/schemas';
import { z } from 'zod';
import { formatEther } from 'viem';

interface ChannelItemProps {
  channel: z.infer<typeof ChannelDataSchema>;
  payments: PaymentListResponse | ErrorResponse | null;
  onCloseClick: (channelId: string) => void;
  onDelete: (channelId: string) => void;
  isLoadingPayments: boolean;
}

const ChannelItem: React.FC<ChannelItemProps> = ({ channel, payments, onCloseClick, onDelete, isLoadingPayments }) => {

  const renderPayments = () => {
    if (isLoadingPayments) {
      return (
        <div className="flex items-center mt-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="ml-2 text-sm">Loading payments...</span>
        </div>
      );
    }

    if (!payments) {
        // This case might indicate an issue or initial state before fetch starts
        return <p className="text-sm text-muted-foreground mt-2">Payment data unavailable.</p>;
    }

    if (payments.success) {
      if (payments.data && payments.data.length > 0) {
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment ID</TableHead>
                <TableHead>Index</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Hash</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.data.map((payment: z.infer<typeof PaymentDataSchema>) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.id}</TableCell>
                  <TableCell>{payment.index}</TableCell>
                  <TableCell>{payment.amount} ETH</TableCell> {/* Assuming ETH */}
                  <TableCell className="truncate max-w-xs">{payment.xHash}</TableCell>
                  <TableCell>{new Date(payment.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );
      } else {
        return <p>No payments found for this channel.</p>;
      }
    } else {
      // Handle the error case
      return (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Payments</AlertTitle>
          <AlertDescription>{payments.message || 'Failed to load payments.'}</AlertDescription>
        </Alert>
      );
    }
  };

  return (
    <Card key={channel.id} className="mb-4">
      <CardHeader>
        <CardTitle>Channel: {channel.id}</CardTitle>
        <CardDescription>
          Contract: {channel.contractAddress}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          <strong>Status:</strong> {channel.status}
        </p>
        <p>
          <strong>Num Hashes:</strong> {channel.numHashes}
        </p>
        <p>
          <strong>Last Index:</strong> {channel.lastIndex}
        </p>
        <p>
          <strong>Tail Hash:</strong> {channel.tail}
        </p>
        <p>
          <strong>Total Amount:</strong>{" "}
          {formatEther(BigInt(channel.totalAmount))} ETH
        </p>{" "}
        {/* Assuming ETH */}
        <p>
          <strong>Created At:</strong>{" "}
          {new Date(channel.createdAt).toLocaleString()}
        </p>
        {channel.closedAt && (
          <p>
            <strong>Closed At:</strong>{" "}
            {new Date(channel.closedAt).toLocaleString()}
          </p>
        )}
        {channel.settlementTx && (
          <p>
            <strong>Settlement Tx:</strong> {channel.settlementTx}
          </p>
        )}

        {channel.status === "OPEN" && (
          <Button
            variant="destructive"
            size="sm"
            className="mt-4"
            onClick={() => onCloseClick(channel.id)}
          >
            Close Channel
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="mt-4 ml-2"
          onClick={() => onDelete(channel.id)}
        >
          Delete Channel
        </Button>

        <h4 className="font-semibold mt-4 mb-2">
          Payments for this Channel:
        </h4>
        {renderPayments()}
      </CardContent>
    </Card>
  );
};

export default ChannelItem; 