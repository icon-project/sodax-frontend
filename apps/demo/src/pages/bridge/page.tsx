// biome-ignore lint/style/useImportType:
import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { SelectChain } from '@/components/solver/SelectChain';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  BASE_MAINNET_CHAIN_ID,
  type CreateBridgeIntentParams,
  POLYGON_MAINNET_CHAIN_ID,
  spokeChainConfig,
  STELLAR_MAINNET_CHAIN_ID,
  StellarSpokeProvider,
} from '@sodax/sdk';
import type { ChainType, SpokeChainId, XToken } from '@sodax/types';
import {
  getXChainType,
  useEvmSwitchChain,
  useWalletProvider,
  useXAccount,
  useXDisconnect,
} from '@sodax/wallet-sdk-react';
import { useAppStore } from '@/zustand/useAppStore';
import { ArrowDownUp, ArrowLeftRight } from 'lucide-react';
import { parseUnits, formatUnits } from 'viem';
import {
  useSpokeProvider,
  useBridgeApprove,
  useBridgeAllowance,
  useBridge,
  useGetBridgeableAmount,
  useGetBridgeableTokens,
  useSodaxContext,
  useStellarTrustlineCheck,
  useRequestTrustline,
} from '@sodax/dapp-kit';
import { Skeleton } from '@/components/ui/skeleton';

export default function BridgePage() {
  const { openWalletModal } = useAppStore();
  const { sodax } = useSodaxContext();

  const [fromToken, setFromToken] = useState<XToken>(
    Object.values(spokeChainConfig[BASE_MAINNET_CHAIN_ID].supportedTokens)[3],
  );
  const [fromAmount, setFromAmount] = useState<string>('');
  const fromAccount = useXAccount(fromToken.xChainId);

  const [toTokenChainId, setToTokenChainId] = useState<SpokeChainId>(POLYGON_MAINNET_CHAIN_ID);
  const toAccount = useXAccount(toTokenChainId);
  const supportedSpokeChains = sodax.config.getSupportedSpokeChains();
  const supportedTokensPerChain = sodax.config.getSupportedTokensPerChain();

  // Fetch bridgeable tokens and set toToken when bridgeableTokens is defined
  const { data: bridgeableTokens, isLoading: isLoadingBridgeableTokens } = useGetBridgeableTokens(
    fromToken.xChainId,
    toTokenChainId,
    fromToken.address,
  );

  useEffect((): void => {
    if (bridgeableTokens && bridgeableTokens.length > 0) {
      setToToken(prev =>
        prev && bridgeableTokens.some(token => token.address === prev.address) ? prev : bridgeableTokens[0],
      );
    } else {
      setToToken(undefined);
    }
    // Only run when bridgeableTokens changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bridgeableTokens]);

  const handleFromChainChange = (chainId: SpokeChainId) => {
    const newToken = Object.values(spokeChainConfig[chainId].supportedTokens)[0];
    setFromToken(newToken);
  };

  const handleToChainChange = (chainId: SpokeChainId) => {
    setToTokenChainId(chainId);
  };

  const [toToken, setToToken] = useState<XToken | undefined>(bridgeableTokens?.[0] ?? undefined);
  console.log('toToken', toToken);

  const { data: bridgeableAmount, isLoading: isLoadingBridgeableAmount } = useGetBridgeableAmount(fromToken, toToken);

  const handleFromAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFromAmount(e.target.value);
  };

  const disconnect = useXDisconnect();
  const handleFromAccountDisconnect = () => {
    disconnect(getXChainType(fromToken.xChainId) as ChainType);
  };

  const handleToAccountDisconnect = () => {
    disconnect(getXChainType(toToken?.xChainId) as ChainType);
  };

  const [open, setOpen] = useState(false);

  const openBridgeModal = () => {
    if (!fromToken || !toToken || !fromAccount.address || !toAccount.address) {
      return;
    }

    setOrder({
      srcChainId: fromToken.xChainId,
      srcAsset: fromToken?.address,
      amount: parseUnits(fromAmount, fromToken?.decimals ?? 0),
      dstChainId: toToken.xChainId,
      dstAsset: toToken?.address,
      recipient: toAccount.address,
    });
    setOpen(true);
  };

  const [order, setOrder] = useState<CreateBridgeIntentParams | undefined>(undefined);

  const fromWalletProvider = useWalletProvider(fromToken.xChainId);
  const fromProvider = useSpokeProvider(fromToken.xChainId, fromWalletProvider);

  const { approve, isLoading: isApproving } = useBridgeApprove(fromProvider);

  const handleApprove = async () => {
    if (!order) {
      return;
    }
    await approve(order);
  };

  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(fromToken.xChainId);
  const { data: hasAllowed, isLoading: isAllowanceLoading } = useBridgeAllowance(order, fromProvider);
  const { mutateAsync: bridge, isPending: isBridging } = useBridge(fromProvider);
  const destProvider = useSpokeProvider(order?.dstChainId, useWalletProvider(order?.dstChainId));
  const {
    data: hasSufficientTrustline,
    isPending: isTrustlineLoading,
    error: trustlineError,
  } = useStellarTrustlineCheck(
    order?.dstAsset,
    parseUnits(fromAmount, toToken?.decimals ?? 0),
    destProvider,
    order?.dstChainId,
  );
  if (trustlineError) {
    console.error('trustlineError', trustlineError);
  }
  const { requestTrustline } = useRequestTrustline(order?.dstAsset);

  const handleBridge = async (order: CreateBridgeIntentParams) => {
    setOpen(false);
    await bridge(order);
  };

  const handleSwitch = () => {
    if (toToken) {
      setFromToken(toToken);
      setToTokenChainId(fromToken.xChainId);
    } else {
      setFromToken(Object.values(spokeChainConfig[toTokenChainId].supportedTokens)[0]);
      setToTokenChainId(fromToken.xChainId);
    }
  };

  const isBridgeable = useMemo(() => {
    console.log('isBridgeable params: ');
    console.log('fromToken', fromToken);
    console.log('toToken', toToken);

    if (!fromToken || !toToken) {
      return false;
    }

    return sodax.bridge.isBridgeable({
      from: fromToken,
      to: toToken,
    });
  }, [fromToken, toToken, sodax]);

  const handleRequestTrustline = async (order: CreateBridgeIntentParams | undefined) => {
    // if destination token is a Stellar asset, request trustline
    if (!order) {
      console.error('intentOrderPayload undefined');
      return;
    }

    if (!destProvider || !(destProvider instanceof StellarSpokeProvider)) {
      console.error('destProvider undefined or not a StellarSpokeProvider');
      return;
    }

    if (!toToken) {
      console.error('toToken undefined');
      return;
    }
    if (!fromAmount) {
      console.error('fromAmount undefined');
      return;
    }

    await requestTrustline({
      token: order.dstAsset,
      amount: parseUnits(fromAmount, toToken?.decimals ?? 0),
      spokeProvider: destProvider,
    });
  };

  return (
    <div className="flex flex-col items-center content-center justify-center h-screen">
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Cross-Chain Transfer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <SelectChain
              chainList={supportedSpokeChains}
              value={fromToken.xChainId}
              setChain={handleFromChainChange}
              placeholder={'Select source chain'}
              id={'source-chain'}
              label={'From'}
            />
          </div>
          <div className="flex space-x-2">
            <div className="grow">
              <Input type="number" placeholder="0.0" value={fromAmount} onChange={handleFromAmountChange} />
            </div>
            <Select
              value={fromToken?.symbol}
              onValueChange={v => {
                const selectedToken = supportedTokensPerChain
                  .get(fromToken.xChainId)
                  ?.find(token => token.symbol === v);
                if (selectedToken) {
                  setFromToken(selectedToken);
                }
              }}
            >
              <SelectTrigger className="w-[110px]">
                <SelectValue placeholder="Token" />
              </SelectTrigger>
              <SelectContent>
                {supportedTokensPerChain.get(fromToken.xChainId)?.map(token => (
                  <SelectItem key={token.address} value={token.symbol}>
                    {token.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grow">
            <Label htmlFor="fromAddress">Source address</Label>
            <div className="flex items-center gap-2">
              <Input id="fromAddress" type="text" placeholder="" value={fromAccount.address || ''} disabled={true} />
              {fromAccount.address ? (
                <Button onClick={handleFromAccountDisconnect}>Disconnect</Button>
              ) : (
                <Button onClick={openWalletModal}>Connect</Button>
              )}
            </div>
          </div>
          <div className="flex justify-center">
            <Button variant="outline" size="icon" onClick={() => handleSwitch()}>
              <ArrowDownUp className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            <SelectChain
              chainList={supportedSpokeChains}
              value={toTokenChainId}
              setChain={handleToChainChange}
              placeholder={'Select destination chain'}
              id={'dest-chain'}
              label={'To'}
            />
          </div>
          <div className="flex space-x-2">
            <div className="grow">
              <Input type="number" placeholder="0.0" value={fromAmount} readOnly />
            </div>
            {isLoadingBridgeableTokens ? (
              <Skeleton className="w-[110px] h-10" />
            ) : (
              <Select
                value={bridgeableTokens?.[0]?.symbol}
                onValueChange={v => {
                  const selectedToken = bridgeableTokens?.find(token => token.symbol === v);
                  if (selectedToken) {
                    setToToken(selectedToken);
                  }
                }}
              >
                <SelectTrigger className="w-[110px]">
                  <SelectValue placeholder="Token" />
                </SelectTrigger>
                <SelectContent>
                  {bridgeableTokens?.map(token => (
                    <SelectItem key={`${token.address}-${token.symbol}`} value={token.symbol}>
                      {token.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="grow">
            <Label htmlFor="toAddress">Destination address</Label>
            <div className="flex items-center gap-2">
              <Input id="toAddress" type="text" value={toAccount.address || ''} placeholder="" disabled={true} />
              {toAccount.address ? (
                <Button onClick={handleToAccountDisconnect}>Disconnect</Button>
              ) : (
                <Button onClick={openWalletModal}>Connect</Button>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          {isBridgeable ? (
            <div className="flex items-center gap-2">
              Maximum Bridgeable Amount:{' '}
              {isLoadingBridgeableAmount ? (
                <Skeleton className="w-16 h-6 inline-block" />
              ) : (
                Number.parseFloat(
                  formatUnits(bridgeableAmount?.amount ?? 0n, bridgeableAmount?.decimals ?? 0),
                ).toLocaleString('en-US')
              )}{' '}
              {toToken?.symbol} ({bridgeableAmount?.type === 'DEPOSIT_LIMIT' ? 'deposit' : 'withdraw'} limit)
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>Not bridgeable</span>
            </div>
          )}
          <Button variant="outline" onClick={openBridgeModal}>
            Bridge
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Bridge Order</DialogTitle>
            <DialogDescription>See details of bridge order.</DialogDescription>
          </DialogHeader>
          <div className="">
            <div className="flex flex-col">
              <div>
                inputToken: {order?.srcAsset} on {order?.srcChainId}
              </div>
              <div>
                outputToken: {order?.dstAsset} on {order?.dstChainId}
              </div>
              <div>inputAmount: {formatUnits(order?.amount ?? 0n, fromToken?.decimals ?? 0)}</div>
              <div>amount: {formatUnits(order?.amount ?? 0n, fromToken?.decimals ?? 0)}</div>
              <div>outputAmount: {formatUnits(order?.amount ?? 0n, fromToken?.decimals ?? 0)}</div>
              {order?.dstChainId === STELLAR_MAINNET_CHAIN_ID && !isTrustlineLoading && !hasSufficientTrustline && (
                <div className="text-red-500">Insufficient Stellar trustline (request trustline to proceed)</div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              className="w-full"
              type="button"
              variant="default"
              onClick={handleApprove}
              disabled={isAllowanceLoading || hasAllowed || isApproving}
            >
              {isApproving ? 'Approving...' : hasAllowed ? 'Approved' : 'Approve'}
            </Button>
            {isTrustlineLoading && order?.dstChainId === STELLAR_MAINNET_CHAIN_ID && <span>Checking trustline...</span>}
            {order?.dstChainId === STELLAR_MAINNET_CHAIN_ID && !isTrustlineLoading && !hasSufficientTrustline && (
              <Button className="w-full" onClick={() => handleRequestTrustline(order)} disabled={isTrustlineLoading}>
                Request Trustline
              </Button>
            )}

            {isWrongChain && (
              <Button className="w-full" type="button" variant="default" onClick={handleSwitchChain}>
                Switch Chain
              </Button>
            )}

            {!isWrongChain &&
              (order ? (
                <Button className="w-full" onClick={() => handleBridge(order)} disabled={!hasAllowed}>
                  <ArrowLeftRight className="mr-2 h-4 w-4" /> Bridge
                </Button>
              ) : (
                <span>Bridge Order undefined</span>
              ))}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
