import type React from 'react';
import { STAKING_APR } from './constants';
import AnimatedNumber from '@/components/shared/animated-number';
import { itemVariants } from '@/constants/animation';
import { motion } from 'framer-motion';

interface StakeHeaderProps {
  apr?: number;
}

export function StakeHeader({ apr = STAKING_APR }: StakeHeaderProps): React.JSX.Element {
  return (
    <motion.div className="self-stretch mix-blend-multiply flex flex-col justify-start items-start gap-4" variants={itemVariants}>
      <div className="self-stretch mix-blend-multiply justify-end">
        <span className="text-yellow-dark text-(length:--app-title) font-normal font-['Shrikhand'] leading-8">Stake</span>
        <span className="text-yellow-dark text-(length:--app-title) font-bold font-['InterRegular'] leading-8"> your SODA</span>
      </div>
      <div className="flex self-stretch mix-blend-multiply justify-start text-clay-light text-(length:--subtitle) font-normal font-['InterRegular'] leading-5 gap-1">
        Earn{' '}
        <div className="flex"><AnimatedNumber to={apr} decimalPlaces={2} className="font-['InterRegular'] text-(length:--subtitle)" />%</div>
        {''}from protocol fees.
      </div>
    </motion.div>
  );
}
