import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// DEV AUTH SHIM
//
// This is a placeholder for Supabase Auth. The whole app reads the current user
// through getCurrentUser(), so swapping in real auth later means implementing
// ONLY this module (read the Supabase session, upsert a User keyed by the
// auth UUID) and adding a login UI — no changes to pages, actions, or queries.
//
// Per the design, User.id stores the Supabase auth.users.id (a UUID). Here we
// stand in with a single fixed dev user.
// ---------------------------------------------------------------------------

export const DEV_USER = {
  id: "dev-user-0001",
  email: "dev@local.test",
  name: "Dev User",
};

export type CurrentUser = typeof DEV_USER;

export async function getCurrentUser(): Promise<CurrentUser> {
  // Ensure the dev user exists so swipes have a valid FK target.
  await prisma.user.upsert({
    where: { id: DEV_USER.id },
    update: {},
    create: DEV_USER,
  });
  return DEV_USER;
}
