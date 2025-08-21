import type { BigNumberValue } from '../../bignumber.js';

export interface CalculateCompoundedRateRequest {
  rate: BigNumberValue;
  duration: BigNumberValue;
}
