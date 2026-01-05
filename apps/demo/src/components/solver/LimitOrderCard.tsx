import { SelectChain } from '@/components/solver/SelectChain';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { parseUnits, formatUnits } from 'viem';
import {
  type CreateLimitOrderParams,
  getSupportedSolverTokens,
  type SolverIntentQuoteRequest,
  StellarSpokeProvider,
} from '@sodax/sdk';
import BigNumber from 'bignumber.js';
import { ArrowDownUp, ArrowLeftRight } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import {
  useSpokeProvider,
  useSwapAllowance,
  useSwapApprove,
  useCreateLimitOrder,
  useStellarTrustlineCheck,
  useRequestTrustline,
  useSodaxContext,
} from '@sodax/dapp-kit';
import {
  getXChainType,
  useEvmSwitchChain,
  useXAccount,
  useXDisconnect,
  useWalletProvider,
} from '@sodax/wallet-sdk-react';
import {
  type ChainId,
  POLYGON_MAINNET_CHAIN_ID,
  type Token,
  type SpokeChainId,
  type ChainType,
  ICON_MAINNET_CHAIN_ID,
  STELLAR_MAINNET_CHAIN_ID,
} from '@sodax/types';
import { useAppStore } from '@/zustand/useAppStore';
import LimitOrderList from './LimitOrderList';
import { useQueryClient } from '@tanstack/react-query';

export default function LimitOrderCard() {
  const { sodax } = useSodaxContext();
  const [sourceChain, setSourceChain] = useState<SpokeChainId>(ICON_MAINNET_CHAIN_ID);
  const sourceAccount = useXAccount(sourceChain);
  const sourceWalletProvider = useWalletProvider(sourceChain);
  const sourceProvider = useSpokeProvider(sourceChain, sourceWalletProvider);
  const [destChain, setDestChain] = useState<SpokeChainId>(POLYGON_MAINNET_CHAIN_ID);
  const destAccount = useXAccount(destChain);
  const { openWalletModal } = useAppStore();
  const { mutateAsync: createLimitOrder } = useCreateLimitOrder(sourceProvider);
  const [sourceToken, setSourceToken] = useState<Token | undefined>(getSupportedSolverTokens(ICON_MAINNET_CHAIN_ID)[0]);
  const [destToken, setDestToken] = useState<Token | undefined>(getSupportedSolverTokens(POLYGON_MAINNET_CHAIN_ID)[0]);
  const [sourceAmount, setSourceAmount] = useState<string>('');
  const [limitOrderPayload, setLimitOrderPayload] = useState<CreateLimitOrderParams | undefined>(undefined);
  const { data: hasAllowed, isLoading: isAllowanceLoading } = useSwapAllowance(limitOrderPayload, sourceProvider);
  const { approve, isLoading: isApproving } = useSwapApprove(limitOrderPayload, sourceProvider);
  const supportedSpokeChains = sodax.config.getSupportedSpokeChains();
  const destProvider = useSpokeProvider(destChain, useWalletProvider(destChain));
  const {
    data: hasSufficientTrustline,
    isPending: isTrustlineLoading,
    error: trustlineError,
  } = useStellarTrustlineCheck(
    limitOrderPayload?.outputToken,
    BigInt(limitOrderPayload?.minOutputAmount ?? 0n),
    destProvider,
    limitOrderPayload?.dstChain,
  );
  if (trustlineError) {
    console.error('trustlineError', trustlineError);
  }
  const { requestTrustline } = useRequestTrustline(destToken?.address);
  const [open, setOpen] = useState(false);

  const onChangeDirection = () => {
    setSourceChain(destChain);
    setDestChain(sourceChain);
    setSourceToken(destToken);
    setDestToken(sourceToken);
  };

  const onSrcChainChange = (chainId: SpokeChainId) => {
    setSourceChain(chainId);
    setSourceToken(getSupportedSolverTokens(chainId)[0]);
  };

  const onDestChainChange = (chainId: SpokeChainId) => {
    setDestChain(chainId);
    setDestToken(getSupportedSolverTokens(chainId)[0]);
  };

  const [limitOrderPrice, setLimitOrderPrice] = useState<string>('0');

  const minOutputAmount = useMemo(() => {
    // Validate sourceAmount and limitOrderPrice
    if (!sourceAmount || Number.isNaN(Number(sourceAmount)) || Number(sourceAmount) <= 0) {
      return undefined;
    }

    if (!limitOrderPrice || Number.isNaN(Number(limitOrderPrice)) || Number(limitOrderPrice) <= 0) {
      return undefined;
    }

    return new BigNumber(sourceAmount)
      .multipliedBy(new BigNumber(limitOrderPrice))
      .multipliedBy(new BigNumber(10).pow(destToken?.decimals ?? 0));
  }, [sourceAmount, limitOrderPrice, destToken]);

  const onSourceAmountChange = (value: string) => {
    setSourceAmount(value);
  };

  const createLimitOrderPayload = async () => {
    if (!sourceToken || !destToken) {
      console.error('sourceToken or destToken undefined');
      return;
    }

    if (!minOutputAmount) {
      console.error('minOutputAmount undefined');
      return;
    }

    if (!sourceAccount.address) {
      console.error('sourceAccount.address undefined');
      return;
    }

    if (!destAccount.address) {
      console.error('destAccount.address undefined');
      return;
    }

    if (!sourceProvider) {
      console.error('sourceProvider undefined');
      return;
    }

    const limitOrderParams = {
      inputToken: sourceToken.address, // The address of the input token on hub chain
      outputToken: destToken.address, // The address of the output token on hub chain
      inputAmount: parseUnits(sourceAmount, sourceToken.decimals), // The amount of input tokens
      minOutputAmount: BigInt(minOutputAmount.toFixed(0)), // The minimum amount of output tokens to accept
      allowPartialFill: false, // Whether the intent can be partially filled
      srcChain: sourceChain, // Chain ID where input tokens originate
      dstChain: destChain, // Chain ID where output tokens should be delivered
      srcAddress: await sourceProvider.walletProvider.getWalletAddress(), // Source address (original address on spoke chain)
      dstAddress: destAccount.address, // Destination address (original address on spoke chain)
      solver: '0x0000000000000000000000000000000000000000', // Optional specific solver address (address(0) = any solver)
      data: '0x', // Additional arbitrary data
    } satisfies CreateLimitOrderParams;

    setLimitOrderPayload(limitOrderParams);
  };

  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(sourceChain as ChainId);

  const queryClient = useQueryClient();

  const handleCreateLimitOrder = async (limitOrderPayload: CreateLimitOrderParams) => {
    setOpen(false);
    const result = await createLimitOrder(limitOrderPayload);

    if (result.ok) {
      queryClient.invalidateQueries({ queryKey: ['backend', 'intent', 'user'] });
    } else {
      console.error('Error creating limit order:', result.error);
    }
  };

  const disconnect = useXDisconnect();
  const handleSourceAccountDisconnect = () => {
    disconnect(getXChainType(sourceChain) as ChainType);
  };

  const handleDestAccountDisconnect = () => {
    disconnect(getXChainType(destChain) as ChainType);
  };

  const handleApprove = async () => {
    if (!limitOrderPayload) {
      console.error('limitOrderPayload undefined');
      return;
    }

    await approve({ params: limitOrderPayload });
  };

  const handleRequestTrustline = async (limitOrderPayload: CreateLimitOrderParams | undefined) => {
    // if destination token is a Stellar asset, request trustline
    if (!limitOrderPayload) {
      console.error('limitOrderPayload undefined');
      return;
    }

    if (!destProvider || !(destProvider instanceof StellarSpokeProvider)) {
      console.error('destProvider undefined or not a StellarSpokeProvider');
      return;
    }

    await requestTrustline({
      token: limitOrderPayload.outputToken,
      amount: limitOrderPayload.minOutputAmount,
      spokeProvider: destProvider,
    });
  };

  return (
    <>
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Cross Chain Limit Order</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grow">
            <Label htmlFor="limitOrderPrice">
              Price: When 1 {sourceToken?.symbol} is worth {limitOrderPrice} {destToken?.symbol}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="limitOrderPrice"
                type="number"
                placeholder=""
                value={limitOrderPrice}
                onChange={e => setLimitOrderPrice(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <SelectChain
              chainList={supportedSpokeChains}
              value={sourceChain}
              setChain={onSrcChainChange}
              placeholder={'Select source chain'}
              id={'source-chain'}
              label={'From'}
            />
          </div>
          <div className="flex space-x-2">
            <div className="grow">
              <Input
                type="number"
                placeholder="0.0"
                value={sourceAmount}
                onChange={e => onSourceAmountChange(e.target.value)}
              />
            </div>
            <Select
              value={sourceToken?.symbol}
              onValueChange={v =>
                setSourceToken(getSupportedSolverTokens(sourceChain).find(token => token.symbol === v))
              }
            >
              <SelectTrigger className="w-[110px]">
                <SelectValue placeholder="Token" />
              </SelectTrigger>
              <SelectContent>
                {getSupportedSolverTokens(sourceChain).map(token => (
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
              setChain={onDestChainChange}
              placeholder={'Select destination chain'}
              id={'dest-chain'}
              label={'To'}
            />
          </div>
          <div className="flex space-x-2">
            <div className="grow">
              <Input
                type="number"
                placeholder="0.0"
                value={minOutputAmount ? formatUnits(BigInt(minOutputAmount.toFixed(0)), destToken?.decimals ?? 0) : ''}
                readOnly
              />
            </div>
            <Select
              value={destToken?.symbol}
              onValueChange={v => setDestToken(getSupportedSolverTokens(destChain).find(token => token.symbol === v))}
            >
              <SelectTrigger className="w-[110px]">
                <SelectValue placeholder="Token" />
              </SelectTrigger>
              <SelectContent>
                {getSupportedSolverTokens(destChain).map(token => (
                  <SelectItem key={token.address} value={token.symbol}>
                    {token.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grow">
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
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => createLimitOrderPayload()}>
                Create Limit Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Limit Order Intent</DialogTitle>
                <DialogDescription>See details of limit order intent.</DialogDescription>
              </DialogHeader>
              <div className="">
                <div className="flex flex-col">
                  <div>
                    inputToken: {limitOrderPayload?.inputToken} on {limitOrderPayload?.srcChain}
                  </div>
                  <div>
                    outputToken: {limitOrderPayload?.outputToken} on {limitOrderPayload?.dstChain}
                  </div>
                  <div>
                    inputAmount: {formatUnits(limitOrderPayload?.inputAmount ?? 0n, sourceToken?.decimals ?? 0)}
                  </div>
                  <div>allowPartialFill: {limitOrderPayload?.allowPartialFill.toString()}</div>
                  <div>srcAddress: {limitOrderPayload?.srcAddress}</div>
                  <div>dstAddress: {limitOrderPayload?.dstAddress}</div>
                  <div>solver: {limitOrderPayload?.solver}</div>
                  <div>data: {limitOrderPayload?.data}</div>
                  <div>amount: {formatUnits(limitOrderPayload?.inputAmount ?? 0n, sourceToken?.decimals ?? 0)}</div>
                  <div>
                    outputAmount: {formatUnits(limitOrderPayload?.minOutputAmount ?? 0n, destToken?.decimals ?? 0)}
                  </div>
                  {destChain === STELLAR_MAINNET_CHAIN_ID && !isTrustlineLoading && !hasSufficientTrustline && (
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

                {isWrongChain && (
                  <Button className="w-full" type="button" variant="default" onClick={handleSwitchChain}>
                    Switch Chain
                  </Button>
                )}

                {!isWrongChain &&
                  (limitOrderPayload ? (
                    <Button
                      className="w-full"
                      onClick={() => handleCreateLimitOrder(limitOrderPayload)}
                      disabled={!hasAllowed}
                    >
                      <ArrowLeftRight className="mr-2 h-4 w-4" /> Create Limit Order
                    </Button>
                  ) : (
                    <span>Limit Order Payload undefined</span>
                  ))}
                {isTrustlineLoading && destChain === STELLAR_MAINNET_CHAIN_ID && <span>Checking trustline...</span>}
                {destChain === STELLAR_MAINNET_CHAIN_ID && !isTrustlineLoading && !hasSufficientTrustline && (
                  <Button
                    className="w-full"
                    onClick={() => handleRequestTrustline(limitOrderPayload)}
                    disabled={isTrustlineLoading}
                  >
                    Request Trustline
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>

      <LimitOrderList spokeChainId={sourceChain} />
    </>
  );
}
