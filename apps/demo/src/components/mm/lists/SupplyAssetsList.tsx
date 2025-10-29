import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatUnits } from 'viem';
import { SupplyAssetsListItem } from './SupplyAssetsListItem';

import { useReserveMetrics } from '@/hooks/useReserveMetrics';
import { useSupplyAssetsData } from '@/hooks/useSupplyAssetsData';

export function SupplyAssetsList() {
  const { selectedChainId, tokens, balances, userReserves, reserves, formattedReserves } = useSupplyAssetsData();

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
              <TableHead>Total Supply</TableHead>
              <TableHead>Supply APY</TableHead>
              <TableHead>Supply APR</TableHead>
              <TableHead>Total Borrow</TableHead>
              <TableHead>Borrow APY</TableHead>
              <TableHead>Borrow APR</TableHead>
              <TableHead>Debt</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokens.map(token => {
              const metrics = useReserveMetrics({
                token,
                reserves,
                formattedReserves,
                userReserves: [userReserves],
                selectedChainId,
              });

              return (
                <SupplyAssetsListItem
                  key={token.address}
                  token={token}
                  walletBalance={
                    balances?.[token.address]
                      ? Number(formatUnits(balances[token.address] || 0n, token.decimals)).toFixed(4)
                      : '-'
                  }
                  balance={
                    metrics.userReserve
                      ? Number(formatUnits(metrics.userReserve?.scaledATokenBalance || 0n, 18)).toFixed(4)
                      : '-'
                  }
                  debt={
                    metrics.userReserve
                      ? Number(formatUnits(metrics.userReserve?.scaledVariableDebt || 0n, 18)).toFixed(4)
                      : '-'
                  }
                  supplyApy={metrics.supplyAPY}
                  supplyAPR={metrics.supplyAPR}
                  borrowApy={metrics.borrowAPY}
                  borrowAPR={metrics.borrowAPR}
                  totalSupply={metrics.totalSupply}
                  totalBorrow={metrics.totalBorrow}
                  totalLiquidityUSD={metrics.totalLiquidityUSD}
                  totalBorrowsUSD={metrics.totalBorrowsUSD}
                />
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
