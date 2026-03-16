import type React from 'react';
import { Loader2 } from 'lucide-react';
import type { PoolData } from '@sodax/sdk';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TabsContent } from '@/components/ui/tabs';

type AddLiquidityTabContentProps = {
  tokenId: string;
  poolData: PoolData;
  minPrice: string;
  maxPrice: string;
  liquidityToken0Amount: string;
  liquidityToken1Amount: string;
  slippageTolerance: string;
  isPending: boolean;
  isSupplyPending: boolean;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  onToken0AmountChange: (value: string) => void;
  onToken1AmountChange: (value: string) => void;
  onSlippageChange: (value: string) => void;
  onAddLiquidity: () => void;
};

export function AddLiquidityTabContent({
  tokenId,
  poolData,
  minPrice,
  maxPrice,
  liquidityToken0Amount,
  liquidityToken1Amount,
  slippageTolerance,
  isPending,
  isSupplyPending,
  onMinPriceChange,
  onMaxPriceChange,
  onToken0AmountChange,
  onToken1AmountChange,
  onSlippageChange,
  onAddLiquidity,
}: AddLiquidityTabContentProps): React.JSX.Element {
  return (
    <TabsContent value="add" className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor={`min-price-${tokenId}`}>Min Price</Label>
          <Input
            id={`min-price-${tokenId}`}
            type="number"
            value={minPrice}
            step="0.000001"
            onChange={event => onMinPriceChange(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`max-price-${tokenId}`}>Max Price</Label>
          <Input
            id={`max-price-${tokenId}`}
            type="number"
            value={maxPrice}
            step="0.000001"
            onChange={event => onMaxPriceChange(event.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor={`token0-amount-${tokenId}`}>{poolData.token0.symbol} Amount</Label>
        <Input
          id={`token0-amount-${tokenId}`}
          type="number"
          placeholder="0.0"
          value={liquidityToken0Amount}
          onChange={event => onToken0AmountChange(event.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`token1-amount-${tokenId}`}>{poolData.token1.symbol} Amount</Label>
        <Input
          id={`token1-amount-${tokenId}`}
          type="number"
          placeholder="0.0"
          value={liquidityToken1Amount}
          onChange={event => onToken1AmountChange(event.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`slippage-${tokenId}`}>Slippage (%)</Label>
        <Input
          id={`slippage-${tokenId}`}
          type="number"
          value={slippageTolerance}
          onChange={event => onSlippageChange(event.target.value)}
        />
      </div>
      <Button className="w-full" onClick={onAddLiquidity} disabled={isPending}>
        {isSupplyPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        Add Liquidity
      </Button>
    </TabsContent>
  );
}
