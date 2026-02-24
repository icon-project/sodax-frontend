interface StakeIconProps {
  width?: number;
  height?: number;
  className?: string;
  fill?: string;
  isActive?: boolean;
  isMobile?: boolean;
}

export const StakeIcon = ({
  width = 16,
  height = 16,
  fill,
  isActive = false,
  isMobile = false,
  ...props
}: StakeIconProps): React.JSX.Element => {
  const activeColor = isMobile ? '#B9ACAB' : '#8E7E7D';
  const inactiveColor = isMobile ? '#B9ACAB' : '#EDE6E6';
  const iconFill = fill || (isActive ? activeColor : inactiveColor);

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 16 16" fill="none" {...props}>
      <title>Stake</title>
      <g style={{ mixBlendMode: isMobile ? undefined : ('multiply' as const) }}>
        <path
          d="M2.43024 0.666707L6.05893 6.77918L6.78467 8.00823L2.43024 15.3334L0.236147 14.1043C1.21867 12.4552 3.99984 8.00823 3.99984 8.00823C3.99984 8.00823 1.22355 3.54484 0.253025 1.89576L2.43024 0.666707Z"
          fill={iconFill}
        />
        <path
          d="M13.6879 0.666707L10.0592 6.77918L9.3335 8.00823L13.6879 15.3334L15.882 14.1043C14.8995 12.4552 12.1183 8.00823 12.1183 8.00823C12.1183 8.00823 14.8946 3.54484 15.8651 1.89576L13.6879 0.666707Z"
          fill={iconFill}
        />
      </g>
    </svg>
  );
};

export default StakeIcon;
