import minimist from 'minimist';

import { CommandLineParams } from './CommandLineParams';
import { ParameterInfo } from './ParameterInfo';
import { schema } from './Schema';

export const params = minimist(
  process.argv,
  {
    alias: schema.filter(
      (x: ParameterInfo): boolean => !!x.aliases?.length
    ).map(
      (x: ParameterInfo): { [key: string]: Array<string> } => {
        return {
          [x.name]: x.aliases,
        };
      }
    ),
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
