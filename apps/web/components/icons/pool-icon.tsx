interface PoolIconProps {
  width?: number;
  height?: number;
  className?: string;
  fill?: string;
  isActive?: boolean;
  isMobile?: boolean;
}

export const PoolIcon = ({
  width = 16,
  height = 16,
  fill,
  isActive = false,
  isMobile = false,
  ...props
}: PoolIconProps): React.JSX.Element => {
  const activeColor = isMobile ? '#B9ACAB' : '#8E7E7D';
  const inactiveColor = isMobile ? '#B9ACAB' : '#EDE6E6';
  const iconFill = fill || (isActive ? activeColor : inactiveColor);

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 16 16" fill="none" {...props}>
      <title>Pool</title>
      <g style={{ mixBlendMode: isMobile ? undefined : ('multiply' as const) }}>
        {/* Left drop */}
        <path
          d="M5.5 2C5.5 2 2 6.5 2 9C2 11.2091 3.567 13 5.5 13C7.433 13 9 11.2091 9 9C9 6.5 5.5 2 5.5 2Z"
          fill={iconFill}
        />
        {/* Right drop */}
        <path
          d="M10.5 4C10.5 4 7.5 7.5 7.5 9.5C7.5 11.433 8.843 13 10.5 13C12.157 13 13.5 11.433 13.5 9.5C13.5 7.5 10.5 4 10.5 4Z"
          fill={iconFill}
        />
      </g>
    </svg>
  );
};

export default PoolIcon;
