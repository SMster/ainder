import type { ModelCardData } from "@/lib/data";
import { formatContext } from "@/lib/format";

const PROVIDER_GRADIENT: Record<string, string> = {
  Anthropic: "from-orange-500 to-amber-600",
  OpenAI: "from-emerald-500 to-teal-600",
  Google: "from-blue-500 to-indigo-600",
  Meta: "from-sky-500 to-blue-700",
};

export default function ModelCard({
  model,
  preferred = [],
}: {
  model: ModelCardData;
  preferred?: string[];
}) {
  const gradient = PROVIDER_GRADIENT[model.provider] ?? "from-fuchsia-500 to-purple-600";
  const ctx = formatContext(model.contextWindow);
  const want = new Set(preferred);
  const matched = model.features.filter((f) => want.has(f)).length;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
      {/* Banner */}
      <div
        className={`relative flex h-40 shrink-0 items-end bg-gradient-to-br ${gradient} p-5`}
      >
        {preferred.length > 0 && (
          <div className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-black/30 px-3 py-1 text-xs font-bold text-white">
            <span className={matched > 0 ? "text-emerald-300" : "text-slate-300"}>★</span>
            {matched}/{preferred.length} of your wants
          </div>
        )}
        <div className="absolute right-4 top-4 rounded-full bg-black/25 px-3 py-1 text-xs font-semibold text-white">
          {model.provider}
        </div>
        <div className="text-7xl font-black leading-none text-white/90 drop-shadow">
          {model.name.charAt(0)}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h2 className="text-2xl font-bold text-white">{model.name}</h2>
          {model.tagline && (
            <p className="mt-1 text-sm text-slate-300">{model.tagline}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {ctx && (
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-slate-200">
              {ctx}
            </span>
          )}
          {model.pricing && (
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium capitalize text-slate-200">
              {model.pricing}
            </span>
          )}
        </div>

        {model.description && (
          <p className="text-sm leading-relaxed text-slate-400">{model.description}</p>
        )}

        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          {model.features.map((f) => {
            const isMatch = want.has(f);
            const cls =
              preferred.length === 0
                ? "bg-pink-500/15 text-pink-200"
                : isMatch
                  ? "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/50"
                  : "bg-white/5 text-slate-400";
            return (
              <span
                key={f}
                className={`rounded-md px-2 py-1 text-xs font-medium ${cls}`}
              >
                {isMatch ? "✓ " : ""}
                {f}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
