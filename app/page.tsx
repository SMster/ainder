import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getDeck, getPreferredFeatures, sortDeckByPreference } from "@/lib/data";
import SwipeDeck from "@/components/SwipeDeck";

export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const user = await getCurrentUser();
  const [deck, preferredFeatures] = await Promise.all([
    getDeck(user.id),
    getPreferredFeatures(user.id),
  ]);
  const preferred = preferredFeatures.map((f) => f.name);

  // With preferences set, surface the best matches first.
  const sortedDeck = sortDeckByPreference(deck, preferred);

  // Key the deck by its contents so a reset (which refetches) remounts it,
  // while ordinary optimistic swipes leave it mounted.
  const deckKey = sortedDeck.map((m) => m.id).join("|") || "empty";

  return (
    <main>
      <h1 className="mb-1 text-center text-2xl font-bold text-white">
        Find your AI match
      </h1>
      <p className="mb-6 text-center text-sm text-slate-400">
        {preferred.length > 0 ? (
          <>Sorted by your <Link href="/preferences" className="text-pink-300 underline">preferences</Link></>
        ) : (
          <>Set your <Link href="/preferences" className="text-pink-300 underline">preferences</Link> to highlight matching features</>
        )}
      </p>
      <SwipeDeck key={deckKey} initialModels={sortedDeck} preferred={preferred} />
    </main>
  );
}
