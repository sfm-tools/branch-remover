import { ILogger } from '../ILogger';
import { Branch } from './Branch';
import { BranchRemoverContext } from './BranchRemoverContext';

export type BranchRemoverOptions = {

  readonly logger?: ILogger;

  /**
   * Branches to ignore/skip.
   */
  ignore?: BranchRemoverOptionsIgnoreType;

  /**
   * Branches to remove.
   */
  remove?: BranchRemoverOptionsRemoveFunction;

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
