import { expect } from 'chai';
import streams from 'memory-streams';
import readline from 'readline';
import sinon from 'sinon';
import { Writable } from 'stream';
import winston from 'winston';

import { BranchRemoverOptionsBuilder } from '../src/BranchRemoverOptionsBuilder';
import { Branch, BranchRemoverContext, BranchRemoverOptionsIgnoreFunction, BranchRemoverOptionsRemoveFunction, Logger } from '../src/Core';
import { branchInfoFormatter } from '../src/Formatters';

describe('BranchRemoverOptionsBuilder', () => {
  let context: BranchRemoverContext = null;
  let writer: Writable = null;

  afterEach((): void => {
    writer = new streams.WritableStream();

    const logger = new Logger({
      levels: Logger.defaultLevels,
      level: 'debug',
      transports: [
        new winston.transports.Stream({
          stream: writer,
        }),
      ],
    });

    context = {
      logger,
    };
  });

  describe('ignore', (): void => {
    it('the ignore property should be a function', (): void => {
      const builder = new BranchRemoverOptionsBuilder();

      builder.ignore('test');

      const options = builder.build();

      expect(typeof options.ignore)
        .to.be.equal('function');
    });

    it('the ignore function should return TRUE', async(): Promise<void> => {
      const builder = new BranchRemoverOptionsBuilder();

      builder.ignore('^(master|prod|release)$');

      const options = builder.build();

      const ignore = options.ignore as BranchRemoverOptionsIgnoreFunction;

      expect(
        await ignore({
          context,
          branchName: 'master',
        })
      ).to.be.true;

      expect(
        await ignore({
          context,
          branchName: 'release',
        })
      ).to.be.true;
    });

    it('the ignore function should return FALSE', async(): Promise<void> => {
      const builder = new BranchRemoverOptionsBuilder();

      builder.ignore('^(master|prod|release)$');

      const options = builder.build();

      const ignore = options.ignore as BranchRemoverOptionsIgnoreFunction;

      expect(
        await ignore({
          context,
          branchName: 'issue-123',
        })
      ).to.be.false;

      expect(
        await ignore({
          context,
          branchName: 'master-prod',
        })
      ).to.be.false;

      expect(
        await ignore({
          context,
          branchName: 'prod555',
        })
      ).to.be.false;

      expect(
        await ignore({
          context,
          branchName: 'master-2',
        })
      ).to.be.false;
    });

    it('should return FALSE when the ignore property is not specified', async(): Promise<void> => {
      const builder = new BranchRemoverOptionsBuilder();
      const options = builder.build();
      const ignore = options.ignore as BranchRemoverOptionsIgnoreFunction;

      expect(
        await ignore({
          context,
          branchName: 'issue-123',
        })
      ).to.be.false;
    });
  });

  describe('remove', (): void => {
    it('the remove property should be a function', (): void => {
      const builder = new BranchRemoverOptionsBuilder();
      const options = builder.build();

      expect(typeof options.remove)
        .to.be.equal('function');
    });

    it('should return TRUE for the merged branch', async(): Promise<void> => {
      const builder = new BranchRemoverOptionsBuilder();

      builder.quiet();

      const options = builder.build();
      const remove = options.remove as BranchRemoverOptionsRemoveFunction;

      expect(
        await remove({
          context,
          branch: {
            merged: true,
            name: 'issue-100',
            updatedDate: new Date(),
            mergedDate: new Date(),
            hasUncommittedChanges: false,
          },
        })
      ).to.be.true;
    });

    it('should return FALSE for the unmerged branch', async(): Promise<void> => {
      const builder = new BranchRemoverOptionsBuilder();
      const options = builder.build();
      const remove = options.remove as BranchRemoverOptionsRemoveFunction;

      expect(
        await remove({
          context,
          branch: {
            merged: false,
            name: 'issue-100',
            updatedDate: new Date(),
            hasUncommittedChanges: true,
          },
        })
      ).to.be.false;
    });

    describe('merged', (): void => {
      it('should return TRUE for the merged branch when merge date less specified', async(): Promise<void> => {
        const builder = new BranchRemoverOptionsBuilder();

        builder.quiet();
        builder.merged(new Date(2021, 7, 8, 12, 0, 0));

        const options = builder.build();
        const remove = options.remove as BranchRemoverOptionsRemoveFunction;

        expect(
          await remove({
            context,
            branch: {
              merged: true,
              name: 'issue-100',
              updatedDate: new Date(),
              mergedDate: new Date(2021, 7, 8, 11, 59, 59),
              hasUncommittedChanges: true,
            },
          })
        ).to.be.true;
      });

      it('should return TRUE for the merged branch when merge date equal to the specified', async(): Promise<void> => {
        const mergedDate = new Date(2021, 7, 8, 12, 0, 0);
        const builder = new BranchRemoverOptionsBuilder();

        builder.quiet();
        builder.merged(mergedDate);

        const options = builder.build();
        const remove = options.remove as BranchRemoverOptionsRemoveFunction;

        expect(
          await remove({
            context,
            branch: {
              merged: true,
              name: 'issue-100',
              updatedDate: new Date(),
              mergedDate: mergedDate,
              hasUncommittedChanges: true,
            },
          })
        ).to.be.true;
      });

      it('should return FALSE for the merged branch when merge date greater than specified', async(): Promise<void> => {
        const builder = new BranchRemoverOptionsBuilder();

        builder.quiet();
        builder.merged(new Date(2021, 7, 8, 12, 0, 0));

        const options = builder.build();
        const remove = options.remove as BranchRemoverOptionsRemoveFunction;

        expect(
          await remove({
            context,
            branch: {
              merged: true,
              name: 'issue-100',
              updatedDate: new Date(),
              mergedDate: new Date(2021, 7, 8, 12, 0, 1),
              hasUncommittedChanges: true,
            },
          })
        ).to.be.false;
      });
    });

    describe('stale', (): void => {
      it('should return TRUE for the unmerged branch when update date less specified', async(): Promise<void> => {
        const builder = new BranchRemoverOptionsBuilder();

        builder.quiet();
        builder.stale(new Date(2021, 7, 8, 12, 0, 0));

        const options = builder.build();
        const remove = options.remove as BranchRemoverOptionsRemoveFunction;

        expect(
          await remove({
            context,
            branch: {
              merged: false,
              name: 'issue-100',
              updatedDate: new Date(2021, 7, 8, 11, 59, 59),
              hasUncommittedChanges: true,
            },
          })
        ).to.be.true;
      });

      it('should return TRUE for the unmerged branch when update date equal to the specified', async(): Promise<void> => {
        const updatedDate = new Date(2021, 7, 8, 12, 0, 0);
        const builder = new BranchRemoverOptionsBuilder();

        builder.quiet();
        builder.stale(updatedDate);

        const options = builder.build();
        const remove = options.remove as BranchRemoverOptionsRemoveFunction;

        expect(
          await remove({
            context,
            branch: {
              merged: false,
              hasUncommittedChanges: true,
              name: 'issue-100',
              updatedDate,
            },
          })
        ).to.be.true;
      });

      it('should return FALSE for the unmerged branch when update date greater than specified', async(): Promise<void> => {
        const builder = new BranchRemoverOptionsBuilder();

        builder.quiet();
        builder.stale(new Date(2021, 7, 8, 12, 0, 0));

        const options = builder.build();
        const remove = options.remove as BranchRemoverOptionsRemoveFunction;

        expect(
          await remove({
            context,
            branch: {
              merged: false,
              name: 'issue-100',
              updatedDate: new Date(2021, 7, 8, 12, 0, 1),
              hasUncommittedChanges: true,
            },
          })
        ).to.be.false;
      });
    });

    describe('quiet', (): void => {
      afterEach((): void => {
        sinon.restore();
      });

      it('should show a confirmation and be TRUE when the answer is "yes"', async(): Promise<void> => {
        const builder = new BranchRemoverOptionsBuilder();
        const options = builder.build();
        const remove = options.remove as BranchRemoverOptionsRemoveFunction;

        const readlineStub = {
          question: sinon.stub().callsFake(
            (query, callback) => {
              callback('yes');
            }
          ),
          close: sinon.stub(),
        };

        sinon.stub(
          readline,
          'createInterface'
        ).returns(<any>readlineStub);

        const result = await remove({
          context,
          branch: {
            merged: true,
            name: 'issue-100',
            updatedDate: new Date(),
            mergedDate: new Date(),
            hasUncommittedChanges: false,
          },
        });

        sinon.assert.calledWith(
          readlineStub.question,
          'Do you want to remove merged branch "issue-100"? Merged 0 seconds ago [y/N] ',
          sinon.match.func
        );

        sinon.assert.calledOnce(readlineStub.close);

        expect(result).to.be.true;
      });

      it('should show a confirmation and be FALSE when the answer is "no"', async(): Promise<void> => {
        const builder = new BranchRemoverOptionsBuilder();
        const options = builder.build();
        const remove = options.remove as BranchRemoverOptionsRemoveFunction;
        const branch: Branch = {
          merged: true,
          name: 'issue-100',
          // null - to avoid problems with different representation of dates
          updatedDate: null,
          mergedDate: null,
          hasUncommittedChanges: false,
        };

        const readlineStub = {
          question: sinon.stub().callsFake(
            (query, callback) => {
              callback('no');
            }
          ),
          close: sinon.stub(),
        };

        sinon.stub(
          readline,
          'createInterface'
        ).returns(<any>readlineStub);

        const result = await remove({
          context,
          branch,
        });

        sinon.assert.calledWith(
          readlineStub.question,
          'Do you want to remove merged branch "issue-100"? Merged 0 seconds ago [y/N] ',
          sinon.match.func
        );

        sinon.assert.calledOnce(readlineStub.close);

        const jsonString = '[' + writer.toString().trim().replace(/[\r\n]+/g, ',') + ']';

        expect(JSON.parse(jsonString))
          .to.be.deep.equal([
            {
              branch,
              level: 'debug',
              message:'Can remove merged "{branch.name}", because no limit on merge date.',
            },
            {
              branch,
              level: 'debug',
              message: 'The user has forbidden the removing of branch "{branch.name}".',
            }
          ]);

        expect(result).to.be.false;
      });
    });

    describe('yes', (): void => {
      afterEach((): void => {
        sinon.restore();
      });

      it('should show a confirmation and be TRUE when the answer is empty', async(): Promise<void> => {
        const builder = new BranchRemoverOptionsBuilder();

        builder.yes();

        const options = builder.build();
        const remove = options.remove as BranchRemoverOptionsRemoveFunction;

        const readlineStub = {
          question: sinon.stub().callsFake(
            (query, callback) => {
              callback('');
            }
          ),
          close: sinon.stub(),
        };

        sinon.stub(
          readline,
          'createInterface'
        ).returns(<any>readlineStub);

        const result = await remove({
          context,
          branch: {
            merged: true,
            name: 'issue-100',
            updatedDate: new Date(),
            mergedDate: new Date(),
            hasUncommittedChanges: false,
          },
        });

        sinon.assert.calledWith(
          readlineStub.question,
          'Do you want to remove merged branch "issue-100"? Merged 0 seconds ago [Y/n] ',
          sinon.match.func
        );

        sinon.assert.calledOnce(readlineStub.close);

        expect(result).to.be.true;
      });

      it('should show a confirmation and be FALSE when the answer is empty', async(): Promise<void> => {
        const builder = new BranchRemoverOptionsBuilder();
        const options = builder.build();
        const remove = options.remove as BranchRemoverOptionsRemoveFunction;
        const branch: Branch = {
          merged: true,
          name: 'issue-100',
          // null - to avoid problems with different representation of dates
          updatedDate: null,
          mergedDate: null,
          hasUncommittedChanges: false,
        };

        const readlineStub = {
          question: sinon.stub().callsFake(
            (query, callback) => {
              callback('no');
            }
          ),
          close: sinon.stub(),
        };

        sinon.stub(
          readline,
          'createInterface'
        ).returns(<any>readlineStub);

        const result = await remove({
          context,
          branch,
        });

        sinon.assert.calledWith(
          readlineStub.question,
          'Do you want to remove merged branch "issue-100"? Merged 0 seconds ago [y/N] ',
          sinon.match.func
        );

        sinon.assert.calledOnce(readlineStub.close);

        const jsonString = '[' + writer.toString().trim().replace(/[\r\n]+/g, ',') + ']';

        expect(JSON.parse(jsonString))
          .to.be.deep.equal([
            {
              branch,
              level: 'debug',
              message:'Can remove merged "{branch.name}", because no limit on merge date.',
            },
            {
              branch,
              level: 'debug',
              message: 'The user has forbidden the removing of branch "{branch.name}".',
            }
          ]);

        expect(result).to.be.false;
      });
    });

    describe('details', (): void => {
      afterEach((): void => {
        sinon.restore();
      });

      it('should display details for unmerged branch', async(): Promise<void> => {
        const builder = new BranchRemoverOptionsBuilder();

        builder.details();

        const options = builder.build();
        const remove = options.remove as BranchRemoverOptionsRemoveFunction;

        sinon.stub(console, 'log');

        const branch = {
          merged: false,
          name: 'issue-100',
          updatedDate: new Date(),
          mergedDate: new Date(),
          hasUncommittedChanges: false,
        };

        await remove({
          context,
          branch,
        });

        sinon.assert.calledWith(
          <any>console.log,
          branchInfoFormatter(branch)
        );
      });

      it('should not display details for unmerged branch', async(): Promise<void> => {
        const builder = new BranchRemoverOptionsBuilder();
        const options = builder.build();
        const remove = options.remove as BranchRemoverOptionsRemoveFunction;

        sinon.stub(console, 'log');

        const branch = {
          merged: false,
          name: 'issue-100',
          updatedDate: new Date(),
          mergedDate: new Date(),
          hasUncommittedChanges: false,
        };

        await remove({
          context,
          branch,
        });

        sinon.assert.neverCalledWith(
          <any>console.log,
          branchInfoFormatter(branch)
        );
      });
    });
  });
});
