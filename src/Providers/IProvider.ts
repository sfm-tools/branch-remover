import { Branch } from './Types';

export interface IProvider {

  readonly owner: string;

  readonly repo: string;

  getBranches(): Promise<Array<Branch>>;

  branchIsExists(branchName: string): Promise<boolean>;

  deleteBranch(branchName: string): Promise<void>;

}
