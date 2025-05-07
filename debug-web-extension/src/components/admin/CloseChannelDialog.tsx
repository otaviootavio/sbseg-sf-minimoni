import { z } from "zod";
import {
  ChannelDataSchema,
  PaymentResponseSchema,
} from "../../clients/schemas";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { channelApi, paymentApi } from "@/clients/api";
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
import { formatEther } from "viem";
import { AlertCircle, Loader2, TriangleAlert } from "lucide-react";
import { useSimulateContract, useWriteContract } from "wagmi";
import EthWordJson from "../../blockchain/EthWord.json";
import { EthWord$Type } from "../../blockchain/EthWord";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

type Channel = z.infer<typeof ChannelDataSchema>;
type Payment = z.infer<typeof PaymentResponseSchema>;

const EthWordTyped = EthWordJson as EthWord$Type;
const abi = EthWordTyped.abi;

interface CloseChannelDialogProps {
  channel: Channel;
  onSuccess: () => void;
}

export const CloseChannelDialog: React.FC<CloseChannelDialogProps> = ({
  channel,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [isClosing, setIsClosing] = useState(false);
  const [latestPayment, setLatestPayment] = useState<Payment | null>(null);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const { data: txHash, writeContractAsync } = useWriteContract();
  const simulateContract = useSimulateContract({
    abi,
    address: channel.contractAddress,
    functionName: "closeChannel",
    args: [
      latestPayment?.data.xHash || "0x",
      BigInt(latestPayment?.data.index ?? 0),
    ],
  });

  const fetchLatestPayment = async () => {
    try {
      setIsLoadingPayment(true);
      const response = await paymentApi.getLatestPaymentBySmartContractAddress(
        channel.contractAddress
      );

      if (response.success) {
        setLatestPayment(response);
      }
    } catch (error) {
      console.error("Failed to fetch latest payment:", error);
      toast({
        title: "Error",
        description: "Failed to fetch latest payment information",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPayment(false);
    }
  };

  useEffect(() => {
    if (channel.contractAddress) {
      fetchLatestPayment();
    }
  }, [channel.contractAddress]);

  const handleCloseChannel = async () => {
    try {
      setIsClosing(true);

      if (!simulateContract.isSuccess) {
        throw new Error("Failed to close channel");
      }

      const writeContractData = await writeContractAsync({
        abi,
        address: channel.contractAddress,
        functionName: "closeChannel",
        args: [
          latestPayment?.data.xHash || "0x",
          BigInt(latestPayment?.data.index ?? 0),
        ],
      });

      channelApi.closeChannel(channel.id, { settlementTx: writeContractData });

      onSuccess();
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to close channel",
        variant: "destructive",
      });
    } finally {
      setIsClosing(false);
    }
  };

  const PaymentInfo = () => {
    if (isLoadingPayment) {
      return <div>Loading...</div>;
    }

    if (!latestPayment) {
      return (
        <div className="p-4 bg-muted rounded-lg">
          <div className="text-sm text-muted-foreground">
            No payment information available
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">
              Latest Payment Hash
            </div>
            <div className="font-mono text-sm break-all">
              {latestPayment.data.xHash}
            </div>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">
              Payment Index
            </div>
            <div className="font-mono text-sm">{latestPayment.data.index}</div>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">
              Amount to vendor
            </div>
            <div className="font-mono text-sm">
              {(parseInt(channel.totalAmount) * latestPayment.data.index) /
                channel.numHashes /
                10 ** 18}
              ETH
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={channel.status === "CLOSED"}
        >
          Close Channel
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent
        className={"lg:max-w-screen-lg overflow-y-scroll max-h-screen"}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Close Payment Channel</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to close this channel? This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Channel Information</h4>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">
                  Number of Hashes
                </div>
                <div className="font-mono text-sm">{channel.numHashes}</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Latest Payment Information</h4>
            <PaymentInfo />
          </div>

          {txHash && (
            <div className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-blue-500 mr-2" />
              <div className="text-sm space-y-1">
                <p>Channel closed successfully!</p>
                <p className="font-mono text-xs truncate">TX Hash: {txHash}</p>
              </div>
            </div>
          )}
        </div>

        {simulateContract.isError && (
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertTitle className="font-bold">Error!</AlertTitle>
            <AlertDescription>
              An error occurred:{" "}
              <p className="break-all">
                {simulateContract.error?.message || ""}
              </p>
            </AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isClosing}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCloseChannel}
            disabled={
              isClosing ||
              channel.status === "CLOSED" ||
              !simulateContract.isSuccess
            }
          >
            {isClosing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Closing...
              </>
            ) : (
              "Close Channel"
            )}
            {simulateContract.isPending && (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
