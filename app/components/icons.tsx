// Small stroke icons (decorative; buttons carry their own labels).
type P = { className?: string };
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const LeafIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M5 19C5 10 10 5 20 4c0 10-5 15-15 15z" />
    <path d="M5 19l8-8" />
  </svg>
);
export const PhoneIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />
  </svg>
);
export const ChatIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M4 5h16v11H9l-5 4z" />
  </svg>
);
export const PinIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M12 21s7-6.2 7-11.5A7 7 0 005 9.5C5 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);
export const CloseIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const PlusIcon = ({ className }: P) => (
  <svg {...base} className={className} strokeWidth={2.4}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const EditIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M4 20h4L19 9l-4-4L4 16z" />
  </svg>
);
export const TrashIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </svg>
);
export const EyeIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
export const LogoutIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3M10 17l5-5-5-5M15 12H4" />
  </svg>
);
export const CheckIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M5 12l5 5 9-10" />
  </svg>
);
export const ImageIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="10" r="2" />
    <path d="M21 16l-5-5-9 9" />
  </svg>
);

/** Drawn bouquet shown when a product has no photo yet. */
export function FlowerPlaceholder({ className }: P) {
  return (
    <svg viewBox="0 0 200 220" className={className} aria-hidden="true">
      <g fill="#5A9A4A">
        <ellipse cx="62" cy="92" rx="22" ry="8" transform="rotate(-35 62 92)" />
        <ellipse cx="138" cy="92" rx="22" ry="8" transform="rotate(35 138 92)" />
        <ellipse cx="44" cy="64" rx="22" ry="8" transform="rotate(-55 44 64)" />
        <ellipse cx="156" cy="64" rx="22" ry="8" transform="rotate(55 156 64)" />
      </g>
      <path d="M100 150V60M100 150L58 74M100 150l42-76M100 150l-24-44M100 150l24-44" stroke="#4D7A3A" strokeWidth="4" strokeLinecap="round" />
      {[
        [100, 52, 17],
        [58, 72, 15],
        [142, 72, 15],
        [76, 104, 16],
        [124, 104, 16],
      ].map(([x, y, r], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <circle r={r} fill={i % 2 ? "#F4778E" : "#D9344F"} />
          <circle r={r * 0.62} fill={i % 2 ? "#D9344F" : "#F4778E"} />
          <circle r={r * 0.22} fill="#9A1D38" />
        </g>
      ))}
      <path d="M50 120Q100 104 150 120L118 212Q100 218 82 212Z" fill="#D4B48A" stroke="#2B1B23" strokeOpacity=".15" />
      <path d="M72 162Q100 170 128 162l-3 13Q100 183 75 175Z" fill="#fff" opacity=".92" />
    </svg>
  );
}
