// apps/web/components/shared/token-group-logo.tsx
import type React from 'react';
import Image from 'next/image';
import type { XToken } from '@sodax/types';
import CurrencyLogo from './currency-logo';

interface TokenGroupLogoProps {
  className?: string;
  tokens: XToken[];
  symbol: string;
  showCount?: boolean;
}

const TokenGroupLogo: React.FC<TokenGroupLogoProps> = ({ 
  className = '', 
  tokens, 
  symbol, 
  showCount = true 
}) => {
  const tokenCount = tokens.length;
  
  // Ensure we have at least one token
  if (tokenCount === 0) {
    return <div className={`relative ${className}`} />;
  }
  
  const primaryToken = tokens[0]; // Use the first token as the primary display

  return (
    <div className={`relative ${className}`}>
      {/* Main token logo */}
      <CurrencyLogo currency={primaryToken} className="w-12 h-10" />
      
      {/* Count badge - only show if there are multiple tokens and showCount is true */}
      {showCount && tokenCount > 1 && (
        <div className="absolute -top-1 -right-1 bg-espresso text-white rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
          <span className="text-xs font-medium leading-none">
            {tokenCount > 99 ? '99+' : tokenCount}
          </span>
        </div>
      )}
    </div>
  );
};

export default TokenGroupLogo;
