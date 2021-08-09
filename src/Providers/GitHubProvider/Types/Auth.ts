export class Auth {

  /**
   * Username or organization name.
   *
   * @example
   * https://github.com/sfm-tools/branch-remover
   *                    ^^^^^^^^  ^^^^^^^^^^^^^^
   *                    owner     repo
   */
  public readonly owner: string;

  /**
   * Repository name.
   *
   * @example
   * https://github.com/sfm-tools/branch-remover
   *                    ^^^^^^^^  ^^^^^^^^^^^^^^
   *                    owner     repo
   */
   public readonly repo: string;

  /**
   * GitHub access token.
   *
   * @see https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/creating-a-personal-access-token
   */
  public readonly token: string;

  constructor(owner: string, repo: string, token: string) {
    this.owner = owner;
    this.repo = repo;
    this.token = token;
  }

}
