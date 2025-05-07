import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { CloseChannelDialog } from "./CloseChannelDialog";
import { z } from "zod";
import { ChannelDataSchema } from "../../clients/schemas";
import { DeleteChannelDialog } from "./DeleteChannelDialog";
import { Clock, Hash } from "lucide-react";
import { formatEther } from "viem";

type Channel = z.infer<typeof ChannelDataSchema>;

// Channel Card Component
interface ChannelCardProps {
  channel: Channel;
  onChannelClose: () => void;
}

export const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  onChannelClose,
}) => {
  // TODO
  // Add here a link to blockchain explorer
  // Showing the 1.closing transaction 2.smartcontract 
  // This enable the user to manually validate the datas (e.g, is the channel closed?)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">
              Channel {channel.id.slice(0, 8)}...
            </CardTitle>
            <Badge
              variant={channel.status === "OPEN" ? "default" : "secondary"}
            >
              {channel.status}
            </Badge>
          </div>
          <div className="flex gap-2">
            <CloseChannelDialog channel={channel} onSuccess={onChannelClose} />
            <DeleteChannelDialog channel={channel} onSuccess={onChannelClose} />
          </div>
        </div>
        {channel.status === "CLOSED" && (
          <div className="flex flex-col gap-1 mt-2 text-sm text-muted-foreground">
            {channel.closedAt && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Closed on {formatDate(channel.closedAt)}</span>
              </div>
            )}
            {channel.settlementTx && (
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                <span className="font-mono">
                  TX: {channel.settlementTx.slice(0, 10)}...
                  {channel.settlementTx.slice(-8)}
                </span>
              </div>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">
              Contract Address
            </div>
            <div className="font-mono text-sm break-all">
              {channel.contractAddress}
            </div>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">
              Total Amount
            </div>
            <div className="font-mono text-sm">
              {formatEther(BigInt(channel.totalAmount))} ETH
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">
              Number of Hashes
            </div>
            <div className="font-mono text-sm">{channel.numHashes}</div>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Last Index</div>
            <div className="font-mono text-sm">{channel.lastIndex}</div>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Tail</div>
            <div className="font-mono text-sm break-all">{channel.tail}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
