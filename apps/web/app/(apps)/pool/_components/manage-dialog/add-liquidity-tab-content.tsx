import type React from 'react';
import { useMemo } from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { spokeChainConfig, type PoolData } from '@sodax/sdk';
import type { SpokeChainId, XToken } from '@sodax/types';
import { formatUnits, parseUnits } from 'viem';
import { PairBalanceHeader } from '@/app/(apps)/pool/_components/manage-dialog/pair-balance-header';
import { useAllChainBalances } from '@/hooks/useAllChainBalances';
import { useAllChainXSodaBalances } from '@/hooks/useAllChainXSodaBalances';
import { cn, formatTokenAmount } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import { TabsContent } from '@/components/ui/tabs';
import Tip from '@/app/(apps)/stake/_components/icons/tip';

type AddLiquidityTabContentProps = {
  chainId: SpokeChainId;
  tokenId: string;
  poolData: PoolData;
  minPrice: string;
  maxPrice: string;
  liquidityToken0Amount: string;
  liquidityToken1Amount: string;
  slippageTolerance: string;
  isPending: boolean;
  isSupplyPending: boolean;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  onToken0AmountChange: (value: string) => void;
  onToken1AmountChange: (value: string) => void;
  onSlippageChange: (value: string) => void;
  onAddLiquidity: () => void;
};

type LiquidityAmountInputProps = {
  tokenId: string;
  tokenSymbol: string;
  amount: string;
  balanceText: string;
  maxAmount: string;
  canUseMax: boolean;
  isOverMax: boolean;
  onAmountChange: (value: string) => void;
};

function getTokenIconName(symbol: string): string {
  const normalizedSymbol = symbol.toLowerCase();
  if (normalizedSymbol === 'bnusd (legacy)') {
    return 'bnusd';
  }
  if (normalizedSymbol.includes('xsoda')) {
    return 'xsoda';
  }
  if (normalizedSymbol === 'soda') {
    return 'soda';
  }
  if (normalizedSymbol.includes('soda')) {
    return 'soda';
  }
  return normalizedSymbol.replace(/\s+/g, '');
}

function getDisplayTokenSymbol(symbol: string): string {
  const normalizedSymbol = symbol.toLowerCase();
  if (normalizedSymbol.includes('xsoda')) {
    return 'xSODA';
  }
  if (normalizedSymbol.includes('soda')) {
    return 'SODA';
  }
  return symbol;
}

function LiquidityAmountInput({
  tokenId,
  tokenSymbol,
  amount,
  balanceText,
  maxAmount,
  canUseMax,
  isOverMax,
  onAmountChange,
}: LiquidityAmountInputProps): React.JSX.Element {
  return (
    <InputGroup className="h-10 pl-2 pr-4 bg-almost-white rounded-[32px] flex justify-between items-center mix-blend-multiply">
      <InputGroupAddon className="pl-0 pr-2">
        <InputGroupText>
          <Image
            className="w-6 h-6 rounded-[256px]"
            src={`/coin/${getTokenIconName(tokenSymbol)}.png`}
            alt={tokenSymbol}
            width={24}
            height={24}
          />
        </InputGroupText>
      </InputGroupAddon>
      <div className="relative flex-1">
        <InputGroupAddon className="pointer-events-none absolute left-0 -top-1 h-auto p-0">
          <InputGroupText className="text-clay text-[9px] font-medium font-['Inter'] uppercase leading-3">
            {balanceText}
          </InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          id={`${tokenSymbol.toLowerCase()}-amount-${tokenId}`}
          type="number"
          placeholder=""
          value={amount}
          onChange={event => onAmountChange(event.target.value)}
          className={cn('h-5 w-full p-0 pt-2 text-xs leading-5', isOverMax ? 'text-negative!' : 'text-espresso')}
        />
        {amount.length === 0 ? (
          <span className="pointer-events-none absolute inset-y-0 left-0 top-2 flex items-center gap-1 text-xs">
            <span className="text-clay-light">0</span>
            <span className={isOverMax ? 'text-negative' : 'text-cherry-grey'}>{tokenSymbol}</span>
          </span>
        ) : null}
      </div>

      {canUseMax ? (
        <InputGroupButton
          size="icon-xs"
          className="text-clay text-[9px] font-['InterRegular'] font-normal border-none! outline-none! leading-0"
          onClick={() => onAmountChange(maxAmount)}
        >
          MAX
        </InputGroupButton>
      ) : (
        <div className="justify-start text-clay text-[9px] font-medium font-['Inter'] uppercase leading-3">MAX</div>
      )}
    </InputGroup>
  );
}

export function AddLiquidityTabContent({
  chainId,
  tokenId,
  poolData,
  minPrice,
  maxPrice,
  liquidityToken0Amount,
  liquidityToken1Amount,
  slippageTolerance,
  isPending,
  isSupplyPending,
  onMinPriceChange,
  onMaxPriceChange,
  onToken0AmountChange,
  onToken1AmountChange,
  onSlippageChange,
  onAddLiquidity,
}: AddLiquidityTabContentProps): React.JSX.Element {
  const allChainSodaBalances = useAllChainBalances({ onlySodaTokens: true });
  const allChainXSodaBalances = useAllChainXSodaBalances([chainId]);
  const selectedSodaToken = useMemo((): XToken | undefined => {
    const selectedChainConfig = spokeChainConfig[chainId];
    if (!selectedChainConfig?.supportedTokens || !('SODA' in selectedChainConfig.supportedTokens)) {
      return undefined;
    }
    return selectedChainConfig.supportedTokens.SODA as XToken;
  }, [chainId]);
  const selectedSodaBalance = useMemo((): bigint => {
    if (!selectedSodaToken) {
      return 0n;
    }

    const selectedSodaBalanceEntry = (allChainSodaBalances[selectedSodaToken.address] || []).find(
      balanceEntry => balanceEntry.chainId === chainId,
    );

    return selectedSodaBalanceEntry?.balance ?? 0n;
  }, [allChainSodaBalances, chainId, selectedSodaToken]);
  const selectedXSodaBalance = allChainXSodaBalances.get(chainId) ?? 0n;
  const token0DisplaySymbol = getDisplayTokenSymbol(poolData.token0.symbol);
  const token1DisplaySymbol = getDisplayTokenSymbol(poolData.token1.symbol);
  const token0BalanceText = token0DisplaySymbol.toLowerCase().includes('xsoda')
    ? formatTokenAmount(selectedXSodaBalance, 18)
    : formatTokenAmount(selectedSodaBalance, selectedSodaToken?.decimals ?? 18);
  const token1BalanceText = token1DisplaySymbol.toLowerCase().includes('xsoda')
    ? formatTokenAmount(selectedXSodaBalance, 18)
    : formatTokenAmount(selectedSodaBalance, selectedSodaToken?.decimals ?? 18);
  const token0IsXSoda = token0DisplaySymbol.toLowerCase().includes('xsoda');
  const token1IsXSoda = token1DisplaySymbol.toLowerCase().includes('xsoda');
  const token0MaxBalance = token0IsXSoda ? selectedXSodaBalance : selectedSodaBalance;
  const token1MaxBalance = token1IsXSoda ? selectedXSodaBalance : selectedSodaBalance;
  const token0MaxAmount = formatUnits(
    token0MaxBalance,
    token0IsXSoda ? 18 : (selectedSodaToken?.decimals ?? 18),
  ).trim();
  const token1MaxAmount = formatUnits(
    token1MaxBalance,
    token1IsXSoda ? 18 : (selectedSodaToken?.decimals ?? 18),
  ).trim();
  const token0Decimals = token0IsXSoda ? 18 : (selectedSodaToken?.decimals ?? 18);
  const token1Decimals = token1IsXSoda ? 18 : (selectedSodaToken?.decimals ?? 18);
  const token0Value = useMemo((): bigint | null => {
    if (liquidityToken0Amount.trim().length === 0) {
      return null;
    }
    try {
      return parseUnits(liquidityToken0Amount, token0Decimals);
    } catch {
      return null;
    }
  }, [liquidityToken0Amount, token0Decimals]);
  const token1Value = useMemo((): bigint | null => {
    if (liquidityToken1Amount.trim().length === 0) {
      return null;
    }
    try {
      return parseUnits(liquidityToken1Amount, token1Decimals);
    } catch {
      return null;
    }
  }, [liquidityToken1Amount, token1Decimals]);
  const token0IsOverMax = token0Value !== null && token0Value > token0MaxBalance;
  const token1IsOverMax = token1Value !== null && token1Value > token1MaxBalance;
  const hasValidToken0Amount =
    token0Value !== null && token0Value > 0n && token0Value <= token0MaxBalance && !token0IsOverMax;
  const hasValidToken1Amount =
    token1Value !== null && token1Value > 0n && token1Value <= token1MaxBalance && !token1IsOverMax;
  const canAddLiquidity = hasValidToken0Amount && hasValidToken1Amount && !isPending;

  return (
    <TabsContent value="add">
      <div className="self-stretch mt-4">
        <PairBalanceHeader chainId={chainId} />
      </div>
      <div className="self-stretch p-6 bg-blend-multiply bg-almost-white rounded-2xl inline-flex flex-col justify-start items-start gap-2 w-full relative mt-10">
        <div className="absolute -top-8 left-8 translate-y-full z-10 pointer-events-none rotate-180">
          <Tip fill="var(--color-almost-white)" />
        </div>
        <div className="text-center justify-center text-clay text-[9px] font-medium font-['Inter'] uppercase leading-3">
          Add liquidity
        </div>
        <LiquidityAmountInput
          tokenId={tokenId}
          tokenSymbol={token0DisplaySymbol}
          amount={liquidityToken0Amount}
          balanceText={token0BalanceText}
          maxAmount={token0MaxAmount}
          canUseMax={token0MaxBalance > 0n}
          isOverMax={token0IsOverMax}
          onAmountChange={onToken0AmountChange}
        />
        <LiquidityAmountInput
          tokenId={tokenId}
          tokenSymbol={token1DisplaySymbol}
          amount={liquidityToken1Amount}
          balanceText={token1BalanceText}
          maxAmount={token1MaxAmount}
          canUseMax={token1MaxBalance > 0n}
          isOverMax={token1IsOverMax}
          onAmountChange={onToken1AmountChange}
        />
      </div>
      <Button className="w-full mt-2" variant="cherry" onClick={onAddLiquidity} disabled={!canAddLiquidity}>
        {isSupplyPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        Add
      </Button>
    </TabsContent>
  );
}
