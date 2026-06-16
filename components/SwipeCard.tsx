"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import ModelCard from "./ModelCard";
import type { ModelCardData } from "@/lib/data";

type Direction = "LEFT" | "RIGHT";

const exitVariants = {
  exit: (dir: number) => ({
    x: dir * 700,
    opacity: 0,
    rotate: dir * 20,
    transition: { duration: 0.3 },
  }),
};

export default function SwipeCard({
  model,
  onSwipe,
  preferred,
}: {
  model: ModelCardData;
  onSwipe: (dir: Direction) => void;
  preferred?: string[];
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-14, 14]);
  const likeOpacity = useTransform(x, [40, 160], [0, 1]);
  const nopeOpacity = useTransform(x, [-160, -40], [1, 0]);

  return (
    <motion.div
      className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
      style={{ x, rotate }}
      drag="x"
      dragSnapToOrigin
      dragElastic={0.6}
      variants={exitVariants}
      exit="exit"
      onDragEnd={(_, info) => {
        if (info.offset.x > 120) onSwipe("RIGHT");
        else if (info.offset.x < -120) onSwipe("LEFT");
      }}
      whileTap={{ scale: 1.01 }}
    >
      {/* LIKE / NOPE drag overlays */}
      <motion.div
        style={{ opacity: likeOpacity }}
        className="pointer-events-none absolute left-5 top-5 z-10 rotate-[-12deg] rounded-lg border-4 border-emerald-400 px-3 py-1 text-2xl font-black tracking-wider text-emerald-400"
      >
        LIKE
      </motion.div>
      <motion.div
        style={{ opacity: nopeOpacity }}
        className="pointer-events-none absolute right-5 top-5 z-10 rotate-[12deg] rounded-lg border-4 border-rose-500 px-3 py-1 text-2xl font-black tracking-wider text-rose-500"
      >
        NOPE
      </motion.div>

      <ModelCard model={model} preferred={preferred} />
    </motion.div>
  );
}
