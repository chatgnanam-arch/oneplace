import { useEffect, useState } from "react";
import { getFaviconCandidates } from "../lib/url";
import type { LinkIconKey } from "../types/catalog";
import { IconGlyph } from "./IconGlyph";

interface WebsiteIconProps {
  className?: string;
  fallbackName: LinkIconKey | "bookmark";
  url: string;
}

export function WebsiteIcon({
  className,
  fallbackName,
  url
}: WebsiteIconProps) {
  const [candidateIndex, setCandidateIndex] = useState(0);
  const candidates = getFaviconCandidates(url);
  const activeCandidate = candidates[candidateIndex] ?? null;

  useEffect(() => {
    setCandidateIndex(0);
  }, [url]);

  if (!activeCandidate) {
    return <IconGlyph className={className} name={fallbackName} />;
  }

  return (
    <img
      alt=""
      aria-hidden="true"
      className={className}
      decoding="async"
      loading="lazy"
      referrerPolicy="no-referrer"
      src={activeCandidate}
      onError={() => {
        setCandidateIndex((current) => current + 1);
      }}
    />
  );
}
