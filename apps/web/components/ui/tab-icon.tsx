// apps/web/components/ui/tab-icon.tsx
import type React from 'react';

export type TabIconType = 'portfolio' | 'savings' | 'loans' | 'migrate';

interface TabIconProps {
  type: TabIconType;
  isActive: boolean;
  isMobile?: boolean;
  className?: string;
}

const TabIcon: React.FC<TabIconProps> = ({ type, isActive, isMobile = false, className = '' }) => {
  const activeColor = isMobile ? '#ffd92f' : '#483534';
  const inactiveColor = isMobile ? '#fff' : '#B9ACAB';

  const iconComponents: Record<TabIconType, React.ReactNode> = {
    portfolio: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-label="Portfolio"
        className={className}
      >
        <title>Portfolio</title>
        <g style={{ mixBlendMode: isMobile ? undefined : ('multiply' as const) }}>
          <rect x="0.666672" y="13.334" width="14.6667" height="2" fill={isActive ? activeColor : inactiveColor} />
          <rect
            x="0.666672"
            y="11.334"
            width="5.33333"
            height="2.66667"
            transform="rotate(-90 0.666672 11.334)"
            fill={isActive ? activeColor : inactiveColor}
          />
          <rect
            x="4.66667"
            y="11.334"
            width="8.66667"
            height="2.66667"
            transform="rotate(-90 4.66667 11.334)"
            fill={isActive ? activeColor : inactiveColor}
          />
          <rect
            x="8.66667"
            y="11.334"
            width="3.33333"
            height="2.66667"
            transform="rotate(-90 8.66667 11.334)"
            fill={isActive ? activeColor : inactiveColor}
          />
          <rect
            x="12.6667"
            y="11.334"
            width="10.6667"
            height="2.66667"
            transform="rotate(-90 12.6667 11.334)"
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
