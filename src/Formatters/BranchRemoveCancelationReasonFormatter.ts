import { BranchRemoveCancelationReason } from '../Core';

export const branchRemoveCancelationReasonFormatter = (value: BranchRemoveCancelationReason): string => {
  switch (value) {
    case BranchRemoveCancelationReason.Other:
      return 'undefined';

    case BranchRemoveCancelationReason.Ignored:
      return 'matches an ignored value';

    case BranchRemoveCancelationReason.BranchNotFound:
      return 'branch details not found';

    case BranchRemoveCancelationReason.MergeDateOutOfRange:
      return 'merge date out of the allowed range';

    case BranchRemoveCancelationReason.UpdateDateOutOfRange:
      return 'update date out of the allowed range';

    case BranchRemoveCancelationReason.CanceledByUser:
      return 'canceled by user';

    default:
      return value.toString();
  }
};
