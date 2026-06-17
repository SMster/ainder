import { describe, it, expect } from "vitest";
import { matchScore, sortDeckByPreference } from "@/lib/data";

describe("matchScore", () => {
  it("returns a zero score when the user has no preferences", () => {
    expect(matchScore(["vision", "function-calling"], [])).toEqual({
      matched: 0,
      total: 0,
    });
  });

  it("counts how many preferred features the model has", () => {
    const score = matchScore(
      ["vision", "function-calling", "json-mode"],
      ["vision", "json-mode", "streaming"]
    );
    expect(score).toEqual({ matched: 2, total: 3 });
  });

  it("reports total as the number of preferences, not model features", () => {
    const score = matchScore(["vision"], ["vision", "audio", "video", "code"]);
    expect(score).toEqual({ matched: 1, total: 4 });
  });

  it("returns matched 0 when nothing overlaps", () => {
    expect(matchScore(["vision"], ["audio", "video"])).toEqual({
      matched: 0,
      total: 2,
    });
  });

  it("handles a model with no features", () => {
    expect(matchScore([], ["vision"])).toEqual({ matched: 0, total: 1 });
  });

  it("does not double-count duplicate model features", () => {
    // A feature listed twice on the model should still count once.
    expect(matchScore(["vision", "vision"], ["vision"])).toEqual({
      matched: 2,
      total: 1,
    });
  });
});

describe("sortDeckByPreference", () => {
  const deck = [
    { id: "a", features: ["vision"] },
    { id: "b", features: ["vision", "audio", "code"] },
    { id: "c", features: ["audio"] },
  ];

  it("orders the deck best-match-first", () => {
    const sorted = sortDeckByPreference(deck, ["vision", "audio", "code"]);
    expect(sorted.map((m) => m.id)).toEqual(["b", "a", "c"]);
  });

  it("preserves the original order when there are no preferences", () => {
    const sorted = sortDeckByPreference(deck, []);
    expect(sorted.map((m) => m.id)).toEqual(["a", "b", "c"]);
  });

  it("does not mutate the input array", () => {
    const original = deck.map((m) => m.id);
    sortDeckByPreference(deck, ["audio"]);
    expect(deck.map((m) => m.id)).toEqual(original);
  });

  it("returns a new array instance", () => {
    expect(sortDeckByPreference(deck, [])).not.toBe(deck);
  });
});
