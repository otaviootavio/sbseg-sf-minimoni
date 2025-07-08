import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHashchain } from "@/context/HashchainProvider";
import { RequestSecretConnection } from "../RequestSecretConnection";
import { ChannelNotOpened } from "../ChannelNotOpened";
import VideoPlayer from "./VideoStreaming";
import VideoPlayerVideoJS from "./VideoStreamingVideoJS";
import VideoPlayerVidstack from "./VideoStreamingVidstack.tsx";
import VideoPlayerMux from "./VideoStreamingMux.tsx";

type PlayerType = "hls" | "videojs" | "vidstack" | "mux" | "clappr";

export const HashStreaming: React.FC = () => {
  const { authStatus, selectedHashchain } = useHashchain();
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerType>("hls");
  
  console.log(authStatus, selectedHashchain);
  const isChannelOpened =
    (selectedHashchain?.data.contractAddress?.toString() ?? "").length > 0;
  const isSecretAuth = authStatus?.secretAuth;

  const renderPlayer = () => {
    switch (selectedPlayer) {
      case "videojs":
        return <VideoPlayerVideoJS />;
      case "vidstack":
        return <VideoPlayerVidstack />;
      case "mux":
        return <VideoPlayerMux />;
      default:
        return <VideoPlayer />;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Stream Hashes</CardTitle>
        {isSecretAuth && isChannelOpened && (
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Player:</span>
            <Select value={selectedPlayer} onValueChange={(value: PlayerType) => setSelectedPlayer(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Select player" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hls">HLS.js</SelectItem>
                <SelectItem value="videojs">Video.js</SelectItem>
                <SelectItem value="vidstack">Vidstack</SelectItem>
                <SelectItem value="mux">Mux Player</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {!isChannelOpened ? (
          <ChannelNotOpened />
        ) : !isSecretAuth ? (
          <RequestSecretConnection />
        ) : (
          renderPlayer()
        )}
      </CardContent>
    </Card>
  );
};

export default HashStreaming;
