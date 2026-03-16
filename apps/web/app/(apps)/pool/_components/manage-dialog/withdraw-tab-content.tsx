import type React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TabsContent } from '@/components/ui/tabs';

type WithdrawTabContentProps = {
  tokenId: string;
  withdrawPercentage: string;
  slippageTolerance: string;
  isPending: boolean;
  isWithdrawPending: boolean;
  onWithdrawPercentageChange: (value: string) => void;
  onSlippageChange: (value: string) => void;
  onWithdrawLiquidity: () => void;
};

export function WithdrawTabContent({
  tokenId,
  withdrawPercentage,
  slippageTolerance,
  isPending,
  isWithdrawPending,
  onWithdrawPercentageChange,
  onSlippageChange,
  onWithdrawLiquidity,
}: WithdrawTabContentProps): React.JSX.Element {
  return (
    <TabsContent value="withdraw" className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor={`withdraw-percentage-${tokenId}`}>Withdraw Percentage (%)</Label>
        <Input
          id={`withdraw-percentage-${tokenId}`}
          type="number"
          value={withdrawPercentage}
          onChange={event => onWithdrawPercentageChange(event.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`withdraw-slippage-${tokenId}`}>Slippage (%)</Label>
        <Input
          id={`withdraw-slippage-${tokenId}`}
          type="number"
          value={slippageTolerance}
          onChange={event => onSlippageChange(event.target.value)}
        />
      </div>
      <Button className="w-full" variant="outline" onClick={onWithdrawLiquidity} disabled={isPending}>
        {isWithdrawPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        Withdraw Liquidity
      </Button>
    </TabsContent>
  );
}
