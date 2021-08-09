import { expect } from 'chai';
import streams from 'memory-streams';
import winston from 'winston';

import { Logger } from '../src/Core';

describe('Logger', (): void => {

  it('should contain info item', (): void => {
    const writer = new streams.WritableStream();
    const logger = new Logger({
      levels: Logger.defaultLevels,
      level: 'info',
      transports: [
        new winston.transports.Stream({
          stream: writer,
        }),
      ],
    });

    logger.info('info');

    expect(JSON.parse(writer.toString()))
      .to.be.deep.equal({
        message: 'info',
        level: 'info'
      });
  });

  it('should contain warning item', (): void => {
    const writer = new streams.WritableStream();
    const logger = new Logger({
      levels: Logger.defaultLevels,
      level: 'info',
      transports: [
        new winston.transports.Stream({
          stream: writer,
        }),
      ],
    });

    logger.warning('some warning');

    expect(JSON.parse(writer.toString()))
      .to.be.deep.equal({
        message: 'some warning',
        level: 'warning'
      });
  });

  it('should contain error item', (): void => {
    const writer = new streams.WritableStream();
    const logger = new Logger({
      levels: Logger.defaultLevels,
      level: 'info',
      transports: [
        new winston.transports.Stream({
          stream: writer,
        }),
      ],
    });

    logger.error('some error');

    expect(JSON.parse(writer.toString()))
      .to.be.deep.equal({
        message: 'some error',
        level: 'error'
      });
  });

  it('should contain debug item', (): void => {
    const writer = new streams.WritableStream();
    const logger = new Logger({
      levels: Logger.defaultLevels,
      level: 'debug',
      transports: [
        new winston.transports.Stream({
          stream: writer,
        }),
      ],
    });

    logger.debug('some debug');

    expect(JSON.parse(writer.toString()))
      .to.be.deep.equal({
        message: 'some debug',
        level: 'debug'
      });
  });

  it('should remain empty when adding "info" entry when the level is "action"', (): void => {
    const writer = new streams.WritableStream();
    const logger = new Logger({
      levels: Logger.defaultLevels,
      level: 'action',
      transports: [
        new winston.transports.Stream({
          stream: writer,
        }),
      ],
    });

    logger.info('some info');

    expect(writer.toString()).to.be.equal('');
  });

});
