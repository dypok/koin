import React from 'react';

export interface KoinLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  variant?: 'gold-3d' | 'emerald-3d' | 'bicolor-3d' | 'proof-flat';
  showWordmark?: boolean;
}

export const KoinLogo: React.FC<KoinLogoProps> = ({
  size = 36,
  variant = 'gold-3d',
  showWordmark = false,
  className = '',
  ...props
}) => {
  const isEmerald = variant === 'emerald-3d';
  const isBicolor = variant === 'bicolor-3d';

  const defaultFace = isEmerald ? 'url(#emFace)' : 'url(#goldFace)';
  const defaultEdge = isEmerald ? 'url(#emEdge)' : 'url(#goldEdge)';
  const accentFace = isBicolor ? 'url(#emFace)' : defaultFace;
  const accentEdge = isBicolor ? 'url(#emEdge)' : defaultEdge;
  const reedingStroke = isEmerald ? 'rgba(255,255,255,0.4)' : 'rgba(254,240,138,0.55)';
  const pipFill = isEmerald ? 'rgba(255,255,255,0.85)' : 'rgba(254,240,138,0.95)';

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
        {/* Sovereign Gold Gradients (Default) */}
        <linearGradient id="goldFace" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="30%" stopColor="#F59E0B" />
          <stop offset="70%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id="goldEdge" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#D97706" />
          <stop offset="50%" stopColor="#B45309" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>

        {/* Emerald Gradients */}
        <linearGradient id="emFace" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="45%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="emEdge" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#064E3B" />
        </linearGradient>
      </defs>

      {/* Helper Macro: Render 12 Stacked 3D Coins forming K */}

      {/* --- Left Pillar: 5 Coins from Bottom to Top --- */}
      {/* 1. Bottom (26, 80) */}
      <g>
        <ellipse cx="26" cy="84.5" rx="12" ry="7" fill="rgba(0,0,0,0.35)" />
        <path d="M 15,80 A 11,6.5 0 0,0 37,80 v 3.2 A 11,6.5 0 0,1 15,83.2 Z" fill={defaultEdge} stroke="hsl(var(--background))" strokeWidth="0.8" />
        <ellipse cx="26" cy="80" rx="11" ry="6.5" fill={defaultFace} stroke="hsl(var(--background))" strokeWidth="0.8" />
        <ellipse cx="26" cy="80" rx="8.5" ry="5" fill="none" stroke={reedingStroke} strokeWidth="0.7" strokeDasharray="1.2 1" />
      </g>

      {/* 2. Mid-Bottom (26, 65) */}
      <g>
        <ellipse cx="26" cy="69.5" rx="12" ry="7" fill="rgba(0,0,0,0.35)" />
        <path d="M 15,65 A 11,6.5 0 0,0 37,65 v 3.2 A 11,6.5 0 0,1 15,68.2 Z" fill={defaultEdge} stroke="hsl(var(--background))" strokeWidth="0.8" />
        <ellipse cx="26" cy="65" rx="11" ry="6.5" fill={defaultFace} stroke="hsl(var(--background))" strokeWidth="0.8" />
        <ellipse cx="26" cy="65" rx="8.5" ry="5" fill="none" stroke={reedingStroke} strokeWidth="0.7" strokeDasharray="1.2 1" />
      </g>

      {/* 3. Center Nexus (26, 50) */}
      <g>
        <ellipse cx="26" cy="54.5" rx="12" ry="7" fill="rgba(0,0,0,0.35)" />
        <path d="M 15,50 A 11,6.5 0 0,0 37,50 v 3.2 A 11,6.5 0 0,1 15,53.2 Z" fill={accentEdge} stroke="hsl(var(--background))" strokeWidth="0.8" />
        <ellipse cx="26" cy="50" rx="11" ry="6.5" fill={accentFace} stroke="hsl(var(--background))" strokeWidth="0.8" />
        <ellipse cx="26" cy="50" rx="8.5" ry="5" fill="none" stroke={reedingStroke} strokeWidth="0.7" strokeDasharray="1.2 1" />
        <circle cx="26" cy="50" r="1.8" fill={pipFill} />
      </g>

      {/* 4. Mid-Top (26, 35) */}
      <g>
        <ellipse cx="26" cy="39.5" rx="12" ry="7" fill="rgba(0,0,0,0.35)" />
        <path d="M 15,35 A 11,6.5 0 0,0 37,35 v 3.2 A 11,6.5 0 0,1 15,38.2 Z" fill={defaultEdge} stroke="hsl(var(--background))" strokeWidth="0.8" />
        <ellipse cx="26" cy="35" rx="11" ry="6.5" fill={defaultFace} stroke="hsl(var(--background))" strokeWidth="0.8" />
        <ellipse cx="26" cy="35" rx="8.5" ry="5" fill="none" stroke={reedingStroke} strokeWidth="0.7" strokeDasharray="1.2 1" />
      </g>

      {/* 5. Top Pillar (26, 20) */}
      <g>
        <ellipse cx="26" cy="24.5" rx="12" ry="7" fill="rgba(0,0,0,0.35)" />
        <path d="M 15,20 A 11,6.5 0 0,0 37,20 v 3.2 A 11,6.5 0 0,1 15,23.2 Z" fill={defaultEdge} stroke="hsl(var(--background))" strokeWidth="0.8" />
        <ellipse cx="26" cy="20" rx="11" ry="6.5" fill={defaultFace} stroke="hsl(var(--background))" strokeWidth="0.8" />
        <ellipse cx="26" cy="20" rx="8.5" ry="5" fill="none" stroke={reedingStroke} strokeWidth="0.7" strokeDasharray="1.2 1" />
        <circle cx="26" cy="20" r="1.8" fill={pipFill} />
      </g>

      {/* --- Lower Diagonal Arm: 3 Coins --- */}
      {/* 6. Lower Branch Mid-1 (44, 60) */}
      <g>
        <ellipse cx="44" cy="64" rx="11.5" ry="6.8" fill="rgba(0,0,0,0.35)" />
        <path d="M 33.5,60 A 10.5,6.2 0 0,0 54.5,60 v 3 A 10.5,6.2 0 0,1 33.5,63 Z" fill={defaultEdge} stroke="hsl(var(--background))" strokeWidth="0.8" />
        <ellipse cx="44" cy="60" rx="10.5" ry="6.2" fill={defaultFace} stroke="hsl(var(--background))" strokeWidth="0.8" />
        <ellipse cx="44" cy="60" rx="8" ry="4.8" fill="none" stroke={reedingStroke} strokeWidth="0.7" strokeDasharray="1.2 1" />
      </g>

      {/* 7. Lower Branch Mid-2 (61, 71) */}
      <g>
        <ellipse cx="61" cy="75" rx="11.5" ry="6.8" fill="rgba(0,0,0,0.35)" />
        <path d="M 50.5,71 A 10.5,6.2 0 0,0 71.5,71 v 3 A 10.5,6.2 0 0,1 50.5,74 Z" fill={defaultEdge} stroke="hsl(var(--background))" strokeWidth="0.8" />
        <ellipse cx="61" cy="71" rx="10.5" ry="6.2" fill={defaultFace} stroke="hsl(var(--background))" strokeWidth="0.8" />
        <ellipse cx="61" cy="71" rx="8" ry="4.8" fill="none" stroke={reedingStroke} strokeWidth="0.7" strokeDasharray="1.2 1" />
      </g>

      {/* 8. Lower Branch Tip (78, 82) */}
      <g>
        <ellipse cx="78" cy="86" rx="11.5" ry="6.8" fill="rgba(0,0,0,0.35)" />
        <path d="M 67.5,82 A 10.5,6.2 0 0,0 88.5,82 v 3 A 10.5,6.2 0 0,1 67.5,85 Z" fill={accentEdge} stroke="hsl(var(--background))" strokeWidth="0.8" />
        <ellipse cx="78" cy="82" rx="10.5" ry="6.2" fill={accentFace} stroke="hsl(var(--background))" strokeWidth="0.8" />
        <ellipse cx="78" cy="82" rx="8" ry="4.8" fill="none" stroke={reedingStroke} strokeWidth="0.7" strokeDasharray="1.2 1" />
        <circle cx="78" cy="82" r="1.8" fill={pipFill} />
      </g>

      {/* --- Upper Diagonal Arm: 4 Coins --- */}
      {/* 9. Upper Branch Mid-1 (42, 43) */}
      <g>
        <ellipse cx="42" cy="47" rx="11.5" ry="6.8" fill="rgba(0,0,0,0.35)" />
        <path d="M 31.5,43 A 10.5,6.2 0 0,0 52.5,43 v 3 A 10.5,6.2 0 0,1 31.5,46 Z" fill={defaultEdge} stroke="hsl(var(--background))" strokeWidth="0.8" />
        <ellipse cx="42" cy="43" rx="10.5" ry="6.2" fill={defaultFace} stroke="hsl(var(--background))" strokeWidth="0.8" />
        <ellipse cx="42" cy="43" rx="8" ry="4.8" fill="none" stroke={reedingStroke} strokeWidth="0.7" strokeDasharray="1.2 1" />
      </g>

      {/* 10. Upper Branch Mid-2 (56, 33) */}
      <g>
        <ellipse cx="56" cy="37" rx="11.5" ry="6.8" fill="rgba(0,0,0,0.35)" />
        <path d="M 45.5,33 A 10.5,6.2 0 0,0 66.5,33 v 3 A 10.5,6.2 0 0,1 45.5,36 Z" fill={defaultEdge} stroke="hsl(var(--background))" strokeWidth="0.8" />
        <ellipse cx="56" cy="33" rx="10.5" ry="6.2" fill={defaultFace} stroke="hsl(var(--background))" strokeWidth="0.8" />
        <ellipse cx="56" cy="33" rx="8" ry="4.8" fill="none" stroke={reedingStroke} strokeWidth="0.7" strokeDasharray="1.2 1" />
      </g>

      {/* 11. Upper Branch Mid-3 (70, 23) */}
      <g>
        <ellipse cx="70" cy="27" rx="11.5" ry="6.8" fill="rgba(0,0,0,0.35)" />
        <path d="M 59.5,23 A 10.5,6.2 0 0,0 80.5,23 v 3 A 10.5,6.2 0 0,1 59.5,26 Z" fill={defaultEdge} stroke="hsl(var(--background))" strokeWidth="0.8" />
        <ellipse cx="70" cy="23" rx="10.5" ry="6.2" fill={defaultFace} stroke="hsl(var(--background))" strokeWidth="0.8" />
        <ellipse cx="70" cy="23" rx="8" ry="4.8" fill="none" stroke={reedingStroke} strokeWidth="0.7" strokeDasharray="1.2 1" />
      </g>

      {/* 12. Upper Branch Tip (84, 13) */}
      <g>
        <ellipse cx="84" cy="17" rx="11.5" ry="6.8" fill="rgba(0,0,0,0.35)" />
        <path d="M 73.5,13 A 10.5,6.2 0 0,0 94.5,13 v 3 A 10.5,6.2 0 0,1 73.5,16 Z" fill={accentEdge} stroke="hsl(var(--background))" strokeWidth="0.8" />
        <ellipse cx="84" cy="13" rx="10.5" ry="6.2" fill={accentFace} stroke="hsl(var(--background))" strokeWidth="0.8" />
        <ellipse cx="84" cy="13" rx="8" ry="4.8" fill="none" stroke={reedingStroke} strokeWidth="0.7" strokeDasharray="1.2 1" />
        <circle cx="84" cy="13" r="1.8" fill={pipFill} />
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
