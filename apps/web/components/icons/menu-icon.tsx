// apps/web/components/icons/menu-icon.tsx
interface MenuIconProps {
  width?: number;
  height?: number;
  className?: string;
  fill?: string;
}

export function MenuIcon({ width = 24, height = 24, className = '', fill = '#fff' }: MenuIconProps): React.JSX.Element {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} aria-label="Menu" className={className}>
      <title>Menu</title>
      <path fill={fill} d="M3 6h18v2H3V6m0 5h18v2H3v-2m0 5h18v2H3v-2Z" />
    </svg>
  );
}
