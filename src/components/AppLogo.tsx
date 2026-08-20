interface AppLogoProps {
  size?: number | string;
  className?: string;
  withGlow?: boolean;
}

export function AppLogo({ size = 32, className = '', withGlow = true }: AppLogoProps) {
  return (
    <div
      className={`inline-flex items-center justify-center relative flex-shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full ${withGlow ? 'drop-shadow-[0_2px_8px_rgba(253,192,16,0.35)]' : ''}`}
      >
        {/* Outer Fine Golden Ring */}
        <circle
          cx="50"
          cy="50"
          r="48"
          stroke="#FDC010"
          strokeWidth="2.8"
          fill="none"
        />

        {/* Golden-Yellow Main Disc */}
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="#FDC010"
        />

        {/* Outer Black Target Ring */}
        <circle
          cx="50"
          cy="50"
          r="23"
          stroke="#131418"
          strokeWidth="6.5"
          fill="none"
        />

        {/* Inner Black Bullseye Ring */}
        <circle
          cx="50"
          cy="50"
          r="10.5"
          stroke="#131418"
          strokeWidth="5.5"
          fill="none"
        />

        {/* Arrow Shaft */}
        <line
          x1="48"
          y1="52"
          x2="68"
          y2="32"
          stroke="#131418"
          strokeWidth="6.2"
          strokeLinecap="round"
        />

        {/* Arrow Fletching Fins at 45 degree angle */}
        <path
          d="M62 31 L68 25 L76 33 L70 39 Z"
          fill="#131418"
        />
        <path
          d="M67 26 L73 20 L78 25 L75 28 L80 28 L76 32 L71 27 Z"
          fill="#131418"
        />
        <path
          d="M68 25 L76 17 L83 24 L75 32 Z"
          fill="#131418"
        />
      </svg>
    </div>
  );
}
