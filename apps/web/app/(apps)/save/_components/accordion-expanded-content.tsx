import { motion } from 'motion/react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { accordionVariants } from '@/constants/animation';
import type { XToken } from '@sodax/types';
import type { FormatReserveUSDResponse, UserReserveData } from '@sodax/sdk';
import { AlertCircleIcon } from 'lucide-react';
import { useLiquidity } from '@/hooks/useAPY';
import { formatUnits } from 'viem';
import { useWalletProvider, useXAccount } from '@sodax/wallet-sdk-react';
import { useSpokeProvider, useUserReservesData } from '@sodax/dapp-kit';
import { useReserveMetrics } from '@/hooks/useReserveMetrics';
import { TokenAsset } from '@/components/shared/token-asset';

function calculateMetricsForToken(token: XToken, formattedReserves: FormatReserveUSDResponse[]) {
  const { address } = useXAccount(token.xChainId);
  const walletProvider = useWalletProvider(token.xChainId);
  const spokeProvider = useSpokeProvider(token.xChainId, walletProvider);

  const { data: userReserves } = useUserReservesData(spokeProvider, address);

  const metrics = useReserveMetrics({
    token,
    formattedReserves: formattedReserves || [],
    userReserves: userReserves?.[0] as UserReserveData[],
  });

  const supplyBalance = metrics.userReserve
    ? Number(formatUnits(metrics.userReserve.scaledATokenBalance, 18)).toFixed(4)
    : '0';

  return { supplyBalance };
}

export default function AccordionExpandedContent({
  tokens,
  symbol,
  formattedReserves,
  isFormattedReservesLoading,
}: {
  tokens: XToken[];
  symbol: string;
  formattedReserves?: FormatReserveUSDResponse[];
  isFormattedReservesLoading: boolean;
}) {
  const { apy, deposits } = useLiquidity(tokens, formattedReserves, isFormattedReservesLoading);

  const enrichedTokens = tokens.map(t => {
    const metrics = calculateMetricsForToken(t, formattedReserves || []);
    return {
      ...t,
      supplyBalance: metrics.supplyBalance,
    };
  });

  const holdTokens = enrichedTokens
    .filter(t => Number(t.supplyBalance) > 0)
    .sort((a, b) => Number(b.supplyBalance) - Number(a.supplyBalance));

  const platformTokens = enrichedTokens
    .filter(t => Number(t.supplyBalance) === 0)
    .sort((a, b) => a.symbol.localeCompare(b.symbol));

  return (
    <motion.div
      variants={accordionVariants}
      initial="closed"
      animate="open"
      exit="closed"
      className="pl-0 md:pl-18 flex flex-col gap-4"
      layout
    >
      <div className="flex h-12">
        <Separator orientation="vertical" className="mix-blend-multiply bg-cream-white border-l-2 h-12" />
        <InfoBlock value={apy.replace('%', '')} label="Current APY" />
        <Separator orientation="vertical" className="mix-blend-multiply bg-cream-white border-l-2 h-12" />
        <InfoBlock value={deposits} label="All deposits" />
      </div>

      <div className="flex flex-wrap mt-4 -ml-3">
        {holdTokens.map(t => (
          <TokenAsset
            key={t.xChainId}
            name={t.symbol}
            token={t}
            formattedBalance={t.supplyBalance}
            isHoldToken={true}
            isClickBlurred={false}
            isHoverDimmed={false}
            isHovered={false}
            onMouseEnter={() => {}}
            onMouseLeave={() => {}}
            onClick={() => {}}
            onChainClick={() => {}}
            isClicked={false}
          />
        ))}
        {platformTokens.length > 1 ? (
          <TokenAsset
            key={platformTokens[0]?.xChainId}
            name={platformTokens[0]?.symbol || ''}
            token={platformTokens[0] || ({} as XToken)}
            isHoldToken={false}
            isGroup={true}
            tokenCount={platformTokens.length}
            tokens={platformTokens}
            isClickBlurred={false}
            isHoverDimmed={false}
            isHovered={false}
            onMouseEnter={() => {}}
            onMouseLeave={() => {}}
            onClick={() => {}}
            onChainClick={() => {}}
            isClicked={false}
          />
        ) : (
          <TokenAsset
            key={platformTokens[0]?.xChainId}
            name={platformTokens[0]?.symbol || ''}
            token={platformTokens[0] || ({} as XToken)}
            isHoldToken={false}
            isClickBlurred={false}
            isHoverDimmed={false}
            isHovered={false}
            onMouseEnter={() => {}}
            onMouseLeave={() => {}}
            onClick={() => {}}
            onChainClick={() => {}}
            isClicked={false}
          />
        )}
      </div>

      <div className="flex gap-4 items-center mb-8">
        <Button variant="cream" className="w-27 mix-blend-multiply shadow-none">
          Continue
        </Button>
        <span className="text-clay text-(length:--body-small) font-['InterRegular']">Select a source</span>
      </div>
    </motion.div>
  );
}

function InfoBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-col px-(--layout-space-normal)">
      <div className="text-espresso text-(length:--subtitle) font-['InterBold']">{value}</div>
      <div className="flex gap-1 text-clay-light text-(length:--body-small)">
        {label} <AlertCircleIcon className="w-4 h-4" />
      </div>
    </div>
  );
}
