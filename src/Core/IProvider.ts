import { BranchDetails, BranchListItem } from './Types';

export interface IProvider {

  readonly owner: string;

  readonly repo: string;

  getListBranches(): Promise<Array<BranchListItem>>;

  getBranchDetails(branchName: string, lastCommitHash?: string): Promise<BranchDetails>;

  branchIsExists(branchName: string): Promise<boolean>;

  removeBranch(branchName: string): Promise<void>;

}
