import React, { useMemo } from 'react';
import { getSpokeTokenAddressByVault, useSpokeProvider, useUserReservesData } from '@sodax/dapp-kit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useWalletProvider, useXAccount, useXBalances } from '@sodax/wallet-sdk-react';
import { formatUnits } from 'viem';
import { SupplyAssetsListItem } from './SupplyAssetsListItem';
import { useAppStore } from '@/zustand/useAppStore';
import { getMoneyMarketConfig, moneyMarketSupportedTokens, SONIC_MAINNET_CHAIN_ID, type UserReserveData } from '@sodax/sdk';
import type { Token, XToken } from '@sodax/types';

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

  const { data: userReserves } = useUserReservesData(spokeProvider, address);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Markets</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead>Wallet Balance</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Debt</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokens.map(token => {
              try {
                let userReserve: UserReserveData | undefined;
                if (token.symbol === 'bnUSD') {
                  // bnUSD is special case, because both bnUSD and bnUSDVault are bnUSD reserves
                  const bnUSDReserve = userReserves?.[0]?.find(
                    r => getMoneyMarketConfig(SONIC_MAINNET_CHAIN_ID).bnUSD.toLowerCase() ===
                    r.underlyingAsset.toLowerCase(),
                  );
                  const bnUSDVaultReserve = userReserves?.[0]?.find(
                    r => getMoneyMarketConfig(SONIC_MAINNET_CHAIN_ID).bnUSDVault.toLowerCase() ===
                    r.underlyingAsset.toLowerCase()
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
                  userReserve = userReserves?.[0]?.find(
                    r => getSpokeTokenAddressByVault(selectedChainId, r.underlyingAsset)?.toLowerCase() === token.address.toLowerCase()
                  );
                }
                return (
                  <SupplyAssetsListItem
                    key={token.address}
                    token={token}
                    walletBalance={
                      balances?.[token.address] ? formatUnits(balances?.[token.address] || 0n, token.decimals) : '-'
                    }
                    balance={userReserve ? formatUnits(userReserve?.scaledATokenBalance || 0n, 18) : '-'}
                    debt={userReserve ? formatUnits(userReserve?.scaledVariableDebt || 0n, 18) : '-'}
                  />
                );
              } catch {
                console.log('error token', token);
              }
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
