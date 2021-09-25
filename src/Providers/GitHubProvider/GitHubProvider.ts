import { Octokit, RestEndpointMethodTypes } from '@octokit/rest';

import {
  Branch,
  BranchListItem,
  IBranchesProvider,
} from '../../Core';
import {
  Auth,
  Commit,
  PullRequestStatus,
} from './Types';

export class GitHubProvider implements IBranchesProvider {

  private readonly _auth: Auth;

  private readonly _client: Octokit;

  private get owner(): string {
    return this._auth.owner;
  }

  private get repo(): string {
    return this._auth.repo;
  }

  public get name(): string {
    return 'GitHub';
  }

  constructor(auth: Auth) {
    Object.getOwnPropertyNames(new Auth(null, null, null)).forEach(
      (x: string): void => {
        if (!auth[x]) {
          throw new Error(`The "${x}" property is required. The value must not be empty.`);
        }
      }
    );

    this._client = new Octokit({
      auth: auth.token,
    });

    this._auth = auth;

    this.getListBranches = this.getListBranches.bind(this);
    this.removeBranch = this.removeBranch.bind(this);
    this.getPullRequestStatus = this.getPullRequestStatus.bind(this);
    this.getLastCommit = this.getLastCommit.bind(this);
  }

  public async getListBranches(): Promise<Array<BranchListItem>> {
    const result = new Array<BranchListItem>();
    const getList = async(page: number): Promise<Array<BranchListItem>> => {
      const { data }= await this._client.repos.listBranches({
        owner: this.owner,
        repo: this.repo,
        per_page: 100,
        page,
      });

      return data.map<BranchListItem>(
        (x): BranchListItem => {
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

  public async getBranch(branchName: string, lastCommitHash?: string): Promise<Branch> {
    const { data } = await this._client.search.issuesAndPullRequests({
      q: `repo:${this.owner}/${this.repo} is:pr head:${branchName}` + (lastCommitHash ? ` hash:${lastCommitHash}` : ''),
      sort: 'updated',
      order: 'desc',
    });

    let updatedDate: Date = null;
    let mergedDate: Date = null;
    let merged = false;
    let hasUncommittedChanges = false;
    let status: PullRequestStatus;
    let item: RestEndpointMethodTypes['search']['issuesAndPullRequests']['response']['data']['items'][0];

    if (data.items.length) {
      for (const x of data.items) {
        status = await this.getPullRequestStatus(x.number);

        if (status.sourceBranchName === branchName) {
          item = x;
          updatedDate = new Date(status.updatedDate);
          hasUncommittedChanges = updatedDate > status.mergedDate;
          break;
        }
      }
    }

    if (item) {
      updatedDate = new Date(item.updated_at);

      if (item.state === 'closed') {
        merged = status.merged;
        mergedDate = status.mergedDate;
      }
    } else {
      const commit = await this.getLastCommit(branchName);

      updatedDate = new Date(commit.date);
    }

    return {
      name: branchName,
      merged,
      mergedDate,
      updatedDate,
      hasUncommittedChanges,
      url: `https://github.com/${this._auth.owner}/${this._auth.repo}/tree/${branchName}`,
    };
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
      mergeCommitHash: data.merge_commit_sha,
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
