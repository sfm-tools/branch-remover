import { IProvider } from './IProvider';

export interface IBranchRemover {

  readonly provider: IProvider;

  test(): Promise<void>;

  execute(): Promise<void>;

}
