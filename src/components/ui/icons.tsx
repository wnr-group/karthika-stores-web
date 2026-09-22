import type { SVGProps } from "react";

/**
 * A small hand-drawn icon set, rather than a library.
 *
 * All of them share one weight (1px), one cap (round) and a 24-unit box, so
 * they sit together in the header without looking assembled from three
 * different packs.
 */

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 4.5 4.5" />
    </Icon>
  );
}

export function BagIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 7.5h14l-1 12.5H6L5 7.5Z" />
      <path d="M9 9V6.5a3 3 0 0 1 6 0V9" />
    </Icon>
  );
}

export function HeartIcon({ filled = false, ...props }: IconProps & { filled?: boolean }) {
  return (
    <Icon fill={filled ? "currentColor" : "none"} {...props}>
      <path d="M12 20s-7-4.6-7-9.4A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.6C19 15.4 12 20 12 20Z" />
    </Icon>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c1.2-3.8 3.8-5.5 7-5.5s5.8 1.7 7 5.5" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </Icon>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m5 9 7 7 7-7" />
    </Icon>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m15 5-7 7 7 7" />
    </Icon>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m9 5 7 7-7 7" />
    </Icon>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </Icon>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

export function MinusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12h14" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </Icon>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 8h16M4 16h16" />
    </Icon>
  );
}

export function FilterIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16M7 12h10M10 17h4" />
    </Icon>
  );
}

export function TruckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2 7h11v9H2zM13 10h4l3 3v3h-7z" />
      <circle cx="6" cy="18" r="1.6" />
      <circle cx="16.5" cy="18" r="1.6" />
    </Icon>
  );
}

export function ReturnIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 9h11a5 5 0 0 1 0 10H9" />
      <path d="m8 5-4 4 4 4" />
    </Icon>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.5 19 6v6c0 4.2-2.9 7.3-7 8.5-4.1-1.2-7-4.3-7-8.5V6l7-2.5Z" />
      <path d="m9 12 2 2 4-4" />
    </Icon>
  );
}

export function LoomIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 5v14M20 5v14" />
      <path d="M4 9h16M4 15h16" />
      <path d="M9 5v14M15 5v14" />
    </Icon>
  );
}

export function WhatsAppIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.86 9.86 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.41a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.4-.42-.56-.43h-.47c-.16 0-.43.06-.65.31-.22.25-.85.83-.85 2.03s.87 2.35.99 2.51c.12.16 1.71 2.61 4.14 3.66.58.25 1.03.4 1.38.51.58.19 1.11.16 1.53.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29Z" />
    </svg>
  );
}
