import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AggregatedReserveData } from '@new-world/sdk';

function formatPercentage(value: bigint, decimals = 27): string {
  return `${(Number(value) / 10 ** decimals).toFixed(2)}%`;
}

function formatBasisPoints(value: bigint): string {
  return `${(Number(value) / 100).toFixed(2)}%`;
}

interface ReserveCardProps {
  reserve: AggregatedReserveData;
}

export function ReserveCard({ reserve }: ReserveCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {reserve.name} ({reserve.symbol})
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <h3 className="font-semibold">Asset Details</h3>
          <div className="grid grid-cols-2 gap-1 text-sm">
            <span className="text-muted-foreground">Underlying Asset:</span>
            <span>{reserve.underlyingAsset}</span>
            <span className="text-muted-foreground">Decimals:</span>
            <span>{reserve.decimals.toString()}</span>
            <span className="text-muted-foreground">aToken Address:</span>
            <span>{reserve.aTokenAddress}</span>
          </div>
        </div>

        <div className="grid gap-2">
          <h3 className="font-semibold">Liquidity Info</h3>
          <div className="grid grid-cols-2 gap-1 text-sm">
            <span className="text-muted-foreground">Available Liquidity:</span>
            <span>{reserve.availableLiquidity.toString()}</span>
            <span className="text-muted-foreground">Total Variable Debt:</span>
            <span>{reserve.totalScaledVariableDebt.toString()}</span>
            <span className="text-muted-foreground">Supply Cap:</span>
            <span>{reserve.supplyCap.toString()}</span>
            <span className="text-muted-foreground">Borrow Cap:</span>
            <span>{reserve.borrowCap.toString()}</span>
          </div>
        </div>

        <div className="grid gap-2">
          <h3 className="font-semibold">Rates & Indexes</h3>
          <div className="grid grid-cols-2 gap-1 text-sm">
            <span className="text-muted-foreground">Borrow Rate:</span>
            <span>{formatPercentage(reserve.variableBorrowRate)}</span>
            <span className="text-muted-foreground">Supply Rate:</span>
            <span>{formatPercentage(reserve.liquidityRate)}</span>
            <span className="text-muted-foreground">Base Variable Borrow Rate:</span>
            <span>{formatPercentage(reserve.baseVariableBorrowRate)}</span>
            <span className="text-muted-foreground">Optimal Usage Ratio:</span>
            <span>{formatPercentage(reserve.optimalUsageRatio)}</span>
          </div>
        </div>

        <div className="grid gap-2">
          <h3 className="font-semibold">Risk Parameters</h3>
          <div className="grid grid-cols-2 gap-1 text-sm">
            <span className="text-muted-foreground">Collateral Factor:</span>
            <span>{formatBasisPoints(reserve.baseLTVasCollateral)}</span>
            <span className="text-muted-foreground">Liquidation Threshold:</span>
            <span>{formatBasisPoints(reserve.reserveLiquidationThreshold)}</span>
            <span className="text-muted-foreground">Liquidation Bonus:</span>
            <span>{formatBasisPoints(reserve.reserveLiquidationBonus)}</span>
            <span className="text-muted-foreground">Reserve Factor:</span>
            <span>{formatBasisPoints(reserve.reserveFactor)}</span>
          </div>
        </div>

        <div className="grid gap-2">
          <h3 className="font-semibold">Status</h3>
          <div className="grid grid-cols-2 gap-1 text-sm">
            <span className="text-muted-foreground">Is Active:</span>
            <span>{reserve.isActive ? 'Yes' : 'No'}</span>
            <span className="text-muted-foreground">Is Frozen:</span>
            <span>{reserve.isFrozen ? 'Yes' : 'No'}</span>
            <span className="text-muted-foreground">Is Paused:</span>
            <span>{reserve.isPaused ? 'Yes' : 'No'}</span>
            <span className="text-muted-foreground">Borrowing Enabled:</span>
            <span>{reserve.borrowingEnabled ? 'Yes' : 'No'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
