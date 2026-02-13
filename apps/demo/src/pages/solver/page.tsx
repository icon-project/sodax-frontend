import React, { useState } from 'react';
import SwapCard from '@/components/solver/SwapCard';
import LimitOrderCard from '@/components/solver/LimitOrderCard';
import type { Hex, Intent, IntentDeliveryInfo } from '@sodax/sdk';
import OrderStatus from '@/components/solver/OrderStatus';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SolverEnv, useAppStore } from '@/zustand/useAppStore';

enum OrderType {
  Market = 'Market',
  Limit = 'Limit',
}

export default function SolverPage() {
  const { solverEnvironment, setSolverEnvironment } = useAppStore();
  const [orders, setOrders] = useState<{ intentHash: Hex; intent: Intent; intentDeliveryInfo: IntentDeliveryInfo }[]>(
    [],
  );

  const [orderType, setOrderType] = useState<OrderType>(OrderType.Market);

  return (
    <main className="flex flex-col items-center content-center justify-center space-y-2">
      {orders.map((order, index) => (
        <OrderStatus key={index} order={order} />
      ))}

      <Tabs value={solverEnvironment} onValueChange={value => setSolverEnvironment(value as SolverEnv)}>
        <TabsList>
          <TabsTrigger value={SolverEnv.Staging}>Staging</TabsTrigger>
          <TabsTrigger value={SolverEnv.Production}>Production</TabsTrigger>
          <TabsTrigger value={SolverEnv.Dev}>Dev</TabsTrigger>
        </TabsList>
      </Tabs>

      <Tabs
        value={orderType}
        onValueChange={value => {
          setOrderType(value as OrderType);
        }}
      >
        <TabsList>
          <TabsTrigger value={OrderType.Market}>Swap</TabsTrigger>
          <TabsTrigger value={OrderType.Limit}>Limit Order</TabsTrigger>
        </TabsList>
      </Tabs>

      {orderType === OrderType.Market && <SwapCard setOrders={setOrders} />}
      {orderType === OrderType.Limit && <LimitOrderCard />}
    </main>
  );
}
