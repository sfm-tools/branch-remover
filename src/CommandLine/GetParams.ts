import minimist from 'minimist';

import { CommandLineParams } from './CommandLineParams';
import { ParameterInfo } from './ParameterInfo';
import { schema } from './Schema';

const alias = Object.fromEntries(
  schema.filter(
    (x: ParameterInfo): boolean => !!x.aliases?.length
  ).map(
    (x: ParameterInfo): Array<string | Array<string>> => {
      return [
        x.name, x.aliases,
      ];
    }
  )
);

export const params = minimist(
  process.argv,
  {
    alias,
    boolean: [
      'version',
      'test',
      'quiet',
    ],
    string: [
      'provider',
      'ignore',
      'merged',
      'stale',
      'config',
    ],
    default: {
      provider: 'github',
      merged: 'all',
      stale: '',
      quiet: false,
    },
  }
) as CommandLineParams;
