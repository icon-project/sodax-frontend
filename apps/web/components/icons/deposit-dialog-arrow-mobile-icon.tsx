// apps/web/components/icons/deposit-dialog-arrow-mobile-icon.tsx
import type React from 'react';

interface DepositDialogArrowMobileIconProps {
  width?: number;
  height?: number;
  className?: string;
  fill?: string;
  style?: React.CSSProperties;
}

export function DepositDialogArrowMobileIcon({
  width = 80,
  height = 16,
  className = '',
  fill = '#EDE6E6',
  style,
}: DepositDialogArrowMobileIconProps): React.JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 80 16"
      fill="none"
      className={className}
      aria-label="Deposit Dialog"
      style={style}
    >
      <title>Deposit Dialog</title>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M40 -1.27146e-06C41.875 -1.27357e-06 42.8259 0.941129 43.3333 1.88235C48.3264 11.1437 61.967 16 80 16L-5.08584e-07 16C18.033 16 31.6736 11.1437 36.6667 1.88235C37.1741 0.941129 38.125 -1.26935e-06 40 -1.27146e-06Z"
        fill={fill}
      />
    </svg>
  );
}
