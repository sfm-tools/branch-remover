import faker from 'faker';

import {
  Branch,
  BranchListItem,
  IBranchesProvider,
} from '../src/Core';

export class FakeBranchesProvider implements IBranchesProvider {

  private _list = new Array<BranchListItem>();

  public details = new Array<Branch>();

  public get name(): string {
    return 'Fake';
  }

  constructor() {
    this.getListBranches = this.getListBranches.bind(this);
    this.removeBranch = this.removeBranch.bind(this);

    Array.from(new Array(100))
      .forEach(
        (): void => {
          const updatedDate: Date = faker.date.past(2, new Date());
          const merged = faker.datatype.boolean();
          const mergedDate: Date = merged ? updatedDate : null;
          const hasUncommittedChanges = mergedDate > mergedDate;
          let name = faker.git.branch();

          while (
            this.details.find(
              (x: Branch): boolean => x.name === name
            )
          ) {
            name = faker.git.branch();
          }

          this._list.push({
            name,
            lastCommitHash: faker.git.commitSha,
          });

          this.details.push({
            name,
            merged,
            mergedDate,
            updatedDate,
            hasUncommittedChanges,
            url: `https://example.org/tree/${name}`,
          });
        }
      );
  }

  public getListBranches(): Promise<Array<BranchListItem>> {
    return Promise.resolve([
      ...this._list
    ]);
  }

  public getBranch(name: string, lastCommitHash?: string): Promise<Branch> {
    const branch = this.details.find(
      (x: Branch): boolean => x.name === name
    );

    return Promise.resolve(branch);
  }

  public removeBranch(name: string): Promise<void> {
    const detailsIndex = this.details.findIndex(
      (x: Branch): boolean => x.name === name
    );

    this.details.splice(detailsIndex, 1);

    const listIndex = this._list.findIndex(
      (x: BranchListItem): boolean => x.name === name
    );

    this._list.splice(listIndex, 1);

    return Promise.resolve();
  }

}
