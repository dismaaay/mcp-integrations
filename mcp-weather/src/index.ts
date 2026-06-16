#!/usr/bin/env node
/**
 * mcp-weather — a Model Context Protocol server that gives an MCP client
 * (Claude Desktop, Cursor, Claude Code, …) live weather data.
 *
 * Transport: stdio. Exposes three tools backed by the free, key-less
 * Open-Meteo API. See README.md for the client config snippet.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  geocode,
  getCurrentWeather,
  getForecast,
} from "./weather.js";

const server = new McpServer({
  name: "mcp-weather",
  version: "1.0.0",
});

server.registerTool(
  "get_current_weather",
  {
    title: "Get current weather",
    description:
      "Get the current weather conditions for a place by name (city, town, landmark). " +
      "Returns temperature, feels-like, humidity, wind and a human-readable condition.",
    inputSchema: {
      location: z
        .string()
        .describe('Place name, e.g. "Warsaw", "Kraków", "Berlin", "Tokyo".'),
    },
  },
  async ({ location }) => {
    const w = await getCurrentWeather(location);
    const text =
      `Current weather in ${w.location} (as of ${w.observedAt}):\n` +
      `• Conditions: ${w.conditions}${w.isDay ? " (day)" : " (night)"}\n` +
      `• Temperature: ${w.temperatureC}°C (feels like ${w.apparentTemperatureC}°C)\n` +
      `• Humidity: ${w.relativeHumidity}%\n` +
      `• Wind: ${w.windSpeedKmh} km/h`;
    return {
      content: [{ type: "text", text }],
    };
  },
);

server.registerTool(
  "get_forecast",
  {
    title: "Get multi-day forecast",
    description:
      "Get a daily weather forecast (1–16 days) for a place by name. " +
      "Returns min/max temperature, conditions and precipitation per day.",
    inputSchema: {
      location: z.string().describe("Place name, e.g. 'Gdańsk'."),
      days: z
        .number()
        .int()
        .min(1)
        .max(16)
        .default(7)
        .describe("Number of days to forecast (1–16, default 7)."),
    },
  },
  async ({ location, days }) => {
    const f = await getForecast(location, days);
    const lines = f.days.map(
      (d) =>
        `${d.date}: ${d.minC}–${d.maxC}°C, ${d.conditions}` +
        (d.precipitationProbabilityPct != null
          ? `, ${d.precipitationProbabilityPct}% precip (${d.precipitationMm} mm)`
          : ""),
    );
    return {
      content: [
        { type: "text", text: `Forecast for ${f.location}:\n${lines.join("\n")}` },
      ],
    };
  },
);

server.registerTool(
  "geocode_location",
  {
    title: "Geocode a place name",
    description:
      "Resolve a place name to latitude/longitude, country and timezone. " +
      "Useful when you need coordinates rather than weather.",
    inputSchema: {
      location: z.string().describe("Place name to resolve."),
    },
  },
  async ({ location }) => {
    const g = await geocode(location);
    return {
      content: [
        {
          type: "text",
          text:
            `${g.name}, ${g.admin1 ? g.admin1 + ", " : ""}${g.country}\n` +
            `Latitude: ${g.latitude}, Longitude: ${g.longitude}\n` +
            `Timezone: ${g.timezone}`,
        },
      ],
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Logs MUST go to stderr — stdout is reserved for the MCP protocol.
  console.error("mcp-weather running on stdio");
}

main().catch((err) => {
  console.error("Fatal error starting mcp-weather:", err);
  process.exit(1);
});
