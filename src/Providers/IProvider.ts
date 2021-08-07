import { Branch, BranchDetails } from './Types';

export interface IProvider {

  readonly owner: string;

  readonly repo: string;

  getBranches(): Promise<Array<Branch>>;

  getBranchDetails(branch: Branch): Promise<BranchDetails>;

  branchIsExists(branchName: string): Promise<boolean>;

  removeBranch(branchName: string): Promise<void>;

}
