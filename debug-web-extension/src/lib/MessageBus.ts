type MessageHandler = (payload: any) => Promise<any>;
type MessageCallback = (response: any) => void;

interface Message {
  id: string;
  source: string;
  type: string;
  payload: any;
}

interface MessageResponse extends Message {
  error?: string;
}

export class MessageBus {
  private handlers: Map<string, MessageHandler> = new Map();
  private callbacks: Map<string, MessageCallback> = new Map();
  private ready: boolean = false;
  private readyCallbacks: (() => void)[] = [];
  
  constructor(private source: string = 'WEBSITE') {
    this.setupMessageListener();
    this.setupServiceWorkerListener();
    
    // Register handler for SW intercept response from content script
    this.registerHandler("SW_FETCH_INTERCEPT_RESPONSE", async (payload) => {
      console.log('[Page MessageBus]: Received SW intercept response from content script:', payload);
      
      // Forward to service worker
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'PAGE_INTERCEPT_RESPONSE',
          data: payload
        });
        console.log('[Page MessageBus]: Forwarded SW intercept response to service worker');
      } else {
        console.warn('[Page MessageBus]: No service worker controller found to forward response');
      }
      
      return { success: true };
    });
  }

  private setupMessageListener() {
    window.addEventListener('message', this.handleMessage);
    
    // Setup ready state listener
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'READY' && event.data?.source === 'CONTENT_SCRIPT') {
        this.ready = true;
        this.readyCallbacks.forEach(cb => cb());
        this.readyCallbacks = [];
      }
    });
  }

  private setupServiceWorkerListener() {
    // Ensure service worker is supported
    if (!('serviceWorker' in navigator)) {
      console.error('[Page MessageBus]: Service Worker is not supported in this browser');
      return;
    }

    // Log service worker state
    console.log('[Page MessageBus]: Setting up service worker listener. Current controller:', 
      navigator.serviceWorker.controller ? 'Available' : 'Not available');
    
    // Start listening right away if controller exists
    if (navigator.serviceWorker.controller) {
      this.addServiceWorkerMessageListener();
    }
    
    // Handle the case when service worker is still being registered/activated
    navigator.serviceWorker.ready.then(registration => {
      console.log('[Page MessageBus]: Service Worker is ready:', registration.active?.state);
      
      // Ensure listener is attached after service worker is ready
      this.addServiceWorkerMessageListener();
    }).catch(err => {
      console.error('[Page MessageBus]: Error waiting for service worker to be ready:', err);
    });
  }
  
  private addServiceWorkerMessageListener() {
    console.log('[Page MessageBus]: Adding service worker message listener');
    
    // Remove existing listener to avoid duplicates
    navigator.serviceWorker.removeEventListener('message', this.handleServiceWorkerMessage);
    
    // Add listener again
    navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage);
  }

  private handleServiceWorkerMessage = (event: MessageEvent) => {
    const { type, url, method, timestamp } = event.data;
    
    console.log('[Page MessageBus]: Processing service worker message:', event.data);
    
    if (type === 'SW_FETCH_INTERCEPT') {
      console.log('[Page MessageBus]: Received intercept message from service worker:', event.data);
      
      try {
        // Send to content script and wait for response
        this.sendMessage('SW_FETCH_INTERCEPT', { url, method, timestamp })
          .then(response => {
            // Send response back to service worker
            if (navigator.serviceWorker.controller) {
              navigator.serviceWorker.controller.postMessage({
                type: 'PAGE_INTERCEPT_RESPONSE',
                data: response
              });
              console.log('[Page MessageBus]: Sent response to service worker:', response);
            } else {
              console.warn('[Page MessageBus]: No service worker controller to respond to');
            }
          })
          .catch(error => {
            console.error('[Page MessageBus]: Error handling service worker message:', error);
          });
      } catch (error) {
        console.error('[Page MessageBus]: Error initiating service worker message handling:', error);
      }
    }
  };

  private handleMessage = async (event: MessageEvent) => {
    const message = event.data as Message;
    
    // Ignore messages from same source to prevent loops
    if (message?.source === this.source) return;
    
    // Handle responses to sent messages
    if (message?.type?.endsWith('_RESPONSE')) {
      const originalType = message.type.replace('_RESPONSE', '');
      const callback = this.callbacks.get(originalType);
      if (callback) {
        callback(message.payload);
        this.callbacks.delete(originalType);
      }
      return;
    }

    // Handle incoming messages that need processing
    const handler = this.handlers.get(message?.type);
    if (handler) {
      try {
        const response = await handler(message.payload);
        this.sendResponse(message, response);
      } catch (error) {
        this.sendResponse(message, null, error as Error);
      }
    }
  };

  private sendResponse(originalMessage: Message, payload: any, error?: Error) {
    const response: MessageResponse = {
      id: originalMessage.id,
      source: this.source,
      type: `${originalMessage.type}_RESPONSE`,
      payload,
    };
    
    if (error) {
      response.error = error.message;
    }
    
    window.postMessage(response, window.location.origin);
  }

  private generateMessageId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public async waitForReady(timeout: number = 2000): Promise<void> {
    if (this.ready) return;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Timeout waiting for ready state'));
      }, timeout);

      this.readyCallbacks.push(() => {
        clearTimeout(timeoutId);
        resolve();
      });
    });
  }

  public registerHandler(type: string, handler: MessageHandler) {
    this.handlers.set(type, handler);
  }

  public unregisterHandler(type: string) {
    this.handlers.delete(type);
  }

  public async sendMessage<T>(type: string, payload: any): Promise<T> {
    await this.waitForReady();

    return new Promise((resolve, reject) => {
      const messageId = this.generateMessageId();
      const timeoutId = setTimeout(() => {
        this.callbacks.delete(type);
        reject(new Error(`Message timeout for type: ${type}`));
      }, 5000);

      this.callbacks.set(type, (response) => {
        clearTimeout(timeoutId);
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve(response as T);
        }
      });

      const message: Message = {
        id: messageId,
        source: this.source,
        type,
        payload,
      };

      window.postMessage(message, window.location.origin);
    });
  }

  public destroy() {
    window.removeEventListener('message', this.handleMessage);
    navigator.serviceWorker.removeEventListener('message', this.handleServiceWorkerMessage);
  }
}