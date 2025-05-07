import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, CheckCircle, ExternalLink } from "lucide-react";
import {
  useAccount,
  useSimulateContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useBalance,
} from "wagmi";
import {
  ethWordAbi,
  useReadEthWordChannelTip,
  useReadEthWordChannelRecipient,
} from "../../generated";
import {
  ChannelDataSchema,
  PaymentListResponse,
  ErrorResponse,
} from "../../clients/schemas";
import { z } from "zod";
import { formatEther, type Hash, keccak256, encodePacked } from "viem";

interface CloseChannelModalProps {
  channel: z.infer<typeof ChannelDataSchema> | null;
  payments: PaymentListResponse | ErrorResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (channelId: string, txHash: Hash) => void;
}

const CloseChannelModal: React.FC<CloseChannelModalProps> = ({
  channel,
  payments,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { chain } = useAccount();
  const [error, setError] = useState<string | null>(null);
  const [proofHash, setProofHash] = useState<`0x${string}` | null>(null);

  const [calculationResult, setCalculationResult] = useState<string | null>(
    null
  );
  const [isCalculating, setIsCalculating] = useState(false);
  const [hashMatches, setHashMatches] = useState<boolean | null>(null);

  const { data: contractBalance } = useBalance({
    address: channel?.contractAddress as `0x${string}` | undefined,
    query: {
      enabled: !!channel && isOpen,
    },
  });

  const { data: channelTip } = useReadEthWordChannelTip({
    address: channel?.contractAddress as `0x${string}` | undefined,
    query: {
      enabled: !!channel && isOpen,
    },
  });

  const { data: channelRecipient } = useReadEthWordChannelRecipient({
    address: channel?.contractAddress as `0x${string}` | undefined,
    query: {
      enabled: !!channel && isOpen,
    },
  });

  const defaultCloseWordCount = channel ? BigInt(channel.lastIndex) : BigInt(0);

  useEffect(() => {
    if (proofHash && channelTip && channel) {
      calculateHashChain(Number(defaultCloseWordCount));
    }
  }, [proofHash, channelTip, channel, defaultCloseWordCount]);

  useEffect(() => {
    if (
      payments &&
      "success" in payments &&
      payments.success &&
      payments.data.length > 0
    ) {
      const latestPayment = [...payments.data].sort(
        (a, b) => b.index - a.index
      )[0];
      setProofHash(latestPayment.xHash);
    } else {
      setProofHash(null);
    }
  }, [payments]);

  const calculateHashChain = async (wordCount: number) => {
    if (!proofHash || !channelTip) return;

    setIsCalculating(true);
    setCalculationResult(null);
    setHashMatches(null);

    try {
      if (wordCount <= 0) {
        throw new Error("Word count must be positive");
      }

      let wordScratch = proofHash;

      wordScratch = keccak256(encodePacked(["bytes32"], [wordScratch]));

      for (let i = 1; i < wordCount; i++) {
        wordScratch = keccak256(encodePacked(["bytes32"], [wordScratch]));

        if (i % 100 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }

      const matches = wordScratch.toLowerCase() === channelTip.toLowerCase();
      setCalculationResult(wordScratch);
      setHashMatches(matches);
    } catch (err) {
      if (err instanceof Error) {
        setError(`Calculation error: ${err.message}`);
      } else {
        setError("Unknown calculation error");
      }
    } finally {
      setIsCalculating(false);
    }
  };

  const closeWordCount = defaultCloseWordCount;

  const {
    data: simulateData,
    error: simulateError,
    isLoading: isSimulating,
  } = useSimulateContract({
    address: channel?.contractAddress,
    abi: ethWordAbi,
    functionName: "closeChannel",
    args: proofHash && channel ? [proofHash, closeWordCount] : undefined,
    query: {
      enabled: !!channel && !!proofHash && isOpen,
    },
  });

  const {
    data: writeData,
    writeContract,
    isPending: isWriting,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash: writeData,
  });

  useEffect(() => {
    if (simulateError) {
      setError(`Simulation: ${simulateError.message}`);
    } else if (writeError) {
      setError(`Transaction: ${writeError.message}`);
    } else if (receiptError) {
      setError(`Confirmation: ${receiptError.message}`);
    } else {
      setError(null);
    }
  }, [simulateError, writeError, receiptError]);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
    }
  }, [isOpen, channel]);

  useEffect(() => {
    if (isConfirmed && channel && writeData) {
      onSuccess(channel.id, writeData);
    }
  }, [isConfirmed, channel, writeData, onSuccess]);

  const handleCloseChannel = () => {
    if (simulateData?.request) {
      setError(null);
      writeContract(simulateData.request);
    } else {
      setError("Simulation failed");
    }
  };

  if (!channel) return null;
  if (!proofHash) {
    return (
      <Dialog
        open={isOpen}
        onOpenChange={(open: boolean) => !open && onClose()}
      >
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Close Channel: {channel.id}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Payment Data</AlertTitle>
              <AlertDescription>
                {payments && "success" in payments && !payments.success
                  ? payments.message
                  : "No payments found for this channel."}
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const explorerUrl = chain?.blockExplorers?.default?.url;

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Close Channel: {channel.id}</DialogTitle>
        </DialogHeader>

        <div className="text-xs bg-slate-50 p-2 rounded-md mt-2 mb-4">
          <p>
            This is a PayWord payment channel. The last payment is hashed{" "}
            {defaultCloseWordCount.toString()} times to create the chain tail.
          </p>
        </div>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="contract-address" className="text-right col-span-1">
              Contract
            </Label>
            <Input
              id="contract-address"
              value={channel.contractAddress}
              readOnly
              className="col-span-3 bg-muted"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="contract-balance" className="text-right col-span-1">
              Balance
            </Label>
            <Input
              id="contract-balance"
              value={
                contractBalance
                  ? `${formatEther(contractBalance.value)} ${
                      contractBalance.symbol
                    }`
                  : "Loading..."
              }
              readOnly
              className="col-span-3 bg-muted"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="contract-tail" className="text-right col-span-1">
              Contract Tail
            </Label>
            <Input
              id="contract-tail"
              value={channelTip || "Loading..."}
              readOnly
              className="col-span-3 bg-muted break-all h-auto font-mono text-xs"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="recipient-address"
              className="text-right col-span-1"
            >
              Recipient
            </Label>
            <Input
              id="recipient-address"
              value={channelRecipient || "Loading..."}
              readOnly
              className="col-span-3 bg-muted"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="close-proof" className="text-right col-span-1">
              Last Payment
            </Label>
            <Input
              id="close-proof"
              value={proofHash}
              readOnly
              className="col-span-3 bg-muted break-all h-auto font-mono text-xs"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="close-index" className="text-right col-span-1">
              Hash Index
            </Label>
            <div className="col-span-3">
              <Input
                id="close-index"
                value={defaultCloseWordCount.toString()}
                readOnly
                className="col-span-3 bg-muted"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="total-amount" className="text-right col-span-1">
              Amount
            </Label>
            <Input
              id="total-amount"
              value={`${formatEther(BigInt(channel.totalAmount))} ETH`}
              readOnly
              className="col-span-3 bg-muted"
            />
          </div>
          {calculationResult && (
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="computed-hash" className="text-right col-span-1">
                Computed Hash
              </Label>
              <div className="col-span-3">
                <Input
                  id="computed-hash"
                  value={calculationResult}
                  readOnly
                  className="bg-muted break-all h-auto font-mono text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {isCalculating ? (
          <Alert variant="default" className="mt-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertTitle>Calculating...</AlertTitle>
          </Alert>
        ) : (
          calculationResult && (
            <Alert
              variant={hashMatches ? "default" : "destructive"}
              className="mt-2"
            >
              {hashMatches ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>{hashMatches ? "Valid" : "Invalid"}</AlertTitle>
              {!hashMatches && (
                <AlertDescription>Try adjusting word count</AlertDescription>
              )}
            </Alert>
          )
        )}

        {error && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {(isSimulating || isWriting || isConfirming || isConfirmed) && (
          <Alert variant="default" className="mt-2">
            {isSimulating || isWriting || isConfirming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
            <AlertTitle>
              {isSimulating
                ? "Simulating..."
                : isWriting
                ? "Processing..."
                : isConfirming
                ? "Confirming..."
                : "Confirmed"}
            </AlertTitle>
            {isConfirmed && writeData && explorerUrl && (
              <AlertDescription>
                <a
                  href={`${explorerUrl}/tx/${writeData}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-green-600"
                >
                  View <ExternalLink className="inline h-3 w-3" />
                </a>
              </AlertDescription>
            )}
          </Alert>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handleCloseChannel}
            disabled={
              isSimulating ||
              isWriting ||
              isConfirming ||
              isConfirmed ||
              !simulateData?.request ||
              !!simulateError
            }
          >
            {isWriting || isConfirming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Closing...
              </>
            ) : isConfirmed ? (
              "Closed"
            ) : (
              "Close Channel"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CloseChannelModal;
