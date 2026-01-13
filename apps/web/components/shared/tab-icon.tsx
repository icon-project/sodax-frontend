// apps/web/components/shared/tab-icon.tsx
import type React from 'react';
import { SwapIcon, SavingsIcon, LoansIcon, MigrateIcon } from '@/components/icons';

export type TabIconType = 'swap' | 'save' | 'loans' | 'migrate';

interface TabIconProps {
  type: TabIconType;
  isActive: boolean;
  isMobile?: boolean;
  className?: string;
}

const TabIcon: React.FC<TabIconProps> = ({ type, isActive, isMobile = false, className = '' }) => {
  const iconComponents: Record<TabIconType, React.ReactNode> = {
    swap: <SwapIcon isActive={isActive} isMobile={isMobile} className={className} />,
    save: <SavingsIcon isActive={isActive} isMobile={isMobile} className={className} />,
    loans: <LoansIcon isActive={isActive} isMobile={isMobile} className={className} />,
    migrate: <MigrateIcon isActive={isActive} isMobile={isMobile} className={className} />,
  };

  return (
    <div data-property-1={type} className={`w-4 h-4 relative ${isMobile ? '' : 'mix-blend-multiply'}`}>
      {iconComponents[type]}
    </div>
  );
};

export default TabIcon;
