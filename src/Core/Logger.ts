import stringFomat from 'string-format';
import winston, { format, Logger as WinstonLogger, LoggerOptions } from 'winston';

import { ILogger } from './ILogger';

export class Logger implements ILogger {

  public static readonly defaultLevels = {
    error: 0,
    warning: 1,
    info: 2,
    debug: 3,
  };

  private readonly _logger: WinstonLogger;

  constructor(options?: LoggerOptions) {
    this.info = this.info.bind(this);
    this.warning = this.warning.bind(this);
    this.error = this.error.bind(this);
    this.debug = this.debug.bind(this);

    if (!options) {
      options = Logger.defaultOptions();
    }

    this._logger = winston.createLogger(options);
  }

  public info(message: string, ...meta: Array<any>): void {
    this._logger.info(message, ...meta);
  }

  public warning(message: string, ...meta: Array<any>): void {
    this._logger.warning(message, ...meta);
  }

  public error(message: string, ...meta: Array<any>): void {
    this._logger.error(message, ...meta);
  }

  public debug(message: string, ...meta: Array<any>): void {
    this._logger.debug(message, ...meta);
  }

  public static defaultOptions(level?: 'error' | 'warning' | 'info' | 'debug'): LoggerOptions {
    return {
      levels: Logger.defaultLevels,
      level: level || 'info',
      format: format.combine(
        format.timestamp(),
        format.printf(info => `${info.timestamp} ${info.level}: ${stringFomat(info.message, info)}`),
      ),
      transports: [
        new winston.transports.Console(),
      ],
    };
  }

}
