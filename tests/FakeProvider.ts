import faker from 'faker';

import {
  Branch,
  BranchListItem,
  IProvider,
} from '../src/Core';

export class FakeProvider implements IProvider {

  public get name(): string {
    return 'Fake';
  }

  constructor() {
    this.getListBranches = this.getListBranches.bind(this);
    this.removeBranch = this.removeBranch.bind(this);
  }

  public getListBranches(): Promise<Array<BranchListItem>> {
    const result = Array.from(new Array(100)).map(
      (): BranchListItem => {
        return {
          name: faker.git.branch(),
          lastCommitHash: faker.git.commitSha(),
        };
      }
    );

    return Promise.resolve(result);
  }

  public getBranch(name: string, lastCommitHash?: string): Promise<Branch> {
    const updatedDate: Date = faker.date.past(2, new Date());
    const merged = faker.datatype.boolean();
    const mergedDate: Date = merged ? updatedDate : null;

    const result = {
      name,
      merged,
      mergedDate,
      updatedDate,
    };

    return Promise.resolve(result);
  }

  public removeBranch(branchName: string): Promise<void> {
    return Promise.resolve();
  }

}
