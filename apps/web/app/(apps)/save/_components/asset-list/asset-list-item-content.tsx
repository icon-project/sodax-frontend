// apps/web/app/(apps)/save/_components/asset-list/asset-list-item-content.tsx
import { motion } from 'motion/react';
import { accordionVariants } from '@/constants/animation';
import type { XToken } from '@sodax/types';
import { useReservesUsdFormat } from '@sodax/dapp-kit';
import { useLiquidity } from '@/hooks/useAPY';
import { useTokenWalletBalances } from '@/hooks/useTokenWalletBalances';
import { useEffect } from 'react';
import DepositInputAmount from './deposit-input-amount';
import { DepositTokenSelect } from './deposit-token-select';
import { useSaveState, useSaveActions } from '../../_stores/save-store-provider';

export type DisplayItem = {
  tokens?: XToken[];
  supplyBalance: string;
};

export default function AssetListItemContent({
  tokens,
  isReadyToEarn,
}: {
  tokens: XToken[];
  isReadyToEarn: boolean;
}) {
  const { data: formattedReserves, isLoading: isFormattedReservesLoading } = useReservesUsdFormat();
  const { apy, deposits } = useLiquidity(tokens, formattedReserves, isFormattedReservesLoading);
  const { isShowDeposits, selectedToken } = useSaveState();
  const { setIsShowDeposits, setSelectedToken } = useSaveActions();

  useEffect(() => {
    if (tokens.length === 1) {
      setSelectedToken(tokens[0] || null);
    }
  }, [tokens, setSelectedToken]);

  const tokensWithBalances = useTokenWalletBalances(tokens);

  const holdTokens = tokensWithBalances
    .filter(t => Number(t.supplyBalance) > 0)
    .sort((a, b) => Number(b.supplyBalance) - Number(a.supplyBalance));

  const platformTokens = tokensWithBalances
    .filter(t => Number(t.supplyBalance) === 0)
    .sort((a, b) => a.symbol.localeCompare(b.symbol));

  const displayItems: DisplayItem[] = [...holdTokens.map(t => ({ tokens: [t], supplyBalance: t.supplyBalance }))];

  if (holdTokens.length === 0 && platformTokens.length > 0) {
    displayItems.push({
      tokens: platformTokens,
      supplyBalance: '0',
    });
  }

  return (
    <motion.div
      variants={accordionVariants}
      initial="closed"
      animate="open"
      exit="closed"
      className="pl-0 md:pl-18 flex flex-col gap-4"
    >
      {isShowDeposits ? (
        <DepositInputAmount
          tokens={tokens}
          onBack={() => {
            setIsShowDeposits(false);
            setSelectedToken(null);
          }}
          apy={apy}
          deposits={Number(deposits)}
        />
      ) : (
        <DepositTokenSelect
          displayItems={displayItems}
          setSelectedToken={setSelectedToken}
          onContinue={!isShowDeposits ? () => setIsShowDeposits(true) : undefined}
          apy={apy}
          deposits={Number(deposits)}
          isReadyToEarn={isReadyToEarn}
        />
      )}
    </motion.div>
  );
}
