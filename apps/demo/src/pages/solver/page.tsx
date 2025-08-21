import React, { useState } from 'react';
import SwapCard from '@/components/solver/SwapCard';
import type { Hex, Intent, IntentDeliveryInfo } from '@sodax/sdk';
import OrderStatus from '@/components/solver/OrderStatus';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/zustand/useAppStore';

export default function SolverPage() {
  const { setIsSolverProduction, isSolverProduction } = useAppStore();
  const [orders, setOrders] = useState<{ intentHash: Hex; intent: Intent; intentDeliveryInfo: IntentDeliveryInfo }[]>([]);

  return (
    <div className="flex flex-col items-center content-center justify-center h-screen">
      {orders.map((order, index) => (
        <OrderStatus key={index} order={order} />
      ))}

      <Tabs
        className="mb-2"
        defaultValue={isSolverProduction ? 'production' : 'staging'}
        onValueChange={value => {
          setIsSolverProduction(value === 'production');
        }}
      >
        <TabsList>
          <TabsTrigger value="staging">Staging</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
        </TabsList>
      </Tabs>

      <SwapCard setOrders={setOrders} />
    </div>
  );
}
