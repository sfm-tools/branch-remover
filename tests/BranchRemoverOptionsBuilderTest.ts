import { expect } from 'chai';
import fs from 'fs';
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

  const parseLog = <T = any>(): Array<T> => {
    const jsonString = '[' + writer.toString().trim().replace(/[\r\n]+/g, ',') + ']';
    return JSON.parse(jsonString);
  };

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

        expect(parseLog())
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

        expect(parseLog())
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

    describe('beforeRemove', (): void => {
      const branch = {
        merged: false,
        name: 'issue-100',
        updatedDate: new Date(),
        mergedDate: new Date(),
        hasUncommittedChanges: false,
      };

      it('should be true with default implementation', async(): Promise<void> => {
        const builder = new BranchRemoverOptionsBuilder();
        const options = builder.build();

        const result = await options.beforeRemove({
          branch,
          context
        });

        expect(result).to.be.true;
      });

      it('should output command with branch name, and the result should be true', async(): Promise<void> => {
        const command = 'echo ${branch}';
        const commandToExec = `echo ${branch.name}`;
        const builder = new BranchRemoverOptionsBuilder();
        const options = builder
          .beforeRemove(command)
          .build();

        const result = await options.beforeRemove({
          branch,
          context
        });

        const [
          commandPreparation,
          commandResult,
        ] = parseLog();

        expect(commandPreparation.source).to.be.equal(command);
        expect(commandPreparation.parsed).to.be.equal(commandToExec);

        expect(commandResult.command).to.be.equal(commandToExec);
        expect(commandResult.stdout).to.be.equal(branch.name);
        expect(commandResult.stderr).to.be.empty;

        expect(result).to.be.true;
      });

      it('should escape special characters', async(): Promise<void> => {
        const command = 'echo "\\${branch} ${branch} $\\{branch\\} ${branch\\}"';
        const commandToExec = `echo "\${branch} ${branch.name} \${branch} \${branch}"`;
        const builder = new BranchRemoverOptionsBuilder();
        const options = builder
          .beforeRemove(command)
          .build();

        await options.beforeRemove({
          branch,
          context
        });

        const [
          commandPreparation,
          commandResult,
        ] = parseLog();

        expect(commandPreparation.source).to.be.equal(command);
        expect(commandPreparation.parsed).to.be.equal(commandToExec);

        expect(commandResult.command).to.be.equal(commandToExec);
        expect(commandResult.stdout).to.be.equal(branch.name);
        expect(commandResult.stderr).to.be.empty;
      });

      it('should be thrown an exception', (): void => {
        const command = 'exit 1';
        const builder = new BranchRemoverOptionsBuilder();
        const options = builder
          .beforeRemove(command)
          .build();

        expect(
          async(): Promise<void> => {
            await options.beforeRemove({
              branch,
              context
            });
          }
        ).to.be.throw;
      });
    });

    describe('afterRemove', (): void => {
      const branch = {
        merged: false,
        name: 'issue-100',
        updatedDate: new Date(),
        mergedDate: new Date(),
        hasUncommittedChanges: false,
      };

      it('should be true with default implementation', async(): Promise<void> => {
        const builder = new BranchRemoverOptionsBuilder();
        const options = builder.build();

        const result = await options.afterRemove({
          branch,
          context
        });

        expect(result).to.be.true;
      });

      it('should output command with branch name', async(): Promise<void> => {
        const command = 'echo ${branch}';
        const commandToExec = `echo ${branch.name}`;
        const builder = new BranchRemoverOptionsBuilder();
        const options = builder
          .afterRemove(command)
          .build();

        await options.afterRemove({
          branch,
          context
        });

        const [
          commandPreparation,
          commandResult,
        ] = parseLog();

        expect(commandPreparation.source).to.be.equal(command);
        expect(commandPreparation.parsed).to.be.equal(commandToExec);

        expect(commandResult.command).to.be.equal(commandToExec);
        expect(commandResult.stdout).to.be.equal(branch.name);
        expect(commandResult.stderr).to.be.empty;
      });

      it('should be thrown an exception', (): void => {
        const command = 'exit 1';
        const builder = new BranchRemoverOptionsBuilder();
        const options = builder
          .afterRemove(command)
          .build();

        expect(
          async(): Promise<void> => {
            await options.afterRemove({
              branch,
              context
            });
          }
        ).to.be.throw;
      });
    });

    describe('cachePath', (): void => {
      afterEach((): void => {
        sinon.restore();
      });

      it('should have a default path for the cache file', (): void => {
        const builder = new BranchRemoverOptionsBuilder();
        const options = builder.build();

        sinon.stub(fs, 'existsSync');

        options.cache.provider.load();

        sinon.assert.calledWith(
          <any>fs.existsSync,
          BranchRemoverOptionsBuilder.DEFAULT_CACHE_PATH
        );
      });

      it('should have custom path to the cache file', (): void => {
        const cachePath = './custom.cache';
        const builder = new BranchRemoverOptionsBuilder();
        const options = builder
          .cachePath(cachePath)
          .build();

        sinon.stub(fs, 'existsSync');

        options.cache.provider.load();

        sinon.assert.calledWith(
          <any>fs.existsSync,
          cachePath
        );
      });

      it('should throw an exception if an empty path is specified', (): void => {
        expect(
          (): void => {
            const builder = new BranchRemoverOptionsBuilder();
            builder.cachePath('');
          }
        ).to.be.throw('Parameter "path" cannot be null or empty.');
      });
    });

    describe('cacheTimeout', (): void => {
      afterEach((): void => {
        sinon.restore();
      });

      it('should be 0 by default', (): void => {
        const builder = new BranchRemoverOptionsBuilder();
        const options = builder.build();

        expect(options.cache.timeout).to.be.equal(0);
      });

      it('should have the specified value', (): void => {
        const builder = new BranchRemoverOptionsBuilder();
        const options = builder
          .cacheTimeout(300)
          .build();

        expect(options.cache.timeout).to.be.equal(300);
      });
    });
  });
});
