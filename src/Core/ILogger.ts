export interface ILogger {

  info(message: string, ...meta: Array<any>): void;

  warning(message: string, ...meta: Array<any>): void;

  error(message: string, ...meta: Array<any>): void;

  debug(message: string, ...meta: Array<any>): void;

}
