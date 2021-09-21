import { expect } from 'chai';

import { branchInfoFormatter } from '../src/Formatters';

describe('BranchInfoFormatter', () => {
  it('should not display details for unmerged branch', (): void => {
    const branch = {
      merged: false,
      name: 'issue-100',
      updatedDate: new Date(),
      mergedDate: new Date(),
      hasUncommittedChanges: false,
      url: 'https://example.org',
    };

    const result = branchInfoFormatter(branch);

    expect(result).to.be.contains('issue-100');
    expect(result).to.be.contains('Branch');
    expect(result).to.be.contains('State');
    expect(result).to.be.contains('Merged date');
    expect(result).to.be.contains('Updated date');
    expect(result).to.be.contains('Has unmerged changes');
    expect(result).to.be.contains('Url');
    expect(result).to.be.contains('no');
    expect(result).to.be.contains('n/a');
    expect(result).to.be.contains('https://example.org');
  });
});
