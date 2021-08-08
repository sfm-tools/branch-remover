import { Branch, BranchListItem } from './Types';

export interface IProvider {

  /**
   * Gets the name of the provider.
   */
  readonly name: string;

  getListBranches(): Promise<Array<BranchListItem>>;

  getBranch(branchName: string, lastCommitHash?: string): Promise<Branch>;

  branchIsExists(branchName: string): Promise<boolean>;

  removeBranch(branchName: string): Promise<void>;

}
