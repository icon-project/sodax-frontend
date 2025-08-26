// biome-ignore lint/style/useImportType:
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { SelectChain } from '@/components/solver/SelectChain';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  type BridgeParams,
  BridgeService,
  POLYGON_MAINNET_CHAIN_ID,
  spokeChainConfig,
  supportedSpokeChains,
  supportedTokensPerChain,
} from '@sodax/sdk';
import type { ChainId, ChainType, SpokeChainId, Token } from '@sodax/types';
import { ICON_MAINNET_CHAIN_ID } from '@sodax/sdk';
import { getXChainType, useEvmSwitchChain, useXAccount, useXDisconnect } from '@sodax/wallet-sdk';
import { useAppStore } from '@/zustand/useAppStore';
import { ArrowDownUp, ArrowLeftRight } from 'lucide-react';
import { normaliseTokenAmount, scaleTokenAmount } from '@/lib/utils';
import { useSpokeProvider, useBridgeApprove, useBridgeAllowance, useBridge } from '@sodax/dapp-kit';

export default function BridgePage() {
  const [sourceChain, setSourceChain] = useState<SpokeChainId>(ICON_MAINNET_CHAIN_ID);
  const [sourceAmount, setSourceAmount] = useState<string>('');
  const [sourceToken, setSourceToken] = useState<Token | undefined>(
    Object.values(spokeChainConfig[ICON_MAINNET_CHAIN_ID].supportedTokens)[0],
  );
  const sourceAccount = useXAccount(sourceChain);
  const { openWalletModal } = useAppStore();

  const [destChain, setDestChain] = useState<SpokeChainId>(POLYGON_MAINNET_CHAIN_ID);
  const [destToken, setDestToken] = useState<Token | undefined>(
    Object.values(spokeChainConfig[POLYGON_MAINNET_CHAIN_ID].supportedTokens)[0],
  );
  const destAccount = useXAccount(destChain);

  const handleSrcChainChange = (chainId: SpokeChainId) => {
    setSourceChain(chainId);
    setSourceToken(Object.values(spokeChainConfig[chainId].supportedTokens)[0]);
  };

  const handleDestChainChange = (chainId: SpokeChainId) => {
    setDestChain(chainId);
    setDestToken(Object.values(spokeChainConfig[chainId].supportedTokens)[0]);
  };

  const handleSourceAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSourceAmount(e.target.value);
  };

  const disconnect = useXDisconnect();
  const handleSourceAccountDisconnect = () => {
    disconnect(getXChainType(sourceChain) as ChainType);
  };

  const handleDestAccountDisconnect = () => {
    disconnect(getXChainType(destChain) as ChainType);
  };

  const [open, setOpen] = useState(false);

  const openBridgeModal = () => {
    if (!sourceToken || !destToken || !sourceAccount.address || !destAccount.address) {
      return;
    }

    setOrder({
      srcChainId: sourceChain,
      srcAsset: sourceToken?.address,
      amount: scaleTokenAmount(sourceAmount, sourceToken?.decimals ?? 0),
      dstChainId: destChain,
      dstAsset: destToken?.address,
      recipient: destAccount.address,
    });
    setOpen(true);
  };

  const [order, setOrder] = useState<BridgeParams | undefined>(undefined);

  const sourceProvider = useSpokeProvider(sourceChain);

  const { approve, isLoading: isApproving } = useBridgeApprove(sourceProvider);

  const handleApprove = async () => {
    if (!order) {
      return;
    }
    await approve(order);
  };

  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(sourceChain as ChainId);
  const { data: hasAllowed, isLoading: isAllowanceLoading } = useBridgeAllowance(order, sourceProvider);
  const { mutateAsync: bridge, isPending: isBridging } = useBridge(sourceProvider);

  const handleBridge = async (order: BridgeParams) => {
    setOpen(false);
    await bridge(order);
  };

  const onChangeDirection = () => {
    setSourceChain(destChain);
    setDestChain(sourceChain);
    setSourceToken(destToken);
    setDestToken(sourceToken);
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
              value={sourceChain}
              setChain={handleSrcChainChange}
              placeholder={'Select source chain'}
              id={'source-chain'}
              label={'From'}
            />
          </div>
          <div className="flex space-x-2">
            <div className="flex-grow">
              <Input type="number" placeholder="0.0" value={sourceAmount} onChange={handleSourceAmountChange} />
            </div>
            <Select
              value={sourceToken?.symbol}
              onValueChange={v =>
                setSourceToken(supportedTokensPerChain.get(sourceChain)?.find(token => token.symbol === v))
              }
            >
              <SelectTrigger className="w-[110px]">
                <SelectValue placeholder="Token" />
              </SelectTrigger>
              <SelectContent>
                {supportedTokensPerChain.get(sourceChain)?.map(token => (
                  <SelectItem key={token.address} value={token.symbol}>
                    {token.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-grow">
            <Label htmlFor="fromAddress">Source address</Label>
            <div className="flex items-center gap-2">
              <Input id="fromAddress" type="text" placeholder="" value={sourceAccount.address || ''} disabled={true} />
              {sourceAccount.address ? (
                <Button onClick={handleSourceAccountDisconnect}>Disconnect</Button>
              ) : (
                <Button onClick={openWalletModal}>Connect</Button>
              )}
            </div>
          </div>
          <div className="flex justify-center">
            <Button variant="outline" size="icon" onClick={() => onChangeDirection()}>
              <ArrowDownUp className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            <SelectChain
              chainList={supportedSpokeChains}
              value={destChain}
              setChain={handleDestChainChange}
              placeholder={'Select destination chain'}
              id={'dest-chain'}
              label={'To'}
            />
          </div>
          <div className="flex space-x-2">
            <div className="flex-grow">
              <Input
                type="number"
                placeholder="0.0"
                value={sourceAmount}
                // value={quote ? normaliseTokenAmount(quote?.quoted_amount, destToken?.decimals ?? 0) : ''}
                readOnly
              />
            </div>
            <Select
              value={destToken?.symbol}
              onValueChange={v =>
                setDestToken(supportedTokensPerChain.get(destChain)?.find(token => token.symbol === v))
              }
            >
              <SelectTrigger className="w-[110px]">
                <SelectValue placeholder="Token" />
              </SelectTrigger>
              <SelectContent>
                {supportedTokensPerChain.get(destChain)?.map(token => (
                  <SelectItem key={token.address} value={token.symbol}>
                    {token.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-grow">
            <Label htmlFor="toAddress">Destination address</Label>
            <div className="flex items-center gap-2">
              <Input id="toAddress" type="text" value={destAccount.address || ''} placeholder="" disabled={true} />
              {destAccount.address ? (
                <Button onClick={handleDestAccountDisconnect}>Disconnect</Button>
              ) : (
                <Button onClick={openWalletModal}>Connect</Button>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          {sourceToken &&
          destToken &&
          BridgeService.isBridgeable({ ...sourceToken, xChainId: sourceChain }, { ...destToken, xChainId: destChain })
            ? 'Bridgeable'
            : 'Not bridgeable'}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={openBridgeModal}>
                Bridge
              </Button>
            </DialogTrigger>
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
                  <div>inputAmount: {normaliseTokenAmount(order?.amount ?? 0n, sourceToken?.decimals ?? 0)}</div>
                  <div>amount: {normaliseTokenAmount(order?.amount ?? 0n, sourceToken?.decimals ?? 0)}</div>
                  <div>outputAmount: {normaliseTokenAmount(order?.amount ?? 0n, destToken?.decimals ?? 0)}</div>
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
        </CardFooter>
      </Card>
    </div>
  );
}
