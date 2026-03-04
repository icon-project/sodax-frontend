import { ReserveIncentiveMock, UserReserveMock } from '../../mocks.js';
import { calculateReserveDebt } from '../reserve/calculate-reserve-debt.js';
import { calculateIncentiveAPR } from './calculate-incentive-apr.js';
import { describe, expect, it } from 'vitest';

describe('calculateIncentiveAPR', () => {
  const userReserveMock = new UserReserveMock().supply(100).variableBorrow(50);
  const reserveIncentiveMock = new ReserveIncentiveMock();
  it('calculates incentives APR', () => {
    const { totalLiquidity } = calculateReserveDebt(userReserveMock.reserve, 1);
    const result = calculateIncentiveAPR({
      emissionPerSecond:
        reserveIncentiveMock.reserveIncentive.aIncentiveData?.rewardsTokenInformation?.[0]?.emissionPerSecond ?? '',
      rewardTokenPriceInMarketReferenceCurrency:
        reserveIncentiveMock.reserveIncentive.aIncentiveData?.rewardsTokenInformation?.[0]?.rewardPriceFeed ?? '',
      totalTokenSupply: totalLiquidity.toString(),
      priceInMarketReferenceCurrency: userReserveMock.reserve.priceInMarketReferenceCurrency,
      decimals: userReserveMock.reserve.decimals,
      rewardTokenDecimals:
        reserveIncentiveMock.reserveIncentive.aIncentiveData?.rewardsTokenInformation?.[0]?.rewardTokenDecimals ?? 0,
    });

    expect(result).toEqual('0.000021024');
  });
});
