export function normalizeUrl(rawValue: string) {
  const trimmed = rawValue.trim();

  if (!trimmed) {
    throw new Error("A website URL is required.");
  }

  const withProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    return url.toString();
  } catch {
    throw new Error("Enter a valid website URL.");
  }
}

export function getFaviconCandidates(rawUrl: string) {
  try {
    const parsedUrl = new URL(rawUrl);
    const origin = parsedUrl.origin;

    return [
      `${origin}/favicon.ico`,
      `https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(origin)}`
    ];
  } catch {
    return [];
  }
}

export function matchesQuery(query: string, values: Array<string | null | undefined>) {
  return values.join(" ").toLowerCase().includes(query);
}
