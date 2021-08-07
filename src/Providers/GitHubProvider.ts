import { Octokit } from '@octokit/rest';

import { IProvider } from './IProvider';
import {
  Auth,
  Branch,
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
    this.deleteBranch = this.deleteBranch.bind(this);
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

}
