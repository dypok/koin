import React from 'react';

export interface KoinLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  variant?: 'mint' | 'gold-core' | 'monochrome';
  showWordmark?: boolean;
}

export const KoinLogo: React.FC<KoinLogoProps> = ({
  size = 32,
  variant = 'mint',
  showWordmark = false,
  className = '',
  ...props
}) => {
  const isGoldCore = variant === 'gold-core';
  const isMonochrome = variant === 'monochrome';

  const logoSvg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      {...props}
    >
      <defs>
        <linearGradient id="koinEmeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        <linearGradient id="koinGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>

      {/* 1. Left Vertical Stem (3 Coins) */}
      {/* Top Left Coin (27, 24) */}
      <g>
        <circle
          cx="27"
          cy="24"
          r="14"
          fill={isMonochrome ? 'currentColor' : 'url(#koinEmeraldGrad)'}
          stroke="hsl(var(--background))"
          strokeWidth="2.5"
        />
        <circle cx="27" cy="24" r="10.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeDasharray="2 1.5" />
        <circle cx="27" cy="24" r="5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />
        <circle cx="27" cy="24" r="2" fill="rgba(255,255,255,0.7)" />
      </g>

      {/* Bottom Left Coin (27, 76) */}
      <g>
        <circle
          cx="27"
          cy="76"
          r="14"
          fill={isMonochrome ? 'currentColor' : 'url(#koinEmeraldGrad)'}
          stroke="hsl(var(--background))"
          strokeWidth="2.5"
        />
        <circle cx="27" cy="76" r="10.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeDasharray="2 1.5" />
        <circle cx="27" cy="76" r="5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />
        <circle cx="27" cy="76" r="2" fill="rgba(255,255,255,0.7)" />
      </g>

      {/* Middle Left Coin (27, 50) - Nexus */}
      <g>
        <circle
          cx="27"
          cy="50"
          r={isGoldCore ? '14.5' : '14'}
          fill={isGoldCore ? 'url(#koinGoldGrad)' : isMonochrome ? 'currentColor' : 'url(#koinEmeraldGrad)'}
          stroke="hsl(var(--background))"
          strokeWidth="2.5"
        />
        <circle
          cx="27"
          cy="50"
          r="10.5"
          stroke={isGoldCore ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.4)'}
          strokeWidth="1"
          strokeDasharray="2 1.5"
        />
        {isGoldCore ? (
          <polygon points="27,45 31,50 27,55 23,50" fill="rgba(255,255,255,0.85)" />
        ) : (
          <>
            <circle cx="27" cy="50" r="5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />
            <circle cx="27" cy="50" r="2" fill="rgba(255,255,255,0.7)" />
          </>
        )}
      </g>

      {/* 2. Upper Diagonal Branch (2 Coins) */}
      {/* Upper Mid Coin (51, 39) */}
      <g>
        <circle
          cx="51"
          cy="39"
          r="14"
          fill={isMonochrome ? 'currentColor' : 'url(#koinEmeraldGrad)'}
          stroke="hsl(var(--background))"
          strokeWidth="2.5"
        />
        <circle cx="51" cy="39" r="10.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeDasharray="2 1.5" />
        <circle cx="51" cy="39" r="5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />
        <circle cx="51" cy="39" r="2" fill="rgba(255,255,255,0.7)" />
      </g>

      {/* Upper Tip Coin (73, 22) */}
      <g>
        <circle
          cx="73"
          cy="22"
          r="14"
          fill={isMonochrome ? 'currentColor' : 'url(#koinEmeraldGrad)'}
          stroke="hsl(var(--background))"
          strokeWidth="2.5"
        />
        <circle cx="73" cy="22" r="10.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeDasharray="2 1.5" />
        <circle cx="73" cy="22" r="5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />
        <circle cx="73" cy="22" r="2" fill="rgba(255,255,255,0.7)" />
      </g>

      {/* 3. Lower Diagonal Branch (2 Coins) */}
      {/* Lower Mid Coin (51, 61) */}
      <g>
        <circle
          cx="51"
          cy="61"
          r="14"
          fill={isMonochrome ? 'currentColor' : 'url(#koinEmeraldGrad)'}
          stroke="hsl(var(--background))"
          strokeWidth="2.5"
        />
        <circle cx="51" cy="61" r="10.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeDasharray="2 1.5" />
        <circle cx="51" cy="61" r="5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />
        <circle cx="51" cy="61" r="2" fill="rgba(255,255,255,0.7)" />
      </g>

      {/* Lower Tip Coin (73, 78) */}
      <g>
        <circle
          cx="73"
          cy="78"
          r="14"
          fill={isMonochrome ? 'currentColor' : 'url(#koinEmeraldGrad)'}
          stroke="hsl(var(--background))"
          strokeWidth="2.5"
        />
        <circle cx="73" cy="78" r="10.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeDasharray="2 1.5" />
        <circle cx="73" cy="78" r="5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />
        <circle cx="73" cy="78" r="2" fill="rgba(255,255,255,0.7)" />
      </g>
    </svg>
  );

  if (!showWordmark) {
    return logoSvg;
  }

  return (
    <div className="flex items-center gap-2.5">
      {logoSvg}
      <span className="font-bold tracking-tight text-foreground text-lg">Koin</span>
    </div>
  );
};
