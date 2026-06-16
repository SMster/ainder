"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type Direction = "LEFT" | "RIGHT";

// Record (or update) the current user's decision on a model.
// LEFT = dismissed forever; RIGHT = match.
export async function recordSwipe(aiModelId: string, direction: Direction) {
  const user = await getCurrentUser();
  await prisma.swipe.upsert({
    where: { userId_aiModelId: { userId: user.id, aiModelId } },
    update: { direction },
    create: { userId: user.id, aiModelId, direction },
  });
  revalidatePath("/");
  revalidatePath("/matches");
}

// Remove a match by turning the RIGHT swipe into a LEFT (so it stays out of the
// deck but leaves the matches list).
export async function unmatch(aiModelId: string) {
  const user = await getCurrentUser();
  await prisma.swipe.update({
    where: { userId_aiModelId: { userId: user.id, aiModelId } },
    data: { direction: "LEFT" },
  });
  revalidatePath("/");
  revalidatePath("/matches");
}

// Phase 2: add or remove a feature from the current user's preferences.
export async function setPreference(featureId: string, enabled: boolean) {
  const user = await getCurrentUser();
  if (enabled) {
    await prisma.userPreference.upsert({
      where: { userId_featureId: { userId: user.id, featureId } },
      update: {},
      create: { userId: user.id, featureId },
    });
  } else {
    await prisma.userPreference.deleteMany({
      where: { userId: user.id, featureId },
    });
  }
  revalidatePath("/");
  revalidatePath("/matches");
  revalidatePath("/preferences");
}

// Clear all of the current user's swipes — repopulates the deck. Handy in dev.
export async function resetSwipes() {
  const user = await getCurrentUser();
  await prisma.swipe.deleteMany({ where: { userId: user.id } });
  revalidatePath("/");
  revalidatePath("/matches");
}
