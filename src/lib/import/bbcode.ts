/**
 * XenForo BBCode → Atrium markdown.
 * Converts the tags that carry meaning, strips presentation-only tags,
 * and leaves unknown tags as escaped-ish plain text rather than dropping
 * user content.
 */

type Rule = { pattern: RegExp; replace: string | ((...args: string[]) => string) };

const NESTABLE_PASSES = 4;

const rules: Rule[] = [
  // Meaningful formatting.
  { pattern: /\[b\]([\s\S]*?)\[\/b\]/gi, replace: "**$1**" },
  { pattern: /\[i\]([\s\S]*?)\[\/i\]/gi, replace: "*$1*" },
  { pattern: /\[u\]([\s\S]*?)\[\/u\]/gi, replace: "$1" },
  { pattern: /\[s\]([\s\S]*?)\[\/s\]/gi, replace: "~~$1~~" },

  // Links.
  {
    pattern: /\[url=(?:"|')?([^\]"']+?)(?:"|')?\]([\s\S]*?)\[\/url\]/gi,
    replace: (_m, href, label) => `[${label.trim() || href}](${href})`,
  },
  { pattern: /\[url\]([\s\S]*?)\[\/url\]/gi, replace: "$1" },
  { pattern: /\[email\]([\s\S]*?)\[\/email\]/gi, replace: "$1" },

  // Media becomes plain links (Atrium markdown has no embeds).
  { pattern: /\[img\]([\s\S]*?)\[\/img\]/gi, replace: "$1" },
  {
    pattern: /\[media=([a-z0-9_]+)\]([\s\S]*?)\[\/media\]/gi,
    replace: (_m, kind, id) => mediaUrl(kind.toLowerCase(), id.trim()),
  },
  { pattern: /\[attach[^\]]*\]([\s\S]*?)\[\/attach\]/gi, replace: "(attachment)" },

  // Code.
  {
    pattern: /\[code(?:=[^\]]*)?\]([\s\S]*?)\[\/code\]/gi,
    replace: (_m, code) => `\n\`\`\`\n${code.replace(/^\n+|\n+$/g, "")}\n\`\`\`\n`,
  },
  { pattern: /\[icode\]([\s\S]*?)\[\/icode\]/gi, replace: "`$1`" },

  // Quotes: attributed and plain.
  {
    pattern: /\[quote=(?:"|')?([^\],"']+)[^\]]*\]([\s\S]*?)\[\/quote\]/gi,
    replace: (_m, who, inner) => blockquote(`**${who.trim()} said:**\n${inner.trim()}`),
  },
  {
    pattern: /\[quote\]([\s\S]*?)\[\/quote\]/gi,
    replace: (_m, inner) => blockquote(inner.trim()),
  },

  // Spoilers → quote with label (no native spoiler in markdown subset).
  {
    pattern: /\[spoiler(?:=(?:"|')?([^\]"']*)(?:"|')?)?\]([\s\S]*?)\[\/spoiler\]/gi,
    replace: (_m, label, inner) =>
      blockquote(`**Spoiler${label ? `: ${label}` : ""}**\n${inner.trim()}`),
  },

  // Lists.
  {
    pattern: /\[list=1\]([\s\S]*?)\[\/list\]/gi,
    replace: (_m, inner) => listItems(inner, true),
  },
  {
    pattern: /\[list\]([\s\S]*?)\[\/list\]/gi,
    replace: (_m, inner) => listItems(inner, false),
  },

  // Presentation-only wrappers: keep the content, drop the styling.
  { pattern: /\[(size|font|color|highlight)=[^\]]*\]([\s\S]*?)\[\/\1\]/gi, replace: "$2" },
  { pattern: /\[(center|left|right|justify|indent|heading)\]([\s\S]*?)\[\/\1\]/gi, replace: "$2" },
  { pattern: /\[(user|usergroup)=\d+\]([\s\S]*?)\[\/\1\]/gi, replace: "$2" },

  // XenForo table markup has no markdown target — flatten cells.
  { pattern: /\[\/?(table|tr)\]/gi, replace: "\n" },
  { pattern: /\[\/?(td|th)\]/gi, replace: " | " },
];

function mediaUrl(kind: string, id: string): string {
  switch (kind) {
    case "youtube":
      return `https://www.youtube.com/watch?v=${id}`;
    case "vimeo":
      return `https://vimeo.com/${id}`;
    default:
      return id;
  }
}

function blockquote(inner: string): string {
  const quoted = inner
    .split("\n")
    .map((l) => `> ${l}`)
    .join("\n");
  return `\n${quoted}\n`;
}

function listItems(inner: string, ordered: boolean): string {
  const items = inner
    .split(/\[\*\]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return (
    "\n" +
    items
      .map((item, i) => (ordered ? `${i + 1}. ${item}` : `- ${item}`))
      .join("\n") +
    "\n"
  );
}

export function bbcodeToMarkdown(input: string): string {
  let text = input.replace(/\r\n/g, "\n");
  for (let pass = 0; pass < NESTABLE_PASSES; pass += 1) {
    let changed = false;
    for (const rule of rules) {
      const next = text.replace(
        rule.pattern,
        rule.replace as string & ((...args: string[]) => string),
      );
      if (next !== text) changed = true;
      text = next;
    }
    if (!changed) break;
  }
  // Collapse the whitespace the conversions leave behind.
  return text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
