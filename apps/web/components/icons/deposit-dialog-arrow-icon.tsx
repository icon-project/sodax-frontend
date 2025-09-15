// apps/web/components/icons/deposit-dialog-arrow-icon.tsx
import type React from 'react';

interface DepositDialogArrowIconProps {
  width?: number;
  height?: number;
  className?: string;
  fill?: string;
  style?: React.CSSProperties;
}

export function DepositDialogArrowIcon({
  width = 16,
  height = 80,
  className = '',
  fill = '#F9F7F5',
  style,
}: DepositDialogArrowIconProps): React.JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 16 80"
      fill="none"
      aria-label="Deposit Dialog"
      className={className}
      style={style}
    >
      <title>Deposit Dialog</title>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.76995e-07 40C3.92926e-07 38.125 0.941131 37.1741 1.88235 36.6667C11.1437 31.6736 16 18.033 16 -1.90798e-07L16 80C16 61.967 11.1437 48.3264 1.88235 43.3333C0.941131 42.8259 5.61065e-07 41.875 4.76995e-07 40Z"
        fill={fill}
      />
    </svg>
  );
}
