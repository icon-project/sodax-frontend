// apps/web/components/icons/close-icon.tsx
interface CloseIconProps {
  width?: number;
  height?: number;
  className?: string;
  fill?: string;
}

export function CloseIcon({
  width = 24,
  height = 24,
  className = '',
  fill = '#000',
}: CloseIconProps): React.JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 24 24"
      aria-label="Close menu"
      className={className}
    >
      <title>Close</title>
      <path
        fill={fill}
        d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
      />
    </svg>
  );
}
