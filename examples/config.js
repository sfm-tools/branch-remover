module.exports = {
  cache?: {
    timeout: 604800,
  },

  /**
   * Branches to ignore/skip.
   */
  ignore: (e) => {
    return Promise.resolve(
      /^(master|main|uat|beta|prod.*)$/i.test(
        e.branchName
      )
    );
  },

  /**
   * Branches to remove.
   */
  remove: (e) => {
    return Promise.resolve(
      e.branch.merged
    );
  },
};
