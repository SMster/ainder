import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Shape of an AI model as shown on a swipe card / match row.
export type ModelCardData = {
  id: string;
  name: string;
  provider: string;
  tagline: string | null;
  description: string | null;
  contextWindow: number | null;
  pricing: string | null;
  features: string[];
};

const withFeatures = Prisma.validator<Prisma.AIModelDefaultArgs>()({
  include: { features: { include: { feature: true } } },
});
type ModelWithFeatures = Prisma.AIModelGetPayload<typeof withFeatures>;

function toCard(m: ModelWithFeatures): ModelCardData {
  return {
    id: m.id,
    name: m.name,
    provider: m.provider,
    tagline: m.tagline,
    description: m.description,
    contextWindow: m.contextWindow,
    pricing: m.pricing,
    features: m.features.map((f) => f.feature.name),
  };
}

// The deck = models the user has not swiped on yet (no Swipe row).
export async function getDeck(userId: string): Promise<ModelCardData[]> {
  const swiped = await prisma.swipe.findMany({
    where: { userId },
    select: { aiModelId: true },
  });
  const swipedIds = swiped.map((s) => s.aiModelId);

  const models = await prisma.aIModel.findMany({
    where: { id: { notIn: swipedIds } },
    include: { features: { include: { feature: true } } },
    orderBy: { createdAt: "asc" },
  });
  return models.map(toCard);
}

export type MatchData = ModelCardData & { matchedAt: Date };

// Matches = models the user swiped RIGHT on.
export async function getMatches(userId: string): Promise<MatchData[]> {
  const swipes = await prisma.swipe.findMany({
    where: { userId, direction: "RIGHT" },
    include: { aiModel: { include: { features: { include: { feature: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  return swipes.map((s) => ({ ...toCard(s.aiModel), matchedAt: s.createdAt }));
}

// ---- Phase 2: preferences --------------------------------------------------

export type FeatureItem = { id: string; name: string; category: string | null };

// All features, for the preference editor.
export async function getAllFeatures(): Promise<FeatureItem[]> {
  return prisma.feature.findMany({
    select: { id: true, name: true, category: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
}

// The current user's preferred features.
export async function getPreferredFeatures(userId: string): Promise<FeatureItem[]> {
  const prefs = await prisma.userPreference.findMany({
    where: { userId },
    include: { feature: true },
  });
  return prefs.map((p) => ({
    id: p.feature.id,
    name: p.feature.name,
    category: p.feature.category,
  }));
}

// How many of the user's preferred features a model has (and the total).
export function matchScore(
  modelFeatures: string[],
  preferred: string[]
): { matched: number; total: number } {
  if (preferred.length === 0) return { matched: 0, total: 0 };
  const want = new Set(preferred);
  const matched = modelFeatures.filter((f) => want.has(f)).length;
  return { matched, total: preferred.length };
}

// Order a deck best-match-first for the given preferred features. Returns a new
// array (does not mutate the input). With no preferences the original order is
// preserved (a stable sort over an all-equal key).
export function sortDeckByPreference<T extends { features: string[] }>(
  deck: T[],
  preferred: string[]
): T[] {
  if (preferred.length === 0) return [...deck];
  return [...deck].sort(
    (a, b) =>
      matchScore(b.features, preferred).matched -
      matchScore(a.features, preferred).matched
  );
}
