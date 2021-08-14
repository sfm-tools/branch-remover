import faker from 'faker';

import {
  Branch,
  BranchListItem,
  IProvider,
} from '../src/Core';

export class FakeProvider implements IProvider {

  private _branches = new Array<Branch>();

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
          let name = faker.git.branch();

          while (
            this._branches.find(
              (x: Branch): boolean => x.name === name
            )
          ) {
            name = faker.git.branch();
          }

          this._branches.push({
            name,
            merged,
            mergedDate,
            updatedDate,
          });
        }
      );
  }

  public getListBranches(): Promise<Array<BranchListItem>> {
    const result = this._branches.map(
      ({ name }: Branch): BranchListItem => {
        return {
          name,
          lastCommitHash: faker.git.commitSha(),
        };
      }
    );

    return Promise.resolve(result);
  }

  public getBranch(name: string, lastCommitHash?: string): Promise<Branch> {
    const branch = this._branches.find(
      (x: Branch): boolean => x.name === name
    );

    return Promise.resolve(branch);
  }

  public removeBranch(name: string): Promise<void> {
    const index = this._branches.findIndex(
      (x: Branch): boolean => x.name === name
    );

    this._branches.splice(index, 1);

    return Promise.resolve();
  }

}
