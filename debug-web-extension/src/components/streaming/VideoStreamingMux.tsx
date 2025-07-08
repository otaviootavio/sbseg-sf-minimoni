import { useEffect, useRef, useState, useCallback } from "react";
import MuxPlayer from '@mux/mux-player-react';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useHashchain } from "@/context/HashchainProvider";

const VideoPlayerMux = () => {
  const [showOverlay, setShowOverlay] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedHashchain } = useHashchain();
  const { toast } = useToast();
  const playerRef = useRef<any>(null);
  const eventListenersRef = useRef<boolean>(false);

  // Check if we have a contract address
  const hasContractAddress = !!selectedHashchain?.data.contractAddress;

  useEffect(() => {
    if (!hasContractAddress) {
      setError("No contract address found. Please set up a payment channel first.");
      setIsLoading(false);
      return;
    }

    // Reset states when contract address changes
    setError(null);
    setIsLoading(true);
    setShowOverlay(true);
  }, [hasContractAddress]);

  const handleError = useCallback((error: any) => {
    console.error("Mux Player error:", error);
    let errorMessage = "An error occurred while loading the video.";
    
    // Handle CustomEvent errors from Mux player
    if (error?.detail?.error) {
      const actualError = error.detail.error;
      if (actualError?.message) {
        errorMessage = actualError.message;
      } else if (actualError?.code) {
        switch (actualError.code) {
          case 1:
            errorMessage = "The video download was aborted.";
            break;
          case 2:
            errorMessage = "Network error. Please check your connection.";
            break;
          case 3:
            errorMessage = "The video is corrupted or not supported.";
            break;
          case 4:
            errorMessage = "The video format is not supported.";
            break;
          default:
            errorMessage = "An unknown error occurred.";
        }
      }
    } else if (error?.detail && typeof error.detail === 'string') {
      errorMessage = error.detail;
    } else if (error?.message && typeof error.message === 'string') {
      const message = error.message.toLowerCase();
      
      if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (message.includes('decode') || message.includes('format') || message.includes('codec')) {
        errorMessage = "Media error. The video format might be unsupported or corrupted.";
      } else if (message.includes('not found') || message.includes('404')) {
        errorMessage = "Video not found. Please check if the stream is available.";
      } else if (message.includes('timeout') || message.includes('aborted')) {
        errorMessage = "Connection timeout. Please try again.";
      } else if (message.includes('unauthorized') || message.includes('403')) {
        errorMessage = "Access denied. Please check your permissions.";
      } else if (message.includes('400')) {
        errorMessage = "Bad request. The stream URL might be invalid or the server is not responding correctly.";
      } else {
        errorMessage = error.message;
      }
    } else if (error?.code) {
      // Handle error codes similar to Video.js
      switch (error.code) {
        case 1:
          errorMessage = "The video download was aborted.";
          break;
        case 2:
          errorMessage = "Network error. Please check your connection.";
          break;
        case 3:
          errorMessage = "The video is corrupted or not supported.";
          break;
        case 4:
          errorMessage = "The video format is not supported.";
          break;
        default:
          errorMessage = "An unknown error occurred.";
      }
    } else if (error?.toString && typeof error.toString === 'function') {
      // Fallback for complex error objects
      const errorString = error.toString();
      if (errorString !== '[object Object]') {
        errorMessage = errorString;
      }
    }

    // Ensure we always have a string
    if (typeof errorMessage !== 'string') {
      errorMessage = "An error occurred while loading the video.";
    }

    setError(errorMessage);
    setIsLoading(false);
    setShowOverlay(false);
    
    toast({
      variant: "destructive",
      title: "Video Error",
      description: errorMessage,
    });
  }, [toast]);

  const handlePlay = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.play();
      setShowOverlay(false);
    }
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setShowOverlay(true);
    
    // Reset event listeners flag
    eventListenersRef.current = false;
    
    // Force re-render of the player by updating the key
    if (playerRef.current) {
      // Reset the player source to trigger a reload
      playerRef.current.currentTime = 0;
      playerRef.current.load();
    }
  }, []);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setShowOverlay(true);
  }, []);

  const handleCanPlay = useCallback(() => {
    setIsLoading(false);
    setShowOverlay(false);
  }, []);

  const handlePlayEvent = useCallback(() => {
    setShowOverlay(false);
  }, []);

  const handleWaiting = useCallback(() => {
    setIsLoading(true);
  }, []);

  const handlePlaying = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleLoadedData = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleStalled = useCallback(() => {
    console.warn("Mux Player: Video stalled");
    setIsLoading(true);
  }, []);

  const handleSuspend = useCallback(() => {
    console.warn("Mux Player: Video suspended");
    setIsLoading(true);
  }, []);

  const handleAbort = useCallback(() => {
    console.warn("Mux Player: Video aborted");
    setError("Video loading was aborted. Please try again.");
    setIsLoading(false);
  }, []);

  // Show error if no contract address
  if (!hasContractAddress) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          No contract address found. Please set up a payment channel first.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Video Error</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>{error}</p>
            <button
              onClick={handleRetry}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors w-fit"
            >
              Retry
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Video Player Container */}
      <div className="relative bg-black rounded-lg overflow-hidden shadow-lg">
        {/* Loading Spinner */}
        {isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}

        {/* Mux Player */}
        <MuxPlayer
          ref={playerRef}
          src={`${import.meta.env.VITE_API_BASE_URL}/hls/playlist.m3u8`}
          metadata={{
            video_id: 'hls-stream',
            video_title: 'HLS Stream',
            viewer_user_id: 'viewer-123',
          }}
          onLoadStart={handleLoadStart}
          onCanPlay={handleCanPlay}
          onError={handleError}
          onPlay={handlePlayEvent}
          onWaiting={handleWaiting}
          onPlaying={handlePlaying}
          onLoadedData={handleLoadedData}
          onStalled={handleStalled}
          onSuspend={handleSuspend}
          onAbort={handleAbort}
          streamType="on-demand"
          autoPlay={false}
          style={{
            height: '100%',
            maxWidth: '100%',
            aspectRatio: '16/9',
          }}
        />

        {/* Play Overlay */}
        {showOverlay && !error && !isLoading && (
          <div
            className="absolute inset-0 bg-black/20 cursor-pointer z-20 flex items-center justify-center group"
            onClick={handlePlay}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? handlePlay() : null}
          >
            <div className="text-white text-5xl group-hover:text-gray-300 transition-colors bg-black/50 rounded-full p-4">
              ▶
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayerMux; 