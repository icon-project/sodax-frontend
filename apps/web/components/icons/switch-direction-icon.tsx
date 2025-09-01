interface SwitchDirectionIconProps {
  width?: number;
  height?: number;
  className?: string;
}

export function SwitchDirectionIcon({ width = 12, height = 12, className = '' }: SwitchDirectionIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 12 12"
      fill="none"
      className={className}
    >
      <title>Arrow down</title>
      <g clipPath="url(#clip0_9664_9869)">
        <path
          d="M5.5 8.5L3.5 10.5L1.5 8.5"
          stroke="#483534"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M3.5 10.5V4.5" stroke="#483534" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path
          d="M10.5 3.5L8.5 1.5L6.5 3.5"
          stroke="black"
          strokeWidth="1.33333"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M8.5 7.5V1.5" stroke="black" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
