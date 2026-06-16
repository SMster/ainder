"use client";

import { useState } from "react";
import { setPreference } from "@/lib/actions";
import type { FeatureItem } from "@/lib/data";

export default function PreferenceEditor({
  features,
  initialSelected,
}: {
  features: FeatureItem[];
  initialSelected: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialSelected)
  );

  function toggle(id: string) {
    const enabled = !selected.has(id);
    setSelected((prev) => {
      const next = new Set(prev);
      if (enabled) next.add(id);
      else next.delete(id);
      return next;
    });
    void setPreference(id, enabled);
  }

  // Group features by category for display.
  const groups = new Map<string, FeatureItem[]>();
  for (const f of features) {
    const key = f.category ?? "other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(f);
  }

  return (
    <div className="flex flex-col gap-6">
      {[...groups.entries()].map(([category, items]) => (
        <section key={category}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {category}
          </h2>
          <div className="flex flex-wrap gap-2">
            {items.map((f) => {
              const on = selected.has(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(f.id)}
                  className={
                    "rounded-full px-3 py-1.5 text-sm font-medium transition " +
                    (on
                      ? "bg-pink-500 text-white shadow"
                      : "border border-white/15 text-slate-300 hover:border-white/40 hover:text-white")
                  }
                >
                  {on ? "✓ " : ""}
                  {f.name}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
