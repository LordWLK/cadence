// Cadence brand logo components — matched exactly to SVG brand assets

interface LogoProps {
  className?: string;
}

/** Icône seule — 3 rectangles empilés + C */
export function CadenceIcon({ className = 'w-12 h-12' }: LogoProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Cadence"
    >
      <rect x="10" y="20" width="60" height="60" rx="2" fill="#D33A24" opacity="0.12" />
      <rect x="25" y="35" width="60" height="60" rx="2" fill="#D33A24" opacity="0.25" />
      <rect x="40" y="20" width="60" height="60" rx="2" fill="#D33A24" />
      <text
        x="70" y="60"
        textAnchor="middle"
        fontFamily="Inter, Helvetica Neue, Arial, sans-serif"
        fontSize="34"
        fontWeight="500"
        fill="#ffffff"
        dominantBaseline="middle"
      >
        C
      </text>
    </svg>
  );
}

/** Logo horizontal — icône + wordmark + tagline (fond clair) */
export function CadenceLogoHorizontal({ className = 'h-10' }: LogoProps) {
  return (
    <svg
      viewBox="0 0 480 120"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Cadence — Plan · Feel · Live"
    >
      <rect x="30" y="15" width="60" height="60" rx="2" fill="#D33A24" opacity="0.12" />
      <rect x="50" y="35" width="60" height="60" rx="2" fill="#D33A24" opacity="0.25" />
      <rect x="70" y="15" width="60" height="60" rx="2" fill="#D33A24" />
      <text
        x="100" y="47"
        textAnchor="middle"
        fontFamily="Inter, Helvetica Neue, Arial, sans-serif"
        fontSize="30"
        fontWeight="500"
        fill="#ffffff"
      >
        C
      </text>
      {/* wordmark — masthead serif façon gazette */}
      <text
        x="155" y="58"
        textAnchor="start"
        fontFamily="Fraunces, Georgia, 'Iowan Old Style', serif"
        fontSize="40"
        fontWeight="700"
        letterSpacing="1"
        fill="#16150F"
      >
        Cadence
      </text>
      <text
        x="155" y="82"
        textAnchor="start"
        fontFamily="'JetBrains Mono', 'Fira Code', monospace"
        fontSize="10"
        fontWeight="400"
        fill="#6b6355"
        letterSpacing="3"
      >
        PLAN · FEEL · LIVE
      </text>
    </svg>
  );
}

/** Logo stacké — icône au-dessus du wordmark + tagline (fond clair) */
export function CadenceLogoStacked({ className = 'w-40' }: LogoProps) {
  return (
    <svg
      viewBox="0 0 240 200"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Cadence — Plan · Feel · Live"
    >
      <rect x="65" y="20" width="60" height="60" rx="2" fill="#D33A24" opacity="0.12" />
      <rect x="82" y="37" width="60" height="60" rx="2" fill="#D33A24" opacity="0.25" />
      <rect x="99" y="20" width="60" height="60" rx="2" fill="#D33A24" />
      <text
        x="129" y="52"
        textAnchor="middle"
        fontFamily="Inter, Helvetica Neue, Arial, sans-serif"
        fontSize="30"
        fontWeight="500"
        fill="#ffffff"
      >
        C
      </text>
      {/* wordmark — masthead serif façon gazette */}
      <text
        x="120" y="125"
        textAnchor="middle"
        fontFamily="Fraunces, Georgia, 'Iowan Old Style', serif"
        fontSize="36"
        fontWeight="700"
        letterSpacing="1"
        fill="#16150F"
      >
        Cadence
      </text>
      <text
        x="120" y="150"
        textAnchor="middle"
        fontFamily="'JetBrains Mono', 'Fira Code', monospace"
        fontSize="9"
        fontWeight="400"
        fill="#6b6355"
        letterSpacing="4"
      >
        PLAN · FEEL · LIVE
      </text>
    </svg>
  );
}
