export function buildCanonicalHref(
  pathname: string,
  searchParams?: Record<string, string | undefined>,
) {
  const normalizedPath =
    pathname === "/" ? "/" : pathname.replace(/\/+$/, "") || "/";

  if (!searchParams) return normalizedPath;

  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const query = params.toString();
  return query ? `${normalizedPath}?${query}` : normalizedPath;
}

export function canonicalLink(href: string) {
  return {
    rel: "canonical",
    href,
  } as const;
}
