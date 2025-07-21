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
import { calculateExchangeRate, normaliseTokenAmount, scaleTokenAmount } from '@/lib/utils';
import {
  type CreateIntentParams,
  encodeAddress,
  type Hex,
  type Intent,
  type SolverIntentQuoteRequest,
  type PacketData,
  spokeChainConfig,
  supportedSpokeChains,
  supportedTokensPerChain,
} from '@sodax/sdk';
import BigNumber from 'bignumber.js';
import { ArrowDownUp, ArrowLeftRight } from 'lucide-react';
import React, { type SetStateAction, useMemo, useState } from 'react';
import { useQuote, useCreateIntentOrder, useSpokeProvider, useSwapAllowance, useSwapApprove } from '@sodax/dapp-kit';
import { getXChainType, useEvmSwitchChain, useXAccount, useXDisconnect } from '@sodax/wallet-sdk';
import {
  type ChainId,
  POLYGON_MAINNET_CHAIN_ID,
  type Token,
  type SpokeChainId,
  type ChainType,
  ICON_MAINNET_CHAIN_ID,
} from '@sodax/types';
import { useAppStore } from '@/zustand/useAppStore';

export default function SwapCard({
  setOrders,
}: {
  setOrders: (value: SetStateAction<{ intentHash: Hex; intent: Intent; packet: PacketData }[]>) => void;
}) {
  const [sourceChain, setSourceChain] = useState<SpokeChainId>(ICON_MAINNET_CHAIN_ID);
  const sourceAccount = useXAccount(sourceChain);
  const sourceProvider = useSpokeProvider(sourceChain);
  const [destChain, setDestChain] = useState<SpokeChainId>(POLYGON_MAINNET_CHAIN_ID);
  const destAccount = useXAccount(destChain);
  const { openWalletModal } = useAppStore();
  const { mutateAsync: createIntentOrder } = useCreateIntentOrder(sourceProvider);
  const [sourceToken, setSourceToken] = useState<Token | undefined>(
    Object.values(spokeChainConfig[ICON_MAINNET_CHAIN_ID].supportedTokens)[0],
  );
  const [destToken, setDestToken] = useState<Token | undefined>(
    Object.values(spokeChainConfig[POLYGON_MAINNET_CHAIN_ID].supportedTokens)[0],
  );
  const [sourceAmount, setSourceAmount] = useState<string>('');
  const [intentOrderPayload, setIntentOrderPayload] = useState<CreateIntentParams | undefined>(undefined);
  const { data: hasAllowed, isLoading: isAllowanceLoading } = useSwapAllowance(intentOrderPayload, sourceProvider);
  const { approve, isLoading: isApproving } = useSwapApprove(sourceToken, sourceProvider);
  const [open, setOpen] = useState(false);
  const [slippage, setSlippage] = useState<string>('0.5');
  const onChangeDirection = () => {
    setSourceChain(destChain);
    setDestChain(sourceChain);
    setSourceToken(destToken);
    setDestToken(sourceToken);
  };

  const onSrcChainChange = (chainId: SpokeChainId) => {
    setSourceChain(chainId);
    setSourceToken(Object.values(spokeChainConfig[chainId].supportedTokens)[0]);
  };

  const onDestChainChange = (chainId: SpokeChainId) => {
    setDestChain(chainId);
    setDestToken(Object.values(spokeChainConfig[chainId].supportedTokens)[0]);
  };

  const payload = useMemo(() => {
    if (!sourceToken || !destToken) {
      return undefined;
    }

    if (Number(sourceAmount) <= 0) {
      return undefined;
    }

    return {
      token_src: sourceToken.address,
      token_src_blockchain_id: sourceChain,
      token_dst: destToken.address,
      token_dst_blockchain_id: destChain,
      amount: scaleTokenAmount(sourceAmount, sourceToken.decimals),
      quote_type: 'exact_input',
    } satisfies SolverIntentQuoteRequest;
  }, [sourceToken, destToken, sourceChain, destChain, sourceAmount]);

  const quoteQuery = useQuote(payload);

  const quote = useMemo(() => {
    if (quoteQuery.data?.ok) {
      return quoteQuery.data.value;
    }

    return undefined;
  }, [quoteQuery]);

  const exchangeRate = useMemo(() => {
    return calculateExchangeRate(
      new BigNumber(sourceAmount),
      new BigNumber(normaliseTokenAmount(quote?.quoted_amount ?? 0n, destToken?.decimals ?? 0)),
    );
  }, [quote, sourceAmount, destToken]);

  const minOutputAmount = useMemo(() => {
    return quote?.quoted_amount
      ? new BigNumber(quote?.quoted_amount).multipliedBy(new BigNumber(100).minus(new BigNumber(slippage))).div(100)
      : undefined;
  }, [quote, slippage]);

  const onSourceAmountChange = (value: string) => {
    setSourceAmount(value);
  };

  const createIntentOrderPayload = async () => {
    if (!quote) {
      console.error('Quote undefined');
      return;
    }

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
      console.error('sourceProvider or destProvider undefined');
      return;
    }

    const createIntentParams = {
      inputToken: sourceToken.address, // The address of the input token on hub chain
      outputToken: destToken.address, // The address of the output token on hub chain
      inputAmount: scaleTokenAmount(sourceAmount, sourceToken.decimals), // The amount of input tokens
      minOutputAmount: BigInt(minOutputAmount.toFixed(0)), // The minimum amount of output tokens to accept
      deadline: BigInt(0), // Optional timestamp after which intent expires (0 = no deadline)
      allowPartialFill: false, // Whether the intent can be partially filled
      srcChain: sourceChain, // Chain ID where input tokens originate
      dstChain: destChain, // Chain ID where output tokens should be delivered
      srcAddress: await sourceProvider.walletProvider.getWalletAddress(), // Source address (original address on spoke chain)
      dstAddress: destAccount.address, // Destination address (original address on spoke chain)
      solver: '0x0000000000000000000000000000000000000000', // Optional specific solver address (address(0) = any solver)
      data: '0x', // Additional arbitrary data
    } satisfies CreateIntentParams;

    setIntentOrderPayload(createIntentParams);
  };

  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(sourceChain as ChainId);

  const handleSwap = async (intentOrderPayload: CreateIntentParams) => {
    setOpen(false);
    const result = await createIntentOrder(intentOrderPayload);

    if (result.ok) {
      const [response, intent, packet] = result.value;

      setOrders(prev => [...prev, { intentHash: response.intent_hash, intent, packet }]);
    } else {
      console.error('Error creating and submitting intent:', result.error);
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
    await approve({ amount: sourceAmount });
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Cross-Chain Swap</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
          <div className="flex-grow">
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
            setChain={onDestChainChange}
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
              value={quote ? normaliseTokenAmount(quote?.quoted_amount, destToken?.decimals ?? 0) : ''}
              readOnly
            />
          </div>
          <Select
            value={destToken?.symbol}
            onValueChange={v => setDestToken(supportedTokensPerChain.get(destChain)?.find(token => token.symbol === v))}
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
        <div className="w-full text-sm text-muted-foreground">
          <div className="flex justify-between items-center">
            <span>Exchange Rate</span>
            <span>
              1 {sourceToken?.symbol} ≈ {exchangeRate.toString()} {destToken?.symbol}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Slippage:</span>
            <div className="flex items-center gap-2">
              <Input type="number" value={slippage} onChange={e => setSlippage(e.target.value)} />
              <span>%</span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span>Minimum Output Amount</span>
            <span>
              {minOutputAmount ? normaliseTokenAmount(minOutputAmount.toString(), destToken?.decimals ?? 0) : '0'}{' '}
              {destToken?.symbol}
            </span>
          </div>
        </div>

        <div className="">
          {quoteQuery.data?.ok === false && <div className="text-red-500">{quoteQuery.data.error.detail.message}</div>}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" onClick={() => createIntentOrderPayload()}>
              Swap
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Intent Swap Order</DialogTitle>
              <DialogDescription>See details of intent order.</DialogDescription>
            </DialogHeader>
            <div className="">
              <div className="flex flex-col">
                <div>
                  inputToken: {intentOrderPayload?.inputToken} on {intentOrderPayload?.srcChain}
                </div>
                <div>
                  outputToken: {intentOrderPayload?.outputToken} on {intentOrderPayload?.dstChain}
                </div>
                <div>
                  inputAmount: {normaliseTokenAmount(intentOrderPayload?.inputAmount ?? 0n, sourceToken?.decimals ?? 0)}
                </div>
                <div>deadline: {intentOrderPayload?.deadline.toString()}</div>
                <div>allowPartialFill: {intentOrderPayload?.allowPartialFill.toString()}</div>
                <div>srcAddress: {intentOrderPayload?.srcAddress}</div>
                <div>dstAddress: {intentOrderPayload?.dstAddress}</div>
                <div>solver: {intentOrderPayload?.solver}</div>
                <div>data: {intentOrderPayload?.data}</div>
                <div>
                  amount: {normaliseTokenAmount(intentOrderPayload?.inputAmount ?? 0n, sourceToken?.decimals ?? 0)}
                </div>
                <div>
                  outputAmount:{' '}
                  {normaliseTokenAmount(intentOrderPayload?.minOutputAmount ?? 0n, destToken?.decimals ?? 0)}
                </div>
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
                (intentOrderPayload ? (
                  <Button className="w-full" onClick={() => handleSwap(intentOrderPayload)} disabled={!hasAllowed}>
                    <ArrowLeftRight className="mr-2 h-4 w-4" /> Swap
                  </Button>
                ) : (
                  <span>Intent Order undefined</span>
                ))}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
