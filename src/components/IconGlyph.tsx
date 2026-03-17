import type { SVGProps } from "react";
import type { CategoryIconKey, LinkIconKey } from "../types/catalog";

type IconName =
  | CategoryIconKey
  | LinkIconKey
  | "arrow-up-right"
  | "heart"
  | "layers"
  | "lock"
  | "mail"
  | "plus"
  | "search";

interface IconGlyphProps extends SVGProps<SVGSVGElement> {
  name: IconName;
}

export function IconGlyph({ name, ...props }: IconGlyphProps) {
  const sharedProps = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24"
  };

  switch (name) {
    case "play":
      return (
        <svg aria-hidden="true" {...sharedProps} {...props}>
          <path d="M7 5.5 18 12 7 18.5Z" />
          <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
        </svg>
      );
    case "gamepad":
      return (
        <svg aria-hidden="true" {...sharedProps} {...props}>
          <path d="M8 14H6m1-1v2m9-1h2m-1-1v2" />
          <path d="M7.5 9.5h9a4 4 0 0 1 3.8 5.2l-.7 2.2a2.5 2.5 0 0 1-4.4.8L13.9 16H10l-1.2 1.7a2.5 2.5 0 0 1-4.4-.8l-.7-2.2A4 4 0 0 1 7.5 9.5Z" />
        </svg>
      );
    case "globe":
      return (
        <svg aria-hidden="true" {...sharedProps} {...props}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M3.8 9.5h16.4M3.8 14.5h16.4M12 3.5c2.2 2.3 3.5 5.3 3.5 8.5s-1.3 6.2-3.5 8.5c-2.2-2.3-3.5-5.3-3.5-8.5S9.8 5.8 12 3.5Z" />
        </svg>
      );
    case "spark":
      return (
        <svg aria-hidden="true" {...sharedProps} {...props}>
          <path d="m12 3 1.6 4.3L18 9l-4.4 1.7L12 15l-1.6-4.3L6 9l4.4-1.7Z" />
          <path d="m18.5 14.5.7 1.9 1.8.7-1.8.7-.7 1.9-.7-1.9-1.8-.7 1.8-.7ZM6 15.5l1.1 2.9L10 19.5l-2.9 1.1L6 23.5l-1.1-2.9L2 19.5l2.9-1.1Z" />
        </svg>
      );
    case "grid":
      return (
        <svg aria-hidden="true" {...sharedProps} {...props}>
          <rect x="4" y="4" width="6" height="6" rx="1.5" />
          <rect x="14" y="4" width="6" height="6" rx="1.5" />
          <rect x="4" y="14" width="6" height="6" rx="1.5" />
          <rect x="14" y="14" width="6" height="6" rx="1.5" />
        </svg>
      );
    case "screen":
      return (
        <svg aria-hidden="true" {...sharedProps} {...props}>
          <rect x="3.5" y="5" width="17" height="11" rx="2.5" />
          <path d="M9 19h6m-4-3 1 3m2-3-1 3" />
        </svg>
      );
    case "controller":
      return (
        <svg aria-hidden="true" {...sharedProps} {...props}>
          <path d="M7.5 11.5h9a3.5 3.5 0 0 1 3.3 4.6l-.5 1.4a2 2 0 0 1-3.6.6l-.9-1.4h-5.6l-.9 1.4a2 2 0 0 1-3.6-.6l-.5-1.4a3.5 3.5 0 0 1 3.3-4.6Z" />
          <path d="M8 13.2H6m1-1v2m9-1h2m-1-1v2" />
        </svg>
      );
    case "headline":
      return (
        <svg aria-hidden="true" {...sharedProps} {...props}>
          <rect x="4" y="4" width="16" height="16" rx="2.5" />
          <path d="M8 9h8M8 13h8M8 17h5" />
        </svg>
      );
    case "bookmark":
      return (
        <svg aria-hidden="true" {...sharedProps} {...props}>
          <path d="M7 4.5h10a1.5 1.5 0 0 1 1.5 1.5v13l-6.5-3-6.5 3V6A1.5 1.5 0 0 1 7 4.5Z" />
        </svg>
      );
    case "toolbox":
      return (
        <svg aria-hidden="true" {...sharedProps} {...props}>
          <rect x="3.5" y="8" width="17" height="10" rx="2" />
          <path d="M9 8V6.5A1.5 1.5 0 0 1 10.5 5h3A1.5 1.5 0 0 1 15 6.5V8M3.5 12h17" />
        </svg>
      );
    case "layers":
      return (
        <svg aria-hidden="true" {...sharedProps} {...props}>
          <path d="m12 4 8 4-8 4-8-4Zm8 8-8 4-8-4m16 4-8 4-8-4" />
        </svg>
      );
    case "heart":
      return (
        <svg aria-hidden="true" {...sharedProps} {...props}>
          <path d="M12 20s-6.7-4.3-8.2-8A4.7 4.7 0 0 1 8.1 5.5c1.6 0 3 .8 3.9 2.1a4.7 4.7 0 0 1 3.9-2.1A4.7 4.7 0 0 1 20.2 12C18.7 15.7 12 20 12 20Z" />
        </svg>
      );
    case "lock":
      return (
        <svg aria-hidden="true" {...sharedProps} {...props}>
          <rect x="5" y="10" width="14" height="10" rx="2.5" />
          <path d="M8 10V7.5A4 4 0 0 1 12 3.5a4 4 0 0 1 4 4V10" />
        </svg>
      );
    case "mail":
      return (
        <svg aria-hidden="true" {...sharedProps} {...props}>
          <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
          <path d="m5 7 7 6 7-6" />
        </svg>
      );
    case "plus":
      return (
        <svg aria-hidden="true" {...sharedProps} {...props}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "search":
      return (
        <svg aria-hidden="true" {...sharedProps} {...props}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
      );
    case "arrow-up-right":
      return (
        <svg aria-hidden="true" {...sharedProps} {...props}>
          <path d="M8 16 16 8M10 8h6v6" />
        </svg>
      );
    default:
      return null;
  }
}
