// apps/web/components/icons/arrow-right-icon.tsx
interface ChevronDownIconProps {
  width?: number;
  height?: number;
  className?: string;
  fill?: string;
  style?: React.CSSProperties;
}

export function ChevronDownIcon({
  width = 16,
  height = 80,
  className = '',
  fill = '#8E7E7D',
  style,
}: ChevronDownIconProps): React.JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 16 17"
      fill="none"
      aria-label="Chevron Down Icon"
      className={className}
      style={style}
    >
      <title>Chevron Down Icon</title>
      <path d="M4 6.5L8 10.5L12 6.5" stroke={fill} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
