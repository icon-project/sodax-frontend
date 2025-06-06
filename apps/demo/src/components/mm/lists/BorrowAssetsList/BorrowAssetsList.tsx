import React from 'react';
import { allXTokens, useReservesData } from '@new-world/dapp-kit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useMemo } from 'react';
import { useAppStore } from '@/zustand/useAppStore';
import { BorrowAssetsListItem } from './BorrowAssetsListItem';
import { formatUnits } from 'viem';

export function BorrowAssetsList() {
  const { selectedChain } = useAppStore();
  const tokens = useMemo(() => allXTokens.filter(token => token.xChainId === selectedChain), [selectedChain]);

  // const { data: reservesData } = useReservesData();

  // // reservesData to an array of XTokens
  // const assets = reservesData?.map(item => ({
  //   ...item,
  //   available: formatUnits(item.availableLiquidity, Number(item.decimals)),
  //   apy: 0,
  //   token: allXTokens.find(t => t.address === item.underlyingAsset),
  // }));

  const assets = useMemo(() => [
    {
      token: allXTokens.find(t => t.address === '0x0000000000000000000000000000000000000000' && t.xChainId === selectedChain),
      available: '100',
      apy: 0,
    },
  ], [selectedChain]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assets to borrow</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead>Available</TableHead>
              <TableHead>APY</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets &&
              assets.map(asset => (
                <BorrowAssetsListItem
                  key={asset.token?.address}
                  token={asset.token}
                  available={asset.available}
                  apy={asset.apy}
                />
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
