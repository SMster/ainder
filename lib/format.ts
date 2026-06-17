// Pure presentation helpers (no React) so they can be unit-tested directly.

// Render a context-window token count as a compact human string, e.g.
// 1_000_000 -> "1M tokens", 128_000 -> "128K tokens", 512 -> "512 tokens".
// Returns null for null/zero so callers can omit the chip entirely.
export function formatContext(tokens: number | null): string | null {
  if (!tokens) return null;
  if (tokens >= 1_000_000) return (tokens / 1_000_000).toString() + "M tokens";
  if (tokens >= 1_000) return Math.round(tokens / 1000) + "K tokens";
  return tokens + " tokens";
}
