import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useHashchain } from "@/context/HashchainProvider";

const VideoPlayer = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedHashchain } = useHashchain();
  const { toast } = useToast();

  useEffect(() => {
    const video = videoRef.current;

    if (Hls.isSupported() && video && !!selectedHashchain?.data.contractAddress) {
      const smartContractAddress = selectedHashchain?.data.contractAddress.toString();
      const hls = new Hls({
        maxBufferLength: 1,
        maxMaxBufferLength: 1,
        lowLatencyMode: true,
        backBufferLength: 0,
        xhrSetup: xhr => {
          xhr.withCredentials = true;
          xhr.setRequestHeader('x-smart-contract-address', smartContractAddress);
        }      
      });

      hlsRef.current = hls;

      hls.attachMedia(video);
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(
          import.meta.env.VITE_API_BASE_URL+"/hls/playlist.m3u8"
        );
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        console.error("HLS error:", data);
        let errorMessage = "An error occurred while loading the video.";

        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          errorMessage = "Network error. Please check your connection.";
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          errorMessage = "Media error. The video format might be unsupported.";
        }

        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Video Error",
          description: errorMessage,
        });
      });

      return () => {
        hlsRef.current?.destroy();
        hlsRef.current = null;
      };
    } else if (video?.canPlayType("application/vnd.apple.mpegurl")) {
      video.src =
        import.meta.env.VITE_API_BASE_URL+"/hls/playlist.m3u8";
      setIsLoading(false);
    } else {
      setError("Your browser doesn't support HLS video playback.");
    }
  }, []);

  const handlePlay = () => {
    videoRef.current?.play();
    setShowOverlay(false);
  };

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    hlsRef.current?.destroy();
    hlsRef.current = null;

    // Re-initialize the player
    const video = videoRef.current;
    if (Hls.isSupported() && video && !!selectedHashchain?.data.contractAddress) {
      const smartContractAddress = selectedHashchain.data.contractAddress.toString();
      const hls = new Hls({
        maxBufferLength: 1,
        maxMaxBufferLength: 1,
        lowLatencyMode: true,
        backBufferLength: 0,
        xhrSetup: xhr => {
          xhr.withCredentials = true;
          xhr.setRequestHeader('x-smart-contract-address', smartContractAddress);
        }
      });
      hlsRef.current = hls;
      hls.attachMedia(video);
      hls.loadSource(
        import.meta.env.VITE_API_BASE_URL+"/hls/playlist.m3u8"
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-3xl mx-auto">
        {isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <p>{error}</p>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors w-fit"
              >
                Retry
              </button>
            </AlertDescription>
          </Alert>
        )}

        <video
          ref={videoRef}
          controls
          className="w-full h-auto"
        />

        {showOverlay && !error && !isLoading && (
          <div
            className="absolute inset-0 bg-cover bg-center cursor-pointer"
            onClick={handlePlay}
            role="button"
            tabIndex={0}
          >
            <button
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl px-8 py-4 rounded-full bg-white/80 hover:bg-white/90 transition-colors"
              type="button"
            >
              ▶
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
