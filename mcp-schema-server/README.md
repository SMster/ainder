# schema-viewer MCP server

A local [MCP](https://modelcontextprotocol.io) server that renders this project's
Prisma schema as an interactive ER diagram (dbdiagram.io style) and opens it in your
browser. Fully offline — no external services.

## Tools

| Tool               | What it does                                                                 |
| ------------------ | ---------------------------------------------------------------------------- |
| `show_schema`      | Parse the Prisma schema, generate an interactive HTML diagram, open browser. |
| `get_schema_dbml`  | Return the schema as dbdiagram.io DBML text.                                  |
| `get_schema_json`  | Return the parsed schema (tables, columns, refs, enums) as JSON.             |

All tools accept an optional `schemaPath` to point at a different `.prisma` file.

The diagram supports: **drag** tables to rearrange, **scroll** to zoom, **drag the
background** to pan, plus **Fit** / **Reset zoom** buttons. Foreign keys are drawn as
curved relationship lines; `PK` / `FK` / `UQ` badges mark key columns.

## Install

```bash
cd mcp-schema-server
npm install
```

## Configure

### Claude Code (this project)
A `.mcp.json` at the project root already registers this server, so Claude Code picks
it up automatically when run from the project directory. Approve it when prompted, or
list it with `claude mcp list`.

### Claude Desktop
Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "schema-viewer": {
      "command": "node",
      "args": ["C:/Users/sean/Downloads/ClaudeCodeDayTwo_TinderforAIs/mcp-schema-server/index.js"],
      "env": {
        "SCHEMA_PATH": "C:/Users/sean/Downloads/ClaudeCodeDayTwo_TinderforAIs/prisma/schema.prisma"
      }
    }
  }
}
```

Restart Claude Desktop, then ask it to "show the database schema".

## How it works

- `parse-schema.js` — a lightweight Prisma schema parser (no Prisma engine needed).
  Extracts tables, columns, PK/FK/unique flags, foreign-key refs, and enums.
- `render-html.js` — builds a self-contained HTML page (inline CSS + vanilla JS) that
  lays out tables and draws relationship lines with SVG.
- `index.js` — the MCP server (stdio) exposing the three tools above.

## Sanity check (without an MCP client)

```bash
node -e "import('./parse-schema.js').then(async m=>{const fs=await import('node:fs/promises');console.log(JSON.stringify(m.parseSchema(await fs.readFile(process.env.SCHEMA_PATH,'utf8')),null,2))})"
```
