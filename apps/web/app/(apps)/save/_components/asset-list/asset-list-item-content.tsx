import { motion } from 'motion/react';
import { accordionVariants } from '@/constants/animation';
import type { XToken } from '@sodax/types';
import { useReservesUsdFormat } from '@sodax/dapp-kit';
import { useLiquidity } from '@/hooks/useAPY';
import { useTokenWalletBalances } from '@/hooks/useTokenWalletBalances';
import { useEffect, useState } from 'react';
import DepositInputAmount from './deposit-input-amount';
import { DepositTokenSelect } from './deposit-token-select';

export type DisplayItem = {
  tokens?: XToken[];
  supplyBalance: string;
};

export default function AssetListItemContent({
  tokens,
}: {
  tokens: XToken[];
}) {
  const { data: formattedReserves, isLoading: isFormattedReservesLoading } = useReservesUsdFormat();
  const { apy, deposits } = useLiquidity(tokens, formattedReserves, isFormattedReservesLoading);
  const [isShowDeposits, setIsShowDeposits] = useState(false);
  const [selectedToken, setSelectedToken] = useState<XToken | null>(null);

  useEffect(() => {
    if (tokens.length === 1) {
      setSelectedToken(tokens[0] || null);
    }
  }, [tokens]);

  const tokensWithBalances = useTokenWalletBalances(tokens);

  const holdTokens = tokensWithBalances
    .filter(t => Number(t.supplyBalance) > 0)
    .sort((a, b) => Number(b.supplyBalance) - Number(a.supplyBalance));

  const platformTokens = tokensWithBalances
    .filter(t => Number(t.supplyBalance) === 0)
    .sort((a, b) => a.symbol.localeCompare(b.symbol));

  const displayItems: DisplayItem[] = [...holdTokens.map(t => ({ tokens: [t], supplyBalance: t.supplyBalance }))];

  if (platformTokens.length > 0) {
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
          selectedToken={selectedToken}
          apy={apy}
          tokens={tokens}
          onBack={() => {
            setIsShowDeposits(false);
            setSelectedToken(null);
          }}
        />
      ) : (
        <DepositTokenSelect
          displayItems={displayItems}
          selectedToken={selectedToken}
          setSelectedToken={setSelectedToken}
          onContinue={!isShowDeposits ? () => setIsShowDeposits(true) : undefined}
          apy={apy}
          deposits={deposits}
        />
      )}
    </motion.div>
  );
}
