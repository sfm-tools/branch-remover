import { ILogger } from '../ILogger';
import { Branch } from './Branch';
import { BranchRemoverContext } from './BranchRemoverContext';
import { CacheOptions } from './CacheOptions';

export type BranchRemoverOptions = {

  readonly logger?: ILogger;

  readonly cache?: CacheOptions;

  /**
   * Checks if the specified branch can be removed or not.
   */
  remove: BranchRemoverOptionsRemoveFunction;

  /**
   * Branches to ignore/skip.
   */
  ignore?: BranchRemoverOptionsIgnoreType;

  /**
   * Called before remove.
   * If the `remove` method returns false, then the call is not made.
   */
  beforeRemove?: BranchRemoverOptionsRemoveFunction;

  /**
   * Called after remove.
   * If the `remove` method returns false, then the call is not made.
   */
  afterRemove?: BranchRemoverOptionsRemoveFunction;

};

export type BranchRemoverOptionsIgnoreArgs = {

  branchName: string;

  context: BranchRemoverContext;

};

export type BranchRemoverOptionsIgnoreFunction = { (e: BranchRemoverOptionsIgnoreArgs): Promise<boolean> };

export type BranchRemoverOptionsIgnoreType = string | Array<string> | RegExp | BranchRemoverOptionsIgnoreFunction;

export type BranchRemoverOptionsRemoveArgs = {

  branch: Branch;

  context: BranchRemoverContext;

};

export type BranchRemoverOptionsRemoveFunction = { (e: BranchRemoverOptionsRemoveArgs): Promise<boolean> };
