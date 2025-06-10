import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSuppliedAssets } from '@sodax/dapp-kit';
import type { UserReserveData } from '@sodax/sdk';
import type { XToken } from '@sodax/wallet-sdk';
import { SuppliedAssetsListItem } from './SuppliedAssetsListItem';
import { useAppStore } from '@/zustand/useAppStore';

export function SuppliedAssetsList() {
  const { selectedChain } = useAppStore();

  const userReserves = useSuppliedAssets(selectedChain);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your supplies</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead>Balance</TableHead>
              {/* <TableHead>APY</TableHead> */}
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userReserves?.map((reserve: UserReserveData & { token: XToken | undefined }) => (
              <SuppliedAssetsListItem key={reserve.underlyingAsset} reserve={reserve} />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
