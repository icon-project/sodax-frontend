import React, { useMemo } from 'react';
import { getSpokeTokenAddressByVault, useReservesData, useSpokeProvider, useUserReservesData } from '@sodax/dapp-kit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useWalletProvider, useXAccount, useXBalances } from '@sodax/wallet-sdk-react';
import { formatUnits } from 'viem';
import { SupplyAssetsListItem } from './SupplyAssetsListItem';
import { useAppStore } from '@/zustand/useAppStore';
import {
  getMoneyMarketConfig,
  moneyMarketSupportedTokens,
  SONIC_MAINNET_CHAIN_ID,
  type UserReserveData,
} from '@sodax/sdk';
import type { Token, XToken } from '@sodax/types';
import { findReserveByUnderlyingAsset, findUserReserveBySpokeTokenAddress } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export function SupplyAssetsList() {
  const { selectedChainId } = useAppStore();

  const tokens = useMemo(
    () =>
      moneyMarketSupportedTokens[selectedChainId].map((t: Token) => {
        return {
          ...t,
          xChainId: selectedChainId,
        } satisfies XToken;
      }),
    [selectedChainId],
  );

  const { address } = useXAccount(selectedChainId);
  const walletProvider = useWalletProvider(selectedChainId);
  const spokeProvider = useSpokeProvider(selectedChainId, walletProvider);
  const { data: balances } = useXBalances({
    xChainId: selectedChainId,
    xTokens: tokens,
    address,
  });

  const { data: userReserves, isLoading: isUserReservesLoading } = useUserReservesData(spokeProvider, address);
  const { data: reserves, isLoading: isReservesLoading } = useReservesData();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Markets</CardTitle>
      </CardHeader>
      <CardContent>
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="border-b border-cherry-grey/20">
              <TableHead className="text-cherry-dark font-bold">Asset</TableHead>
              <TableHead className="text-cherry-dark font-bold">Wallet Balance</TableHead>
              <TableHead className="text-cherry-dark font-bold">Balance</TableHead>
              <TableHead className="text-cherry-dark font-bold">Debt</TableHead>
              <TableHead className="text-cherry-dark font-bold">Supply</TableHead>
              <TableHead className="text-cherry-dark font-bold">Withdraw</TableHead>
              <TableHead className="text-cherry-dark font-bold">Repay</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isUserReservesLoading || isReservesLoading || !userReserves || !reserves ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="flex items-center justify-center gap-2 text-clay">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Loading markets...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              userReserves &&
              reserves &&
              tokens.map(token => {
                try {
                  let userReserve: UserReserveData;
                  if (token.symbol === 'bnUSD') {
                    // bnUSD is special case, because both bnUSD and bnUSDVault are bnUSD reserves
                    const bnUSDReserve = userReserves?.[0]?.find(
                      r =>
                        getMoneyMarketConfig(SONIC_MAINNET_CHAIN_ID).bnUSD.toLowerCase() ===
                        r.underlyingAsset.toLowerCase(),
                    );
                    const bnUSDVaultReserve = userReserves?.[0]?.find(
                      r =>
                        getMoneyMarketConfig(SONIC_MAINNET_CHAIN_ID).bnUSDVault.toLowerCase() ===
                        r.underlyingAsset.toLowerCase(),
                    );

                    if (!bnUSDReserve || !bnUSDVaultReserve) {
                      return null;
                    }

                    // we just merge the two bnUSD reserves into one bnUSD vault reserve, but you should be aware of the differences
                    const mergedbnUSDReserve = {
                      ...bnUSDVaultReserve,
                      scaledATokenBalance: bnUSDReserve?.scaledATokenBalance + bnUSDVaultReserve?.scaledATokenBalance,
                      scaledVariableDebt: bnUSDReserve?.scaledVariableDebt + bnUSDVaultReserve?.scaledVariableDebt,
                    };
                    userReserve = mergedbnUSDReserve;
                  } else {
                    userReserve = findUserReserveBySpokeTokenAddress(userReserves[0], selectedChainId, token);
                  }
                  return (
                    <SupplyAssetsListItem
                      key={token.address}
                      token={token}
                      walletBalance={
                        balances?.[token.address] ? formatUnits(balances?.[token.address] || 0n, token.decimals) : '-'
                      }
                      balance={formatUnits(userReserve.scaledATokenBalance || 0n, 18)}
                      debt={formatUnits(userReserve.scaledVariableDebt || 0n, 18)}
                      reserve={findReserveByUnderlyingAsset(userReserve.underlyingAsset, reserves[0])}
                    />
                  );
                } catch {
                  console.log('error token', token);
                }
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
