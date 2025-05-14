import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BaseCurrencyInfo } from '@new-world/sdk';

interface BaseCurrencyCardProps {
  info: BaseCurrencyInfo;
}

export function BaseCurrencyCard({ info }: BaseCurrencyCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Base Currency Information</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-2 gap-1 text-sm">
          <span className="text-muted-foreground">Market Reference Price (USD):</span>
          <span>{info.marketReferenceCurrencyPriceInUsd.toString()}</span>

          <span className="text-muted-foreground">Network Base Token Price (USD):</span>
          <span>{info.networkBaseTokenPriceInUsd.toString()}</span>

          <span className="text-muted-foreground">Network Base Token Price Decimals:</span>
          <span>{info.networkBaseTokenPriceDecimals}</span>
        </div>
      </CardContent>
    </Card>
  );
}
