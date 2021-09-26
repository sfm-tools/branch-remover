import { expect } from 'chai';

import { Branch } from '../src/Core';
import { branchInfoFormatter } from '../src/Formatters';

describe('BranchInfoFormatter', () => {
  it('should not display details for unmerged branch', (): void => {
    const branch: Branch = {
      merged: false,
      name: 'issue-100',
      updatedDate: new Date(),
      mergedDate: new Date(),
      hasUncommittedChanges: false,
      url: 'https://example.org',
      additionalInfo: new Map<string, string>()
        .set('Additional field#1', 'Some value 1')
        .set('Additional field#2', 'Some value 2')
    };

    const result = branchInfoFormatter(branch);

    expect(result).to.be.contains('issue-100');
    expect(result).to.be.contains('Branch');
    expect(result).to.be.contains('State');
    expect(result).to.be.contains('Merged date');
    expect(result).to.be.contains('Updated date');
    expect(result).to.be.contains('Has unmerged changes');
    expect(result).to.be.contains('Url');
    expect(result).to.be.contains('Additional field#1');
    expect(result).to.be.contains('Additional field#2');
    expect(result).to.be.contains('no');
    expect(result).to.be.contains('n/a');
    expect(result).to.be.contains('https://example.org');
    expect(result).to.be.contains('Some value 1');
    expect(result).to.be.contains('Some value 2');
  });
});
