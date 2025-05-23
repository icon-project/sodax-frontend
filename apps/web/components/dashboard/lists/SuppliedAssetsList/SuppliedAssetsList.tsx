import { allXTokens } from '@/app/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import useSuppliedAssets from '@/hooks/useSuppliedAssets';
import type { BaseCurrencyInfo } from '@new-world/sdk';
import { getXChainType, useXAccount, useXBalances } from '@new-world/xwagmi';
import { SuppliedAssetsListItem } from './SuppliedAssetsListItem';

interface SupplyAssetsListProps {
  info: BaseCurrencyInfo;
}

export function SuppliedAssetsList() {
  const { address } = useXAccount(getXChainType('0xa869.fuji'));

  const { data: balances } = useXBalances({
    xChainId: '0xa869.fuji',
    xTokens: allXTokens,
    address,
  });

  const userReserves = useSuppliedAssets();

  console.log('userReserves', userReserves);

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
              <TableHead>APY</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userReserves?.map(reserve => (
              <SuppliedAssetsListItem key={reserve.underlyingAsset} reserve={reserve} />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
