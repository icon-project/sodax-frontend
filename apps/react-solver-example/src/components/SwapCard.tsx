import { SelectChain } from '@/components/SelectChain';
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
import { sodax, supportedTokensPerChain } from '@/constants';
import { useSpokeProvider } from '@/hooks/useSpokeProvider';
import { calculateExchangeRate, normaliseTokenAmount, scaleTokenAmount } from '@/lib/utils';
import {
  ARBITRUM_MAINNET_CHAIN_ID,
  type Address,
  type CreateIntentParams,
  type EvmChainId,
  type Hex,
  type IntentQuoteRequest,
  type IntentQuoteResponse,
  POLYGON_MAINNET_CHAIN_ID,
  type SpokeChainId,
  type SpokeProvider,
  type Token,
  getEvmViemChain,
  spokeChainConfig,
  supportedSpokeChains,
} from '@new-world/sdk';
import BigNumber from 'bignumber.js';
import { debounce } from 'lodash';
import { ArrowDownUp, ArrowLeftRight } from 'lucide-react';
import React, { type SetStateAction, useState } from 'react';
import { useSwitchChain } from 'wagmi';
import { switchChain } from 'wagmi/actions';

export default function SwapCard({
  setIntentTxHash,
  address,
}: {
  setIntentTxHash: (value: SetStateAction<Hex | undefined>) => void;
  address: Address;
}) {
  const { switchChain } = useSwitchChain();
  const [sourceChain, setSourceChain] = useState<SpokeChainId>(ARBITRUM_MAINNET_CHAIN_ID);
  const [destChain, setDestChain] = useState<SpokeChainId>(POLYGON_MAINNET_CHAIN_ID);
  const sourceChainSpokeProvider = useSpokeProvider(sourceChain, address);
  console.log('sourceChainSpokeProvider:', sourceChainSpokeProvider);
  const [sourceToken, setSourceToken] = useState<Token | undefined>(
    spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens[0],
  );
  const [destToken, setDestToken] = useState<Token | undefined>(
    spokeChainConfig[POLYGON_MAINNET_CHAIN_ID].supportedTokens[0],
  );
  const [sourceAmount, setSourceAmount] = useState<string>('');
  const [quote, setQuote] = useState<IntentQuoteResponse | undefined>(undefined);
  const [exchangeRate, setExchangeRate] = useState<BigNumber | string>('');
  const [intentOrderPayload, setIntentOrderPayload] = useState<CreateIntentParams | undefined>(undefined);
  const [open, setOpen] = useState(false);

  const onChangeDirection = () => {
    setSourceChain(destChain);
    setDestChain(sourceChain);
    setSourceToken(destToken);
    setDestToken(sourceToken);
  };

  const onSrcChainChange = (chainId: SpokeChainId) => {
    console.log('onSrcChainChange chainId:', chainId);
    switchChain({ chainId: getEvmViemChain(chainId as EvmChainId).id });
    setSourceChain(chainId);
    setSourceToken(spokeChainConfig[chainId].supportedTokens[0]);
  };

  const getQuote = async (value: string) => {
    if (Number(value) <= 0) {
      return;
    }

    console.log('getQuote:', value);

    if (!sourceToken || !destToken) {
      console.error('sourceToken or destToken undefined');
      return;
    }

    console.log('sourceChain:', sourceChain);
    console.log('destChain:', destChain);
    console.log('sourceToken:', sourceToken);
    console.log('destToken:', destToken);

    const payload = {
      token_src: sourceToken.address,
      token_src_blockchain_id: sourceChain,
      token_dst: destToken.address,
      token_dst_blockchain_id: destChain,
      amount: scaleTokenAmount(value, sourceToken.decimals),
      quote_type: 'exact_input',
    } satisfies IntentQuoteRequest;

    console.log('payload:', payload);

    const quoteResult = await sodax.solver.getQuote(payload);

    if (quoteResult.ok) {
      setExchangeRate(
        calculateExchangeRate(
          new BigNumber(value),
          new BigNumber(normaliseTokenAmount(quoteResult.value.quoted_amount, destToken.decimals)),
        ),
      );
      setQuote(quoteResult.value);
    } else {
      console.error(quoteResult.error.detail.message);
    }
  };

  const onSourceAmountChange = (value: string) => {
    console.log('onSourceAmountChange:', value);
    setSourceAmount(value);
    debounce(() => getQuote(value), 2000)();
  };

  function getSourceChainSpokeProvider(): SpokeProvider {
    if (sourceChainSpokeProvider) {
      return sourceChainSpokeProvider;
    }

    throw new Error('Source chain spoke provider not found');
  }

  const createIntentOrderPayload = () => {
    if (!quote) {
      console.error('Quote undefined');
      return;
    }

    if (!sourceToken || !destToken) {
      console.error('sourceToken or destToken undefined');
      return;
    }

    const createIntentParams = {
      inputToken: sourceToken.address, // The address of the input token on hub chain
      outputToken: destToken.address, // The address of the output token on hub chain
      inputAmount: scaleTokenAmount(sourceAmount, sourceToken.decimals), // The amount of input tokens
      minOutputAmount: quote.quoted_amount, // The minimum amount of output tokens to accept
      deadline: BigInt(0), // Optional timestamp after which intent expires (0 = no deadline)
      allowPartialFill: false, // Whether the intent can be partially filled
      srcChain: sourceChain, // Chain ID where input tokens originate
      dstChain: destChain, // Chain ID where output tokens should be delivered
      srcAddress: getSourceChainSpokeProvider().walletProvider.getWalletAddressBytes(), // Source address in bytes (original address on spoke chain)
      dstAddress: getSourceChainSpokeProvider().walletProvider.getWalletAddressBytes(), // Destination address in bytes (original address on spoke chain)
      solver: '0x0000000000000000000000000000000000000000', // Optional specific solver address (address(0) = any solver)
      data: '0x', // Additional arbitrary data
    } satisfies CreateIntentParams;

    setIntentOrderPayload(createIntentParams);
  };

  const createIntentOrder = async (createIntentParams: CreateIntentParams) => {
    if (!quote) {
      console.error('Quote undefined');
      return;
    }

    if (!sourceToken || !destToken) {
      console.error('Source token or destination token undefined');
      return;
    }

    // create on-chain intent, post to Solver API and Submit to Relay API
    // NOTE: you should primarily use this one to create intent
    // const rawResult = await solverService.createIntent(createIntentParams, sourceChainProvider, hubProvider, true);

    // console.log("rawResult", rawResult)

    const result = await sodax.solver.createAndSubmitIntent(createIntentParams, getSourceChainSpokeProvider());

    console.log('result:', result);

    if (result.ok) {
      const [response, intent] = result.value;
      console.log('response:', response);
      console.log('intent:', intent);

      setIntentTxHash(response.intent_hash);
    } else {
      console.error('Error creating and submitting intent:', result.error);
    }
  };

  const handleSwap = async (intentOrderPayload: CreateIntentParams) => {
    setOpen(false);
    // Implement swap logic here
    await createIntentOrder(intentOrderPayload);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
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
          <Input
            id="fromAddress"
            type="text"
            placeholder="0.0"
            value={getSourceChainSpokeProvider().walletProvider.getWalletAddress()}
            disabled={true}
          />
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
            setChain={setDestChain}
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
          <Input
            id="toAddress"
            type="text"
            value={getSourceChainSpokeProvider().walletProvider.getWalletAddress()}
            disabled={true}
          />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="w-full text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Exchange Rate</span>
            <span>
              1 {sourceToken?.symbol} ≈ {exchangeRate.toString()} {destToken?.symbol}
            </span>
          </div>
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
                <div>inputToken: {intentOrderPayload?.inputToken}</div>
                <div>outputToken: {intentOrderPayload?.outputToken}</div>
                <div>inputAmount: {intentOrderPayload?.inputAmount.toString()}</div>
                <div>minOutputAmount: {intentOrderPayload?.minOutputAmount.toString()}</div>
                <div>deadline: {intentOrderPayload?.deadline.toString()}</div>
                <div>allowPartialFill: {intentOrderPayload?.allowPartialFill.toString()}</div>
                <div>srcChain: {intentOrderPayload?.srcChain.toString()}</div>
                <div>dstChain: {intentOrderPayload?.dstChain.toString()}</div>
                <div>srcAddress: {intentOrderPayload?.srcAddress}</div>
                <div>dstAddress: {intentOrderPayload?.dstAddress}</div>
                <div>solver: {intentOrderPayload?.solver}</div>
                <div>data: {intentOrderPayload?.data}</div>
                <div>
                  amount: {intentOrderPayload?.inputAmount.toString()}
                  (normalised:{normaliseTokenAmount(intentOrderPayload?.inputAmount ?? 0n, sourceToken?.decimals ?? 0)})
                </div>
                <div>toToken: {intentOrderPayload?.outputToken}</div>
                <div>
                  toAmount: {intentOrderPayload?.minOutputAmount.toString()}
                  (normalised:
                  {normaliseTokenAmount(intentOrderPayload?.minOutputAmount ?? 0n, destToken?.decimals ?? 0)})
                </div>
              </div>
            </div>
            <DialogFooter>
              {intentOrderPayload ? (
                <Button className="w-full" onClick={() => handleSwap(intentOrderPayload)}>
                  <ArrowLeftRight className="mr-2 h-4 w-4" /> Swap
                </Button>
              ) : (
                <span>Intent Order undefined</span>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
