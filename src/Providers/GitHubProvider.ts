import { Octokit } from '@octokit/rest';

import { IProvider } from './IProvider';
import {
  Auth,
  Branch,
  BranchDetails,
  Commit,
  PullRequestStatus,
} from './Types';

export class GitHubProvider implements IProvider {

  private readonly _auth: Auth;

  private readonly _client: Octokit;

  public get owner(): string {
    return this._auth.owner;
  }

  public get repo(): string {
    return this._auth.repo;
  }

  constructor(auth: Auth) {
    this._client = new Octokit({
      auth: auth.token,
    });

    this._auth = auth;

    this.getBranches = this.getBranches.bind(this);
    this.branchIsExists = this.branchIsExists.bind(this);
    this.removeBranch = this.removeBranch.bind(this);
    this.getPullRequestStatus = this.getPullRequestStatus.bind(this);
    this.getLastCommit = this.getLastCommit.bind(this);
  }

  public async getBranches(): Promise<Array<Branch>> {
    const result = new Array<Branch>();
    const getList = async(page: number): Promise<Array<Branch>> => {
      const { data }= await this._client.repos.listBranches({
        owner: this.owner,
        repo: this.repo,
        per_page: 100,
        page,
      });

      return data.map<Branch>(
        (x): Branch => {
          return {
            name: x.name,
            lastCommitHash: x.commit.sha,
          };
        }
      );
    };

    let page = 1;
    let list = await getList(page);

    while (list.length) {
      result.push(...list);
      list = await getList(++page);
    }

    return result;
  }

  public async getBranchDetails(branch: Branch): Promise<BranchDetails> {
    const { data } = await this._client.search.issuesAndPullRequests({
      q: `repo:${this.owner}/${this.repo} is:pr head:${branch.name} hash:${branch.lastCommitHash}`,
      sort: 'updated',
      order: 'desc',
    });

    let updatedDate: Date = null;
    let mergedDate: Date = null;
    let merged = false;

    const item = data.items?.[0];

    if (item) {
      updatedDate = new Date(item.updated_at);

      if (item.state === 'closed') {
        const status = await this.getPullRequestStatus(item.number);

        merged = status.merged;
        mergedDate = status.mergedDate;
      }
    } else {
      const commit = await this.getLastCommit(branch.name);

      updatedDate = new Date(commit.date);
    }

    return {
      name: branch.name,
      merged,
      mergedDate,
      updatedDate,
    };
  }

  public async branchIsExists(branchName: string): Promise<boolean> {
    const response = !!(await this._client.repos.getBranch({
      owner: this.owner,
      repo: this.repo,
      branch: branchName,
    })).data;

    return response;
  }

  public async removeBranch(branchName: string): Promise<void> {
    await this._client.git.deleteRef({
      owner: this.owner,
      repo: this.repo,
      ref: `heads/${branchName}`,
    });
  }

  private async getPullRequestStatus(pullRequestNumber: number): Promise<PullRequestStatus> {
    const { data } = await this._client.pulls.get({
      owner: this.owner,
      repo: this.repo,
      pull_number: pullRequestNumber,
    });

    return {
      sourceBranchName: data.head.ref,
      targetBranchName: data.base.ref,
      merged: data.merged,
      mergeable: data.mergeable,
      mergeableState: data.mergeable_state as any,
      mergedDate: data.merged_at && new Date(data.merged_at),
      closedDate: data.closed_at && new Date(data.closed_at),
      updatedDate: data.updated_at && new Date(data.updated_at),
      createdDate: new Date(data.created_at),
    };
  }

  private async getLastCommit(branchName: string): Promise<Commit> {
    const { data } = await this._client.repos.getCommit({
      owner: this.owner,
      repo: this.repo,
      ref: branchName,
    });

    return {
      hash: data.sha,
      date: new Date(data.commit.committer.date),
    };
  }

}
