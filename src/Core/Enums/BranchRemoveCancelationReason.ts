export enum BranchRemoveCancelationReason {
  None = 0,
  Other = 1,
  Ignored = 2,
  BranchNotFound = 3,
  CanceledByBeforeHandler = 4,
  MergeDateOutOfRange = 5,
  UpdateDateOutOfRange = 6,
  CanceledByUser = 7,
}
