import { useHashchain } from "@/context/HashchainProvider";
import { Button } from "./ui/button";
import { Loader2, InfoIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

export const RequestSecretConnection = () => {
  const { requestSecretConnection } = useHashchain();

  return (
    <div>
      <Alert className="mb-4" variant={"destructive"}>
        <AlertTitle>
          <div className="flex items-center">
            <InfoIcon size={20} />
            <span className="ml-2 font-bold">Secret auth needed!</span>
          </div>
        </AlertTitle>
        <AlertDescription>
          You need to request secret connection to play the video.
        </AlertDescription>
      </Alert>
      <Button
        onClick={requestSecretConnection}
        disabled={!requestSecretConnection}
      >
        {!requestSecretConnection ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Requesting Secret Connection...
          </>
        ) : (
          "Request Secret Connection"
        )}
      </Button>
    </div>
  );
};
