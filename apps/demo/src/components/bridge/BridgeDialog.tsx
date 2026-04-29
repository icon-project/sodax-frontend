import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  useBridge,
  useBridgeAllowance,
  useBridgeApprove,
  useStellarTrustlineCheck,
  useRequestTrustline,
  useBitcoinBalance,
} from '@sodax/dapp-kit';
import { useEvmSwitchChain, useWalletProvider, useXAccount } from '@sodax/wallet-sdk-react';
import { ChainKeys, type ChainType, type SpokeChainKey, type XToken, type GetWalletProviderType, type IBitcoinWalletProvider, type IStellarWalletProvider } from '@sodax/types';
import type { CreateBridgeIntentParams } from '@sodax/sdk';
import { BitcoinSetupPanel } from '@/components/bitcoin/BitcoinSetupPanel';
import { ArrowLeftRight } from 'lucide-react';
import { formatUnits } from 'viem';

interface BridgeDialogProps {
  open: boolean;
  onClose: () => void;
  order: CreateBridgeIntentParams;
  fromToken: XToken | undefined;
  toToken: XToken | undefined;
  walletProvider: GetWalletProviderType<SpokeChainKey>;
  fromChainType: ChainType | undefined;
  toChainKey: SpokeChainKey;
  fromBtcConnector?: { name: string; icon: string };
  toBtcConnector?: { name: string; icon: string };
}

export function BridgeDialog({
  open,
  onClose,
  order,
  fromToken,
  toToken,
  walletProvider,
  fromChainType,
  toChainKey,
  fromBtcConnector,
  toBtcConnector,
}: BridgeDialogProps) {
  const [isFromBtcReady, setIsFromBtcReady] = useState(false);
  const [isToBtcReady, setIsToBtcReady] = useState(false);

  const toAccount = useXAccount(toChainKey);

  const { data: hasAllowance, isLoading: isAllowanceLoading } = useBridgeAllowance(
    order,
    walletProvider as GetWalletProviderType<typeof order.srcChainKey>,
  );

  const { mutateAsync: approve, isPending: isApproving } = useBridgeApprove();
  const { mutateAsync: bridge, isPending: isBridging } = useBridge();

  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(order.srcChainKey);

  const toWalletProvider = useWalletProvider(toChainKey);

  const fromBtcWalletProvider =
    walletProvider.chainType === 'BITCOIN' ? (walletProvider as IBitcoinWalletProvider) : undefined;
  const toBtcWalletProvider =
    toWalletProvider?.chainType === 'BITCOIN' ? (toWalletProvider as IBitcoinWalletProvider) : undefined;

  const stellarWalletProvider =
    toWalletProvider?.chainType === 'STELLAR' ? (toWalletProvider as IStellarWalletProvider) : undefined;
  const { data: hasSufficientTrustline, isPending: isTrustlineLoading } = useStellarTrustlineCheck(
    order.dstToken,
    order.amount,
    toChainKey,
    stellarWalletProvider,
  );
  const { requestTrustline, isLoading: isRequestingTrustline } = useRequestTrustline(order.dstToken);

  const toBtcAddress = toChainKey === ChainKeys.BITCOIN_MAINNET ? toAccount.address : undefined;
  const { data: toBtcBalance } = useBitcoinBalance(toBtcAddress);

  const handleApprove = async () => {
    await approve({
      params: order,
      walletProvider: walletProvider as GetWalletProviderType<typeof order.srcChainKey>,
    });
  };

  const handleBridge = async () => {
    const result = await bridge({
      params: order,
      walletProvider: walletProvider as GetWalletProviderType<typeof order.srcChainKey>,
    });
    if (result.ok) {
      onClose();
    }
  };

  const handleRequestTrustline = async () => {
    if (!stellarWalletProvider) return;
    await requestTrustline({
      token: order.dstToken,
      amount: order.amount,
      srcChainKey: ChainKeys.STELLAR_MAINNET,
      walletProvider: stellarWalletProvider,
    });
  };

  const isDestinationStellar = toChainKey === ChainKeys.STELLAR_MAINNET;
  const needsTrustline = isDestinationStellar && !isTrustlineLoading && !hasSufficientTrustline;

  const isBridgeDisabled =
    isBridging ||
    (fromChainType === 'EVM' && !hasAllowance) ||
    (order.srcChainKey === ChainKeys.BITCOIN_MAINNET && !isFromBtcReady) ||
    (toChainKey === ChainKeys.BITCOIN_MAINNET && !isToBtcReady) ||
    needsTrustline;

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Bridge Order</DialogTitle>
          <DialogDescription>Review and confirm your cross-chain transfer.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 text-sm">
          <div>
            From: {fromToken?.symbol ?? order.srcToken} on {order.srcChainKey}
          </div>
          <div>
            To: {toToken?.symbol ?? order.dstToken} on {order.dstChainKey}
          </div>
          <div>Amount: {formatUnits(order.amount, fromToken?.decimals ?? 0)}</div>
          <div>Recipient: {order.recipient}</div>

          {needsTrustline && (
            <div className="text-red-500">Insufficient Stellar trustline — request trustline to proceed.</div>
          )}
        </div>

        {fromBtcWalletProvider && order.srcChainKey === ChainKeys.BITCOIN_MAINNET && (
          <BitcoinSetupPanel
            walletProvider={fromBtcWalletProvider}
            onReadyChange={setIsFromBtcReady}
            connectorName={fromBtcConnector?.name}
            connectorIcon={fromBtcConnector?.icon}
          />
        )}

        {toBtcWalletProvider && toChainKey === ChainKeys.BITCOIN_MAINNET && toBtcBalance !== undefined && (
          <BitcoinSetupPanel
            walletProvider={toBtcWalletProvider}
            onReadyChange={setIsToBtcReady}
            nativeBalance={toBtcBalance}
            connectorName={toBtcConnector?.name}
            connectorIcon={toBtcConnector?.icon}
            isDestination
          />
        )}

        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          {fromChainType === 'EVM' && (
            <Button
              className="w-full"
              onClick={handleApprove}
              disabled={isAllowanceLoading || hasAllowance === true || isApproving}
            >
              {isApproving ? 'Approving…' : hasAllowance ? 'Approved' : 'Approve'}
            </Button>
          )}

          {isDestinationStellar && isTrustlineLoading && <span className="text-sm">Checking trustline…</span>}

          {needsTrustline && (
            <Button className="w-full" onClick={handleRequestTrustline} disabled={isRequestingTrustline}>
              {isRequestingTrustline ? 'Requesting…' : 'Request Trustline'}
            </Button>
          )}

          {isWrongChain && fromChainType === 'EVM' && (
            <Button className="w-full" onClick={handleSwitchChain}>
              Switch Chain
            </Button>
          )}

          {!isWrongChain && (
            <Button className="w-full" onClick={handleBridge} disabled={isBridgeDisabled}>
              {isBridging ? 'Bridging…' : (
                <>
                  <ArrowLeftRight className="mr-2 h-4 w-4" /> Bridge
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
