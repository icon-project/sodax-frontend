// apps/web/components/icons/evm-multi-connect-icon.tsx
interface EvmMultiConnectIconProps {
  width?: number;
  height?: number;
  className?: string;
  fill?: string;
}

export function EvmMultiConnectIcon({
  width = 41,
  height = 9,
  className = '',
  fill = 'white',
}: EvmMultiConnectIconProps): React.JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 41 9"
      fill="none"
      aria-label="EVM multi-connect"
      className={className}
    >
      <title>EVM multi-connect</title>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20.5 8.57226C19.5625 8.57226 19.0871 8.1017 18.8333 7.63109C16.3368 3.00043 9.51648 0.572266 0.5 0.572266L40.5 0.572264C31.4835 0.572264 24.6632 3.00043 22.1667 7.63109C21.9129 8.1017 21.4375 8.57226 20.5 8.57226Z"
        fill={fill}
      />
    </svg>
  );
}
