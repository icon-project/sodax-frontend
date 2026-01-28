export enum FeeClaimAssetStatus {
  NO_PREFS = 'NO_PREFS',
  BELOW_MIN = 'BELOW_MIN',
  READY = 'READY',
}

export enum ClaimExecutionState {
  READY = 'READY', // user can start the claim
  APPROVING = 'APPROVING', // ERC20 approve tx
  SUBMITTING = 'SUBMITTING', // createIntent tx sent
  SUBMITTED = 'SUBMITTED', // solver working (async)
  COMPLETED = 'COMPLETED',
}
