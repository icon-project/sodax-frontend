// import type { SpokeChainId } from '@sodax/types';
// import type { SpokeProvider, UserReserveData } from '@sodax/sdk';
// import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
// import { useSodaxContext } from '../shared/useSodaxContext.js';
//
// type BaseQueryOptions = {
//   queryOptions?: UseQueryOptions<readonly [readonly UserReserveData[], number], Error>;
// };
//
// type NewParams = BaseQueryOptions & {
//   /** Spoke chain id (e.g. '0xa86a.avax') */
//   spokeChainId: SpokeChainId | undefined;
//   /** User wallet address on the spoke chain */
//   userAddress: string | undefined;
// };
//
// /** @deprecated Use `{ spokeChainId, userAddress }` instead */
// type LegacyParams = BaseQueryOptions & {
//   /** @deprecated Use `spokeChainId` instead */
//   spokeProvider: SpokeProvider | undefined;
//   /** @deprecated Use `userAddress` instead */
//   address: string | undefined;
// };
//
// export type UseUserReservesDataParams = NewParams | LegacyParams;
//
// function isLegacyParams(params: UseUserReservesDataParams): params is LegacyParams {
//   return 'spokeProvider' in params || 'address' in params;
// }
//
// function resolveParams(params: UseUserReservesDataParams): {
//   spokeChainId: SpokeChainId | undefined;
//   userAddress: string | undefined;
// } {
//   if (isLegacyParams(params)) {
//     return {
//       spokeChainId: params.spokeProvider?.chainConfig.chain.id as SpokeChainId | undefined,
//       userAddress: params.address,
//     };
//   }
//   return { spokeChainId: params.spokeChainId, userAddress: params.userAddress };
// }
//
// /**
//  * Hook for fetching user reserves data from the Sodax money market.
//  *
//  * @param params (optional) - Object including:
//  *   - spokeChainId: The spoke chain id whose reserves data will be fetched. If not provided, data fetching is disabled.
//  *   - userAddress: The user's address (string) whose reserves data will be fetched. If not provided, data fetching is disabled.
//  *   - queryOptions: (optional) Custom React Query options such as `queryKey`, `enabled`, or cache policy.
//  *
//  * @returns {UseQueryResult<readonly [readonly UserReserveData[], number], Error>} React Query result object containing:
//  *   - data: A tuple with array of UserReserveData and associated number, or undefined if loading
//  *   - isLoading: Boolean loading state
//  *   - isError: Boolean error state
//  *   - error: Error object, if present
//  *
//  * @example
//  * const { data: userReservesData, isLoading, error } = useUserReservesData({
//  *   spokeChainId,
//  *   userAddress,
//  * });
//  */
// export function useUserReservesData(
//   params?: UseUserReservesDataParams,
// ): UseQueryResult<readonly [readonly UserReserveData[], number], Error> {
//   const { sodax } = useSodaxContext();
//   const resolved = params ? resolveParams(params) : { spokeChainId: undefined, userAddress: undefined };
//   const defaultQueryOptions = {
//     queryKey: ['mm', 'userReservesData', resolved.spokeChainId, resolved.userAddress],
//     enabled: !!resolved.spokeChainId && !!resolved.userAddress,
//     refetchInterval: 5000,
//   };
//   const queryOptions = {
//     ...defaultQueryOptions,
//     ...params?.queryOptions, // override default query options if provided
//   };
//
//   return useQuery({
//     ...queryOptions,
//     queryFn: async () => {
//       if (!resolved.spokeChainId || !resolved.userAddress) {
//         throw new Error('spokeChainId or userAddress is not defined');
//       }
//
//       return await sodax.moneyMarket.data.getUserReservesData(resolved.spokeChainId, resolved.userAddress);
//     },
//   });
// }
//
