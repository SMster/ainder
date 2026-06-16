import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getMatches, getPreferredFeatures, matchScore } from "@/lib/data";
import { unmatch } from "@/lib/actions";

export const dynamic = "force-dynamic";

const PROVIDER_GRADIENT: Record<string, string> = {
  Anthropic: "from-orange-500 to-amber-600",
  OpenAI: "from-emerald-500 to-teal-600",
  Google: "from-blue-500 to-indigo-600",
  Meta: "from-sky-500 to-blue-700",
};

export default async function MatchesPage() {
  const user = await getCurrentUser();
  const [matches, preferredFeatures] = await Promise.all([
    getMatches(user.id),
    getPreferredFeatures(user.id),
  ]);
  const preferred = preferredFeatures.map((f) => f.name);
  const want = new Set(preferred);

  // Inline server action: read the model id from the form and unmatch.
  async function removeMatch(formData: FormData) {
    "use server";
    await unmatch(String(formData.get("aiModelId")));
  }

  return (
    <main>
      <h1 className="mb-1 text-2xl font-bold text-white">Your matches</h1>
      <p className="mb-6 text-sm text-slate-400">
        {matches.length} AI{matches.length === 1 ? "" : "s"} you&apos;re compatible with.
      </p>

      {matches.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-6 py-12 text-center">
          <p className="text-slate-300">No matches yet.</p>
          <Link
            href="/"
            className="mt-3 inline-block rounded-full bg-pink-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-pink-400"
          >
            Start swiping
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {matches.map((m) => {
            const gradient =
              PROVIDER_GRADIENT[m.provider] ?? "from-fuchsia-500 to-purple-600";
            return (
              <li
                key={m.id}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-900/70 p-4"
              >
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-2xl font-black text-white`}
                >
                  {m.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <h3 className="truncate font-semibold text-white">{m.name}</h3>
                    <span className="shrink-0 text-xs text-slate-400">{m.provider}</span>
                    {preferred.length > 0 && (
                      <span className="shrink-0 text-xs font-semibold text-emerald-300">
                        ★ {matchScore(m.features, preferred).matched}/{preferred.length}
                      </span>
                    )}
                  </div>
                  {m.tagline && (
                    <p className="truncate text-sm text-slate-400">{m.tagline}</p>
                  )}
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {m.features.slice(0, 5).map((f) => {
                      const isMatch = want.has(f);
                      const cls =
                        preferred.length === 0
                          ? "bg-pink-500/15 text-pink-200"
                          : isMatch
                            ? "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/40"
                            : "bg-white/5 text-slate-400";
                      return (
                        <span
                          key={f}
                          className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${cls}`}
                        >
                          {isMatch ? "✓ " : ""}
                          {f}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <form action={removeMatch}>
                  <input type="hidden" name="aiModelId" value={m.id} />
                  <button
                    type="submit"
                    className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-rose-500/60 hover:text-rose-400"
                  >
                    Unmatch
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
