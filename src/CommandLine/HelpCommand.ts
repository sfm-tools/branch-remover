import chalk from 'chalk';
import Table from 'cli-table';

import { params } from './GetParams';
import { ParameterInfo } from './ParameterInfo';
import { ParameterInfoExample } from './ParameterInfoExample';
import { schema } from './Schema';

type RowType = { [key: string]: Array<string> };

export const helpCommand = (): void => {
  // TODO: PackageInfo service
  const {
    name: packageName,
    version: packageVersion,
  } = require('../../package.json');

  const additionalInfo = new Array<string>();
  const getRow = (x: ParameterInfo): RowType => {
    return {
      [`--${x.name}`]:
      [
        x.aliases?.map((x: string): string => `--${x}`).join('\n') ?? chalk.italic('n/a'),
        x.description?.join('\n') ?? chalk.italic('n/a'),
      ],
    };
  };

  let rows = schema.map(getRow);
  let param: ParameterInfo = null;

  if (typeof params.help === 'string') {
    const findName = (params.help as unknown).toString().trim();
    param = schema.find(
      (x: ParameterInfo): boolean => {
        return x.name === findName
          || x.aliases?.includes(findName);
      }
    );

    if (param) {
      rows = [getRow(param)];

      if (param.examples?.length) {
        additionalInfo.push(
          '',
          'Examples:',
          '─────────',
          ...param.examples.map(
            (x: ParameterInfoExample): string => {
              const result = new Array<string>();

              if (x.title) {
                result.push(chalk.italic(x.title));
              }

              result.push(`> ${x.example}`);

              if (x.notes) {
                result.push('');
                result.push(x.notes);
                result.push('');
              }

              return result.join('\n') + '\n';
            }
          )
        );
      }
    } else {
      console.error(`Unknown parameter name "${findName}".`);
    }
  }

  const table = new Table({
    head: [
      'Parameter',
      'Aliases',
      'Description',
    ],
  });

  table.push(...rows);

  console.log(
    `${packageName} v${packageVersion}`,
    param ? `/ ${param.name}` : ''
  );
  console.log(table.toString());

  if (additionalInfo?.length) {
    console.log(additionalInfo.join('\n'));
  }

  process.exit();
};
