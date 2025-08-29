// apps/web/components/icons/loans-icon.tsx
import type React from 'react';

interface LoansIconProps {
  width?: number;
  height?: number;
  className?: string;
  fill?: string;
  isActive?: boolean;
  isMobile?: boolean;
}

export function LoansIcon({
  width = 16,
  height = 16,
  className = '',
  fill,
  isActive = false,
  isMobile = false,
}: LoansIconProps): React.JSX.Element {
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
      aria-label="Loan"
      className={className}
    >
      <title>Loan</title>
      <g style={{ mixBlendMode: isMobile ? undefined : ('multiply' as const) }}>
        <path
          d="M15.3333 5.02044L9.22082 1.39175L7.99177 0.666016L0.666626 5.02044L1.89568 7.21454L5.55005 5.03732C5.66476 4.96981 5.79586 4.91918 5.94335 4.91918C6.40219 4.91918 6.76272 5.29048 6.76272 5.76306V10.1175H9.22082V5.76306C9.22082 5.29048 9.58134 4.91918 10.0402 4.91918C10.1877 4.91918 10.3188 4.96981 10.4335 5.03732L14.1042 7.19766L15.3333 5.02044Z"
          fill={iconFill}
        />
        <rect x="0.666626" y="12.666" width="14.6667" height="2.66667" fill={iconFill} />
      </g>
    </svg>
  );
}
