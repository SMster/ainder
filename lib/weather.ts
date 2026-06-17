// Weather helpers for the upper-right weather widget.
//
// Data comes from Open-Meteo (https://open-meteo.com/) — free, no API key, and
// CORS-enabled, so the browser can fetch directly. The pure helpers below
// (CITIES, weatherCodeInfo, buildForecastUrl) carry no React/DOM/network deps so
// they can be unit-tested directly; only fetchCurrentWeather touches the network.

export type City = {
  name: string;
  latitude: number;
  longitude: number;
};

// The 5 cities shown in the expandable panel, hardcoded so no geocoding call is
// needed. Order is the display order.
export const CITIES: City[] = [
  { name: "New York", latitude: 40.7128, longitude: -74.006 },
  { name: "London", latitude: 51.5074, longitude: -0.1278 },
  { name: "Tokyo", latitude: 35.6762, longitude: 139.6503 },
  { name: "Sydney", latitude: -33.8688, longitude: 151.2093 },
  { name: "Dubai", latitude: 25.2048, longitude: 55.2708 },
];

// Fallback when the user denies (or the browser lacks) geolocation.
export const DEFAULT_CITY: City = CITIES[0];

export type WeatherInfo = { icon: string; label: string };

// Map a WMO weather interpretation code to an emoji icon + short label.
// Reference: https://open-meteo.com/en/docs (WMO Weather interpretation codes).
// Unknown codes fall back to a neutral thermometer.
export function weatherCodeInfo(code: number): WeatherInfo {
  switch (code) {
    case 0:
      return { icon: "☀️", label: "Clear" };
    case 1:
      return { icon: "🌤️", label: "Mainly clear" };
    case 2:
      return { icon: "⛅", label: "Partly cloudy" };
    case 3:
      return { icon: "☁️", label: "Overcast" };
    case 45:
    case 48:
      return { icon: "🌫️", label: "Fog" };
    case 51:
    case 53:
    case 55:
      return { icon: "🌦️", label: "Drizzle" };
    case 56:
    case 57:
      return { icon: "🌧️", label: "Freezing drizzle" };
    case 61:
    case 63:
    case 65:
      return { icon: "🌧️", label: "Rain" };
    case 66:
    case 67:
      return { icon: "🌧️", label: "Freezing rain" };
    case 71:
    case 73:
    case 75:
    case 77:
      return { icon: "🌨️", label: "Snow" };
    case 80:
    case 81:
    case 82:
      return { icon: "🌦️", label: "Rain showers" };
    case 85:
    case 86:
      return { icon: "🌨️", label: "Snow showers" };
    case 95:
      return { icon: "⛈️", label: "Thunderstorm" };
    case 96:
    case 99:
      return { icon: "⛈️", label: "Thunderstorm with hail" };
    default:
      return { icon: "🌡️", label: "Unknown" };
  }
}

// Build the Open-Meteo current-weather forecast URL for a coordinate.
export function buildForecastUrl(latitude: number, longitude: number): string {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,weather_code",
  });
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

// Raw temperature is kept in Celsius (Open-Meteo's default unit) and converted
// at display time, so the °C/°F toggle is instant and needs no refetch.
export type CurrentWeather = { tempC: number; code: number };

export type TempUnit = "C" | "F";

// Format a Celsius temperature for display in the chosen unit, e.g.
// formatTemp(25, "C") -> "25°", formatTemp(25, "F") -> "77°".
export function formatTemp(tempC: number, unit: TempUnit): string {
  const value = unit === "F" ? tempC * (9 / 5) + 32 : tempC;
  return `${Math.round(value)}°`;
}

// Fetch current weather for a coordinate from Open-Meteo. Thin network wrapper
// (not unit-tested; exercised via the running app).
export async function fetchCurrentWeather(
  latitude: number,
  longitude: number
): Promise<CurrentWeather> {
  const res = await fetch(buildForecastUrl(latitude, longitude));
  if (!res.ok) {
    throw new Error(`Open-Meteo request failed: ${res.status}`);
  }
  const data = await res.json();
  return {
    tempC: data.current.temperature_2m,
    code: data.current.weather_code,
  };
}
