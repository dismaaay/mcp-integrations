/**
 * Tests for the core weather logic.
 *
 * - describeWeatherCode: pure, offline, always runs.
 * - geocode / getCurrentWeather / getForecast: hit the live Open-Meteo API.
 *   They are skipped automatically when OFFLINE=1 (e.g. CI without network).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  describeWeatherCode,
  geocode,
  getCurrentWeather,
  getForecast,
} from "./weather.ts";

const online = process.env.OFFLINE !== "1";

test("describeWeatherCode maps known WMO codes", () => {
  assert.equal(describeWeatherCode(0), "Clear sky");
  assert.equal(describeWeatherCode(95), "Thunderstorm");
});

test("describeWeatherCode handles unknown codes gracefully", () => {
  assert.match(describeWeatherCode(123), /Unknown/);
});

test("geocode rejects empty input", async () => {
  await assert.rejects(() => geocode("   "), /empty/);
});

test("geocode rejects nonsense locations", { skip: !online }, async () => {
  await assert.rejects(() => geocode("zzzxxxqqq-not-a-place-999"), /No location/);
});

test("geocode resolves a real city", { skip: !online }, async () => {
  const g = await geocode("Warsaw");
  assert.equal(g.country, "Poland");
  assert.ok(Math.abs(g.latitude - 52.23) < 1);
  assert.ok(Math.abs(g.longitude - 21.0) < 1);
});

test("getCurrentWeather returns a plausible reading", { skip: !online }, async () => {
  const w = await getCurrentWeather("Kraków");
  assert.ok(typeof w.temperatureC === "number");
  assert.ok(w.temperatureC > -60 && w.temperatureC < 60);
  assert.ok(w.conditions.length > 0);
});

test("getForecast clamps and returns N days", { skip: !online }, async () => {
  const f = await getForecast("Gdańsk", 3);
  assert.equal(f.days.length, 3);
  for (const d of f.days) {
    assert.ok(d.maxC >= d.minC);
  }
});
