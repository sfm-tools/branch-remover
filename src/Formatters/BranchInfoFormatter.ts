import chalk from 'chalk';
import Table from 'cli-table';
import humanizeDuration from 'humanize-duration';

import { Branch } from '../Core';

export const branchInfoFormatter = (branch: Branch): string => {
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
          ) + ` ago (${branch.mergedDate.toLocaleString()})`
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
        ) + ` ago (${branch.updatedDate?.toLocaleString()})`,
      ]
    },
    {
      'Has unmerged changes': [
        branch.hasUncommittedChanges ? chalk.red('yes') : chalk.green('no'),
      ]
    },
  );

  if (branch.url) {
    table.push({
      'Url': [
        branch.url,
      ]
    });
  }

  return table.toString();
};
