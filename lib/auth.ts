import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export type CurrentUser = { id: string; email: string; name: string | null };

// The Supabase auth user, or null if not signed in. Use in places that must
// render for both signed-in and signed-out visitors (e.g. <Nav>, /login).
export async function getOptionalUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// The current app user. Redirects to /login if not authenticated, and upserts a
// User row keyed by the Supabase auth UUID (User.id == auth.users.id) so app
// data lines up with Supabase Auth identity. Pages and actions call this.
export async function getCurrentUser(): Promise<CurrentUser> {
  const authUser = await getOptionalUser();
  if (!authUser) redirect("/login");

  const email = authUser.email ?? "";
  const name = (authUser.user_metadata?.name as string | undefined) ?? null;

  const dbUser = await prisma.user.upsert({
    where: { id: authUser.id },
    update: { email },
    create: { id: authUser.id, email, name },
  });

  return { id: dbUser.id, email: dbUser.email, name: dbUser.name };
}
