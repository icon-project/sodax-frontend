import React, { useMemo } from 'react';
import type { Hex, Intent, IntentDeliveryInfo } from '@sodax/sdk';
import { useStatus, useBackendSubmitSwapTxStatus } from '@sodax/dapp-kit';
import { statusCodeToMessage } from '@/lib/utils';

export type SolverOrder = {
  mode: 'solver';
  intentHash: Hex;
  intent: Intent;
  intentDeliveryInfo: IntentDeliveryInfo;
};

export type SubmitTxOrder = {
  mode: 'submit-tx';
  txHash: string;
  srcChainId: string;
  apiBaseURL?: string;
};

export type Order = SolverOrder | SubmitTxOrder;

function SolverOrderStatus({ order }: { order: SolverOrder }) {
  const { data: status } = useStatus(order.intentDeliveryInfo.dstTxHash as `0x${string}`);

  if (status) {
    if (status.ok) {
      return (
        <div className="flex flex-col text-center pb-4">
          <div>Order ID: {order.intent.intentId.toString()}</div>
          <div>Intent Hash: {order.intentHash}</div>
          <div>Intent Tx Hash: {order.intentDeliveryInfo.dstTxHash}</div>
          <div>Status: {statusCodeToMessage(status.value.status)}</div>
        </div>
      );
    }

    return (
      <div className="flex">
        <span>Error: {status.error.detail.message}</span>
      </div>
    );
  }

  return null;
}

function SubmitTxOrderStatus({ order }: { order: SubmitTxOrder }) {
  const apiConfig = useMemo(
    () => (order.apiBaseURL ? { baseURL: order.apiBaseURL } : undefined),
    [order.apiBaseURL],
  );
  const { data: statusResponse } = useBackendSubmitSwapTxStatus({
    params: { txHash: order.txHash, srcChainId: order.srcChainId },
    apiConfig,
  });

  if (!statusResponse) {
    return (
      <div className="flex flex-col text-center pb-4">
        <div>Tx Hash: {order.txHash}</div>
        <div>Status: Loading...</div>
      </div>
    );
  }

  const { status, result, failedAtStep, failureReason } = statusResponse.data;

  return (
    <div className="flex flex-col text-center pb-4">
      <div>Tx Hash: {order.txHash}</div>
      <div>Src Chain ID: {order.srcChainId}</div>
      <div>Status: {status}</div>
      {status === 'executed' && result?.dstIntentTxHash && <div>Dst Intent Tx Hash: {result.dstIntentTxHash}</div>}
      {status === 'executed' && result?.intent_hash && <div>Intent Hash: {result.intent_hash}</div>}
      {status === 'failed' && failedAtStep && <div className="text-red-500">Failed at: {failedAtStep}</div>}
      {status === 'failed' && failureReason && <div className="text-red-500">Reason: {failureReason}</div>}
    </div>
  );
}

export default function OrderStatus({ order }: { order: Order }) {
  if (order.mode === 'solver') {
    return <SolverOrderStatus order={order} />;
  }

  return <SubmitTxOrderStatus order={order} />;
}
