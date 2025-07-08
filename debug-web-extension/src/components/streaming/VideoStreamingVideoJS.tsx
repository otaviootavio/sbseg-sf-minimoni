import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import videojs from "video.js";
import "@videojs/http-streaming";
import "video.js/dist/video-js.css";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useHashchain } from "@/context/HashchainProvider";

// Simple VideoJS component following the official example pattern
const VideoJS = ({ options, onReady }: { options: any; onReady?: (player: any) => void }) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<ReturnType<typeof videojs> | null>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    // Only initialize once and avoid recreation unless sources actually change
    if (!playerRef.current && !isInitialized.current) {
      isInitialized.current = true;
      
      // The Video.js player needs to be _inside_ the component el for React 18 Strict Mode.
      const videoElement = document.createElement("video-js");
      
      videoElement.classList.add('vjs-big-play-centered');
      videoRef.current?.appendChild(videoElement);

      const player = playerRef.current = videojs(videoElement, options, () => {
        videojs.log('player is ready');
        onReady && onReady(player);
      });

    } else if (playerRef.current && !playerRef.current.isDisposed()) {
      // Update existing player instead of recreating
      const player = playerRef.current;
      
      if (options.autoplay !== undefined) {
        player.autoplay(options.autoplay);
      }
      
      if (options.sources && options.sources.length > 0) {
        player.src(options.sources);
      }
    }
  }, [options?.sources?.[0]?.src, options?.autoplay]); // Only depend on actual source changes

  // Dispose the Video.js player when the functional component unmounts
  useEffect(() => {
    const player = playerRef.current;

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
        isInitialized.current = false;
      }
    };
  }, []);

  return (
    <div data-vjs-player className="w-full">
      <div ref={videoRef} className="w-full" />
    </div>
  );
};

const VideoPlayerVideoJS = () => {
  const [showOverlay, setShowOverlay] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [player, setPlayer] = useState<ReturnType<typeof videojs> | null>(null);
  const { selectedHashchain } = useHashchain();
  const { toast } = useToast();
  const eventListenersRef = useRef<boolean>(false);

  // Check if we have a contract address
  const hasContractAddress = !!selectedHashchain?.data.contractAddress;

  // Memoize video.js options to prevent recreation on every render
  const videoJsOptions = useMemo(() => ({
    autoplay: false,
    controls: true,
    responsive: true,
    fluid: true,
    aspectRatio: '16:9',
    playbackRates: [0.5, 1, 1.5, 2],
    html5: {
      hls: {
        enableLowInitialPlaylist: true,
        smoothQualityChange: true,
        overrideNative: true,
        // Ultra-minimal buffer settings for lowest latency
        maxBufferLength: 0.01, // Extremely minimal buffer - 10ms
        startingBufferLength: 0, // Start with no buffer
        maxBufferHole: 0.01, // Minimal gap tolerance
        maxSeekHole: 0.01, // Minimal seek hole tolerance
        liveSyncDurationCount: 1, // Stay only 1 segment behind live
        liveMaxLatencyDurationCount: 1, // Maximum 1 segment latency
        maxMaxBufferLength: 0.05, // Absolute maximum buffer limit
        lowLatencyMode: true, // Enable low latency mode if available
      },
    },
    sources: hasContractAddress ? [{
      src: `${import.meta.env.VITE_API_BASE_URL}/hls/playlist.m3u8`,
      type: "application/x-mpegURL",
    }] : [],
  }), [hasContractAddress]);

  // Memoize the player ready handler to prevent recreation
  const handlePlayerReady = useCallback((player: ReturnType<typeof videojs>) => {
    console.log('Player ready called');
    
    // Batch state updates to prevent multiple re-renders
    setPlayer(player);
    setIsLoading(false);
    setShowOverlay(false);

    // Only add event listeners once
    if (!eventListenersRef.current) {
      eventListenersRef.current = true;
      
      // Handle player events
      player.on('error', () => {
        const error = player.error();
        console.error("Video.js error:", error);
        
        let errorMessage = "An error occurred while loading the video.";
        
        if (error) {
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
              errorMessage = error.message || "An unknown error occurred.";
          }
        }

        setError(errorMessage);
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Video Error",
          description: errorMessage,
        });
      });

      player.on('play', () => {
        setShowOverlay(false);
      });

      player.on('loadstart', () => {
        setIsLoading(true);
      });

      player.on('canplay', () => {
        setIsLoading(false);
      });

      player.on('waiting', () => {
        videojs.log('player is waiting');
      });

      player.on('dispose', () => {
        videojs.log('player will dispose');
        eventListenersRef.current = false;
      });
    }
  }, [toast]);

  const handlePlay = useCallback(() => {
    if (player) {
      player.play();
      setShowOverlay(false);
    }
  }, [player]);

  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setShowOverlay(true);
    
    if (player) {
      player.src({
        src: `${import.meta.env.VITE_API_BASE_URL}/hls/playlist.m3u8`,
        type: "application/x-mpegURL",
      });
    }
  }, [player]);

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

        {/* Video Player */}
        <VideoJS options={videoJsOptions} onReady={handlePlayerReady} />

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

export default VideoPlayerVideoJS; 