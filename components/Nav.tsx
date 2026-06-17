import Link from "next/link";
import { getOptionalUser } from "@/lib/auth";
import { signOut } from "@/lib/auth-actions";

export default async function Nav() {
  const user = await getOptionalUser();

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/60 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent">
            AInder
          </span>
        </Link>
        <div className="flex items-center gap-1 text-sm font-medium">
          {user ? (
            <>
              <Link
                href="/"
                className="rounded-full px-3 py-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                Discover
              </Link>
              <Link
                href="/matches"
                className="rounded-full px-3 py-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                Matches
              </Link>
              <Link
                href="/preferences"
                className="rounded-full px-3 py-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                Preferences
              </Link>
              <form action={signOut} className="ml-2 flex items-center gap-2">
                <span className="hidden text-xs text-slate-500 sm:inline">
                  {user.email}
                </span>
                <button
                  type="submit"
                  className="rounded-full border border-white/10 px-3 py-1.5 text-slate-300 transition hover:border-rose-500/60 hover:text-rose-400"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-pink-500 px-3 py-1.5 text-white transition hover:bg-pink-400"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
