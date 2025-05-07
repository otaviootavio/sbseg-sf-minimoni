import { type WebsiteAuth } from "./auth.types";
import { IndexedDBClient } from "./indexedDBClient";

export class AuthRepository {
  private db: IndexedDBClient;

  constructor() {
    this.db = new IndexedDBClient("auth_db", "website_auth", 2);
  }

  // ========================
  //  Basic Access Operations
  // ========================

  /**
   * Grants basic access to a website with specified duration
   * @param url The website URL to authorize
   * @param duration Access duration in milliseconds
   */
  async grantBasicAccess(url: string, duration: number): Promise<void> {
    const auth: WebsiteAuth = {
      id: url,
      url,
      basicAccessDuration: duration,
      secretAccessDuration: 0,
      basicAuth: true,
      secretAuth: false,
      startTime: Date.now(),
    };

    console.log(`Granting basic access to ${url} for ${duration}ms`);
    await this.db.put(url, auth);
    await this.notifyAuthStatusChangeListeners(url);
  }

  /**
   * Updates basic access duration and resets timer
   * @param url The website URL to update
   * @param newDuration New duration in milliseconds
   */
  async updateBasicAccessDuration(
    url: string,
    newDuration: number
  ): Promise<void> {
    const auth = await this.db.get<WebsiteAuth>(url);
    if (!auth) return;
    await this.db.put(url, {
      ...auth,
      basicAccessDuration: newDuration,
      basicAuth: true,
      startTime: Date.now(),
    });
    await this.notifyAuthStatusChangeListeners(url);
  }

  // =========================
  //  Secret Access Operations
  // =========================

  /**
   * Grants secret access to a website with specified duration
   * @param url The website URL to authorize
   * @param duration Access duration in milliseconds
   */
  async grantSecretAccess(url: string, duration: number): Promise<void> {
    const existingAuth = (await this.db.get<WebsiteAuth>(url)) || {
      id: url,
      url,
      basicAccessDuration: 0,
      secretAccessDuration: 0,
      basicAuth: false,
      secretAuth: false,
      startTime: Date.now(),
    };

    const auth: WebsiteAuth = {
      ...existingAuth,
      secretAccessDuration: duration,
      secretAuth: true,
      startTime: Date.now(),
    };

    console.log(`Granting secret access to ${url} for ${duration}ms`);
    await this.db.put(url, auth);
    await this.notifyAuthStatusChangeListeners(url);
  }

  /**
   * Updates secret access duration and resets timer
   * @param url The website URL to update
   * @param newDuration New duration in milliseconds
   */
  async updateSecretAccessDuration(
    url: string,
    newDuration: number
  ): Promise<void> {
    const auth = await this.db.get<WebsiteAuth>(url);
    if (!auth) return;

    await this.db.put(url, {
      ...auth,
      secretAccessDuration: newDuration,
      secretAuth: true,
      startTime: Date.now(),
    });
    await this.notifyAuthStatusChangeListeners(url);
  }

  // ======================
  //  Common Operations
  // ======================

  /**
   * Checks if valid basic access exists for a website
   * @param url The website URL to check
   * @returns true if valid basic access exists
   */
  async hasValidBasicAccess(url: string): Promise<boolean> {
    const auth = await this.db.get<WebsiteAuth>(url);
    const updatedAuth = await this.checkAndUpdateExpiration(auth);
    return updatedAuth?.basicAuth ?? false;
  }

  /**
   * Checks if valid secret access exists for a website
   * @param url The website URL to check
   * @returns true if valid secret access exists
   */
  async hasValidSecretAccess(url: string): Promise<boolean> {
    const remaining = await this.getRemainingSecretAccessTime(url);
    return remaining !== null && remaining > 0;
  }

  /**
   * Gets remaining time for basic access
   * @param url The website URL to check
   * @returns Remaining time in milliseconds or null if inactive
   */
  async getRemainingBasicAccessTime(url: string): Promise<number | null> {
    const auth = await this.db.get<WebsiteAuth>(url);
    if (!auth || !auth.basicAuth) return null;

    const expirationTime = auth.startTime + auth.basicAccessDuration;
    return Math.max(expirationTime - Date.now(), 0);
  }

  /**
   * Gets remaining time for secret access
   * @param url The website URL to check
   * @returns Remaining time in milliseconds or null if inactive
   */
  async getRemainingSecretAccessTime(url: string): Promise<number | null> {
    const auth = await this.db.get<WebsiteAuth>(url);
    if (!auth || !auth.secretAuth) return null;

    const expirationTime = auth.startTime + auth.secretAccessDuration;
    return Math.max(expirationTime - Date.now(), 0);
  }

  /**
   * Deactivates both access types for a website
   * @param url The website URL to deactivate
   */
  async deactivateAccess(url: string): Promise<void> {
    const auth = await this.db.get<WebsiteAuth>(url);
    if (!auth) return;

    await this.db.put(url, {
      ...auth,
      basicAuth: false,
      secretAuth: false,
    });
    await this.notifyAuthStatusChangeListeners(url);
  }

  /**
   * Retrieves all active authentications (either basic or secret)
   * @returns Array of active WebsiteAuth objects
   */
  async getAllActiveAuth(): Promise<WebsiteAuth[]> {
    const allAuth = await this.db.getAll<WebsiteAuth>();
    const updatedAuths = await Promise.all(
      allAuth.map((auth) => this.checkAndUpdateExpiration(auth))
    );
    return updatedAuths.filter(
      (auth) => auth?.basicAuth || auth?.secretAuth
    ) as WebsiteAuth[];
  }

  /**
   * Removes all authentication data for a website
   * @param url The website URL to remove
   */
  async removeAuth(url: string): Promise<void> {
    await this.db.delete(url);
    await this.notifyAuthStatusChangeListeners(url);
  }
  /**
   * Gets the authentication status for a website
   * @param url The website URL to check
   * @returns Object with basicAuth and secretAuth booleans
   */
  async getAuthStatus(
    url: string
  ): Promise<{ basicAuth: boolean; secretAuth: boolean }> {
    const auth = await this.db.get<WebsiteAuth>(url);
    const updatedAuth = await this.checkAndUpdateExpiration(auth);
    return {
      basicAuth: updatedAuth?.basicAuth ?? false,
      secretAuth: updatedAuth?.secretAuth ?? false,
    };
  }

  private async checkAndUpdateExpiration(
    auth: WebsiteAuth | null
  ): Promise<WebsiteAuth | null> {
    if (!auth) return null;

    const now = Date.now();
    let needsUpdate = false;
    const originalState = { basic: auth.basicAuth, secret: auth.secretAuth };

    // Check basic access expiration
    if (auth.basicAuth) {
      const basicExpiration = auth.startTime + auth.basicAccessDuration;
      if (now >= basicExpiration) {
        auth.basicAuth = false;
        needsUpdate = true;
      }
    }

    // Check secret access expiration
    if (auth.secretAuth) {
      const secretExpiration = auth.startTime + auth.secretAccessDuration;
      if (now >= secretExpiration) {
        auth.secretAuth = false;
        needsUpdate = true;
      }
    }

    // Only update and notify if there's a state change
    if (needsUpdate) {
      await this.db.put(auth.id, auth);

      // Notify listeners if either state changed
      if (
        originalState.basic !== auth.basicAuth ||
        originalState.secret !== auth.secretAuth
      ) {
        await this.notifyAuthStatusChangeListeners(auth.id);
      }
    }

    return auth;
  }

  notifyAuthStatusChangeListeners = async (url: string) => {
    const auth = await this.db.get<WebsiteAuth>(url);
    const authStatus = {
      basicAuth: auth?.basicAuth ?? false,
      secretAuth: auth?.secretAuth ?? false,
    };

    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id) {
          console.log("Background: sending auth status change to tab", tab.id);
          chrome.tabs.sendMessage(
            tab.id,
            {
              type: "AUTH_STATUS_CHANGED",
              authStatus: {
                basicAuth: authStatus.basicAuth,
                secretAuth: authStatus.secretAuth,
              },
            },
            () => {
              const lastError = chrome.runtime.lastError;
              // Ignore the error - this just means the tab isn't ready
              if (lastError) {
                console.debug(
                  `Could not send message to tab ${tab.id}:`,
                  lastError.message
                );
              }
            }
          );
        }
      });
    });
  };
}
