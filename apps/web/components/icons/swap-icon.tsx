// apps/web/components/icons/swap-icon.tsx
import type React from 'react';

interface SwapIconProps {
  width?: number;
  height?: number;
  className?: string;
  fill?: string;
  isActive?: boolean;
  isMobile?: boolean;
}

export function SwapIcon({
  width = 16,
  height = 16,
  className = '',
  fill,
  isActive = false,
  isMobile = false,
}: SwapIconProps): React.JSX.Element {
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
      aria-label="Swap"
      className={className}
    >
      <title>Swap</title>
      <g style={{ mixBlendMode: isMobile ? undefined : ('multiply' as const) }}>
        <path
          d="M14.667 4.38477L13.5498 6.39746L10.2275 4.40039C10.1234 4.33856 10.004 4.2921 9.87012 4.29199C9.45298 4.29199 9.125 4.63307 9.125 5.06641V9.05859H9.11035V11.0518C9.11035 11.485 9.43748 11.826 9.85449 11.8262C9.98841 11.8262 10.1077 11.7796 10.2119 11.7178L13.5498 9.73633L14.667 11.7334L9.11035 15.0605L7.99219 15.7256L1.33301 11.7334L2.4502 9.7207L5.77246 11.7178C5.87662 11.7796 5.996 11.8261 6.12988 11.8262C6.54702 11.8262 6.875 11.4851 6.875 11.0518V7.05957H6.88965V5.06641C6.88965 4.63316 6.56252 4.29213 6.14551 4.29199C6.01159 4.29199 5.89228 4.33859 5.78809 4.40039L2.4502 6.38184L1.33301 4.38477L6.88965 1.05762L8.00781 0.392578L14.667 4.38477Z"
          fill={iconFill}
        />
      </g>
    </svg>
  );
}
