import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSuppliedAssets } from '@new-world/dapp-kit';
import type { UserReserveData } from '@new-world/sdk';
import type { XToken } from '@new-world/xwagmi';
import { SuppliedAssetsListItem } from './SuppliedAssetsListItem';
import { useChainSelector } from '@/contexts/ChainSelectorContext';

export function SuppliedAssetsList() {
  const { selectedChain } = useChainSelector();

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
