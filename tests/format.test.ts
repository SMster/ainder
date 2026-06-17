import { describe, it, expect } from "vitest";
import { formatContext } from "@/lib/format";

describe("formatContext", () => {
  it("returns null for null", () => {
    expect(formatContext(null)).toBeNull();
  });

  it("returns null for zero", () => {
    expect(formatContext(0)).toBeNull();
  });

  it("formats millions with an M suffix", () => {
    expect(formatContext(1_000_000)).toBe("1M tokens");
    expect(formatContext(2_000_000)).toBe("2M tokens");
  });

  it("formats fractional millions", () => {
    expect(formatContext(1_500_000)).toBe("1.5M tokens");
  });

  it("formats thousands with a rounded K suffix", () => {
    expect(formatContext(128_000)).toBe("128K tokens");
    expect(formatContext(1_000)).toBe("1K tokens");
    expect(formatContext(8_192)).toBe("8K tokens");
  });

  it("formats sub-thousand counts verbatim", () => {
    expect(formatContext(512)).toBe("512 tokens");
  });
});
