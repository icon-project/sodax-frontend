import React from 'react';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { formatUnits } from 'viem';
import type { IntentResponse, Intent, IntentRelayChainId } from '@sodax/sdk';
import { useMemo } from 'react';
import type { SpokeChainId } from '@sodax/types';
import { useCancelSwap, useSodaxContext, useSpokeProvider } from '@sodax/dapp-kit';
import { useWalletProvider } from '@sodax/wallet-sdk-react';
import { useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';

interface LimitOrderItemProps {
  intent: IntentResponse;
}

/**
 * Component for displaying a single limit order in the table
 */
export default function LimitOrderItem({ intent }: LimitOrderItemProps) {
  const { sodax } = useSodaxContext();
  const queryClient = useQueryClient();

  const srcChainId = sodax.config.getSpokeChainIdFromIntentRelayChainId(
    BigInt(intent.intent.srcChain) as IntentRelayChainId,
  ) as SpokeChainId;
  const dstChainId = sodax.config.getSpokeChainIdFromIntentRelayChainId(
    BigInt(intent.intent.dstChain) as IntentRelayChainId,
  ) as SpokeChainId;

  // Find tokens by address on their respective chains
  const inputToken = useMemo(() => {
    // !TODO: make a util function to find token by spoke chain id and hub asset address. and simplify the code.
    const originalAssetAddress = sodax.config.getOriginalAssetAddress(
      srcChainId,
      intent.intent.inputToken as `0x${string}`,
    );
    return originalAssetAddress
      ? sodax.config
          .getSupportedTokensPerChain()
          .get(srcChainId)
          ?.find(token => token.address.toLowerCase() === originalAssetAddress.toLowerCase())
      : undefined;
  }, [srcChainId, intent.intent.inputToken, sodax.config]);

  const outputToken = useMemo(() => {
    // !TODO: make a util function to find token by spoke chain id and hub asset address. and simplify the code.
    const originalAssetAddress = sodax.config.getOriginalAssetAddress(
      dstChainId,
      intent.intent.outputToken as `0x${string}`,
    );
    return originalAssetAddress
      ? sodax.config
          .getSupportedTokensPerChain()
          .get(dstChainId)
          ?.find(token => token.address.toLowerCase() === originalAssetAddress.toLowerCase())
      : undefined;
  }, [dstChainId, intent.intent.outputToken, sodax.config]);

  // Format amounts
  const inputAmount = useMemo(() => {
    if (!inputToken) {
      return intent.intent.inputAmount;
    }

    return formatUnits(BigInt(intent.intent.inputAmount), inputToken.decimals);
  }, [intent.intent.inputAmount, inputToken]);

  const outputAmount = useMemo(() => {
    if (!outputToken) {
      return intent.intent.minOutputAmount;
    }

    return formatUnits(BigInt(intent.intent.minOutputAmount), outputToken.decimals);
  }, [intent.intent.minOutputAmount, outputToken]);

  // Get provider for canceling (use srcChain since that's where the intent was created)
  const walletProvider = useWalletProvider(srcChainId);
  const spokeProvider = useSpokeProvider(srcChainId, walletProvider);
  const { mutateAsync: cancelSwap, isPending: isCanceling } = useCancelSwap(spokeProvider);

  const handleCancel = async (): Promise<void> => {
    try {
      const intentData: Intent = {
        intentId: BigInt(intent.intent.intentId),
        creator: intent.intent.creator as `0x${string}`,
        inputToken: intent.intent.inputToken as `0x${string}`,
        outputToken: intent.intent.outputToken as `0x${string}`,
        inputAmount: BigInt(intent.intent.inputAmount),
        minOutputAmount: BigInt(intent.intent.minOutputAmount),
        deadline: BigInt(intent.intent.deadline),
        allowPartialFill: intent.intent.allowPartialFill,
        srcChain: BigInt(intent.intent.srcChain) as IntentRelayChainId,
        dstChain: BigInt(intent.intent.dstChain) as IntentRelayChainId,
        srcAddress: intent.intent.srcAddress as `0x${string}`,
        dstAddress: intent.intent.dstAddress as `0x${string}`,
        solver: intent.intent.solver as `0x${string}`,
        data: intent.intent.data as `0x$string`,
      };

      const result = await cancelSwap({ intent: intentData });

      if (result.ok) {
        // Invalidate queries to refresh the list
        queryClient.invalidateQueries({ queryKey: ['backend', 'intent', 'user'] });
      } else {
        console.error('Failed to cancel intent:', result.error);
      }
    } catch (error) {
      console.error('Error canceling intent:', error);
    }
  };

  return (
    <TableRow>
      <TableCell>
        {inputAmount} {inputToken?.symbol ?? ''}
      </TableCell>
      <TableCell className="font-medium">
        {inputToken ? `${inputToken.symbol} (${inputToken.name})` : intent.intent.inputToken}
      </TableCell>
      <TableCell>
        {outputAmount} {outputToken?.symbol ?? ''}
      </TableCell>
      <TableCell className="font-medium">
        {outputToken ? `${outputToken.symbol} (${outputToken.name})` : intent.intent.outputToken}
      </TableCell>
      <TableCell>
        <Button size="sm" onClick={handleCancel} disabled={isCanceling || !intent.open}>
          <X className="h-4 w-4 mr-1" />
          {isCanceling ? 'Canceling...' : 'Cancel'}
        </Button>
      </TableCell>
    </TableRow>
  );
}
