import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { VendorDataSchema } from '../../clients/schemas';
import { z } from 'zod';
import { formatDate } from "@/utils/formatDate";

interface VendorInfoCardProps {
  vendor: z.infer<typeof VendorDataSchema>;
}

const VendorInfoCard: React.FC<VendorInfoCardProps> = ({ vendor }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendor Information</CardTitle>
        <CardDescription>
          Details for the connected vendor wallet.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
            <div className="text-sm text-muted-foreground">Vendor ID</div>
            <div className="font-mono text-sm break-all">
              {vendor.id}
            </div>
          </div>
          
          <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
            <div className="text-sm text-muted-foreground">Wallet Address</div>
            <div className="font-mono text-sm break-all">
              {vendor.address}
            </div>
          </div>
          
          <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
            <div className="text-sm text-muted-foreground">Chain ID</div>
            <div className="font-mono text-sm">
              {vendor.chainId}
            </div>
          </div>
          
          <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
            <div className="text-sm text-muted-foreground">Amount per Hash</div>
            <div className="font-mono text-sm">
              {vendor.amountPerHash} ETH
            </div>
          </div>
          
          <div className="space-y-2 p-4 bg-muted/30 rounded-lg md:col-span-2">
            <div className="text-sm text-muted-foreground">Created At</div>
            <div className="font-mono text-sm">
              {formatDate(new Date(vendor.createdAt))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VendorInfoCard; 