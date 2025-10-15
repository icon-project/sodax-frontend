// apps/demo/src/components/dex/LiquidityManager.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function LiquidityManager() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="add" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="add">Add Liquidity</TabsTrigger>
          <TabsTrigger value="remove">Remove Liquidity</TabsTrigger>
          <TabsTrigger value="manage">Manage Position</TabsTrigger>
        </TabsList>

        <TabsContent value="add" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Liquidity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token0">Token 0</Label>
                <div className="flex gap-2">
                  <Input id="token0" type="text" placeholder="0.0" className="flex-1" />
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
                <Label htmlFor="token1">Token 1</Label>
                <div className="flex gap-2">
                  <Input id="token1" type="text" placeholder="0.0" className="flex-1" />
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
                <Label htmlFor="feeTier">Fee Tier</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fee tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.01">0.01%</SelectItem>
                    <SelectItem value="0.05">0.05%</SelectItem>
                    <SelectItem value="0.3">0.3%</SelectItem>
                    <SelectItem value="1">1%</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full" disabled>
                Add Liquidity (Coming Soon)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="remove" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Remove Liquidity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="positionId">Position ID</Label>
                <Input id="positionId" type="text" placeholder="Enter position NFT token ID" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="liquidityAmount">Liquidity Amount</Label>
                <Input id="liquidityAmount" type="text" placeholder="0.0" />
              </div>

              <Button className="w-full" disabled>
                Remove Liquidity (Coming Soon)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manage Position</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="managePositionId">Position ID</Label>
                <Input id="managePositionId" type="text" placeholder="Enter position NFT token ID" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button disabled>Increase Liquidity (Coming Soon)</Button>
                <Button disabled>Decrease Liquidity (Coming Soon)</Button>
              </div>

              <Button className="w-full" disabled>
                Burn Position (Coming Soon)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}







