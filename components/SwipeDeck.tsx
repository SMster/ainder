"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import SwipeCard from "./SwipeCard";
import ModelCard from "./ModelCard";
import { recordSwipe, resetSwipes } from "@/lib/actions";
import type { ModelCardData } from "@/lib/data";

type Direction = "LEFT" | "RIGHT";

export default function SwipeDeck({
  initialModels,
  preferred = [],
}: {
  initialModels: ModelCardData[];
  preferred?: string[];
}) {
  const [models, setModels] = useState(initialModels);
  const [exitDir, setExitDir] = useState(0);
  const router = useRouter();

  const top = models[0];

  function swipe(direction: Direction) {
    if (!top) return;
    setExitDir(direction === "RIGHT" ? 1 : -1);
    // Persist in the background; optimistically advance the deck.
    void recordSwipe(top.id, direction);
    setModels((prev) => prev.slice(1));
  }

  async function reset() {
    await resetSwipes();
    router.refresh();
  }

  if (!top) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-slate-900/60 px-6 py-16 text-center">
        <div className="text-5xl">🎉</div>
        <h2 className="text-xl font-bold text-white">You&apos;ve seen everyone!</h2>
        <p className="max-w-xs text-sm text-slate-400">
          No more AIs to swipe on. Check your matches, or reset the deck to start over.
        </p>
        <button
          onClick={reset}
          className="mt-2 rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
        >
          Reset deck
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative mx-auto h-[540px] w-full max-w-sm">
        {/* Stacked background cards for depth (non-interactive) */}
        {models.slice(1, 3).reverse().map((m, i, arr) => {
          const depth = arr.length - i; // 1 (further) .. 2 (nearer)
          return (
            <div
              key={m.id}
              className="absolute inset-0"
              style={{
                transform: `scale(${1 - depth * 0.04}) translateY(${depth * 14}px)`,
                opacity: 0.7,
                zIndex: 0,
              }}
            >
              <ModelCard model={m} preferred={preferred} />
            </div>
          );
        })}

        <AnimatePresence custom={exitDir} initial={false}>
          <SwipeCard key={top.id} model={top} onSwipe={swipe} preferred={preferred} />
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6">
        <button
          aria-label="Pass"
          onClick={() => swipe("LEFT")}
          className="flex h-16 w-16 items-center justify-center rounded-full border border-rose-500/40 bg-slate-900 text-3xl text-rose-500 shadow-lg transition hover:scale-105 hover:border-rose-500"
        >
          ✕
        </button>
        <button
          aria-label="Like"
          onClick={() => swipe("RIGHT")}
          className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/40 bg-slate-900 text-3xl text-emerald-400 shadow-lg transition hover:scale-105 hover:border-emerald-400"
        >
          ♥
        </button>
      </div>

      <p className="text-xs text-slate-500">Drag the card or use the buttons</p>
    </div>
  );
}
