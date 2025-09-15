// apps/web/components/icons/savings-icon.tsx
import type React from 'react';

interface SavingsIconProps {
  width?: number;
  height?: number;
  className?: string;
  fill?: string;
  isActive?: boolean;
  isMobile?: boolean;
}

export function SavingsIcon({
  width = 16,
  height = 16,
  className = '',
  fill,
  isActive = false,
  isMobile = false,
}: SavingsIconProps): React.JSX.Element {
  const activeColor = isMobile ? '#B9ACAB' : '#8E7E7D';
  const inactiveColor = isMobile ? '#B9ACAB' : '#EDE6E6';
  const iconFill = fill || (isActive ? activeColor : inactiveColor);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 16 16"
      fill="none"
      aria-label="Savings"
      className={className}
    >
      <title>Savings</title>
      <g style={{ mixBlendMode: isMobile ? undefined : ('multiply' as const) }}>
        <path
          d="M15.3333 5.76276L9.22082 9.39145L7.99177 10.1172L0.666626 5.76276L1.89568 3.56867L5.55005 5.74588C5.66476 5.81339 5.79586 5.86403 5.94335 5.86403C6.40219 5.86403 6.76272 5.49272 6.76272 5.02014V0.665711H9.22082V5.02014C9.22082 5.49272 9.58134 5.86403 10.0402 5.86403C10.1877 5.86403 10.3188 5.81339 10.4335 5.74588L14.1042 3.58555L15.3333 5.76276Z"
          fill={iconFill}
        />
        <rect x="0.666626" y="12.666" width="14.6667" height="2.66667" fill={iconFill} />
      </g>
    </svg>
  );
}
