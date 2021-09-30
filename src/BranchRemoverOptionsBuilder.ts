import child_process from 'child_process';
import humanizeDuration from 'humanize-duration';
import readline from 'readline';
import util from 'util';

import {
  Branch,
  BranchRemoveCancelationReason,
  BranchRemoverOptions,
  BranchRemoverOptionsIgnoreArgs,
  BranchRemoverOptionsRemoveArgs,
  FileCacheProvider,
  ILogger,
  Logger,
} from './Core';
import { branchInfoFormatter } from './Formatters';

const exec = util.promisify(child_process.exec);

export class BranchRemoverOptionsBuilder {

  public static readonly DEFAULT_CACHE_PATH = './.branch-remover.cache';

  private _quiet: boolean = false;

  private _yes: boolean = false;

  private _details: boolean = false;

  private _mergedDate: Date = null;

  private _staleDate: Date = null;

  private _ignore: string = null;

  private _beforeRemove: string = null;

  private _afterRemove: string = null;

  private _cacheTimeout: number = 0;

  private _cachePath: string = BranchRemoverOptionsBuilder.DEFAULT_CACHE_PATH;

  private _debug: boolean = false;

  constructor() {
    this.quiet = this.quiet.bind(this);
    this.merged = this.merged.bind(this);
    this.stale = this.stale.bind(this);
    this.yes = this.yes.bind(this);
    this.details = this.details.bind(this);
    this.ignore = this.ignore.bind(this);
    this.beforeRemove = this.beforeRemove.bind(this);
    this.afterRemove = this.afterRemove.bind(this);
    this.cacheTimeout = this.cacheTimeout.bind(this);
    this.cachePath = this.cachePath.bind(this);
    this.debug = this.debug.bind(this);
    this.build = this.build.bind(this);
  }

  public quiet(): this {
    this._quiet = true;
    return this;
  }

  public yes(): this {
    this._yes = true;
    return this;
  }

  public details(): this {
    this._details = true;
    return this;
  }

  public merged(date: Date): this {
    this._mergedDate = date;
    return this;
  }

  public stale(date: Date): this {
    this._staleDate = date;
    return this;
  }

  public ignore(value: string): this {
    this._ignore = value;
    return this;
  }

  public beforeRemove(command: string): this {
    this._beforeRemove = command;
    return this;
  }

  public afterRemove(command: string): this {
    this._afterRemove = command;
    return this;
  }

  public cacheTimeout(timeout: number): this {
    this._cacheTimeout = Number(timeout);
    return this;
  }

  public cachePath(path: string): this {
    if (!path) {
      throw new Error('Parameter "path" cannot be null or empty.');
    }

    this._cachePath = path;

    return this;
  }

  public debug(): this {
    this._debug = true;
    return this;
  }

  public build(): BranchRemoverOptions {
    const displayDefaultAnswer = this._yes ? '[Y/n]' : '[y/N]';
    const defaultAnswer = this._yes ? 'yes' : 'no';
    const ignore = this.getRegExpOrNull(this._ignore);
    const mergedDate = this._mergedDate;
    const staleDate = this._staleDate;
    const quiet = this._quiet;
    const details = this._details;
    const beforeRemove = this._beforeRemove;
    const afterRemove = this._afterRemove;
    const cachePath = this._cachePath;
    const cacheTimeout = this._cacheTimeout;
    const cacheProvider = new FileCacheProvider(cachePath);
    const logger = new Logger(
      Logger.defaultOptions(
        this._debug ? 'debug' : 'info'
      )
    );

    return {
      logger,
      cache: {
        provider: cacheProvider,
        timeout: cacheTimeout,
      },
      ignore: (e: BranchRemoverOptionsIgnoreArgs): Promise<boolean> => {
        if (ignore) {
          // When a regex has the global flag set, test() will advance the lastIndex of the regex.
          // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/test#using_test_on_a_regex_with_the_global_flag
          ignore.lastIndex = 0;

          if (ignore.test(e.branchName)) {
            return Promise.resolve(true);
          }
        }

        return Promise.resolve(false);
      },
      remove: async(e: BranchRemoverOptionsRemoveArgs): Promise<boolean | BranchRemoveCancelationReason> => {
        const {
          branch,
          context: {
            logger,
          },
        } = e;

        let result: boolean | BranchRemoveCancelationReason = false;

        if (branch.merged) {
          if (mergedDate) {
            if (branch.mergedDate <= mergedDate) {
              result = true;

              logger.debug(
                'Can remove merged "{branch.name}", because the merged date {branch.mergedDate} is less or equal to {date}.',
                {
                  branch,
                  date: mergedDate,
                }
              );
            } else {
              result = BranchRemoveCancelationReason.MergeDateOutOfRange;

              logger.debug(
                'Cannot remove merged "{branch.name}", because the merged date {branch.mergedDate} is greater than {date}.',
                {
                  branch,
                  date: mergedDate,
                }
              );
            }
          } else {
            result = true;

            logger.debug(
              'Can remove merged "{branch.name}", because no limit on merge date.',
              {
                branch,
              }
            );
          }
        } else {
          if (staleDate && branch.updatedDate <= staleDate) {
            result = true;

            logger.debug(
              'Can remove "{branch.name}", because the updated date {branch.updatedDate} is less or equal to {date}.',
              {
                branch,
                date: staleDate,
              }
            );
          } else {
            result = BranchRemoveCancelationReason.UpdateDateOutOfRange;
          }
        }

        if (result === true && !quiet) {
          const question = (query: string): Promise<string> => {
            const rl = readline.createInterface({
              input: process.stdin,
              output: process.stdout,
            });

            return new Promise(
              (resolve): void => {
                rl.question(
                  query,
                  (answer: string): void => {
                    resolve(answer);
                    rl.close();
                  }
                );
              }
            );
          };

          const now = new Date();
          const duration = humanizeDuration(
            now.getTime() - (branch.mergedDate ?? branch.updatedDate ?? now).getTime(),
            {
              largest: 1,
              round: true,
            }
          );
          const date = `${branch.merged ? 'Merged' : 'Updated'} ${duration} ago`;

          this.displayBranchInfo(branch);

          const answer = await question(
            `Do you want to remove ${branch.merged ? 'merged' : 'unmerged'} branch "${branch.name}"? ${date} ${displayDefaultAnswer} `,
          );

          if (!/y(es|)+/gi.test(answer || defaultAnswer)) {
            result = BranchRemoveCancelationReason.CanceledByUser;

            logger.debug(
              'Removing branch "{branch.name}" canceled by user.',
              {
                branch,
              }
            );
          }
        }

        if (details && !quiet && result !== true) {
          this.displayBranchInfo(branch);
        }

        return result;
      },
      beforeRemove: ({ branch, context }: BranchRemoverOptionsRemoveArgs): Promise<boolean> => {
        if (beforeRemove) {
          return this.execCommand(
            beforeRemove,
            branch,
            context.logger
          );
        } else {
          return Promise.resolve(true);
        }
      },
      afterRemove: async({ branch, context }: BranchRemoverOptionsRemoveArgs): Promise<void> => {
        if (afterRemove) {
          await this.execCommand(
            afterRemove,
            branch,
            context.logger
          );
        }
      },
    };
  }

  private displayBranchInfo(branch: Branch): void {
    console.log(branchInfoFormatter(branch));
  }

  private getRegExpOrNull(value: string): RegExp {
    return value
      ? new RegExp(value, 'g')
      : null;
  }

  private async execCommand(command: string, branch: Branch, logger: ILogger): Promise<boolean> {
    const commandToExec = command
      .replace(/(\\)(.{1})/g, String.fromCharCode(0) + '$2$1')
      .replace(/\{branch\}/g, branch.name)
      .replace(/(\0)(.{1})(\\)/g, '$2');

    logger.debug(
      'Preparation for command execution. Source: "{source}". Command to execute: {parsed}.',
      {
        source: command,
        parsed: commandToExec,
      }
    );

    const {
      stdout,
      stderr,
    } = await exec(commandToExec);

    logger.debug(
      '{command} > stdout - {stdout}, stderr - {stderr}',
      {
        command: commandToExec,
        stdout: stdout?.trim(),
        stderr: stderr?.trim(),
      }
    );

    return !stdout
      || (
        stdout
        && !/^(0|false)$/i.test(stdout)
      );
  }

}
