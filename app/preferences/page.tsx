import { getCurrentUser } from "@/lib/auth";
import { getAllFeatures, getPreferredFeatures } from "@/lib/data";
import PreferenceEditor from "@/components/PreferenceEditor";

export const dynamic = "force-dynamic";

export default async function PreferencesPage() {
  const user = await getCurrentUser();
  const [features, preferred] = await Promise.all([
    getAllFeatures(),
    getPreferredFeatures(user.id),
  ]);

  return (
    <main>
      <h1 className="mb-1 text-2xl font-bold text-white">Your AI preferences</h1>
      <p className="mb-6 text-sm text-slate-400">
        Pick the features you care about. Matching features are highlighted on cards,
        and the deck is sorted to show your best matches first.
      </p>
      <PreferenceEditor
        features={features}
        initialSelected={preferred.map((f) => f.id)}
      />
    </main>
  );
}
