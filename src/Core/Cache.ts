import fs from 'fs';
import NodeCache from 'node-cache';

import { ICache } from './ICache';

type CacheItem = { key: string, value: any, ttl: number };

export class Cache implements ICache {

  private readonly _cache = new NodeCache();

  private readonly _path: string;

  constructor(path?: string) {
    this._path = path;

    this.has = this.has.bind(this);
    this.keys = this.keys.bind(this);
    this.get = this.get.bind(this);
    this.getTtl = this.getTtl.bind(this);
    this.add = this.add.bind(this);
    this.remove = this.remove.bind(this);
    this.clearAll = this.clearAll.bind(this);
    this.load = this.load.bind(this);
    this.save = this.save.bind(this);
  }

  public has(key: string): boolean {
    return this._cache.has(key);
  }

  public keys(): Array<string> {
    return this._cache.keys();
  }

  public get<T>(key: string): T | undefined {
    return this._cache.get(key);
  }

  public getTtl(key: string): number {
    return this._cache.getTtl(key);
  }

  public add<T>(key: string, value: T, ttl: number): boolean {
    return this._cache.set(key, value, ttl);
  }

  public remove(keys: string | Array<string>): number {
    return this._cache.del(keys);
  }

  public clearAll(): void {
    this._cache.flushAll();
  }

  public async load(): Promise<void> {
    if (!this._path) {
      throw new Error('"path" is required. Value must not be null or empty.');
    }

    this.clearAll();

    if (!fs.existsSync(this._path)) {
      return;
    }

    const data = JSON.parse(
      await fs.readFileSync(this._path, 'utf8')
    ) || [];

    data.forEach((item: CacheItem): void => {
      this._cache.set(
        item.key,
        item.value,
        (item.ttl - new Date().getTime()) / 1000
      );
    });
  }

  public async save(): Promise<void> {
    if (!this._path) {
      throw new Error('"path" is required. Value must not be null or empty.');
    }

    const keys = this.keys();
    const data = new Array<CacheItem>();

    keys.forEach(
      (key: string): void => {
        data.push({
          key,
          ttl: this._cache.getTtl(key),
          value: this._cache.get(key),
        });
      }
    );

    await fs.writeFileSync(
      this._path,
      JSON.stringify(data),
      {
        encoding: 'utf8',
      }
    );
  }

}
