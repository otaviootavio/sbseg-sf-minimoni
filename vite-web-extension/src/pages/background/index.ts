import { AuthRepository } from "./authRepository";
import { HashchainRepository } from "./hashchainRepository";

const repository = new HashchainRepository();
const authRepository = new AuthRepository();

const openBasicAuthSite = (url: string) => {
  chrome.windows.getCurrent((currentWindow) => {
    const {
      left = 0,
      top = 0,
      width = window.screen.availWidth,
      height = window.screen.availHeight,
    } = currentWindow;

    const centerX = left + Math.floor(width / 2);
    const centerY = top + Math.floor(height / 2);

    chrome.windows.create({
      url: chrome.runtime.getURL(`src/pages/auth/basic/index.html?url=${url}`),
      type: "popup",
      width: 400,
      height: 450,
      left: Math.max(0, centerX - 150),
      top: Math.max(0, centerY - 175),
      focused: true,
    });
  });
};

const openSecretAuthSite = (url: string) => {
  chrome.windows.getCurrent((currentWindow) => {
    const {
      left = 0,
      top = 0,
      width = window.screen.availWidth,
      height = window.screen.availHeight,
    } = currentWindow;

    const centerX = left + Math.floor(width / 2);
    const centerY = top + Math.floor(height / 2);

    chrome.windows.create({
      url: chrome.runtime.getURL(`src/pages/auth/secret/index.html?url=${url}`),
      type: "popup",
      width: 400,
      height: 450,
      left: Math.max(0, centerX - 150),
      top: Math.max(0, centerY - 175),
      focused: true,
    });
  });
};

const basicAuthMiddleware = async (sender: any, sendResponse: any) => {
  if (!(await authRepository.hasValidBasicAccess(sender.url))) {
    sendResponse({ error: "Basic authentication required" });
    return true;
  }
  return false;
};

const secretAuthMiddleware = async (
  message: any,
  sender: any,
  sendResponse: any
) => {
  if (!(await authRepository.hasValidSecretAccess(sender.url))) {
    await openSecretAuthSite(sender.url ?? "");
    sendResponse({ error: "Secret authentication required" });
    return true;
  }
  return false;
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handleRequest = async () => {
    // Handle basic auth first

    switch (message.type) {
      case "GET_AUTH_STATUS":
        const res = await authRepository.getAuthStatus(sender.url ?? "");
        return res;
      case "AUTH_STATUS_RESPONSE":
        // TODO
        // The event of this type event is send FROM the extension
        // TO the page to notify that the hashchain selection was
        // changed. This behavior can be useful in the future
        return true;
      case "REQUEST_CONNECTION":
        await openBasicAuthSite(sender.url ?? "");
        return true;
      case "REQUEST_SECRET_CONNECTION":
        await openSecretAuthSite(sender.url ?? "");
        return true;
    }
    if (await basicAuthMiddleware(sender, sendResponse)) return;

    // Process basic-authed requests
    switch (message.type) {
      case "CREATE_HASHCHAIN":
        return repository.createHashchain(
          message.payload.vendorData,
          message.payload.secret
        );
      case "GET_HASHCHAIN":
        return repository.getHashchain(message.payload.hashchainId);
      case "SELECT_HASHCHAIN":
        return repository.selectHashchain(message.payload.hashchainId);
      case "GET_SELECTED_HASHCHAIN":
        return repository.getSelectedHashchain();
      case "SYNC_HASHCHAIN_INDEX":
        return repository.syncHashchainIndex(
          message.payload.hashchainId,
          message.payload.newIndex
        );
      case "UPDATE_HASHCHAIN":
        return repository.updateHashchain(
          message.payload.hashchainId,
          message.payload.data
        );
      case "IMPORT_HASHCHAIN":
        return repository.importHashchain(message.payload.data);
      case "AUTH_SITE":
        return repository.importHashchain(message.payload.data);
      case "HASHCHAIN_SELECTION_CHANGED_RESPONSE":
        // TODO
        // The event of this type event is send FROM the extension
        // TO the page to notify that the hashchain selection was
        // changed. This behavior can be useful in the future
        return true;
    }

    // Process secret-authed requests
    switch (message.type) {
      case "GET_SECRET":
        if (await secretAuthMiddleware(message, sender, sendResponse)) return;
        return repository.getSecret(message.payload.hashchainId);
      case "GET_NEXT_HASH":
        if (await secretAuthMiddleware(message, sender, sendResponse)) return;
        return repository.getNextHash(message.payload.hashchainId);
      case "GET_FULL_HASHCHAIN":
        if (await secretAuthMiddleware(message, sender, sendResponse)) return;
        return repository.getFullHashchain(message.payload.hashchainId);
    }

    return { error: `Unknown message type: ${message.type}` };
  };

  handleRequest()
    .then(sendResponse)
    .catch((error) => sendResponse({ error: error.message }));

  return true;
});
