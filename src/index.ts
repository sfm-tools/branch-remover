#!/usr/bin/env node
import parse from 'parse-duration';

import { BranchRemover } from './BranchRemover';
import { BranchRemoverOptionsBuilder } from './BranchRemoverOptionsBuilder';
import { helpCommand, params } from './CommandLine';
import { BranchRemoverOptions, IProvider } from './Core';
import { Auth, GitHubProvider } from './Providers/GitHubProvider';

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
    if (!params['github']) {
      throw new Error('Expects parameter github.auth or parameters github.owner, github.repo and github.token.');
    }

    let auth: Auth = null;
    if (params['github']['auth']) {
      auth = require(params['github']['auth']);
    } else {
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

      auth = params['github'];
    }

    provider = new GitHubProvider(auth);
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

  if (params.yes) {
    builder.yes();
  }

  builder.ignore(params.ignore);

  options = builder.build();
}

const remover = new BranchRemover(provider);

remover.execute(
  options,
  params.test
);
