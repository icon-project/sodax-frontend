import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { UserReserveData } from '@new-world/sdk';

interface UserReservesCardProps {
  reserves: UserReserveData[];
  eModeCategory: number;
}

export function UserReservesCard({ reserves, eModeCategory }: UserReservesCardProps) {
  const activeReserves = reserves.filter(
    reserve => Number(reserve.scaledATokenBalance) > 0 || Number(reserve.scaledVariableDebt) > 0,
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>User Position</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="text-sm">
          <span className="text-muted-foreground">E-Mode Category: </span>
          <span>{eModeCategory}</span>
        </div>

        {activeReserves.length > 0 ? (
          activeReserves.map(reserve => (
            <div key={reserve.underlyingAsset} className="grid gap-2">
              <h3 className="font-semibold">Asset {reserve.underlyingAsset}</h3>
              <div className="grid grid-cols-2 gap-1 text-sm">
                <span className="text-muted-foreground">Supplied:</span>
                <span>{reserve.scaledATokenBalance}</span>

                <span className="text-muted-foreground">Borrowed:</span>
                <span>{reserve.scaledVariableDebt}</span>

                <span className="text-muted-foreground">Used as Collateral:</span>
                <span>{reserve.usageAsCollateralEnabledOnUser ? 'Yes' : 'No'}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-muted-foreground">No active positions</div>
        )}
      </CardContent>
    </Card>
  );
}
