/// <reference types="vite-plugin-pwa/client" />
/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

self.addEventListener("install", (event) => {
  console.log("[SW]: Installing...", event);
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[SW]: Activated", event);
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", async (event) => {
  const url = new URL(event.request.url);
  const baseUrl = new URL(import.meta.env.VITE_API_BASE_URL + "/hls");

  // Known issue:
  // The current approach intercets all requests to the CDN, including files like m3u8 playlists.
  // This is not ideal, as we only want to intercept the requests for the video segments (.ts).
  if (url.href.startsWith(baseUrl.href)) {
    console.log(
      "[Page Service Worker]: Intercepting request",
      event.request.url
    );

    event.respondWith(
      (async () => {
        try {
          // Get all clients
          const clients = await self.clients.matchAll({ type: "window" });
          if (clients.length === 0) {
            throw new Error("No clients available");
          }

          console.log("[SW]: Found clients:", clients.length);

          // Send message to the page
          const message = {
            type: "SW_FETCH_INTERCEPT",
            timestamp: Date.now(),
            url: url.href,
            method: event.request.method,
          };

          // Try each client until we get a response
          const client = clients[0];
          console.log("[SW]: Sending message to client:", client.id);
          
          // Start timing for message response
          const messageStartTime = performance.now();
          
          client.postMessage(message);
          console.log("[SW]: Message sent to client:", message);

          // Wait for response from page
          const response = await new Promise<{
            hashchainId: string;
            nextHash: string;
            index: number;
            contractAddress: string;
          }>((resolve, reject) => {
            // Define the response handler function
            function responseHandler(event: MessageEvent) {
              console.log("[SW]: Received response from page:", event.data);
              const { type, data } = event.data;
              if (type === "PAGE_INTERCEPT_RESPONSE") {
                self.removeEventListener("message", responseHandler);
                
                // Check if the response contains an error
                if (data.error) {
                  console.error("[SW]: Error from content script:", data.error);
                  reject(new Error(data.error));
                  return;
                }
                
                console.log("[SW]: Contract address:", data.contractAddress);
                
                // Calculate message response time
                const messageEndTime = performance.now();
                const messageResponseTime = messageEndTime - messageStartTime;
                console.log(`[SW-BENCHMARK]: Message response time: ${messageResponseTime.toFixed(2)}ms`);
                
                resolve(data);
              }
            }

            // Add the event listener
            self.addEventListener("message", responseHandler);
          });

          console.log("[SW]: Got response with next hash:", response);

          if (!response.nextHash) {
            console.error("[SW]: No next hash received from background");
            return new Response(
              JSON.stringify({ error: "No next hash received" }),
              {
                status: 400,
                headers: { "Content-Type": "application/json" },
              }
            );
          }

          // Check if contract address is valid
          if (!response.contractAddress) {
            console.error("[SW]: No contract address in response");
            return new Response(
              JSON.stringify({ error: "No contract address available" }),
              {
                status: 400,
                headers: { "Content-Type": "application/json" },
              }
            );
          }

          const existingHeaders = Object.fromEntries(
            event.request.headers.entries()
          );
          
          // Start timing for HLS fetch request
          const fetchStartTime = performance.now();
          
          const fetchResponse = await fetch(event.request, {
            headers: {
              ...existingHeaders,
              "X-Hash": response.nextHash,
              "x-hash-index": response.index.toString(),
              "x-smart-contract-address": response.contractAddress,
            },
          });
          
          // Calculate fetch request time
          const fetchEndTime = performance.now();
          const fetchRequestTime = fetchEndTime - fetchStartTime;
          console.log(`[SW-BENCHMARK]: HLS fetch request time: ${fetchRequestTime.toFixed(2)}ms`);
          
          // Calculate total time from message start to fetch completion
          const totalTime = fetchEndTime - messageStartTime;
          console.log(`[SW-BENCHMARK]: Total request processing time: ${totalTime.toFixed(2)}ms`);

          // Get content type from response
          const contentType = fetchResponse.headers.get("Content-Type") || "";

          // Handle different content types
          if (contentType.includes("application/json")) {
            // For JSON responses
            const jsonData = await fetchResponse.json();
            return new Response(JSON.stringify(jsonData), {
              status: fetchResponse.status,
              statusText: fetchResponse.statusText,
              headers: fetchResponse.headers,
            });
          } else if (
            url.pathname.endsWith(".m3u8") ||
            contentType.includes("application/vnd.apple.mpegurl")
          ) {
            // For M3U8 files
            const playlist = await fetchResponse.text();
            return new Response(playlist, {
              status: fetchResponse.status,
              statusText: fetchResponse.statusText,
              headers: new Headers({
                ...Object.fromEntries(fetchResponse.headers.entries()),
                "Content-Type": "application/vnd.apple.mpegurl",
              }),
            });
          } else {
            // For other content types (binary data, etc.)
            return fetchResponse;
          }
        } catch (error) {
          console.error("[SW]: Error intercepting request", error);
          return new Response(JSON.stringify({ error: "Internal error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      })()
    );
  }
});
