#!/usr/bin/env node
/**
 * End-to-end MCP smoke test: spawns the built server over stdio, performs the
 * real MCP handshake, lists tools, and calls get_current_weather for Warsaw.
 * Exits non-zero on any failure. This is the same path Claude Desktop uses.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "node",
  args: ["dist/index.js"],
});
const client = new Client({ name: "smoke-test", version: "1.0.0" });

await client.connect(transport);

const { tools } = await client.listTools();
console.log("Tools exposed:", tools.map((t) => t.name).join(", "));
if (tools.length !== 3) throw new Error(`expected 3 tools, got ${tools.length}`);

const res = await client.callTool({
  name: "get_current_weather",
  arguments: { location: "Warsaw" },
});
const text = res.content[0].text;
console.log("\n--- get_current_weather('Warsaw') ---\n" + text);
if (!/Warsaw/.test(text) || !/Temperature/.test(text)) {
  throw new Error("unexpected tool output");
}

const fc = await client.callTool({
  name: "get_forecast",
  arguments: { location: "Zakopane", days: 3 },
});
console.log("\n--- get_forecast('Zakopane', 3) ---\n" + fc.content[0].text);

await client.close();
console.log("\n✅ MCP smoke test passed");
