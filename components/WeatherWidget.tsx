"use client";

import { useEffect, useRef, useState } from "react";
import {
  CITIES,
  DEFAULT_CITY,
  fetchCurrentWeather,
  formatTemp,
  weatherCodeInfo,
  type CurrentWeather,
  type TempUnit,
} from "@/lib/weather";

type LocalState = {
  label: string;
  weather: CurrentWeather | null;
  loading: boolean;
};

type CityWeather = {
  name: string;
  weather: CurrentWeather | null;
};

export default function WeatherWidget() {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState<LocalState>({
    label: "Your location",
    weather: null,
    loading: true,
  });
  const [cities, setCities] = useState<CityWeather[] | null>(null);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [unit, setUnit] = useState<TempUnit>("F");
  const containerRef = useRef<HTMLDivElement>(null);

  // Resolve the corner button: try geolocation, fall back to DEFAULT_CITY.
  useEffect(() => {
    let cancelled = false;

    async function loadFor(
      label: string,
      latitude: number,
      longitude: number
    ) {
      try {
        const weather = await fetchCurrentWeather(latitude, longitude);
        if (!cancelled) setLocal({ label, weather, loading: false });
      } catch {
        if (!cancelled)
          setLocal({ label, weather: null, loading: false });
      }
    }

    function fallback() {
      void loadFor(DEFAULT_CITY.name, DEFAULT_CITY.latitude, DEFAULT_CITY.longitude);
    }

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          void loadFor(
            "Your location",
            pos.coords.latitude,
            pos.coords.longitude
          ),
        () => fallback(),
        { timeout: 8000 }
      );
    } else {
      fallback();
    }

    return () => {
      cancelled = true;
    };
  }, []);

  // Close the panel when clicking outside of it.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Lazily load the 5 cities the first time the panel opens.
  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && cities === null && !citiesLoading) {
      setCitiesLoading(true);
      const results = await Promise.all(
        CITIES.map(async (c) => {
          try {
            const weather = await fetchCurrentWeather(c.latitude, c.longitude);
            return { name: c.name, weather };
          } catch {
            return { name: c.name, weather: null };
          }
        })
      );
      setCities(results);
      setCitiesLoading(false);
    }
  }

  const buttonText = local.loading
    ? "🌡️ —"
    : local.weather
      ? `${weatherCodeInfo(local.weather.code).icon} ${formatTemp(local.weather.tempC, unit)}`
      : "🌡️ —";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label="Show weather for major cities"
        className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/70 px-3 py-1.5 text-sm font-medium text-slate-200 shadow-2xl backdrop-blur transition hover:border-white/25 hover:text-white"
      >
        <span className="tabular-nums">{buttonText}</span>
        <span className="hidden text-xs text-slate-400 sm:inline">
          {local.label}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-white/10 bg-slate-900/90 p-2 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Major cities
            </span>
            <div className="flex rounded-full border border-white/10 p-0.5 text-xs font-medium">
              {(["C", "F"] as TempUnit[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  aria-pressed={unit === u}
                  className={
                    "rounded-full px-2 py-0.5 transition " +
                    (unit === u
                      ? "bg-white/15 text-white"
                      : "text-slate-400 hover:text-white")
                  }
                >
                  °{u}
                </button>
              ))}
            </div>
          </div>
          {citiesLoading || cities === null ? (
            <div className="px-2 py-3 text-sm text-slate-400">Loading…</div>
          ) : (
            <ul className="space-y-0.5">
              {cities.map((c) => {
                const info =
                  c.weather && weatherCodeInfo(c.weather.code);
                return (
                  <li
                    key={c.name}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-slate-200 transition hover:bg-white/5"
                  >
                    <span className="flex items-center gap-2">
                      <span aria-hidden>{info ? info.icon : "🌡️"}</span>
                      <span>{c.name}</span>
                    </span>
                    <span className="tabular-nums text-slate-300">
                      {c.weather ? formatTemp(c.weather.tempC, unit) : "—"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
