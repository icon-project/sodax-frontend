// apps/demo/src/components/dex/SwapInterface.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDownUp } from 'lucide-react';

export function SwapInterface() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Swap Tokens</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="tokenIn">From</Label>
          <div className="flex gap-2">
            <Input id="tokenIn" type="text" placeholder="0.0" className="flex-1" />
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select token" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usdc">USDC</SelectItem>
                <SelectItem value="usdt">USDT</SelectItem>
                <SelectItem value="eth">ETH</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-center">
          <Button variant="outline" size="icon">
            <ArrowDownUp className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tokenOut">To</Label>
          <div className="flex gap-2">
            <Input id="tokenOut" type="text" placeholder="0.0" className="flex-1" />
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select token" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usdc">USDC</SelectItem>
                <SelectItem value="usdt">USDT</SelectItem>
                <SelectItem value="eth">ETH</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Price Impact</span>
            <span>0.01%</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Minimum Received</span>
            <span>99.99 USDC</span>
          </div>
        </div>

        <Button className="w-full" disabled>
          Swap (Coming Soon)
        </Button>
      </CardContent>
    </Card>
  );
}







