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
import { calculateExchangeRate } from '@/lib/utils';
import { parseUnits, formatUnits } from 'viem';
import {
  type CreateIntentParams,
  getSupportedSolverTokens,
  type SolverIntentQuoteRequest,
} from '@sodax/sdk';
import type { SubmitSwapTxRequest, SwapIntentData } from '@sodax/types';
import BigNumber from 'bignumber.js';
import { ArrowDownUp, ArrowLeftRight } from 'lucide-react';
import React, { type SetStateAction, useMemo, useState } from 'react';
import {
  useQuote,
  useSwapAllowance,
  useSwapApprove,
  useSwap,
  useStellarTrustlineCheck,
  useRequestTrustline,
  useSodaxContext,
  loadRadfiSession,
  useTradingWalletBalance,
  useBackendSubmitSwapTx,
  useXBalances,
} from '@sodax/dapp-kit';
import {
  getXChainType,
  useEvmSwitchChain,
  useXAccount,
  useXDisconnect,
  useWalletProvider,
  useXConnection,
  useXService,
} from '@sodax/wallet-sdk-react';
import {
  type SpokeChainKey,
  type XToken,
  type ChainType,
  type IBitcoinWalletProvider,
  type IStellarWalletProvider,
  type StellarChainKey,
  ChainKeys,
} from '@sodax/types';
import type { Order } from '@/components/solver/OrderStatus';
import { useAppStore } from '@/zustand/useAppStore';
import { BitcoinSetupPanel } from '@/components/bitcoin/BitcoinSetupPanel';

const SUBMIT_TX_API_CONFIG = { baseURL: 'https://canary-api.sodax.com/v1/bes' } as const;

export default function SwapCard({
  setOrders,
}: {
  setOrders: (value: SetStateAction<Order[]>) => void;
}) {
  const { sodax } = useSodaxContext();
  //chain and account states
  const [sourceChain, setSourceChain] = useState<SpokeChainKey>(ChainKeys.ICON_MAINNET);
  const sourceAccount = useXAccount(sourceChain);
  const sourceWalletProvider = useWalletProvider(sourceChain);
  const [destChain, setDestChain] = useState<SpokeChainKey>(ChainKeys.POLYGON_MAINNET);
  const destAccount = useXAccount(destChain);
  const destWalletProvider = useWalletProvider(destChain);
  const { openWalletModal } = useAppStore();
  const { mutateAsync: swap } = useSwap(sourceChain, sourceWalletProvider);
  const [sourceToken, setSourceToken] = useState<XToken | undefined>(getSupportedSolverTokens(ChainKeys.ICON_MAINNET)[0]);
  const [destToken, setDestToken] = useState<XToken | undefined>(getSupportedSolverTokens(ChainKeys.POLYGON_MAINNET)[0]);
  const [sourceAmount, setSourceAmount] = useState<string>('');
  const [intentOrderPayload, setIntentOrderPayload] = useState<CreateIntentParams | undefined>(undefined);
  const { data: hasAllowed, isLoading: isAllowanceLoading } = useSwapAllowance(intentOrderPayload, sourceChain, sourceWalletProvider);
  const { approve, isLoading: isApproving } = useSwapApprove(intentOrderPayload, sourceChain, sourceWalletProvider);
  const supportedSpokeChains = sodax.config.getSupportedSpokeChains();
  const {
    data: hasSufficientTrustline,
    isPending: isTrustlineLoading,
    error: trustlineError,
  } = useStellarTrustlineCheck(
    intentOrderPayload?.outputToken,
    BigInt(intentOrderPayload?.minOutputAmount ?? 0n),
    intentOrderPayload?.dstChainKey,
    destChain === ChainKeys.STELLAR_MAINNET ? (destWalletProvider as IStellarWalletProvider | undefined) : undefined,
  );
  if (trustlineError) {
    console.error('trustlineError', trustlineError);
  }
  const { requestTrustline } = useRequestTrustline(destToken?.address);
  const [open, setOpen] = useState(false);
  const [slippage, setSlippage] = useState<string>('0.5');
    const [useSubmitTxApi, setUseSubmitTxApi] = useState(false);
    const { mutateAsync: submitSwapTx, isPending: isSubmitting } = useBackendSubmitSwapTx({
        apiConfig: SUBMIT_TX_API_CONFIG,
    });
  const [isBitcoinReady, setIsBitcoinReady] = useState(false);
  const [isDestBitcoinReady, setIsDestBitcoinReady] = useState(false);

  // Bitcoin connector info for fund dialog (source)
  const sourceChainType = getXChainType(sourceChain);
  const sourceBtcConnection = useXConnection(sourceChainType);
  const sourceBtcService = useXService(sourceChainType);
  const sourceBtcConnector = sourceChainType === 'BITCOIN' && sourceBtcConnection?.xConnectorId && sourceBtcService
    ? sourceBtcService.getXConnectorById(sourceBtcConnection.xConnectorId)
    : undefined;

  // Bitcoin connector info (dest)
  const destChainType = getXChainType(destChain);
  const destBtcConnection = useXConnection(destChainType);
  const destBtcService = useXService(destChainType);
  const destBtcConnector = destChainType === 'BITCOIN' && destBtcConnection?.xConnectorId && destBtcService
    ? destBtcService.getXConnectorById(destBtcConnection.xConnectorId)
    : undefined;

  const onChangeDirection = () => {
    setSourceChain(destChain);
    setDestChain(sourceChain);
    setSourceToken(destToken);
    setDestToken(sourceToken);
  };

  const onSrcChainChange = (chainId: SpokeChainKey) => {
    setSourceChain(chainId);
    setSourceToken(getSupportedSolverTokens(chainId)[0]);
  };

  const onDestChainChange = (chainId: SpokeChainKey) => {
    setDestChain(chainId);
    setDestToken(getSupportedSolverTokens(chainId)[0]);
  };

  // Balance fetching- Fetch source token balance for the connected wallet
  const sourceXService = useXService(getXChainType(sourceChain));
  const { data: sourceBalances } = useXBalances({
    xService: sourceXService,
    xChainId: sourceChain,
    xTokens: sourceToken ? [sourceToken as XToken] : [],
    address: sourceAccount.address,
  });
  const sourceTokenBalance = sourceBalances?.[sourceToken?.address ?? ''] ?? 0n;

  // Fetch destination token balance for the connected wallet
  const destXService = useXService(getXChainType(destChain));
  const { data: destBalances } = useXBalances({
    xService: destXService,
    xChainId: destChain,
    xTokens: destToken ? [destToken as XToken] : [],
    address: destAccount.address,
  });
  const destTokenBalance = destBalances?.[destToken?.address ?? ''] ?? 0n;

  // Bitcoin trading wallet balances
  const sourceTradingAddress = sourceChain === ChainKeys.BITCOIN_MAINNET && sourceAccount.address
    ? loadRadfiSession(sourceAccount.address)?.tradingAddress : undefined;
  const destTradingAddress = destChain === ChainKeys.BITCOIN_MAINNET && destAccount.address
    ? loadRadfiSession(destAccount.address)?.tradingAddress : undefined;
  const sourceBitcoinWallet =
    sourceChain === ChainKeys.BITCOIN_MAINNET ? (sourceWalletProvider as IBitcoinWalletProvider | undefined) : undefined;
  const destBitcoinWallet =
    destChain === ChainKeys.BITCOIN_MAINNET ? (destWalletProvider as IBitcoinWalletProvider | undefined) : undefined;
  const { data: srcTradingBal } = useTradingWalletBalance(sourceBitcoinWallet, sourceTradingAddress);
  const { data: destTradingBal } = useTradingWalletBalance(destBitcoinWallet, destTradingAddress);

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
      amount: parseUnits(sourceAmount, sourceToken.decimals),
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
      new BigNumber(formatUnits(quote?.quoted_amount ?? 0n, destToken?.decimals ?? 0)),
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

    if (!sourceWalletProvider) {
      console.error('sourceWalletProvider undefined');
      return;
    }

    const createIntentParams = {
      inputToken: sourceToken.address, // The address of the input token on hub chain
      outputToken: destToken.address, // The address of the output token on hub chain
      inputAmount: parseUnits(sourceAmount, sourceToken.decimals), // The amount of input tokens
      minOutputAmount: BigInt(minOutputAmount.toFixed(0)), // The minimum amount of output tokens to accept
      deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 5), // Optional timestamp after which intent expires (0 = no deadline)
      allowPartialFill: false, // Whether the intent can be partially filled
      srcChainKey: sourceChain, // Chain ID where input tokens originate
      dstChainKey: destChain, // Chain ID where output tokens should be delivered
      srcAddress: await sourceWalletProvider.getWalletAddress(), // Source address (original address on spoke chain)
      dstAddress: destChain === ChainKeys.BITCOIN_MAINNET && destAccount.address
        ? (loadRadfiSession(destAccount.address)?.tradingAddress || destAccount.address)
        : destAccount.address, // Bitcoin: prefer trading wallet, others: personal wallet
      solver: '0x0000000000000000000000000000000000000000', // Optional specific solver address (address(0) = any solver)
      data: '0x', // Additional arbitrary data
    } satisfies CreateIntentParams;

    setIntentOrderPayload(createIntentParams);
  };

  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(sourceChain as SpokeChainKey);

  const handleSubmitTxSwap = async (intentOrderPayload: CreateIntentParams) => {
    if (!sourceWalletProvider) {
      console.error('sourceWalletProvider undefined');
      return;
    }

    setOpen(false);

    const createIntentResult = await sodax.swaps.createIntent({
      params: intentOrderPayload,
      raw: false,
      walletProvider: sourceWalletProvider,
    });

    if (!createIntentResult.ok) {
      console.error('Error creating intent:', createIntentResult.error);
      return;
    }

    const [spokeTxHash, intent, relayData] = createIntentResult.value;
    console.log('Intent created. Spoke tx hash:', spokeTxHash);

    const swapIntentData: SwapIntentData = {
      intentId: intent.intentId.toString(),
      creator: intent.creator,
      inputToken: intent.inputToken,
      outputToken: intent.outputToken,
      inputAmount: intent.inputAmount.toString(),
      minOutputAmount: intent.minOutputAmount.toString(),
      deadline: intent.deadline.toString(),
      allowPartialFill: intent.allowPartialFill,
      srcChain: Number(intent.srcChain),
      dstChain: Number(intent.dstChain),
      srcAddress: intent.srcAddress,
      dstAddress: intent.dstAddress,
      solver: intent.solver,
      data: intent.data,
    };

    const request: SubmitSwapTxRequest = {
      txHash: spokeTxHash as string,
      srcChainKey: sourceChain,
      walletAddress: sourceAccount.address ?? '',
      intent: swapIntentData,
      relayData,
    };

    const submitResult = await submitSwapTx(request);
    console.log('Submit swap tx result:', submitResult);

    setOrders(prev => [
      ...prev,
      { mode: 'submit-tx', txHash: spokeTxHash as string, srcChainId: sourceChain, apiBaseURL: SUBMIT_TX_API_CONFIG.baseURL },
    ]);
  };

  const handleSwap = async (intentOrderPayload: CreateIntentParams) => {
    if (useSubmitTxApi) {
      await handleSubmitTxSwap(intentOrderPayload);
      return;
    }

    setOpen(false);
    const result = await swap(intentOrderPayload);

    if (result.ok) {
      const [response, intent, intentDeliveryInfo] = result.value;

      setOrders(prev => [...prev, { mode: 'solver', intentHash: response.intent_hash, intent, intentDeliveryInfo }]);
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
    if (!intentOrderPayload) {
      console.error('intentOrderPayload undefined');
      return;
    }

    await approve({ params: intentOrderPayload });
  };

  const handleRequestTrustline = async (intentOrderPayload: CreateIntentParams | undefined) => {
    // if destination token is a Stellar asset, request trustline
    if (!intentOrderPayload) {
      console.error('intentOrderPayload undefined');
      return;
    }

    if (destChain !== ChainKeys.STELLAR_MAINNET || !destWalletProvider) {
      console.error('destChain is not Stellar or destWalletProvider undefined');
      return;
    }

    await requestTrustline({
      token: intentOrderPayload.outputToken,
      amount: intentOrderPayload.minOutputAmount,
      srcChainKey: destChain as StellarChainKey,
      walletProvider: destWalletProvider as IStellarWalletProvider,
    });
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
            onValueChange={v => setSourceToken(getSupportedSolverTokens(sourceChain).find(token => token.symbol === v))}
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
        <div className="mix-blend-multiply text-black text-(length:--body-comfortable) font-medium font-['InterRegular'] flex gap-1">
          <span className="hidden sm:inline">Balance:</span>
          <span className="inline">
            {Number(formatUnits(
              sourceChain === ChainKeys.BITCOIN_MAINNET && srcTradingBal
                ? srcTradingBal.btcSatoshi
                : sourceTokenBalance,
              sourceToken?.decimals ?? 0,
            )).toFixed(5)}
          </span>
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

        {sourceBitcoinWallet && (
          <BitcoinSetupPanel
            walletProvider={sourceBitcoinWallet}
            onReadyChange={setIsBitcoinReady}
            nativeBalance={sourceTokenBalance}
            connectorName={sourceBtcConnector?.name}
            connectorIcon={sourceBtcConnector?.icon}
          />
        )}

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
              value={quote ? formatUnits(quote?.quoted_amount, destToken?.decimals ?? 0) : ''}
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
        <div className="mix-blend-multiply text-black text-(length:--body-comfortable) font-medium font-['InterRegular'] flex gap-1">
          <span className="hidden sm:inline">Balance:</span>
          <span className="inline">{Number(formatUnits(
            destChain === ChainKeys.BITCOIN_MAINNET && destTradingBal
              ? destTradingBal.btcSatoshi
              : destTokenBalance,
            destToken?.decimals ?? 0,
          )).toFixed(4)}</span>
        </div>
        <div className="grow">
          <Label htmlFor="toAddress">Destination address</Label>
          <div className="flex items-center gap-2">
            <Input id="toAddress" type="text" value={
              destChain === ChainKeys.BITCOIN_MAINNET && destAccount.address
                ? (loadRadfiSession(destAccount.address)?.tradingAddress || destAccount.address)
                : (destAccount.address || '')
            } placeholder="" disabled={true} />
            {destAccount.address ? (
              <Button onClick={handleDestAccountDisconnect}>Disconnect</Button>
            ) : (
              <Button onClick={openWalletModal}>Connect</Button>
            )}
          </div>
        </div>

        {destBitcoinWallet && (
          <BitcoinSetupPanel
            walletProvider={destBitcoinWallet}
            onReadyChange={setIsDestBitcoinReady}
            nativeBalance={destTokenBalance}
            connectorName={destBtcConnector?.name}
            connectorIcon={destBtcConnector?.icon}
            isDestination
          />
        )}
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
              {minOutputAmount ? formatUnits(BigInt(minOutputAmount.toFixed(0)), destToken?.decimals ?? 0) : '0'}{' '}
              {destToken?.symbol}
            </span>
          </div>
        </div>

        <div className="">
          {quoteQuery.data?.ok === false && <div className="text-red-500">{quoteQuery.data.error.detail.message}</div>}
        </div>

        <div className="flex items-center gap-2 w-full">
          <label htmlFor="submit-tx-toggle" className="text-sm font-medium cursor-pointer">
            Submit tx to API
          </label>
          <input
            id="submit-tx-toggle"
            type="checkbox"
            checked={useSubmitTxApi}
            onChange={e => setUseSubmitTxApi(e.target.checked)}
            className="h-4 w-4 cursor-pointer"
          />
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
                  inputToken: {intentOrderPayload?.inputToken} on {intentOrderPayload?.srcChainKey}
                </div>
                <div>
                  outputToken: {intentOrderPayload?.outputToken} on {intentOrderPayload?.dstChainKey}
                </div>
                <div>inputAmount: {formatUnits(intentOrderPayload?.inputAmount ?? 0n, sourceToken?.decimals ?? 0)}</div>
                <div>deadline: {new Date(Number(intentOrderPayload?.deadline) * 1000).toLocaleString()}</div>
                <div>allowPartialFill: {intentOrderPayload?.allowPartialFill.toString()}</div>
                <div>srcAddress: {intentOrderPayload?.srcAddress}</div>
                <div>dstAddress: {intentOrderPayload?.dstAddress}</div>
                <div>solver: {intentOrderPayload?.solver}</div>
                <div>data: {intentOrderPayload?.data}</div>
                <div>amount: {formatUnits(intentOrderPayload?.inputAmount ?? 0n, sourceToken?.decimals ?? 0)}</div>
                <div>
                  outputAmount: {formatUnits(intentOrderPayload?.minOutputAmount ?? 0n, destToken?.decimals ?? 0)}
                </div>
                {destChain === ChainKeys.STELLAR_MAINNET && !isTrustlineLoading && !hasSufficientTrustline && (
                  <div className="text-red-500">Insufficient Stellar trustline (request trustline to proceed)</div>
                )}
              </div>
            </div>
            <DialogFooter>
              {sourceChain !== ChainKeys.BITCOIN_MAINNET && (
                <Button
                  className="w-full"
                  type="button"
                  variant="default"
                  onClick={handleApprove}
                  disabled={isAllowanceLoading || hasAllowed || isApproving}
                >
                  {isApproving ? 'Approving...' : hasAllowed ? 'Approved' : 'Approve'}
                </Button>
              )}

              {isWrongChain && (
                <Button className="w-full" type="button" variant="default" onClick={handleSwitchChain}>
                  Switch Chain
                </Button>
              )}

              {!isWrongChain &&
                (intentOrderPayload ? (
                  <Button
                    className="w-full"
                    onClick={() => handleSwap(intentOrderPayload)}
                    disabled={
                      (sourceChain !== ChainKeys.BITCOIN_MAINNET && !hasAllowed) || isSubmitting ||
                      (sourceChain === ChainKeys.BITCOIN_MAINNET && !isBitcoinReady) ||
                      (destChain === ChainKeys.BITCOIN_MAINNET && !isDestBitcoinReady)
                    }
                  >
                    <ArrowLeftRight className="mr-2 h-4 w-4" /> Swap
                  </Button>
                ) : (
                  <span>Intent Order undefined</span>
                ))}
              {isTrustlineLoading && destChain === ChainKeys.STELLAR_MAINNET && <span>Checking trustline...</span>}
              {destChain === ChainKeys.STELLAR_MAINNET && !isTrustlineLoading && !hasSufficientTrustline && (
                <Button
                  className="w-full"
                  onClick={() => handleRequestTrustline(intentOrderPayload)}
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
  );
}
