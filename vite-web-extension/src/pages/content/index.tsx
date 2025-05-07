import { HashchainId, PublicHashchainData } from "../background/types";

const targetOrigin = window.location.origin;
console.log(
  "[ContentScript] Content script initialized with origin:",
  targetOrigin
);

// Helper function to send messages to webpage
const sendToWebpage = (message: any) => {
  window.postMessage(message, targetOrigin);
  console.log("[ContentScript] Content script -> Webpage:", message);
};

// Helper function to handle messages to background
const sendToBackground = async (type: string, payload: any) => {
  console.log("[ContentScript] Content script -> Background:", {
    type,
    payload,
  });
  try {
    const response = await chrome.runtime.sendMessage({ type, payload });
    console.log("[ContentScript] Background -> Content script:", response);
    return response;
  } catch (err) {
    console.error("[ContentScript] Background communication error:", err);
    throw err;
  }
};

// Initialize content script
sendToWebpage({
  source: "CONTENT_SCRIPT",
  type: "READY",
});

// Handle messages from webpage
window.addEventListener("message", async (event) => {
  // Security: Check origin
  if (event.origin !== targetOrigin) {
    console.log("[ContentScript] Ignored message from different origin:", event.origin);
    return;
  }

  const { data } = event;
  if (data?.source !== "WEBSITE") {
    console.log("[ContentScript] Ignored message from non-website source:", data?.source);
    return;
  }

  console.log("[ContentScript] Received message from webpage:", data);
  const { type, payload } = data;
  
  // Handle service worker intercept messages that come through the page
  if (type === "SW_FETCH_INTERCEPT") {
    console.log("[ContentScript] Received SW intercept message via page:", payload);
    
    try {
      // Get the selected hashchain
      const selectedHashchain: {
        hashchainId: HashchainId;
        data: PublicHashchainData;
      } = await sendToBackground("GET_SELECTED_HASHCHAIN", {});

      console.log("[ContentScript] Got selected hashchain:", selectedHashchain);

      if (!selectedHashchain || !selectedHashchain.hashchainId) {
        console.error("[ContentScript] No hashchain selected");
        sendToWebpage({
          source: "CONTENT_SCRIPT",
          type: "SW_FETCH_INTERCEPT_RESPONSE",
          payload: { error: "No hashchain selected" },
        });
        return;
      }

      // Get next hash
      const nextHash = await sendToBackground("GET_NEXT_HASH", {
        hashchainId: selectedHashchain.hashchainId,
      });

      console.log("[ContentScript] Got next hash:", nextHash);

      // Send response back to the page
      const response = {
        hashchainId: selectedHashchain.hashchainId,
        nextHash,
        index: selectedHashchain.data.lastIndex + 1,
      };

      sendToWebpage({
        source: "CONTENT_SCRIPT",
        type: "SW_FETCH_INTERCEPT_RESPONSE",
        payload: response,
      });
      
      console.log("[ContentScript] Sent hash response to page:", response);
      return;
    } catch (err) {
      console.error("[ContentScript] Error handling SW intercept:", err);
      sendToWebpage({
        source: "CONTENT_SCRIPT",
        type: "SW_FETCH_INTERCEPT_RESPONSE",
        payload: { error: (err as Error).message },
      });
      return;
    }
  }
  
  // Handle regular messages from webpage to background
  try {
    const response = await sendToBackground(type, payload);
    sendToWebpage({
      source: "CONTENT_SCRIPT",
      type: `${type}_RESPONSE`,
      payload: response,
    });
  } catch (err) {
    console.error("[ContentScript] Message handling error:", err);
    sendToWebpage({
      source: "CONTENT_SCRIPT",
      type: `${type}_RESPONSE`,
      payload: { error: (err as Error).message },
    });
  }
});

// Handle messages from extension
chrome.runtime.onMessage.addListener((message) => {
  switch (message.type) {
    
    case "HASHCHAIN_SELECTION_CHANGED":
      console.log("[ContentScript] Received message from extension:", message);
      sendToWebpage({
        source: "CONTENT_SCRIPT",
        type: "HASHCHAIN_SELECTION_CHANGED",
        hashchainId: message.hashchainId,
      });
      return;
    case "AUTH_STATUS_CHANGED":
      console.log("[ContentScript] Auth status changed:", message.authStatus);
      sendToWebpage({
        source: "CONTENT_SCRIPT",
        type: "AUTH_STATUS_CHANGED",
        authStatus: message.authStatus,
      });
      return;
    default:
      console.log("[ContentScript] Unhandled message from extension:", message);
  }
});
