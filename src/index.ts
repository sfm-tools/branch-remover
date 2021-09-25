#!/usr/bin/env node
import parse from 'parse-duration';

import { BranchRemover } from './BranchRemover';
import { BranchRemoverOptionsBuilder } from './BranchRemoverOptionsBuilder';
import { helpCommand, params } from './CommandLine';
import { BranchRemoverOptions, IBranchesProvider } from './Core';
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
let provider: IBranchesProvider;

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

  if (params.details) {
    builder.details();
  }

  if (params.before) {
    builder.beforeRemove(params.before);
  }

  if (params.after) {
    builder.afterRemove(params.after);
  }

  if (params.cache) {
    // TODO: understand at what level it is better to implement the parsing of cache parameters
    // consider implementing inside BranchRemoverOptionsBuilder or alternative solution
    const cacheParams = /(?<path>.*)\s*((timeout=(?<timeout>\d+))|)/g.exec(params.cache);

    if (cacheParams.groups['path']) {
      builder.cachePath(cacheParams.groups['path']);
    }

    if (cacheParams.groups['timeout']) {
      builder.cacheTimeout(
        parseInt(cacheParams.groups['timeout'], 10)
      );
    }
  }

  builder.ignore(params.ignore);

  options = builder.build();
}

const remover = new BranchRemover(provider);

remover.execute(
  options,
  params.test
);
