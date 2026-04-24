// import type { SpokeChainId } from '@sodax/types';
// import type { FormatUserSummaryResponse, FormatReserveUSDResponse, SpokeProvider } from '@sodax/sdk';
// import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
// import { useSodaxContext } from '../shared/useSodaxContext.js';
//
// type BaseQueryOptions = {
//   queryOptions?: UseQueryOptions<FormatUserSummaryResponse<FormatReserveUSDResponse>, Error>;
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
// export type UseUserFormattedSummaryParams = NewParams | LegacyParams;
//
// function isLegacyParams(params: UseUserFormattedSummaryParams): params is LegacyParams {
//   return 'spokeProvider' in params || 'address' in params;
// }
//
// function resolveParams(params: UseUserFormattedSummaryParams): {
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
//  * React hook to fetch a formatted summary of a user's Sodax money market portfolio.
//  *
//  * @param params (optional) - Object including:
//  *   - spokeChainId: The spoke chain id whose data will be fetched. If not provided, data fetching is disabled.
//  *   - userAddress: The user's address (string) whose summary will be fetched. If not provided, data fetching is disabled.
//  *   - queryOptions: (optional) Custom React Query options such as `queryKey`, `enabled`, or cache policy.
//  *
//  * @returns {UseQueryResult<FormatUserSummaryResponse<FormatReserveUSDResponse>, Error>}
//  *   A result object from React Query including:
//  *     - data: The user's formatted portfolio summary (or undefined if not loaded)
//  *     - isLoading: Boolean loading state
//  *     - isError: Boolean error state
//  *     - error: Error if thrown in fetching
//  *
//  * @example
//  * const { data, isLoading, error } = useUserFormattedSummary({ spokeChainId, userAddress });
//  */
// export function useUserFormattedSummary(
//   params?: UseUserFormattedSummaryParams,
// ): UseQueryResult<FormatUserSummaryResponse<FormatReserveUSDResponse>, Error> {
//   const { sodax } = useSodaxContext();
//   const resolved = params ? resolveParams(params) : { spokeChainId: undefined, userAddress: undefined };
//   const defaultQueryOptions = {
//     queryKey: ['mm', 'userFormattedSummary', resolved.spokeChainId, resolved.userAddress],
//     enabled: !!resolved.spokeChainId && !!resolved.userAddress,
//     refetchInterval: 5000,
//   };
//
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
//       // fetch reserves and hub wallet address
//       const reserves = await sodax.moneyMarket.data.getReservesHumanized();
//
//       // format reserves
//       const formattedReserves = sodax.moneyMarket.data.formatReservesUSD(
//         sodax.moneyMarket.data.buildReserveDataWithPrice(reserves),
//       );
//
//       // fetch user reserves
//       const userReserves = await sodax.moneyMarket.data.getUserReservesHumanized(
//         resolved.spokeChainId,
//         resolved.userAddress,
//       );
//
//       // format user summary
//       return sodax.moneyMarket.data.formatUserSummary(
//         sodax.moneyMarket.data.buildUserSummaryRequest(reserves, formattedReserves, userReserves),
//       );
//     },
//   });
// }
//
