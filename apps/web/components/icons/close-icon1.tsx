// apps/web/components/icons/close-icon1.tsx
interface CloseIcon1Props {
  width?: number;
  height?: number;
  className?: string;
  fill?: string;
}

export function CloseIcon1({ width = 10, height = 10, className = '', fill }: CloseIcon1Props): React.JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 10 10"
      fill="none"
      className={className}
      transform="scale(0.6)"
    >
      <title>Close Icon 1</title>
      <path
        d="M7.5 2.5L2.5 7.5"
        stroke={fill || 'currentColor'}
        strokeWidth="0.9375"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.5 2.5L7.5 7.5"
        stroke={fill || 'currentColor'}
        strokeWidth="0.9375"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
