import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChainSelector } from '@/components/shared/ChainSelector';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetBridgeableTokens, useGetBridgeableAmount, useSodaxContext, loadRadfiSession } from '@sodax/dapp-kit';
import { useWalletProvider, useXAccount, useXDisconnect, getXChainType, useXConnection, useXService } from '@sodax/wallet-sdk-react';
import { ChainKeys, type SpokeChainKey, type XToken } from '@sodax/types';
import type { CreateBridgeIntentParams } from '@sodax/sdk';
import { ArrowDownUp } from 'lucide-react';
import { formatUnits, parseUnits } from 'viem';
import { useAppStore } from '@/zustand/useAppStore';
import { BridgeDialog } from './BridgeDialog';

export function BridgeManager() {
  const { sodax } = useSodaxContext();
  const { openWalletModal } = useAppStore();

  const supportedSpokeChains = useMemo(() => sodax.config.getSupportedSpokeChains(), [sodax]);
  const supportedTokensPerChain = useMemo(() => sodax.config.getSupportedTokensPerChain(), [sodax]);

  const [fromChainKey, setFromChainKey] = useState<SpokeChainKey>(ChainKeys.BASE_MAINNET);
  const [toChainKey, setToChainKey] = useState<SpokeChainKey>(ChainKeys.POLYGON_MAINNET);

  const fromTokens = supportedTokensPerChain.get(fromChainKey) ?? [];
  const [fromToken, setFromToken] = useState<XToken | undefined>(fromTokens[0]);
  const [toToken, setToToken] = useState<XToken | undefined>(undefined);
  const [fromAmount, setFromAmount] = useState('');

  const fromAccount = useXAccount(fromChainKey);
  const toAccount = useXAccount(toChainKey);
  const disconnect = useXDisconnect();

  const walletProvider = useWalletProvider(fromChainKey);
  const fromChainType = getXChainType(fromChainKey);
  const toChainType = getXChainType(toChainKey);

  const fromBtcConnection = useXConnection(fromChainType);
  const fromBtcService = useXService(fromChainType);
  const fromBtcConnector =
    fromChainType === 'BITCOIN' && fromBtcConnection?.xConnectorId && fromBtcService
      ? fromBtcService.getXConnectorById(fromBtcConnection.xConnectorId)
      : undefined;

  const toBtcConnection = useXConnection(toChainType);
  const toBtcService = useXService(toChainType);
  const toBtcConnector =
    toChainType === 'BITCOIN' && toBtcConnection?.xConnectorId && toBtcService
      ? toBtcService.getXConnectorById(toBtcConnection.xConnectorId)
      : undefined;

  const { data: bridgeableTokens, isLoading: isLoadingBridgeableTokens } = useGetBridgeableTokens(
    fromToken?.chainKey,
    toChainKey,
    fromToken?.address,
  );

  useEffect(() => {
    if (bridgeableTokens && bridgeableTokens.length > 0) {
      setToToken(prev =>
        prev && bridgeableTokens.some(t => t.address === prev.address) ? prev : bridgeableTokens[0],
      );
    } else {
      setToToken(undefined);
    }
  }, [bridgeableTokens]);

  useEffect(() => {
    const tokens = supportedTokensPerChain.get(fromChainKey) ?? [];
    setFromToken(tokens[0]);
  }, [fromChainKey, supportedTokensPerChain]);

  const { data: bridgeableAmount, isLoading: isLoadingBridgeableAmount } = useGetBridgeableAmount(fromToken, toToken);

  const isBridgeable = useMemo(() => {
    if (!fromToken || !toToken) return false;
    return sodax.bridge.isBridgeable({ from: fromToken, to: toToken });
  }, [fromToken, toToken, sodax]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [order, setOrder] = useState<CreateBridgeIntentParams | undefined>(undefined);

  const handleOpenDialog = () => {
    if (!fromToken || !toToken || !fromAccount.address || !toAccount.address) return;

    const recipient =
      toChainKey === ChainKeys.BITCOIN_MAINNET && toAccount.address
        ? loadRadfiSession(toAccount.address)?.tradingAddress ?? toAccount.address
        : toAccount.address;

    setOrder({
      srcChainKey: fromChainKey,
      srcToken: fromToken.address,
      srcAddress: fromAccount.address,
      amount: parseUnits(fromAmount || '0', fromToken.decimals),
      dstChainKey: toChainKey,
      dstToken: toToken.address,
      recipient,
    });
    setDialogOpen(true);
  };

  const handleSwitch = () => {
    const prevFromChainKey = fromChainKey;
    const prevFromToken = fromToken;
    setFromChainKey(toChainKey);
    setToChainKey(prevFromChainKey);
    setFromToken(toToken);
    setToToken(prevFromToken);
  };

  return (
    <>
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Cross-Chain Transfer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>From</Label>
            <ChainSelector
              selectedChainId={fromChainKey}
              selectChainId={setFromChainKey}
              allowedChains={supportedSpokeChains}
            />
          </div>

          <div className="flex space-x-2">
            <div className="grow">
              <Input
                type="number"
                placeholder="0.0"
                value={fromAmount}
                onChange={e => setFromAmount(e.target.value)}
              />
            </div>
            <Select
              value={fromToken?.symbol}
              onValueChange={symbol => {
                const selected = fromTokens.find(t => t.symbol === symbol);
                if (selected) setFromToken(selected);
              }}
            >
              <SelectTrigger className="w-[110px]">
                <SelectValue placeholder="Token" />
              </SelectTrigger>
              <SelectContent>
                {fromTokens.map(t => (
                  <SelectItem key={t.address} value={t.symbol}>
                    {t.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grow">
            <Label htmlFor="fromAddress">Source address</Label>
            <div className="flex items-center gap-2">
              <Input id="fromAddress" type="text" value={fromAccount.address ?? ''} disabled />
              {fromAccount.address ? (
                <Button onClick={() => { const type = getXChainType(fromChainKey); if (type) disconnect(type); }}>Disconnect</Button>
              ) : (
                <Button onClick={openWalletModal}>Connect</Button>
              )}
            </div>
          </div>

          <div className="flex justify-center">
            <Button variant="outline" size="icon" onClick={handleSwitch}>
              <ArrowDownUp className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Label>To</Label>
            <ChainSelector
              selectedChainId={toChainKey}
              selectChainId={setToChainKey}
              allowedChains={supportedSpokeChains}
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
                value={toToken?.symbol}
                onValueChange={symbol => {
                  const selected = bridgeableTokens?.find(t => t.symbol === symbol);
                  if (selected) setToToken(selected);
                }}
              >
                <SelectTrigger className="w-[110px]">
                  <SelectValue placeholder="Token" />
                </SelectTrigger>
                <SelectContent>
                  {bridgeableTokens?.map(t => (
                    <SelectItem key={`${t.address}-${t.symbol}`} value={t.symbol}>
                      {t.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grow">
            <Label htmlFor="toAddress">Destination address</Label>
            <div className="flex items-center gap-2">
              <Input
                id="toAddress"
                type="text"
                value={
                  toChainKey === ChainKeys.BITCOIN_MAINNET && toAccount.address
                    ? (loadRadfiSession(toAccount.address)?.tradingAddress ?? toAccount.address)
                    : (toAccount.address ?? '')
                }
                disabled
              />
              {toAccount.address ? (
                <Button onClick={() => { const type = getXChainType(toChainKey); if (type) disconnect(type); }}>Disconnect</Button>
              ) : (
                <Button onClick={openWalletModal}>Connect</Button>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          {isBridgeable ? (
            <div className="flex items-center gap-2 text-sm">
              Maximum bridgeable:{' '}
              {isLoadingBridgeableAmount ? (
                <Skeleton className="w-16 h-5 inline-block" />
              ) : (
                Number.parseFloat(
                  formatUnits(bridgeableAmount?.amount ?? 0n, bridgeableAmount?.decimals ?? 0),
                ).toLocaleString('en-US')
              )}{' '}
              {toToken?.symbol} ({bridgeableAmount?.type === 'DEPOSIT_LIMIT' ? 'deposit' : 'withdraw'} limit)
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Route not available</div>
          )}
          <Button
            className="w-full"
            onClick={handleOpenDialog}
            disabled={!fromToken || !toToken || !fromAccount.address || !toAccount.address || !fromAmount}
          >
            Bridge
          </Button>
        </CardFooter>
      </Card>

      {order && walletProvider && (
        <BridgeDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          order={order}
          fromToken={fromToken}
          toToken={toToken}
          walletProvider={walletProvider}
          fromChainType={fromChainType}
          toChainKey={toChainKey}
          fromBtcConnector={fromBtcConnector ? { name: fromBtcConnector.name, icon: fromBtcConnector.icon ?? '' } : undefined}
          toBtcConnector={toBtcConnector ? { name: toBtcConnector.name, icon: toBtcConnector.icon ?? '' } : undefined}
        />
      )}
    </>
  );
}
