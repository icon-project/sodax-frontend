import { calculateUserReserveIncentives, type UserReserveIncentive } from './calculate-user-reserve-incentives.js';
import type {
  ReservesIncentiveDataHumanized,
  UserReservesIncentivesDataHumanized,
  UserReserveCalculationData,
} from './types.js';

// Indexed by reward token address
export type UserIncentiveDict = Record<string, UserIncentiveData>;

export interface UserIncentiveData {
  incentiveControllerAddress: string;
  rewardTokenSymbol: string;
  rewardPriceFeed: string;
  rewardTokenDecimals: number;
  claimableRewards: BigNumber;
  assets: string[];
}

export interface CalculateAllUserIncentivesRequest {
  reserveIncentives: ReservesIncentiveDataHumanized[]; // token incentive data, from UiIncentiveDataProvider
  userIncentives: UserReservesIncentivesDataHumanized[]; // user incentive data, from UiIncentiveDataProvider
  userReserves: UserReserveCalculationData[]; // deposit and borrow data for user assets
  currentTimestamp: number;
}

export function calculateAllUserIncentives({
  reserveIncentives,
  userIncentives,
  userReserves,
  currentTimestamp,
}: CalculateAllUserIncentivesRequest): UserIncentiveDict {
  // calculate incentive per token
  const allRewards = userIncentives.flatMap((userIncentive: UserReservesIncentivesDataHumanized) => {
    const reserve: ReservesIncentiveDataHumanized | undefined = reserveIncentives.find(
      (reserve: ReservesIncentiveDataHumanized) => reserve.underlyingAsset === userIncentive.underlyingAsset,
    );
    const userReserve: UserReserveCalculationData | undefined = userReserves.find(
      (userReserve: UserReserveCalculationData) =>
        userReserve.reserve.underlyingAsset.toLowerCase() === userIncentive.underlyingAsset.toLowerCase(),
    );
    if (reserve) {
      const reserveRewards: UserReserveIncentive[] = calculateUserReserveIncentives({
        reserveIncentives: reserve,
        userIncentives: userIncentive,
        userReserveData: userReserve,
        currentTimestamp,
      });
      return reserveRewards;
    }

    return [];
  });

  // From the array of all deposit and borrow incentives, create dictionary indexed by reward token address
  const incentiveDict: UserIncentiveDict = {};
  for (const reward of allRewards) {
    if (!incentiveDict[reward.rewardTokenAddress]) {
      incentiveDict[reward.rewardTokenAddress] = {
        assets: [],
        rewardTokenSymbol: reward.rewardTokenSymbol,
        claimableRewards: reward.unclaimedRewards,
        incentiveControllerAddress: reward.incentiveController,
        rewardTokenDecimals: reward.rewardTokenDecimals,
        rewardPriceFeed: reward.rewardPriceFeed,
      };
    }

    if (reward.accruedRewards.gt(0)) {
      const incentive = incentiveDict[reward.rewardTokenAddress];

      if (!incentive) {
        throw new Error('Incentive not found');
      }

      incentive.claimableRewards = incentive.claimableRewards.plus(reward.accruedRewards);
      incentive.assets.push(reward.tokenAddress);
    }
  }

  return incentiveDict;
}
