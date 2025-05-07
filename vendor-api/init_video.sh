#!/bin/bash

# --- Configuration ---
# !!! IMPORTANT: Replace this placeholder URL with the actual video URL you want to download !!!
VIDEO_URL="https://download.blender.org/peach/bigbuckbunny_movies/BigBuckBunny_320x180.mp4"
OUTPUT_DIR="data"
# OUTPUT_FILENAME="downloaded_video.mp4" # No longer saving as single file
HLS_PLAYLIST_NAME="playlist.m3u8"
HLS_SEGMENT_FILENAME_PATTERN="segment%03d.ts" # e.g., segment000.ts, segment001.ts
# --- End Configuration ---

# Create the output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Construct the full path for the master playlist
MASTER_PLAYLIST_PATH="$OUTPUT_DIR/$HLS_PLAYLIST_NAME"
# Construct the full path pattern for segments (used by ffmpeg internally)
SEGMENT_PATH_PATTERN="$OUTPUT_DIR/$HLS_SEGMENT_FILENAME_PATTERN"

echo "Starting video download and HLS conversion..."
echo "Source URL: $VIDEO_URL"
echo "Output Directory: $OUTPUT_DIR"
echo "Master Playlist: $MASTER_PLAYLIST_PATH"

# Use ffmpeg to download and convert the video to HLS
# -i: input file (URL)
# -codec: copy: Avoids re-encoding video/audio streams (faster, maintains quality)
# -start_number 0: Start segment numbering from 0
# -hls_time 10: Create segments of approximately 10 seconds
# -hls_list_size 0: Keep all segments in the playlist (suitable for VOD)
# -hls_segment_filename: Pattern for naming segment files
# -f hls: Specify the output format as HLS
# The last argument is the path to the master playlist file (.m3u8)
ffmpeg -i "$VIDEO_URL" \
       -codec copy \
       -start_number 0 \
       -hls_time 10 \
       -hls_list_size 0 \
       -hls_segment_filename "$SEGMENT_PATH_PATTERN" \
       -f hls \
       "$MASTER_PLAYLIST_PATH"

# Check if ffmpeg command was successful
if [ $? -eq 0 ]; then
  echo "Video download and HLS conversion completed successfully!"
  echo "HLS playlist and segments saved in: $OUTPUT_DIR"
else
  echo "Error: Video download or HLS conversion failed." >&2
  exit 1
fi

exit 0
