import NodeCache from 'node-cache';

import {
  ICacheProvider,
} from '../src/Core';

export class FakeCacheProvider implements ICacheProvider {

  private readonly _cache = new NodeCache();

  constructor() {
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

  public load(): Promise<void> {
    return Promise.resolve();
  }

  public save(): Promise<void> {
    return Promise.resolve();
  }

}
