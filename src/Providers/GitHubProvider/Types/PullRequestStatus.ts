export type PullRequestStatus = {

  sourceBranchName: string;

  targetBranchName: string;

  merged: boolean;

  /**
   * If the value is null, then GitHub has started a background job to compute the mergeability.
   */
  mergeable: boolean | null;

  mergeableState: 'clean' | 'dirty' | 'unstable' | 'unknown';

  createdDate: Date;

  updatedDate?: Date;

  mergedDate?: Date;

  closedDate?: Date;

};
