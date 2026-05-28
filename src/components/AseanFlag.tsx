export function AseanFlag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 72 48"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="ASEAN flag"
    >
      {/* Blue background */}
      <rect width="72" height="48" fill="#003DA5" />
      {/* White circle */}
      <circle cx="36" cy="24" r="14" fill="#FFFFFF" />
      {/* Central red circle */}
      <circle cx="36" cy="24" r="5" fill="#D0001B" />
      {/* 10 rice stalks - simplified golden strokes */}
      <g stroke="#F4B41A" strokeWidth="1.2" strokeLinecap="round">
        {/* Stalks radiating from center */}
        {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const x1 = 36 + 5 * Math.cos(rad);
          const y1 = 24 + 5 * Math.sin(rad);
          const x2 = 36 + 12 * Math.cos(rad);
          const y2 = 24 + 12 * Math.sin(rad);
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
          );
        })}
      </g>
    </svg>
  );
}
