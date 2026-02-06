export enum FeeClaimAssetStatus {
  NO_PREFS = 'NO_PREFS',
  BELOW_MIN = 'BELOW_MIN',
  READY = 'READY',
  CLAIMED = 'CLAIMED',
}

//transaction lifecycle
export enum ClaimExecutionState {
  READY = 'READY', //before user clicks
  SIGNING = 'SIGNING', // wallet tsx signing
  SUBMITTED = 'SUBMITTED', //tsx hash exist
}

export enum ClaimFlowStep {
  NONE = 'NONE',
  CONFIRM = 'CONFIRM',
  SUBMITTED = 'SUBMITTED',
}
