import { describe, it, expect } from "vitest";
import {
  buildForecastUrl,
  weatherCodeInfo,
  formatTemp,
  CITIES,
} from "@/lib/weather";

describe("weatherCodeInfo", () => {
  it("maps clear sky", () => {
    expect(weatherCodeInfo(0)).toEqual({ icon: "☀️", label: "Clear" });
  });

  it("maps a range of rain codes to the same icon", () => {
    expect(weatherCodeInfo(61).icon).toBe("🌧️");
    expect(weatherCodeInfo(63).icon).toBe("🌧️");
    expect(weatherCodeInfo(65).icon).toBe("🌧️");
  });

  it("maps thunderstorm codes", () => {
    expect(weatherCodeInfo(95).label).toBe("Thunderstorm");
    expect(weatherCodeInfo(99).label).toBe("Thunderstorm with hail");
  });

  it("falls back to a neutral icon for unknown codes", () => {
    expect(weatherCodeInfo(123)).toEqual({ icon: "🌡️", label: "Unknown" });
    expect(weatherCodeInfo(-1).label).toBe("Unknown");
  });
});

describe("buildForecastUrl", () => {
  it("targets the Open-Meteo forecast endpoint", () => {
    expect(buildForecastUrl(0, 0)).toContain(
      "https://api.open-meteo.com/v1/forecast?"
    );
  });

  it("includes the coordinates and requested current fields", () => {
    const url = buildForecastUrl(40.7128, -74.006);
    const params = new URL(url).searchParams;
    expect(params.get("latitude")).toBe("40.7128");
    expect(params.get("longitude")).toBe("-74.006");
    expect(params.get("current")).toBe("temperature_2m,weather_code");
  });

  it("encodes negative longitudes safely", () => {
    const url = buildForecastUrl(51.5074, -0.1278);
    expect(url).toContain("longitude=-0.1278");
  });
});

describe("formatTemp", () => {
  it("renders Celsius unchanged, rounded, with a degree sign", () => {
    expect(formatTemp(25, "C")).toBe("25°");
    expect(formatTemp(13.4, "C")).toBe("13°");
    expect(formatTemp(13.6, "C")).toBe("14°");
  });

  it("converts Celsius to Fahrenheit", () => {
    expect(formatTemp(25, "F")).toBe("77°"); // 25°C = 77°F
    expect(formatTemp(0, "F")).toBe("32°");
    expect(formatTemp(-40, "F")).toBe("-40°"); // the crossover point
  });
});

describe("CITIES", () => {
  it("lists the five expected cities in order", () => {
    expect(CITIES.map((c) => c.name)).toEqual([
      "New York",
      "London",
      "Tokyo",
      "Sydney",
      "Dubai",
    ]);
  });
});
