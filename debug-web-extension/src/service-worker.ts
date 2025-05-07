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
          client.postMessage(message);
          console.log("[SW]: Message sent to client:", message);

          // Wait for response from page
          const response = await new Promise<{
            hashchainId: string;
            nextHash: string;
            index: number;
          }>((resolve) => {
            // Define the response handler function
            function responseHandler(event: MessageEvent) {
              console.log("[SW]: Received response from page:", event.data);

              const { type, data } = event.data;
              if (type === "PAGE_INTERCEPT_RESPONSE") {
                self.removeEventListener("message", responseHandler);
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

          const existingHeaders = Object.fromEntries(
            event.request.headers.entries()
          );
          const fetchResponse = await fetch(event.request, {
            headers: {
              ...existingHeaders,
              "X-Hash": response.nextHash,
              "x-hash-index": response.index.toString(),
            },
          });

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
