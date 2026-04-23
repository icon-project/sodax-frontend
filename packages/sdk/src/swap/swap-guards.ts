import type { IntentError } from '../shared/types/intent-types.js';

export function isIntentCreationFailedError(error: unknown): error is IntentError<'CREATION_FAILED'> {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'CREATION_FAILED' &&
    'data' in error &&
    typeof error.data === 'object' &&
    error.data !== null &&
    'payload' in error.data &&
    'error' in error.data
  );
}

export function isIntentSubmitTxFailedError(error: unknown): error is IntentError<'SUBMIT_TX_FAILED'> {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'SUBMIT_TX_FAILED' &&
    'data' in error &&
    typeof error.data === 'object' &&
    error.data !== null &&
    'payload' in error.data &&
    'error' in error.data
  );
}

export function isIntentPostExecutionFailedError(error: unknown): error is IntentError<'POST_EXECUTION_FAILED'> {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'POST_EXECUTION_FAILED' &&
    'data' in error &&
    typeof error.data === 'object' &&
    error.data !== null &&
    'detail' in error.data
  );
}

export function isWaitUntilIntentExecutedFailed(error: unknown): error is IntentError<'RELAY_TIMEOUT'> {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'RELAY_TIMEOUT' &&
    'data' in error &&
    typeof error.data === 'object' &&
    error.data !== null &&
    'payload' in error.data &&
    'error' in error.data
  );
}

export function isIntentCreationUnknownError(error: unknown): error is IntentError<'UNKNOWN'> {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'UNKNOWN' &&
    'data' in error &&
    typeof error.data === 'object' &&
    error.data !== null &&
    'payload' in error.data &&
    'error' in error.data
  );
}
