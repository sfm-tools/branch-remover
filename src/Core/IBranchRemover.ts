import { IProvider } from './IProvider';
import { BranchRemoverOptions } from './Types';

export interface IBranchRemover {

  readonly provider: IProvider;

  execute(options: BranchRemoverOptions, test?: boolean): Promise<void>;

}
