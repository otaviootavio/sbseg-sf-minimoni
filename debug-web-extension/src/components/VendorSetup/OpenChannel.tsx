import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { AlertCircle, Loader2, Check } from "lucide-react";
import { useHashchain } from "@/context/HashchainProvider";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "../ui/slider";
import { channelApi } from "@/clients/api";
import { useSmartContract } from "@/hooks/useSmartContract";
import { parseEther } from "viem";
import { useAccount } from "wagmi";

interface HashSliderProps {
  value: string;
  onChange: (values: number[]) => void;
  isDisabled: boolean;
  isLocked: boolean;
}

type StepStatus = "pending" | "loading" | "completed" | "error";

interface StepIndicatorProps {
  stepNumber: number;
  status: StepStatus;
  label: string;
}

// Step Indicator Component
const StepIndicator = ({ stepNumber, status, label }: StepIndicatorProps) => {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`rounded-full w-6 h-6 flex items-center justify-center
        ${
          status === "completed"
            ? "bg-green-500 text-white"
            : status === "loading"
            ? "bg-blue-500 text-white"
            : status === "error"
            ? "bg-red-500 text-white"
            : "bg-gray-200 text-gray-600"
        }`}
      >
        {status === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : status === "completed" ? (
          <Check className="h-4 w-4" />
        ) : (
          stepNumber
        )}
      </div>
      <span className="text-sm">{label}</span>
    </div>
  );
};

// Hash Slider Component
const HashSlider = ({
  value,
  onChange,
  isDisabled,
  isLocked,
}: HashSliderProps) => (
  <div>
    <Label htmlFor="numHashes" className="text-sm text-gray-500">
      Number of Hashes: {value}
    </Label>
    <Slider
      id="numHashes"
      min={100}
      max={1000}
      step={100}
      value={[parseInt(value) || 0]}
      onValueChange={onChange}
      disabled={isDisabled || isLocked}
    />
  </div>
);

// Main OpenChannel Component
export const OpenChannel = () => {
  const { toast } = useToast();
  const [numHashes, setNumHashes] = useState("");
  const [deployedContract, setDeployedContract] = useState("");
  const {
    selectedHashchain,
    error,
    updateContractDetails,
    getSelectedHashchain, // Add this
  } = useHashchain();
  const { compileContract, deployContract } = useSmartContract();
  const { isConnected } = useAccount()

  // Step statuses
  const [hashStatus, setHashStatus] = useState<StepStatus>("pending");
  const [compileStatus, setCompileStatus] = useState<StepStatus>("pending");
  const [deployStatus, setDeployStatus] = useState<StepStatus>("pending");
  const [isProcessing, setIsProcessing] = useState(false);


  if(!isConnected){
    return <div className="bg-gray-100 border border-gray-300 rounded-2xl flex flex-col justify-center items-center">
      <h1 className="font-bold text-xl text-gray-400">
        Not avaliable.
      </h1>
      <p className="text-gray-400">
        Please connect a wallet
      </p>
    </div>
  }
  const handleNumHashesChange = (values: number[]) => {
    if (!isProcessing) {
      setNumHashes(values[0].toString());
    }
  };

  const amountPerHash = selectedHashchain?.data.vendorData.amountPerHash ?? "0";
  const totalAmount =
    selectedHashchain?.data?.vendorData && numHashes
      ? (parseFloat(numHashes) * parseFloat(amountPerHash)).toFixed(6)
      : "0";

  const handleOpenChannel = async () => {
    if (!numHashes) {
      toast({
        title: "Error",
        description: "Please select the number of hashes",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Confirm Hashes
      setHashStatus("loading");
      await updateContractDetails({
        numHashes: numHashes,
        totalAmount: parseEther(totalAmount).toString(),
      });
      setHashStatus("completed");

      // Step 2: Compile Contract
      setCompileStatus("loading");
      const { abi, bytecode } = await compileContract();
      setCompileStatus("completed");

      // Step 3: Deploy Contract
      setDeployStatus("loading");

      // Get latest hashchain state after updates
      const updatedHashchain = await getSelectedHashchain();

      if (!updatedHashchain) {
        throw new Error("No hashchain selected");
      }

      console.log("Updated hashchain before deploy:", updatedHashchain); // Debug log

      const amountInWei = parseEther(totalAmount);

      if (!updatedHashchain.data.tail) {
        throw new Error("Tail is not defined. Please try again.");
      }

      const contractAddress = await deployContract({
        amountEthInWei: amountInWei,
        numersOfToken: parseInt(numHashes),
        toAddress: updatedHashchain.data.vendorData
          .vendorAddress as `0x${string}`,
        tail: updatedHashchain.data.tail, // Using updated tail
        abi,
        bytecode,
      });

      const response = await channelApi.createChannelbyVendorAddress({
        contractAddress: contractAddress as `0x${string}`,
        numHashes: parseInt(numHashes),
        lastIndex: 0,
        tail: updatedHashchain.data.tail as `0x${string}`,
        totalAmount: parseEther(totalAmount).toString(),
        vendorAddress: updatedHashchain.data.vendorData.vendorAddress as `0x${string}`,
      });

      if (response.success) {
        await updateContractDetails({
          contractAddress: response.data.contractAddress,
          numHashes: response.data.numHashes.toString(),
          totalAmount: response.data.totalAmount.toString(),
        });

        setDeployedContract(contractAddress);
        setDeployStatus("completed");

        toast({
          title: "Success",
          description: "Channel opened successfully",
        });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to process";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      // Set error status for the current step
      if (hashStatus === "loading") setHashStatus("error");
      if (compileStatus === "loading") setCompileStatus("error");
      if (deployStatus === "loading") setDeployStatus("error");

      console.error("Error in handleOpenChannel:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const isDisabled =
    !selectedHashchain?.data?.vendorData?.chainId ||
    !!selectedHashchain.data.contractAddress;
    

  return (
    <Card className={isDisabled ? "opacity-25" : ""}>
      <CardHeader>
        <CardTitle>
          <p className="font-bold text-md">2. Open the channel!</p>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <HashSlider
            value={numHashes}
            onChange={handleNumHashesChange}
            isDisabled={isDisabled}
            isLocked={isProcessing}
          />

          <div>
            <Label className="text-sm text-gray-500">Total Amount (ETH)</Label>
            <div className="flex flex-row items-center gap-2">
              <div className="flex-1 p-2 bg-gray-100 dark:bg-gray-800 rounded border">
                {totalAmount} ETH
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Button
              onClick={handleOpenChannel}
              disabled={isDisabled || isProcessing || !numHashes}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Open Channel"
              )}
            </Button>

            <div className="space-y-2">
              <StepIndicator
                stepNumber={1}
                status={hashStatus}
                label="Confirm Hashes"
              />
              <StepIndicator
                stepNumber={2}
                status={compileStatus}
                label="Compile Contract"
              />
              <StepIndicator
                stepNumber={3}
                status={deployStatus}
                label="Deploy Contract"
              />
            </div>
          </div>

          <p className="text-sm">
            You will be able to watch up to{" "}
            <span className="font-bold">
              {(parseFloat(numHashes) / 4 || 0).toFixed(0)} minutes
            </span>
          </p>
        </div>

        <div className="mt-4">
          {error && (
            <div className="text-sm text-red-500 mb-4">
              Error: {error.message}
            </div>
          )}

          {deployedContract && (
            <div className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-blue-500 mr-2" />
              <div className="text-sm space-y-1 w-full">
                <p className="font-bold">Channel opened successfully!</p>
                <p className="font-mono text-xs truncate">
                  Contract Address: {deployedContract}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OpenChannel;
