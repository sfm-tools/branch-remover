import { expect } from 'chai';
import faker from 'faker';
import streams from 'memory-streams';
import { Writable } from 'stream';
import util from 'util';
import winston from 'winston';

import { BranchRemover } from '../src/BranchRemover';
import {
  BranchListItem,
  BranchRemoverOptionsIgnoreArgs,
  IBranchRemover,
  ILogger,
  IProvider,
  Logger,
} from '../src/Core';
import { FakeCacheProvider } from './FakeCacheProvider';
import { FakeProvider } from './FakeProvider';

const setTimeoutAsync = util.promisify(
  (interval: number, callback?: Function): void => {
    setTimeout(callback, interval);
  }
);

describe('BranchRemover', (): void => {
  let provider: IProvider;
  let remover: IBranchRemover;
  let logger: ILogger;
  let writer: Writable;

  const getBranchNames = async(): Promise<Array<string>> => {
    return (await provider.getListBranches()).map(
      (x: BranchListItem): string => x.name
    );
  };

  const randomArrayElements = (source: Array<string>, max: number): Array<string> => {
    const result = new Array<string>();

    let item = faker.random.arrayElement(source);

    while (
      result.includes(item)
      || result.length < max
    ) {
      if (!result.includes(item)) {
        result.push(item);
      }

      item = faker.random.arrayElement(source);
    }

    return result;
  };

  const escape = (value: string): string => {
    return value.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  };

  const initNewLogger = (): void => {
    logger = new Logger({
      levels: Logger.defaultLevels,
      level: 'info',
      transports: [
        new winston.transports.Stream({
          stream: writer,
        }),
      ],
    });
  };

  beforeEach((): void => {
    writer = new streams.WritableStream();
    provider = new FakeProvider();
    remover = new BranchRemover(provider);

    initNewLogger();
  });

  it('provider should not be null', (): void => {
    expect(remover.provider).to.not.be.null;
  });

  it('should use the default logger', async(): Promise<void> => {
    await remover.execute({
      remove: (): Promise<boolean> => Promise.resolve(true),
    }, true);

    expect(writer.toString()).to.be.empty;
  });

  it('should skip a branch for which detailed information is missing', async(): Promise<void> => {
    await getBranchNames();

    (<FakeProvider>provider).details.splice(0, 10);

    await remover.execute({
      logger,
      remove: (): Promise<boolean> => Promise.resolve(true),
    });

    const log = writer.toString();
    const result = await getBranchNames();

    expect(result.length).to.be.equal(10);
    expect(log).to.be.contain('because no detailed information');
  });

  it('should not remove branches in test mode', async(): Promise<void> => {
    const branches = await getBranchNames();

    await remover.execute({
      logger,
      remove: (): Promise<boolean> => Promise.resolve(true),
    }, true);

    const log = writer.toString();
    const result = await getBranchNames();

    expect(result.length).to.be.equal(branches.length);
    expect(log).to.be.contain('Removing is not applicable in test mode.');
  });

  it('should only contain branches that were ignored by function results', async(): Promise<void> => {
    const max = 5;
    const branches = randomArrayElements(
      await getBranchNames(),
      max
    );

    await remover.execute({
      logger,
      ignore: ({ branchName }: BranchRemoverOptionsIgnoreArgs): Promise<boolean> => {
        return Promise.resolve(
          branches.includes(branchName)
        );
      },
      remove: (): Promise<boolean> => Promise.resolve(true),
    });

    const result = await getBranchNames();

    expect(result.length).to.be.equal(max);
    expect(result.sort()).to.deep.equal(branches.sort());
  });

  it('should only contain branches that were ignored by RegExp pattern', async(): Promise<void> => {
    const max = 5;
    const branches = randomArrayElements(
      await getBranchNames(),
      max
    );

    await remover.execute({
      logger,
      ignore: new RegExp(`^(${branches.map(escape).join('|')})$`),
      remove: (): Promise<boolean> => Promise.resolve(true),
    });

    const result = await getBranchNames();

    expect(result.length).to.be.equal(max);
    expect(result.sort()).to.deep.equal(branches.sort());
  });

  it('should only contain branches that were ignored by array', async(): Promise<void> => {
    const max = 5;
    const ignore = randomArrayElements(
      await getBranchNames(),
      max
    );

    await remover.execute({
      logger,
      ignore,
      remove: (): Promise<boolean> => Promise.resolve(true),
    });

    const result = await getBranchNames();

    expect(result.length).to.be.equal(max);
    expect(result.sort()).to.deep.equal(ignore.sort());
  });

  it('should only contain branches that were ignored by string value', async(): Promise<void> => {
    const ignore = randomArrayElements(
      await getBranchNames(),
      1
    )[0];

    await remover.execute({
      logger,
      ignore,
      remove: (): Promise<boolean> => Promise.resolve(true),
    });

    const result = await getBranchNames();

    expect(result.length).to.be.equal(1);
    expect(result).to.deep.equal([ignore]);
  });

  it('should be removed all branches using remove function', async(): Promise<void> => {
    await remover.execute({
      logger,
      remove: (): Promise<boolean> => Promise.resolve(true),
    });

    const result = await getBranchNames();

    expect(result.length).to.be.equal(0);
  });

  it('should use cache', async(): Promise<void> => {
    const branches = await getBranchNames();
    const keys = branches.map((x: string): string => `branch-${x}`);

    const cache = {
      timeout: 10,
      provider: new FakeCacheProvider(),
    };

    await remover.execute({
      cache,
      remove: (): Promise<boolean> => Promise.resolve(false),
    }, true);

    expect(cache.provider.keys()).to.be.deep.equal(keys);

    await remover.execute({
      cache,
      logger,
      remove: (): Promise<boolean> => Promise.resolve(true),
    }, true);

    const log = writer.toString();

    expect(log).to.be.contains('because it was cached');
  });
});
