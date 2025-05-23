import { TableCell, TableRow } from '@/components/ui/table';
import type { UserReserveData } from '@new-world/sdk';
import type { XToken } from '@new-world/xwagmi';
import { formatUnits } from 'viem';
import { WithdrawButton } from './WithdrawButton';

interface SuppliedAssetsListItemProps {
  reserve: UserReserveData & { token: XToken | undefined };
}

export function SuppliedAssetsListItem({ reserve }: SuppliedAssetsListItemProps) {
  return (
    <TableRow>
      <TableCell>{reserve?.token?.symbol}</TableCell>
      <TableCell>{formatUnits(reserve.scaledATokenBalance, reserve?.token?.decimals || 18)}</TableCell>
      <TableCell>hello%</TableCell>
      <TableCell>{reserve?.token && <WithdrawButton token={reserve?.token} />}</TableCell>
    </TableRow>
  );
}
