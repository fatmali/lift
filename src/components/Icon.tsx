interface Props {
  name: keyof typeof PATHS;
  size?: number;
  className?: string;
}

/** 24px stroke icons — one visual weight across the whole app. */
const PATHS = {
  today: <path d="M4 7h16M4 12h10M4 17h7" />,
  bolt: <path d="M13 3 5 14h6l-1 7 8-11h-6l1-7Z" />,
  chart: <path d="M4 19V5m0 14h16M8 15l3.5-4L15 14l4-6" />,
  body: (
    <>
      <circle cx="12" cy="6" r="2.6" />
      <path d="M7 21v-5l-1.4-4.2A2 2 0 0 1 7.5 9h9a2 2 0 0 1 1.9 2.8L17 16v5" />
    </>
  ),
  plan: (
    <>
      <path d="M5 4h14v16H5z" />
      <path d="M9 9h6M9 13h6M9 17h3" />
    </>
  ),
  check: <path d="m5 13 4.5 4.5L19 7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  chevron: <path d="m9 5 7 7-7 7" />,
  chevronDown: <path d="m5 9 7 7 7-7" />,
  back: <path d="m15 5-7 7 7 7" />,
  timer: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2M9 2h6" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
      <path d="M8 6H5v1a3 3 0 0 0 3 3M16 6h3v1a3 3 0 0 1-3 3M10 20h4M12 13v7" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" />
      <circle cx="12" cy="13" r="3.2" />
    </>
  ),
  trash: <path d="M5 7h14M10 7V5h4v2M6 7l1 13h10l1-13M10 11v6M14 11v6" />,
  heart: (
    <path d="M12 20s-7-4.6-7-9.4A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.6C19 15.4 12 20 12 20Z" />
  ),
  run: (
    <>
      <circle cx="15" cy="5" r="1.8" />
      <path d="m8 21 2.5-5 3-2-1-4-3 2-2 3M13.5 14l3 2 1 5" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />,
  arrowUp: <path d="M12 19V5m0 0-6 6m6-6 6 6" />,
  arrowDown: <path d="M12 5v14m0 0 6-6m-6 6-6-6" />,
  scale: <path d="M12 4v16M6 8h12M4 20h16" />,
  note: (
    <>
      <path d="M5 4h14v16H5z" />
      <path d="M9 9h6M9 13h6" />
    </>
  ),
  refresh: <path d="M4 12a8 8 0 0 1 13.7-5.6L20 8M20 4v4h-4M20 12a8 8 0 0 1-13.7 5.6L4 16M4 20v-4h4" />,
  download: <path d="M12 4v10m0 0 4-4m-4 4-4-4M5 19h14" />,
} as const;

export function Icon({ name, size = 20, className }: Props) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
