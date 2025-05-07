import { useHashchain } from "@/context/HashchainProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertCircle, Check, CheckCheck } from "lucide-react";
import { formatEther } from "viem";

export const ConnectMiniMoniWalletWithDropdown = () => {
  const { requestConnection, authStatus, selectedHashchain, error } =
    useHashchain();

  if (!authStatus?.secretAuth && !authStatus?.basicAuth) {
    return (
      <Button
        onClick={() => requestConnection()}
        variant="default"
        className="font-bold"
        size="sm"
      >
        Connect MiniMoni Wallet
      </Button>
    );
  }

  const renderTriggerButton = () => {
    if (authStatus?.secretAuth) {
      return (
        <Button variant="default" size="sm">
          <CheckCheck /> Streaming
        </Button>
      );
    } else if (authStatus?.basicAuth) {
      return (
        <Button variant="default" className="font-bold" size="sm">
          <Check />
          Connected
        </Button>
      );
    } else {
      return (
        <Button
          onClick={() => requestConnection()}
          variant="default"
          className="font-bold"
          size="sm"
        >
          Connect MiniMoni Wallet
        </Button>
      );
    }
  };

  const renderContent = () => {
    if (!selectedHashchain) {
      return (
        <div className="p-4 w-full">
          <div className="flex items-center text-muted-foreground">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span>No hashchain selected</span>
          </div>
        </div>
      );
    }

    const {
      vendorData: { chainId, vendorAddress, amountPerHash },
      contractAddress,
      numHashes,
      totalAmount,
      lastIndex,
    } = selectedHashchain.data;

    return (
      <div className="p-4 w-72">
        {error && (
          <div className="mb-4 p-2 bg-red-50 dark:bg-red-900/20 rounded text-red-600 dark:text-red-400 text-sm">
            {error.message}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Chain ID
            </p>
            <p className="text-sm font-mono">{chainId}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Vendor</p>
            <p className="text-sm font-mono truncate" title={vendorAddress}>
              {vendorAddress}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Amount/Hash
            </p>
            <p className="text-sm font-mono">{amountPerHash} ETH</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Contract
            </p>
            <p className="text-sm font-mono truncate" title={contractAddress}>
              {contractAddress || "Not deployed"}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Number of Hashes
            </p>
            <p className="text-sm font-mono">{numHashes || "0"}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Total Amount
            </p>
            <p className="text-sm font-mono">
              {formatEther(BigInt(totalAmount || "0"))} ETH
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Last Hash Index
            </p>
            <p className="text-sm font-mono">{lastIndex}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{renderTriggerButton()}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        {renderContent()}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ConnectMiniMoniWalletWithDropdown;
