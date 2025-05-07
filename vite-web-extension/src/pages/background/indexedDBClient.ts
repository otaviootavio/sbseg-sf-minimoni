export class IndexedDBClient {
  private db: IDBDatabase | null = null;

  constructor(
    private readonly dbName: string,
    private readonly storeName: string,
    private readonly version: number = 1
  ) {}

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        db.createObjectStore(this.storeName, { keyPath: "id" });
      };
    });
  }

  private async getStore(): Promise<IDBObjectStore> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(this.storeName, "readwrite");
    return transaction.objectStore(this.storeName);
  }

  async get<T>(key: string): Promise<T | null> {
    const store = await this.getStore();
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result as T);
      request.onerror = () => reject(request.error);
    });
  }

  async put<T>(key: string, value: T): Promise<void> {
    const store = await this.getStore();
    return new Promise((resolve, reject) => {
      const request = store.put({ id: key, ...value });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAll<T>(): Promise<(T & { id: string })[]> {
    const store = await this.getStore();
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        // Filter out the selected_hashchain entry since it's not a hashchain
        const results = (request.result as any[])
          .filter((item) => item.id !== "selected_hashchain")
          // Keep the id field instead of removing it
          .map((item) => item as T & { id: string });
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async delete(key: string): Promise<void> {
    const store = await this.getStore();
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
