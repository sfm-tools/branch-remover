import parse from 'parse-duration';

import { BranchRemover } from './BranchRemover';
import { BranchRemoverOptionsBuilder } from './BranchRemoverOptionsBuilder';
import { helpCommand, params } from './CommandLine';
import { BranchRemoverOptions, IProvider } from './Core';
import { GitHubProvider } from './Providers/GitHubProvider';

if (params.version) {
  const { version } = require('../package.json');
  console.log(`v${version}`);
  process.exit();
}

if (params.help) {
  helpCommand();
}

let options: BranchRemoverOptions;
let provider: IProvider;

switch (params.provider.toLowerCase()) {
  case 'github': {
    const requiredParams = [
      'token',
      'owner',
      'repo',
    ];

    requiredParams.forEach(
      (x: string): void => {
        if (!params['github'][x]) {
          throw new Error(`"github.${x}" is required. The value must not be empty.`);
        }
      }
    );

    provider = new GitHubProvider(params['github']);
    break;
  }

  default:
    throw Error(`Unknown provider "${params.provider}".`);
}

if (params.config) {
  options = require(params.config);
} else {
  const now = new Date();
  const builder = new BranchRemoverOptionsBuilder();

  if (params.quiet) {
    builder.quiet();
  }

  if (params.merged !== 'all') {
    const milliseconds = parse(params.merged);
    builder.merged(new Date(now.getTime() - milliseconds));
  }

  if (params.stale) {
    const milliseconds = parse(params.stale);
    builder.stale(new Date(now.getTime() - milliseconds));
  }

  builder.ignore(params.ignore);

  options = builder.build();
}

const remover = new BranchRemover(provider);

remover.execute(
  options,
  params.test
);
