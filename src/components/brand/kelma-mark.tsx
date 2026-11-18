export function KelmaMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="kelma-tile" x1="5" y1="4" x2="43" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C7FF5C" />
          <stop offset="0.52" stopColor="#8B7BFF" />
          <stop offset="1" stopColor="#55E6D9" />
        </linearGradient>
        <linearGradient id="kelma-bubble" x1="12" y1="12" x2="37" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="1" stopColor="#EAF7FF" stopOpacity="0.8" />
        </linearGradient>
      </defs>

      <rect x="2" y="2" width="44" height="44" rx="15" fill="url(#kelma-tile)" />
      <rect x="2.75" y="2.75" width="42.5" height="42.5" rx="14.25" stroke="white" strokeOpacity="0.35" strokeWidth="1.5" />

      <path
        d="M13 14.5C13 12.567 14.567 11 16.5 11H31.5C33.433 11 35 12.567 35 14.5V27.5C35 29.433 33.433 31 31.5 31H23L16.7 36.2C15.9 36.82 14.75 36.25 14.75 35.2V31H16.5C14.567 31 13 29.433 13 27.5V14.5Z"
        fill="url(#kelma-bubble)"
      />
      <path
        d="M20 16.5V26.5M20 21.6L28.6 16.5M23.4 20.4L30 26.5"
        stroke="#171438"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="31.5" cy="15.5" r="2.4" fill="#FF6B8B" />
    </svg>
  );
}

export function KelmaWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <KelmaMark className="size-9 shrink-0 drop-shadow-[0_6px_14px_rgba(139,123,255,0.35)]" />
      <span className="font-display text-xl font-extrabold tracking-tight text-white">
        kelma<span className="text-accent">.</span>
      </span>
    </span>
  );
}
