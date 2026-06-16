#!/usr/bin/env node
// MCP server: renders this project's Prisma schema as an interactive ER diagram
// (dbdiagram.io style) and opens it in the default browser. Also exposes DBML
// and JSON views of the schema. Pure stdio MCP server, no external services.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { exec } from "node:child_process";
import { parseSchema, toDbml } from "./parse-schema.js";
import { buildHtml } from "./render-html.js";

// Default schema location: SCHEMA_PATH env, else <project>/prisma/schema.prisma
// relative to the current working directory.
const DEFAULT_SCHEMA =
  process.env.SCHEMA_PATH || path.resolve(process.cwd(), "prisma", "schema.prisma");

function resolveSchemaPath(override) {
  return path.resolve(override || DEFAULT_SCHEMA);
}

async function loadParsed(schemaPath) {
  if (!existsSync(schemaPath)) {
    throw new Error("Schema file not found at: " + schemaPath);
  }
  const text = await readFile(schemaPath, "utf8");
  return parseSchema(text);
}

function openInBrowser(target) {
  let cmd;
  if (process.platform === "win32") cmd = 'start "" "' + target + '"';
  else if (process.platform === "darwin") cmd = 'open "' + target + '"';
  else cmd = 'xdg-open "' + target + '"';
  return new Promise((resolve) => {
    exec(cmd, { shell: true }, () => resolve());
  });
}

const server = new McpServer({ name: "schema-viewer", version: "0.1.0" });

server.tool(
  "show_schema",
  "Render the project's Prisma database schema as an interactive ER diagram (dbdiagram.io style) and open it in the browser. Returns the path to the generated HTML.",
  { schemaPath: z.string().optional().describe("Optional path to a .prisma schema file. Defaults to the project schema.") },
  async ({ schemaPath }) => {
    const resolved = resolveSchemaPath(schemaPath);
    const data = await loadParsed(resolved);
    const html = buildHtml(data, "Schema — " + path.basename(path.dirname(resolved)));
    const out = path.join(tmpdir(), "prisma-schema-diagram.html");
    await writeFile(out, html, "utf8");
    await openInBrowser(out);
    const summary =
      "Opened ER diagram in your browser.\n" +
      "Tables: " +
      data.tables.map((t) => t.name).join(", ") +
      "\nRelationships: " +
      data.refs.length +
      "\nHTML written to: " +
      out;
    return { content: [{ type: "text", text: summary }] };
  }
);

server.tool(
  "get_schema_dbml",
  "Return the schema as dbdiagram.io DBML text (paste into dbdiagram.io).",
  { schemaPath: z.string().optional() },
  async ({ schemaPath }) => {
    const data = await loadParsed(resolveSchemaPath(schemaPath));
    return { content: [{ type: "text", text: toDbml(data) }] };
  }
);

server.tool(
  "get_schema_json",
  "Return the parsed schema (tables, columns, refs, enums) as JSON.",
  { schemaPath: z.string().optional() },
  async ({ schemaPath }) => {
    const data = await loadParsed(resolveSchemaPath(schemaPath));
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
