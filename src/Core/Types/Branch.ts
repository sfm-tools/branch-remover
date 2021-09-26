export type Branch = {

  name: string;

  merged: boolean;

  mergedDate?: Date;

  updatedDate: Date;

  hasUncommittedChanges: boolean;

  url?: string;

  additionalInfo?: Map<string, string>;

};
