/**
 * Streaming-ish parser for XenForo MySQL dumps (mysqldump output).
 * Reads CREATE TABLE statements to learn column order, then tokenizes
 * INSERT INTO ... VALUES (...),(...) tuples — including extended inserts,
 * quoted strings with backslash escapes, NULLs, and numbers.
 */

export type DumpRow = Record<string, string | number | null>;

const INTERESTING_TABLES = new Set([
  "xf_user",
  "xf_node",
  "xf_thread",
  "xf_post",
]);

export type XenForoDump = {
  users: DumpRow[];
  nodes: DumpRow[];
  threads: DumpRow[];
  posts: DumpRow[];
};

/** Column order per table, from CREATE TABLE or the INSERT column list. */
function parseCreateColumns(sql: string): Map<string, string[]> {
  const columns = new Map<string, string[]>();
  const createRe = /CREATE TABLE (?:IF NOT EXISTS )?`?(\w+)`?\s*\(([\s\S]*?)\)\s*(?:ENGINE|;)/gi;
  for (const match of sql.matchAll(createRe)) {
    const table = match[1]!;
    if (!INTERESTING_TABLES.has(table)) continue;
    const body = match[2]!;
    const cols: string[] = [];
    for (const line of body.split("\n")) {
      const colMatch = line.trim().match(/^`(\w+)`\s/);
      if (colMatch) cols.push(colMatch[1]!);
    }
    columns.set(table, cols);
  }
  return columns;
}

/** Tokenizes the VALUES payload of one INSERT statement into tuples. */
export function parseValueTuples(payload: string): Array<Array<string | number | null>> {
  const tuples: Array<Array<string | number | null>> = [];
  let i = 0;
  const len = payload.length;

  while (i < len) {
    while (i < len && payload[i] !== "(") i += 1;
    if (i >= len) break;
    i += 1; // consume '('

    const tuple: Array<string | number | null> = [];
    let current = "";
    let inString = false;
    let done = false;

    while (i < len && !done) {
      const ch = payload[i]!;
      if (inString) {
        if (ch === "\\") {
          const next = payload[i + 1];
          const unescaped: Record<string, string> = {
            n: "\n",
            r: "\r",
            t: "\t",
            "0": "\0",
            "'": "'",
            '"': '"',
            "\\": "\\",
          };
          current += unescaped[next ?? ""] ?? next ?? "";
          i += 2;
          continue;
        }
        if (ch === "'") {
          if (payload[i + 1] === "'") {
            current += "'";
            i += 2;
            continue;
          }
          inString = false;
          tuple.push(current);
          current = "";
          i += 1;
          // skip to , or )
          while (i < len && payload[i] !== "," && payload[i] !== ")") i += 1;
          if (payload[i] === ")") {
            done = true;
          }
          i += 1;
          continue;
        }
        current += ch;
        i += 1;
        continue;
      }

      if (ch === "'") {
        inString = true;
        i += 1;
        continue;
      }
      if (ch === "," || ch === ")") {
        const raw = current.trim();
        if (raw.length) {
          if (raw.toUpperCase() === "NULL") tuple.push(null);
          else if (/^-?\d+$/.test(raw)) tuple.push(Number(raw));
          else if (/^-?\d*\.\d+$/.test(raw)) tuple.push(Number(raw));
          else tuple.push(raw);
        }
        current = "";
        if (ch === ")") done = true;
        i += 1;
        continue;
      }
      current += ch;
      i += 1;
    }

    if (tuple.length) tuples.push(tuple);
  }

  return tuples;
}

export function parseXenForoDump(sql: string): XenForoDump {
  const createColumns = parseCreateColumns(sql);
  const tables: Record<string, DumpRow[]> = {
    xf_user: [],
    xf_node: [],
    xf_thread: [],
    xf_post: [],
  };

  const insertRe =
    /INSERT INTO `?(\w+)`?\s*(\(([^)]*)\))?\s*VALUES\s*([\s\S]*?);\s*(?:\n|$)/gi;
  for (const match of sql.matchAll(insertRe)) {
    const table = match[1]!;
    if (!INTERESTING_TABLES.has(table)) continue;

    const explicitCols = match[3]
      ?.split(",")
      .map((c) => c.trim().replace(/`/g, ""))
      .filter(Boolean);
    const cols = explicitCols?.length ? explicitCols : createColumns.get(table);
    if (!cols?.length) continue;

    for (const tuple of parseValueTuples(match[4]!)) {
      const row: DumpRow = {};
      cols.forEach((col, idx) => {
        row[col] = tuple[idx] ?? null;
      });
      tables[table]!.push(row);
    }
  }

  return {
    users: tables.xf_user!,
    nodes: tables.xf_node!,
    threads: tables.xf_thread!,
    posts: tables.xf_post!,
  };
}

/** Letters NFKD can't decompose (Turkish dotless ı, Nordic ligatures, …). */
const ROMANIZE: Record<string, string> = {
  ı: "i",
  ß: "ss",
  ø: "o",
  đ: "d",
  þ: "th",
  æ: "ae",
  œ: "oe",
  ð: "d",
  ł: "l",
};

/** XenForo's URL slug algorithm, approximately (romanize + dashes). */
export function xenforoSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[ıßøđþæœðł]/g, (ch) => ROMANIZE[ch] ?? ch)
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "thread"
  );
}
