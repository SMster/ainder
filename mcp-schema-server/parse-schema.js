// Minimal Prisma schema parser tailored to this project's schema.
// Extracts tables (with columns + PK/FK/unique flags), foreign-key refs, and enums.
// No external dependencies, no Prisma engine required.

function stripComment(line) {
  const idx = line.indexOf("//");
  return idx >= 0 ? line.slice(0, idx) : line;
}

export function parseSchema(text) {
  const lines = text.split(/\r?\n/);

  // First pass: collect model and enum names so we can classify field types.
  const modelNames = new Set();
  const enumNames = new Set();
  for (const raw of lines) {
    const m = raw.match(/^\s*model\s+(\w+)\s*\{/);
    if (m) modelNames.add(m[1]);
    const e = raw.match(/^\s*enum\s+(\w+)\s*\{/);
    if (e) enumNames.add(e[1]);
  }

  const tables = [];
  const refs = [];
  const enums = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const mm = line.match(/^\s*model\s+(\w+)\s*\{/);
    const em = line.match(/^\s*enum\s+(\w+)\s*\{/);

    if (mm) {
      const name = mm[1];
      const cols = [];
      const pkCols = new Set();
      const uniqueCols = new Set();
      i++;
      for (; i < lines.length; i++) {
        let l = stripComment(lines[i]);
        if (/^\s*\}/.test(l)) break;
        l = l.trim();
        if (!l) continue;

        if (l.startsWith("@@")) {
          const idm = l.match(/@@id\(\s*\[([^\]]+)\]/);
          if (idm) idm[1].split(",").forEach((s) => pkCols.add(s.trim()));
          const um = l.match(/@@unique\(\s*\[([^\]]+)\]/);
          if (um) um[1].split(",").forEach((s) => uniqueCols.add(s.trim()));
          continue;
        }

        const fm = l.match(/^(\w+)\s+(\w+)(\[\])?(\?)?(.*)$/);
        if (!fm) continue;
        const fname = fm[1];
        const typeBase = fm[2];
        const isList = !!fm[3];
        const isOpt = !!fm[4];
        const rest = fm[5] || "";

        if (modelNames.has(typeBase)) {
          // Relation field — produces FK ref(s) if it carries @relation(fields/references).
          const rel = rest.match(
            /@relation\([^)]*fields:\s*\[([^\]]+)\][^)]*references:\s*\[([^\]]+)\]/
          );
          if (rel) {
            const fromFields = rel[1].split(",").map((s) => s.trim());
            const toFields = rel[2].split(",").map((s) => s.trim());
            for (let k = 0; k < fromFields.length; k++) {
              refs.push({
                fromTable: name,
                fromColumn: fromFields[k],
                toTable: typeBase,
                toColumn: toFields[k],
              });
            }
          }
          continue; // relation fields are not stored DB columns
        }

        // Scalar or enum column.
        const isId = /@id\b/.test(rest);
        const isUnique = /@unique\b/.test(rest);
        if (isId) pkCols.add(fname);
        if (isUnique) uniqueCols.add(fname);
        const type = typeBase + (isList ? "[]" : "") + (isOpt ? "?" : "");
        cols.push({
          name: fname,
          type,
          isEnum: enumNames.has(typeBase),
          required: !isOpt && !isList,
        });
      }

      const fkCols = new Set(
        refs.filter((r) => r.fromTable === name).map((r) => r.fromColumn)
      );
      for (const c of cols) {
        c.isPk = pkCols.has(c.name);
        c.isUnique = uniqueCols.has(c.name);
        c.isFk = fkCols.has(c.name);
      }
      tables.push({ name, columns: cols });
    } else if (em) {
      const name = em[1];
      const values = [];
      i++;
      for (; i < lines.length; i++) {
        const l = stripComment(lines[i]).trim();
        if (/^\}/.test(l)) break;
        if (!l) continue;
        const v = l.match(/^(\w+)/);
        if (v) values.push(v[1]);
      }
      enums.push({ name, values });
    }
    i++;
  }

  return { tables, refs, enums };
}

// Render the parsed schema back to dbdiagram.io DBML.
export function toDbml({ tables, refs, enums }) {
  const out = [];
  for (const e of enums) {
    out.push("Enum " + e.name + " {");
    for (const v of e.values) out.push("  " + v);
    out.push("}", "");
  }
  for (const t of tables) {
    out.push("Table " + t.name + " {");
    for (const c of t.columns) {
      const attrs = [];
      if (c.isPk) attrs.push("pk");
      if (c.isUnique && !c.isPk) attrs.push("unique");
      if (!c.required) attrs.push("null");
      const suffix = attrs.length ? " [" + attrs.join(", ") + "]" : "";
      out.push("  " + c.name + " " + c.type.replace(/[?\[\]]/g, "") + suffix);
    }
    out.push("}", "");
  }
  for (const r of refs) {
    out.push(
      "Ref: " +
        r.fromTable +
        "." +
        r.fromColumn +
        " > " +
        r.toTable +
        "." +
        r.toColumn
    );
  }
  return out.join("\n");
}
