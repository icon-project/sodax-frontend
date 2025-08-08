// apps/web/components/ui/tab-icon.tsx
import type React from 'react';

export type TabIconType = 'swap' | 'savings' | 'loans' | 'migrate';

interface TabIconProps {
  type: TabIconType;
  isActive: boolean;
  isMobile?: boolean;
  className?: string;
}

const TabIcon: React.FC<TabIconProps> = ({ type, isActive, isMobile = false, className = '' }) => {
  const activeColor = isMobile ? '#B9ACAB' : '#8E7E7D';
  const inactiveColor = isMobile ? '#B9ACAB' : '#EDE6E6';

  const iconComponents: Record<TabIconType, React.ReactNode> = {
    swap: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-label="Swap"
        className={className}
      >
        <title>Swap</title>
        <g style={{ mixBlendMode: isMobile ? undefined : ('multiply' as const) }}>
          <path
            d="M14.667 4.38477L13.5498 6.39746L10.2275 4.40039C10.1234 4.33856 10.004 4.2921 9.87012 4.29199C9.45298 4.29199 9.125 4.63307 9.125 5.06641V9.05859H9.11035V11.0518C9.11035 11.485 9.43748 11.826 9.85449 11.8262C9.98841 11.8262 10.1077 11.7796 10.2119 11.7178L13.5498 9.73633L14.667 11.7334L9.11035 15.0605L7.99219 15.7256L1.33301 11.7334L2.4502 9.7207L5.77246 11.7178C5.87662 11.7796 5.996 11.8261 6.12988 11.8262C6.54702 11.8262 6.875 11.4851 6.875 11.0518V7.05957H6.88965V5.06641C6.88965 4.63316 6.56252 4.29213 6.14551 4.29199C6.01159 4.29199 5.89228 4.33859 5.78809 4.40039L2.4502 6.38184L1.33301 4.38477L6.88965 1.05762L8.00781 0.392578L14.667 4.38477Z"
            fill={isActive ? activeColor : inactiveColor}
          />
        </g>
      </svg>
    ),
    savings: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-label="Savings"
        className={className}
      >
        <title>Savings</title>
        <g style={{ mixBlendMode: isMobile ? undefined : ('multiply' as const) }}>
          <path
            d="M15.3333 5.76276L9.22082 9.39145L7.99177 10.1172L0.666626 5.76276L1.89568 3.56867L5.55005 5.74588C5.66476 5.81339 5.79586 5.86403 5.94335 5.86403C6.40219 5.86403 6.76272 5.49272 6.76272 5.02014V0.665711H9.22082V5.02014C9.22082 5.49272 9.58134 5.86403 10.0402 5.86403C10.1877 5.86403 10.3188 5.81339 10.4335 5.74588L14.1042 3.58555L15.3333 5.76276Z"
            fill={isActive ? activeColor : inactiveColor}
          />
          <rect
            x="0.666626"
            y="12.666"
            width="14.6667"
            height="2.66667"
            fill={isActive ? activeColor : inactiveColor}
          />
        </g>
      </svg>
    ),
    loans: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-label="Loan"
        className={className}
      >
        <title>Loan</title>
        <g style={{ mixBlendMode: isMobile ? undefined : ('multiply' as const) }}>
          <path
            d="M15.3333 5.02044L9.22082 1.39175L7.99177 0.666016L0.666626 5.02044L1.89568 7.21454L5.55005 5.03732C5.66476 4.96981 5.79586 4.91918 5.94335 4.91918C6.40219 4.91918 6.76272 5.29048 6.76272 5.76306V10.1175H9.22082V5.76306C9.22082 5.29048 9.58134 4.91918 10.0402 4.91918C10.1877 4.91918 10.3188 4.96981 10.4335 5.03732L14.1042 7.19766L15.3333 5.02044Z"
            fill={isActive ? activeColor : inactiveColor}
          />
          <rect
            x="0.666626"
            y="12.666"
            width="14.6667"
            height="2.66667"
            fill={isActive ? activeColor : inactiveColor}
          />
        </g>
      </svg>
    ),
    migrate: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-label="Migrate"
        className={className}
      >
        <title>Migrate</title>
        <g style={{ mixBlendMode: isMobile ? undefined : ('multiply' as const) }}>
          <path
            d="M10.9199 0.667318L14.5486 6.77979L15.2743 8.00884L10.9199 15.334L8.72577 14.1049C9.70829 12.4558 12.4895 8.00884 12.4895 8.00884C12.4895 8.00884 9.71318 3.54545 8.74265 1.89637L10.9199 0.667318Z"
            fill={isActive ? activeColor : inactiveColor}
          />
          <path
            d="M2.97895 0.667318L6.60764 6.77979L7.33337 8.00884L2.97895 15.334L0.784853 14.1049C1.76737 12.4558 4.54854 8.00884 4.54854 8.00884C4.54854 8.00884 1.77226 3.54545 0.801731 1.89637L2.97895 0.667318Z"
            fill={isActive ? activeColor : inactiveColor}
          />
        </g>
      </svg>
    ),
  };

  return (
    <div data-property-1={type} className={`w-4 h-4 relative ${isMobile ? '' : 'mix-blend-multiply'}`}>
      {iconComponents[type]}
    </div>
  );
};

export default TabIcon;
