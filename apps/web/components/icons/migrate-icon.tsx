// apps/web/components/icons/migrate-icon.tsx
import type React from 'react';

interface MigrateIconProps {
  width?: number;
  height?: number;
  className?: string;
  fill?: string;
  isActive?: boolean;
  isMobile?: boolean;
}

export function MigrateIcon({
  width = 16,
  height = 16,
  className = '',
  fill,
  isActive = false,
  isMobile = false,
}: MigrateIconProps): React.JSX.Element {
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
      aria-label="Migrate"
      className={className}
    >
      <title>Migrate</title>
      <g style={{ mixBlendMode: isMobile ? undefined : ('multiply' as const) }}>
        <path
          d="M10.9199 0.667318L14.5486 6.77979L15.2743 8.00884L10.9199 15.334L8.72577 14.1049C9.70829 12.4558 12.4895 8.00884 12.4895 8.00884C12.4895 8.00884 9.71318 3.54545 8.74265 1.89637L10.9199 0.667318Z"
          fill={iconFill}
        />
        <path
          d="M2.97895 0.667318L6.60764 6.77979L7.33337 8.00884L2.97895 15.334L0.784853 14.1049C1.76737 12.4558 4.54854 8.00884 4.54854 8.00884C4.54854 8.00884 1.77226 3.54545 0.801731 1.89637L2.97895 0.667318Z"
          fill={iconFill}
        />
      </g>
    </svg>
  );
}
