import '@vidstack/react/player/styles/base.css';

import { useEffect, useRef, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertTriangle } from "lucide-react";
import { useHashchain } from "@/context/HashchainProvider";

import {
  MediaPlayer,
  MediaProvider,
  type MediaPlayerInstance,
  type MediaProviderAdapter,
  type MediaProviderChangeEvent,
  type MediaCanPlayEvent,
  type MediaCanPlayDetail,
  isHLSProvider,
} from '@vidstack/react';

const VideoPlayerVidstack = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);
  const { selectedHashchain } = useHashchain();
  const { toast } = useToast();
  const playerRef = useRef<MediaPlayerInstance>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    
    // Clear any existing timeout
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
  }, [hasContractAddress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, []);

  const getErrorMessage = useCallback((error: any): string => {
    // Handle HLS.js specific errors
    if (error?.data?.details) {
      const details = error.data.details;
      switch (details) {
        case 'manifestLoadError':
          return "Failed to load video stream. The stream might be unavailable.";
        case 'manifestLoadTimeOut':
          return "Stream loading timeout. Please try again.";
        case 'manifestParsingError':
          return "Invalid stream format. The stream might be corrupted.";
        case 'levelLoadError':
        case 'fragLoadError':
          return "Failed to load video data. The stream might be interrupted.";
        case 'fragLoadTimeOut':
          return "Video loading timeout. Please check your connection.";
        default:
          return "Stream error. Please try again.";
      }
    }

    // Handle HTTP status codes
    if (error?.data?.response?.code || error?.response?.status) {
      const statusCode = error.data?.response?.code || error.response?.status;
      switch (statusCode) {
        case 400:
          return "Bad request. The stream might be temporarily unavailable.";
        case 401:
        case 403:
          return "Access denied. Authentication may be required.";
        case 404:
          return "Stream not found. The video might be unavailable.";
        case 500:
        case 502:
        case 503:
        case 504:
          return "Server error. The streaming service is temporarily unavailable.";
        default:
          return `Unable to load stream (Error ${statusCode}).`;
      }
    }

    // Handle basic error messages
    if (error?.message && typeof error.message === 'string') {
      const message = error.message.toLowerCase();
      
      if (message.includes('network') || message.includes('fetch')) {
        return "Network error. Please check your connection.";
      } else if (message.includes('timeout')) {
        return "Connection timeout. Please try again.";
      } else if (message.includes('manifest') || message.includes('m3u8')) {
        return "Stream error. The video stream might be unavailable.";
      } else if (message.includes('400')) {
        return "Bad request. The stream might be temporarily unavailable.";
      }
    }

    return "Unable to load video stream. Please try again.";
  }, []);

  const handleError = useCallback((error: any) => {
    console.error("Video player error:", error);
    console.error("Error type:", typeof error);
    console.error("Error details:", {
      message: error?.message,
      detail: error?.detail,
      data: error?.data,
      type: error?.type,
      code: error?.code,
    });
    
    // Clear loading timeout
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
    
    const errorMessage = getErrorMessage(error);
    console.log("Parsed error message:", errorMessage);
    
    setError(errorMessage);
    setIsLoading(false);
    setShowOverlay(false);
    
    toast({
      variant: "destructive",
      title: "Video Error",
      description: errorMessage,
    });
  }, [toast, getErrorMessage]);

  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setShowOverlay(true);
    
    // Force re-render of the player by resetting current time
    if (playerRef.current) {
      try {
        playerRef.current.currentTime = 0;
      } catch (err) {
        console.error("Error during player reset:", err);
      }
    }
  }, []);

  const handleLoadStart = useCallback(() => {
    console.log("Load start triggered");
    setIsLoading(true);
    setShowOverlay(true);
    setError(null);
    
    // Clear any existing timeout
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    
    // Set timeout for loading
    loadTimeoutRef.current = setTimeout(() => {
      console.log("Load timeout triggered");
      setError("Failed to load video stream. The stream might be unavailable or there's a server error.");
      setIsLoading(false);
      setShowOverlay(false);
    }, 10000); // 10 second timeout
  }, []);

  const handleCanPlay = useCallback((_detail: MediaCanPlayDetail, _nativeEvent: MediaCanPlayEvent) => {
    console.log("Can play triggered");
    
    // Clear loading timeout
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
    
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
    console.warn("Video stalled");
    setIsLoading(true);
  }, []);

  const handleSuspend = useCallback(() => {
    console.warn("Video suspended");
    setIsLoading(true);
  }, []);

  const handleAbort = useCallback(() => {
    console.warn("Video aborted");
    setError("Video loading was aborted. Please try again.");
    setIsLoading(false);
  }, []);

  const handleEmptied = useCallback(() => {
    console.warn("Video emptied");
    setIsLoading(true);
  }, []);

  const onProviderChange = useCallback((
    provider: MediaProviderAdapter | null,
    _nativeEvent: MediaProviderChangeEvent,
  ) => {
    // We can configure provider's here.
    if (isHLSProvider(provider)) {
      provider.config = {};
    }
  }, []);

  // Show error if no contract address
  if (!hasContractAddress) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          No contract address found. Please set up a payment channel first.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full h-full space-y-4">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Video Error</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>{error}</p>
            <button
              onClick={handleRetry}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors w-fit"
            >
              Try Again
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Video Player Container */}
      <div className="relative rounded-lg shadow-lg">
        <MediaPlayer
          className="w-full h-full media-player"
          title="HLS Stream"
          src={`${import.meta.env.VITE_API_BASE_URL}/hls/playlist.m3u8`}
          crossOrigin
          playsInline
          autoPlay={false}
          controls
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
          onEmptied={handleEmptied}
          onProviderChange={onProviderChange}
          ref={playerRef}
        >
          <MediaProvider>
            {/* Loading overlay */}
            {isLoading && showOverlay && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
          </MediaProvider>
        </MediaPlayer>
      </div>
    </div>
  );
};

export default VideoPlayerVidstack; 