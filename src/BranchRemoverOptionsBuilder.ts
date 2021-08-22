import chalk from 'chalk';
import Table from 'cli-table';
import humanizeDuration from 'humanize-duration';
import readline from 'readline';

import {
  Branch,
  BranchRemoverOptions,
  BranchRemoverOptionsIgnoreArgs,
  BranchRemoverOptionsRemoveArgs,
} from './Core';

export class BranchRemoverOptionsBuilder {

  private _quiet: boolean = false;

  private _mergedDate: Date = null;

  private _staleDate: Date = null;

  private _ignore: string = null;

  constructor() {
    this.quiet = this.quiet.bind(this);
    this.merged = this.merged.bind(this);
    this.stale = this.stale.bind(this);
    this.ignore = this.ignore.bind(this);
    this.build = this.build.bind(this);
  }

  public quiet(): this {
    this._quiet = true;
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

  public build(): BranchRemoverOptions {
    const ignore = this.getRegExpOrNull(this._ignore);
    const mergedDate = this._mergedDate;
    const staleDate = this._staleDate;
    const quiet = this._quiet;

    return {
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
      remove: async(e: BranchRemoverOptionsRemoveArgs): Promise<boolean> => {
        const {
          branch,
          context: {
            logger,
          },
        } = e;

        let result = false;

        if (branch.merged) {
          if (mergedDate) {
            result = mergedDate && branch.mergedDate <= mergedDate;

            if (result) {
              logger.debug(
                'Can remove merged "{branch.name}", because the merged date {branch.mergedDate} is less or equal to {date}.',
                {
                  branch,
                  date: mergedDate,
                }
              );
            } else {
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
          }
        }

        if (result && !quiet) {
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
            `Do you want to remove ${branch.merged ? 'merged' : 'unmerged'} branch "${branch.name}"? ${date} [Y/n] `,
          );

          if (!/y(es|)+/gi.test(answer || 'yes')) {
            result = false;

            logger.debug(
              'The user has forbidden the removing of branch "{branch.name}".',
              {
                branch,
              }
            );
          }
        }

        return result;
      },
    };
  }

  private displayBranchInfo(branch: Branch): void {
    const now = new Date();
    const table = new Table();

    table.push(
      {
        'Branch': [
          branch.name,
        ]
      },
      {
        'State': [
          branch.merged ? chalk.green('merged') : chalk.red('unmerged'),
        ]
      },
      {
        'Merged date': [
          branch.merged && branch.mergedDate
            ? humanizeDuration(
              now.getTime() - branch.mergedDate.getTime(),
              {
                largest: 1,
                round: true,
              }
            ) + ` ago (${branch.mergedDate.toString()})`
            : 'n/a',
        ]
      },
      {
        'Updated date': [
          humanizeDuration(
            now.getTime() - branch.updatedDate?.getTime(),
            {
              largest: 1,
              round: true,
            }
          ) + ` ago (${branch.updatedDate?.toString()})`,
        ]
      },
      {
        'Has unmerged changes': [
          branch.hasUncommittedChanges ? chalk.red('yes') : 'no',
        ]
      },
    );

    console.log(table.toString());
  }

  private getRegExpOrNull(value: string): RegExp {
    return value
      ? new RegExp(value, 'g')
      : null;
  }

}
