// apps/demo/src/components/dex/SelectPool.tsx
import React, { type JSX } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertCircle } from 'lucide-react';
import type { PoolKey} from '@sodax/sdk';
import type { ChainId,  } from '@sodax/types';


interface SelectPoolProps {
  selectedChainId: ChainId | null;
  pools: PoolKey[];
  selectedPoolIndex: number;
  onPoolSelect: (index: number) => void;
  loading: boolean;
}

export function SelectPool({
  selectedChainId,
  pools,
  selectedPoolIndex,
  onPoolSelect,
  loading,
}: SelectPoolProps): JSX.Element {
  if (!selectedChainId) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8" />
            <p className="font-medium">Please select a chain to continue</p>
            <p className="text-sm">Select a chain from the dropdown above to view available pools</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Pool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pool">Available Pools</Label>
          <Select
            value={selectedPoolIndex >= 0 ? selectedPoolIndex.toString() : ''}
            onValueChange={value => onPoolSelect(Number.parseInt(value, 10))}
            disabled={pools.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={pools.length === 0 ? 'No pools available' : 'Select a pool'} />
            </SelectTrigger>
            <SelectContent>
              {pools.map((pool, index) => (
                <SelectItem key={index} value={index.toString()}>
                  Pool {index + 1} - Fee: {pool.fee / 10000}%
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {pools.length} pool{pools.length !== 1 ? 's' : ''} available
          </p>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading pool data...
          </div>
        )}
      </CardContent>
    </Card>
  );
}

