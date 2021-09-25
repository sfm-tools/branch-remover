import chalk from 'chalk';

import {
  BranchRemoverContext,
  BranchRemoverOptions,
  BranchRemoverOptionsIgnoreArgs,
  BranchRemoverOptionsIgnoreFunction,
  BranchRemoverOptionsIgnoreType,
  IBranchesProvider,
  IBranchRemover,
  ILogger,
  Logger,
} from './Core';

export class BranchRemover implements IBranchRemover {

  private readonly _provider: IBranchesProvider;

  public get provider(): IBranchesProvider {
    return this._provider;
  }

  constructor(provider: IBranchesProvider) {
    this._provider = provider;

    this.execute = this.execute.bind(this);
  }

  public async execute(options: BranchRemoverOptions, test?: boolean): Promise<void> {
    // TODO: PackageInfo service
    const {
      name: packageName,
      version: packageVersion,
    } = require('../package.json');

    const logger = options.logger || new Logger();
    const cache = options.cache?.provider;
    const cacheTimeout = options.cache?.timeout ?? 0;
    const isCacheAvailable = cache && cacheTimeout > 0;

    logger.info(
      '{package} v{version}',
      {
        package: packageName,
        version: packageVersion,
      }
    );

    if (isCacheAvailable) {
      cache.load();
    }

    try {
      await this.processBranches(
        logger,
        options,
        test ?? false
      );
    } catch (error) {
      throw new Error(error.message);
    } finally {
      if (isCacheAvailable) {
        cache.save();
      }
    }
  }

  private buildIgnoreFunction(value: BranchRemoverOptionsIgnoreType): BranchRemoverOptionsIgnoreFunction {
    if (typeof value === 'function') {
      return value;
    }

    if (typeof value === 'string') {
      return (e: BranchRemoverOptionsIgnoreArgs): Promise<boolean> => {
        return Promise.resolve(
          e.branchName === value
        );
      };
    }

    if (value instanceof RegExp) {
      return (e: BranchRemoverOptionsIgnoreArgs): Promise<boolean> => {
        return Promise.resolve(
          value.test(e.branchName)
        );
      };
    }

    if (Array.isArray(value)) {
      return (e: BranchRemoverOptionsIgnoreArgs): Promise<boolean> => {
        return Promise.resolve(
          value.includes(e.branchName)
        );
      };
    }

    return (): Promise<boolean> => Promise.resolve(false);
  }

  private async processBranches(
    logger: ILogger,
    options: Omit<BranchRemoverOptions, 'logger'>,
    test: boolean
  ): Promise<void> {
    const start = new Date();
    const cache = options.cache?.provider;
    const cacheTimeout = options.cache?.timeout ?? 0;
    const isCacheAvailable = cache && cacheTimeout > 0;
    const ignore = this.buildIgnoreFunction(options.ignore);
    const remove = options.remove;
    const dummy = (): Promise<boolean> => Promise.resolve(true);
    const beforeRemove = options.beforeRemove || dummy;
    const afterRemove = options.afterRemove || dummy;
    const context: BranchRemoverContext = {
      test,
      logger,
    };

    logger.info(
      'Processing branches using {provider} provider in {mode} mode.',
      {
        provider: chalk.yellow(this._provider.name),
        mode: test ? chalk.yellow('test') : chalk.bold(chalk.red('remove')),
      }
    );

    const branches = await this._provider.getListBranches();

    let totalRemoved = 0;

    for (let i = 0, ic = branches.length; i < ic; ++i) {
      const { name, lastCommitHash } = branches[i];

      logger.info(
        'Processing branch {index} of {count} - {branch}',
        {
          index: chalk.blue(i + 1),
          count: chalk.blue(ic),
          branch: name,
        }
      );

      if (isCacheAvailable) {
        const cacheKey = `branch-${name}`;

        if (cache.has(cacheKey)) {
          logger.info(
            'Skip branch "{branch}", because it was cached before {ttl}.',
            {
              branch: name,
              ttl: new Date(cache.getTtl(cacheKey)),
            }
          );
          continue;
        }

        cache.add(cacheKey, 1, cacheTimeout);
      }

      // NOTE: we have to check before getting branch details
      // because, depending on the provider, there may be limits on the number of requests;
      // for example, GitHub currently allows no more than 5,000 requests per hour for free
      const ignored = await ignore({
        branchName: name,
        context,
      });

      if (ignored) {
        logger.info(
          'Skip branch "{branch}", because it matches an ignored value.',
          {
            branch: name,
          }
        );
        continue;
      }

      const branch = await this._provider.getBranch(
        name,
        lastCommitHash
      );

      if (!branch) {
        logger.info(
          'Skip branch "{branch}", because no detailed information.',
          {
            branch: name,
          }
        );
        continue;
      }

      const args = {
        branch,
        context,
      };

      const canRemove = await remove(args);

      if (canRemove) {
        logger.info(
          'Removing "{branch}"...',
          {
            branch: name,
          }
        );

        if (test) {
          logger.info('Removing is not applicable in test mode.');
        } else {
          // TODO: not sure if we need additional checking,
          // this is probably redundant,
          // need to think about this question
          const canStillRemove = await beforeRemove(args);

          if (canStillRemove) {
            await this._provider.removeBranch(name);

            ++totalRemoved;

            logger.info(
              'Successfully removed "{branch}".',
              {
                branch: name,
              }
            );

            await afterRemove(args);
          } else {
            logger.info(
              'Removing branch "{branch}" canceled by the result of the {handler} handler.',
              {
                branch: name,
                handler: 'beforeRemove',
              }
            );
          }
        }
      }
    }

    logger.info(
      'Removed {totalRemoved} out of {totalCount} branches in {duration} seconds.',
      {
        totalRemoved,
        totalCount: branches.length,
        duration: (new Date().getTime() - start.getTime()) / 1000,
      }
    );
  }

}
