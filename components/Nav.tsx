import Link from "next/link";

export default function Nav() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/60 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent">
            AInder
          </span>
        </Link>
        <div className="flex items-center gap-1 text-sm font-medium">
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
        </div>
      </nav>
    </header>
  );
}
