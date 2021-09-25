export interface ICache {

  has(key: string): boolean;

  keys(): Array<string>;

  get<T>(key: string): T | undefined;

  getTtl(key: string): number;

  /**
   * Adds value to cache. Returns true on success.
   *
   * @param key The cache key.
   * @param value The value to cache.
   * @param ttl Time to live (in seconds).
   */
  add<T>(key: string, value: T, ttl: number): boolean;

  remove(keys: string | Array<string>): number;

  clearAll(): void;

  /**
   * Loads saved data to cache.
   * If the current instance already contains any data,
   * it clears it and replaces it with the loaded data.
   */
  load(): Promise<void>;

  /**
   * Saves data.
   */
  save(): Promise<void>;

}
