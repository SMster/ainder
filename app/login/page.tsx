import { signIn, signUp } from "@/lib/auth-actions";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <main className="mx-auto mt-12 max-w-sm">
      <h1 className="mb-1 text-center text-2xl font-bold text-white">
        Welcome to{" "}
        <span className="bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent">
          AInder
        </span>
      </h1>
      <p className="mb-6 text-center text-sm text-slate-400">
        Sign in to start swiping on AI models.
      </p>

      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
        <GoogleSignInButton />

        <div className="my-4 flex items-center gap-3 text-xs text-slate-500">
          <span className="h-px flex-1 bg-white/10" />
          or use email
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <form className="flex flex-col gap-3">
        <label className="text-sm text-slate-300">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none focus:border-pink-500"
          />
        </label>
        <label className="text-sm text-slate-300">
          Password
          <input
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="current-password"
            className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none focus:border-pink-500"
          />
        </label>

        {error && (
          <p className="rounded-lg bg-rose-500/15 px-3 py-2 text-sm text-rose-300">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-300">
            {message}
          </p>
        )}

        <div className="mt-1 flex gap-2">
          <button
            formAction={signIn}
            className="flex-1 rounded-full bg-pink-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-pink-400"
          >
            Sign in
          </button>
          <button
            formAction={signUp}
            className="flex-1 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/40 hover:text-white"
          >
            Create account
          </button>
        </div>
        </form>
      </div>
    </main>
  );
}
