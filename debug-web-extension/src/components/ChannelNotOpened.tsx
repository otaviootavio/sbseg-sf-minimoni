import { InfoIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

export const ChannelNotOpened = () => {
  return (
    <Alert className="mb-4" variant={"destructive"}>
      <AlertTitle>
        <div className="flex items-center">
          <InfoIcon size={20} />
          <span className="ml-2 font-bold">Channel not opened!</span>
        </div>
      </AlertTitle>
      <AlertDescription>
        You need to open a channel to play the video.
      </AlertDescription>
    </Alert>
  );
};
