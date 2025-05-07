import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useHashchain } from "@/context/HashchainProvider";
import { RequestSecretConnection } from "../RequestSecretConnection";
import { ChannelNotOpened } from "../ChannelNotOpened";
import VideoPlayer from "./VideoStreaming";

export const HashStreaming: React.FC = () => {
  const { authStatus, selectedHashchain } = useHashchain();
  console.log(authStatus, selectedHashchain);
  const isChannelOpened =
    (selectedHashchain?.data.contractAddress?.toString() ?? "").length > 0;
  const isSecretAuth = authStatus?.secretAuth;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stream Hashes</CardTitle>
      </CardHeader>
      <CardContent>
        {isSecretAuth && isChannelOpened ? <VideoPlayer /> : null}
        {!isChannelOpened ? <ChannelNotOpened /> : null}
        {!isSecretAuth ? <RequestSecretConnection /> : null}
      </CardContent>
    </Card>
  );
};

export default HashStreaming;
