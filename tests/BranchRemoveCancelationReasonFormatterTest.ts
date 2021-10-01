import { expect } from 'chai';

import { BranchRemoveCancelationReason } from '../src/Core';
import { branchRemoveCancelationReasonFormatter } from '../src/Formatters';

describe('BranchRemoveCancelationReasonFormatter', () => {
  it('BranchNotFound', (): void => {
    const result = branchRemoveCancelationReasonFormatter(
      BranchRemoveCancelationReason.BranchNotFound
    );

    expect(result).to.be.equal('branch details not found');
  });

  it('CanceledByBeforeHandler', (): void => {
    const result = branchRemoveCancelationReasonFormatter(
      BranchRemoveCancelationReason.CanceledByBeforeHandler
    );

    expect(result).to.be.equal('canceled by before handler');
  });

  it('CanceledByUser', (): void => {
    const result = branchRemoveCancelationReasonFormatter(
      BranchRemoveCancelationReason.CanceledByUser
    );

    expect(result).to.be.equal('canceled by user');
  });

  it('Ignored', (): void => {
    const result = branchRemoveCancelationReasonFormatter(
      BranchRemoveCancelationReason.Ignored
    );

    expect(result).to.be.equal('matches an ignored value');
  });

  it('Ignored', (): void => {
    const result = branchRemoveCancelationReasonFormatter(
      BranchRemoveCancelationReason.MergeDateOutOfRange
    );

    expect(result).to.be.equal('merge date out of the allowed range');
  });

  it('None', (): void => {
    const result = branchRemoveCancelationReasonFormatter(
      BranchRemoveCancelationReason.None
    );

    expect(result).to.be.equal('None');
  });

  it('Other', (): void => {
    const result = branchRemoveCancelationReasonFormatter(
      BranchRemoveCancelationReason.Other
    );

    expect(result).to.be.equal('undefined');
  });

  it('UpdateDateOutOfRange', (): void => {
    const result = branchRemoveCancelationReasonFormatter(
      BranchRemoveCancelationReason.UpdateDateOutOfRange
    );

    expect(result).to.be.equal('update date out of the allowed range');
  });
});
