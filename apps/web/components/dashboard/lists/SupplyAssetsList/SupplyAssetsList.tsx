import { allXTokens } from '@new-world/dapp-kit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useChainSelector } from '@/contexts/ChainSelectorContext';
import { getXChainType, useXAccount, useXBalances } from '@new-world/xwagmi';
import { formatUnits } from 'viem';
import { SupplyAssetsListItem } from './SupplyAssetsListItem';

export function SupplyAssetsList() {
  const { selectedChain } = useChainSelector();
  const { address } = useXAccount(getXChainType(selectedChain));
  const { data: balances } = useXBalances({
    xChainId: selectedChain,
    xTokens: allXTokens.filter(token => token.xChainId === selectedChain),
    address,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assets to supply</CardTitle>
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
            {allXTokens
              .filter(token => token.xChainId === selectedChain)
              .map(token => (
                <SupplyAssetsListItem
                  key={token.address}
                  token={token}
                  balance={formatUnits(balances?.[token.address] || 0n, token.decimals)}
                  apy={2}
                />
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
