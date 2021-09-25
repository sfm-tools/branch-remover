import { Branch, BranchListItem } from './Types';

export interface IBranchesProvider {

  /**
   * Gets the name of the provider.
   */
  readonly name: string;

  getListBranches(): Promise<Array<BranchListItem>>;

  getBranch(branchName: string, lastCommitHash?: string): Promise<Branch>;

  removeBranch(branchName: string): Promise<void>;

}
