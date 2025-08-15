// apps/web/components/icons/rounded-pill-icon.tsx
interface RoundedPillIconProps {
  width?: number;
  height?: number;
  className?: string;
  fill?: string;
  style?: React.CSSProperties;
}

export function RoundedPillIcon({
  width = 8,
  height = 40,
  className = '',
  fill = '#F9F7F5',
  style,
}: RoundedPillIconProps): React.JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 8 40"
      fill="none"
      aria-label="Rounded Pill"
      className={className}
      style={style}
    >
      <title>Rounded Pill</title>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.38498e-07 20C1.96463e-07 19.0625 0.470565 18.5871 0.941175 18.3333C5.57184 15.8368 8 9.01648 8 -9.5399e-08L8 40C8 30.9835 5.57184 24.1632 0.941175 21.6667C0.470566 21.4129 2.80532e-07 20.9375 2.38498e-07 20Z"
        fill={fill}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.5 5.9999C10.5 6.95019 10.1991 7.87608 9.64047 8.64486C9.08187 9.41364 8.29423 9.98585 7.39044 10.2795C6.48665 10.5731 5.5131 10.5731 4.60932 10.2794C3.70555 9.98572 2.91794 9.41346 2.35938 8.64465C1.80083 7.87584 1.49999 6.94994 1.5 5.99964C1.50001 5.04935 1.80085 4.12345 2.35942 3.35465C2.91799 2.58584 3.7056 2.0136 4.60938 1.71993C5.51316 1.42627 6.48671 1.42625 7.3905 1.7199"
        fill={fill}
      />
    </svg>
  );
}
