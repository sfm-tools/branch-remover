import { Branch, BranchListItem } from './Types';

export interface IProvider {

  getListBranches(): Promise<Array<BranchListItem>>;

  getBranch(branchName: string, lastCommitHash?: string): Promise<Branch>;

  branchIsExists(branchName: string): Promise<boolean>;

  removeBranch(branchName: string): Promise<void>;

}
