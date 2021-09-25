import { IBranchesProvider } from './IBranchesProvider';
import { BranchRemoverOptions } from './Types';

export interface IBranchRemover {

  readonly provider: IBranchesProvider;

  execute(options: BranchRemoverOptions, test?: boolean): Promise<void>;

}
