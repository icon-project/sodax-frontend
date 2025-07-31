// apps/web/components/ui/tab-item.tsx
import type React from 'react';
import { TabsTrigger } from '@/components/ui/tabs';
import TabIcon, { type TabIconType } from './tab-icon';
import { Badge } from '@/components/ui/badge';

interface TabItemProps {
  value: string;
  type: TabIconType;
  label: string;
  isActive: boolean;
  isMobile?: boolean;
  setTabRef?: (el: HTMLButtonElement | null) => void;
  className?: string;
}

const TabItem: React.FC<TabItemProps> = ({
  value,
  type,
  label,
  isActive,
  isMobile = false,
  setTabRef,
  className = '',
}) => {
  const getTextClassName = (): string => {
    if (isMobile) {
      return `mix-blend-multiply font-normal leading-[1.4] ${
        isActive
          ? "text-espresso text-[13px] leading-[1.4] font-['Shrikhand']"
          : "text-clay font-medium font-['InterRegular'] text-[11px] leading-[1.4]"
      }`;
    }
    return `mix-blend-multiply justify-end leading-snug ${
      isActive ? "text-espresso font-['Shrikhand']" : "text-clay font-['InterRegular']"
    }`;
  };

  const getContainerClassName = (): string => {
    if (isMobile) {
      return `flex flex-col items-center gap-2 w-[25vw] ${className}`;
    }
    return `inline-flex items-center gap-1 w-33 p-0 ${className}`;
  };

  return (
    <TabsTrigger
      ref={setTabRef}
      value={value}
      className="data-[state=active]:bg-transparent data-[state=active]:shadow-none py-0 px-0"
    >
      <div className={getContainerClassName()}>
        <TabIcon type={type} isActive={isActive} isMobile={isMobile} />
        <div
          className={isMobile ? 'flex justify-start items-center gap-[2px]' : 'flex justify-start items-center ml-2'}
        >
          <div
            className={getTextClassName()}
            style={!isMobile ? { fontSize: 'var(--body-super-comfortable)' } : undefined}
          >
            {label}
          </div>
          {
            isMobile && value !== 'migrate' && (
              // <Badge variant="mobile" className="px-0" style={{ fontSize: 'var(--body-small)' }}>
              <span className="text-clay-light text-[11px] mix-blend-multiply leading-[1.4] font-['InterRegular']">
                (SOON)
              </span>
            )
            // </Badge>
          }
        </div>
        {!isMobile && value !== 'migrate' && <Badge variant="desktop">SOON</Badge>}
      </div>
    </TabsTrigger>
  );
};

export default TabItem;
