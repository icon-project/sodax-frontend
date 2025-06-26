import React, { useState } from 'react';
import SwapCard from '@/components/solver/SwapCard';
import type { Hex, Intent, PacketData } from '@sodax/sdk';
import OrderStatus from '@/components/solver/OrderStatus';

export default function SolverPage() {
  const [orders, setOrders] = useState<{ intentHash: Hex; intent: Intent; packet: PacketData }[]>([]);

  return (
    <div className="flex flex-col items-center content-center justify-center h-screen">
      {orders.map((order, index) => (
        <OrderStatus key={index} order={order} />
      ))}
      <SwapCard setOrders={setOrders} />
    </div>
  );
}
