import { z } from "zod";
import { ChannelDataSchema } from "../../clients/schemas";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { channelApi } from "../../clients/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { formatEther } from "viem";

type Channel = z.infer<typeof ChannelDataSchema>;

interface DeleteChannelDialogProps {
  channel: Channel;
  onSuccess: () => void;
}

export const DeleteChannelDialog: React.FC<DeleteChannelDialogProps> = ({
  channel,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteChannel = async () => {
    try {
      setIsDeleting(true);
      const response = await channelApi.deleteChannel(channel.id);

      if ("success" in response && !response.success) {
        throw new Error(response.message || "Failed to delete channel");
      }

      onSuccess();
      toast({
        title: "Success",
        description: "Channel deleted successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to delete channel",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Channel</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this channel? This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
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
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteChannel}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Channel"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
