// apps/web/components/shared/token-group-logo.tsx
import type React from 'react';
import Image from 'next/image';
import type { XToken } from '@sodax/types';
import CurrencyLogo from '@/components/shared/currency-logo';
import CurrencyGroupLogo from '@/components/shared/currency-group-logo';

interface TokenGroupLogoProps {
  className?: string;
  tokens: XToken[];
  symbol: string;
  showCount?: boolean;
}

const TokenGroupLogo: React.FC<TokenGroupLogoProps> = ({ className = '', tokens, symbol, showCount = true }) => {
  const tokenCount = tokens.length;

  if (tokenCount === 0) {
    return <div className={`relative ${className}`} />;
  }

  const primaryToken = tokens[0];

  return (
    <div className={`relative ${className}`}>
      {tokenCount > 1 ? (
        <CurrencyGroupLogo currency={primaryToken as XToken} className="w-12 h-10" count={tokenCount} />
      ) : (
        <CurrencyLogo currency={primaryToken as XToken} className="w-12 h-10" />
      )}
    </div>
  );
};

export default TokenGroupLogo;
