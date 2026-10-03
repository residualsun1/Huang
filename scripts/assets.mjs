import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

// Compute on each build, including watch rebuilds, rather than retaining a stale cache.
export function assetUrl(pathname) {
  const file = new URL(`../public${pathname}`, import.meta.url);
  const version = createHash("sha256").update(readFileSync(file)).digest("hex").slice(0, 12);
  return `${pathname}?v=${version}`;
}
