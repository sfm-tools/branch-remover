# branch-remover

[![NPM Version](https://badgen.net/npm/v/branch-remover)](https://www.npmjs.com/package/branch-remover)
![License](https://badgen.net/npm/license/branch-remover)
[![Build Status](https://travis-ci.org/sfm-tools/branch-remover.svg?branch=main)](https://travis-ci.org/sfm-tools/branch-remover)
[![Coverage Status](https://coveralls.io/repos/github/sfm-tools/branch-remover/badge.svg?branch=main)](https://coveralls.io/github/sfm-tools/branch-remover?branch=main)
![Last Commit](https://badgen.net/github/last-commit/sfm-tools/branch-remover/main)
[![Node Version](https://badgen.net/npm/node/branch-remover)](https://www.npmjs.com/package/branch-remover)

The easiest way to remove unneeded branches in your GitHub repos.

## Install

```bash
npm install --global branch-remover
```

## Usage

```bash
branch-remover --github.owner %owner% --github.repo %repo% --github.token %token% --ignore "^(master|main)$"
```

Use your access options instead `%owner%`, `%repo%`, and `%token%`.

`%owner%` and `%repo%` you can found in URL of your repository:

```
https://github.com/sfm-tools/branch-remover
                   ^^^^^^^^  ^^^^^^^^^^^^^^
                   owner     repo
```

For `%token%` check the following page:
https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/creating-a-personal-access-token

You can also use a separate JSON file with access parameters. For example:

**somename.json**
```json
{
  "owner": "%GITHUB USERNAME OR ORG NAME HERE%",
  "repo":  "%GITHUB REPOSITORY NAME HERE%",
  "token": "%YOUR GITHUB TOKEN HERE%"
}
```

You can specify the path to this file using the github.auth parameter:

```bash
branch-remover --github.auth ./somename.json --ignore "^(master|main)$"
```

## Options

### --version

Displays the version number of the application.

### --help

Displays help information.

You can see additional information for each individual option:
`branch-remover --help %parameterName%`.

For example:
* `branch-remover --help help`
* `branch-remover --help github.auth`

### --test

Test mode, automatic removing branches is disabled.
Use this option to **test your configuration**.

### --provider

Specifies the provider name. Expected values: `github` (default).

### --quiet

The presence of this option disables the confirmation request to remove branches.

**Matching branches will be removed immediately. Be careful when using this option!**

### --ignore

A regex pattern that allows specifying branches to ignore.

For example, ignore `master` and `main` branches:

```bash
branch-remover --github.auth ./auth.json --ignore "^(master|main)$"
```

### --merged

Allows specifying the time elapsed since the merge.

For example: `2 years` (or `2y`), `6 months`, `5 days` (or `5d`), `2 hours` (or `2h`), `30 minutes` (or `30m`), etc.

Default: `all` (all merged branches).

**NOTE:** Please use quotation marks if the option value contains a space. For example:


```bash
branch-remover --github.auth ./auth.json --merged "2 months"
```

### --stale

Allows specifying the time after which the unmerged branch can be considered obsolete since the last update.

This option is similar to `--merged`.

### --config

Path to custom js-file containing branch processing parameters.

### --github.auth

The path to the JSON file that contains the repository access parameters.

Required only for provider "github", when the access parameters are not specified separately.

### --github.auth

The path to the JSON file that contains the repository access parameters.

Required only for provider "github", when the access parameters are not specified separately.

### --github.token

GitHub access token - https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/creating-a-personal-access-token

Required only for provider "github", when `--github.auth` is not specified.

### --github.owner

Username or organization name on GitHub. For example: `sfm-tools`.

Required only for provider "github", when `--github.auth` is not specified.

### --github.repo

Repository name on GitHub. For example: `branch-remover`.

Required only for provider "github", when `--github.auth` is not specified.

## License
MIT
