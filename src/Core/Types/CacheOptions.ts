import { ICacheProvider } from '../ICacheProvider';

export type CacheOptions = {

  readonly provider?: ICacheProvider;

  readonly timeout: number;

};
