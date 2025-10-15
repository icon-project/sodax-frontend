// apps/demo/src/pages/dex/page.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PositionViewer } from '@/components/dex/PositionViewer';
import { CreatePool } from '@/components/dex/CreatePool';
import { SwapInterface } from '@/components/dex/SwapInterface';
import { LiquidityManager } from '@/components/dex/LiquidityManager';

export default function DexPage() {
  return (
    <main className="container mx-auto p-4 mt-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">DEX - Concentrated Liquidity</h1>
      </div>

      <Tabs defaultValue="positions" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="swap">Swap</TabsTrigger>
          <TabsTrigger value="liquidity">Liquidity</TabsTrigger>
          <TabsTrigger value="create-pool">Create Pool</TabsTrigger>
        </TabsList>

        <TabsContent value="positions" className="space-y-4">
          <PositionViewer />
        </TabsContent>

        <TabsContent value="swap" className="space-y-4">
          <SwapInterface />
        </TabsContent>

        <TabsContent value="liquidity" className="space-y-4">
          <LiquidityManager />
        </TabsContent>

        <TabsContent value="create-pool" className="space-y-4">
          <CreatePool />
        </TabsContent>
      </Tabs>
    </main>
  );
}
