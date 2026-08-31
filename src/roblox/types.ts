export type RobloxUser = {
  id: number;
  name: string;
  displayName?: string;
};

export type UserRestriction = {
  path?: string;
  user?: string;
  updateTime?: string;
  gameJoinRestriction?: {
    active?: boolean;
    startTime?: string;
    duration?: string;
    privateReason?: string;
    displayReason?: string;
    excludeAltAccounts?: boolean;
    inherited?: boolean;
  };
};

export type ListRestrictionsResponse = {
  userRestrictions?: UserRestriction[];
  nextPageToken?: string;
};
