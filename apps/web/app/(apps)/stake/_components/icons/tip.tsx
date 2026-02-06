const CurvedDivider = ({ width = 80, height = 16, fill = '#F5F2F2', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 80 16" fill="none" {...props}>
    <title>Tip</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M40 16C38.125 16 37.1741 15.0589 36.6667 14.1177C31.6736 4.85632 18.033 9.53674e-07 0 9.53674e-07H80C61.967 9.53674e-07 48.3264 4.85632 43.3333 14.1177C42.8259 15.0589 41.875 16 40 16Z"
      fill={fill}
    />
  </svg>
);

export default CurvedDivider;
