export type CommandLineParams = {

  version?: boolean;

  help?: boolean;

  /**
   * Indicates that the script is running in test mode and should not actually delete branches.
   */
  test?: boolean;

  /**
   * Indicates that the script should not ask the user for confirmation to delete branches.
   */
  quiet?: boolean;

  /**
   * API provider for working with branches.
   */
  provider?: string;

  /**
   * Regular expression to check for branch names that should be ignored.
   */
  ignore?: string;

  /**
   * Rules for deleting merged branches.
   */
  merged?: string;

  /**
   * Rules for deleting stale branches.
   */
  stale?: string;

  /**
   * Path to custom config file.
   */
  config?: string;

};
