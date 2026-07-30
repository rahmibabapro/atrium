/**
 * Minimal, dependency-free markdown for forum posts.
 * Strategy: escape ALL html first, then re-introduce a whitelisted subset,
 * so output can never contain user-supplied tags or attributes.
 *
 * Supported: fenced/inline code, bold, italic, blockquote, [text](https url),
 * bare-url autolink, paragraphs + line breaks.
 */

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (url.protocol === "http:" || url.protocol === "https:") return url.href;
    return null;
  } catch {
    return null;
  }
}

const CODE_TOKEN = "\u0000CODE";

export function renderPostHtml(markdown: string): string {
  const codeSnippets: string[] = [];

  // 1. Pull out fenced code blocks before any other processing.
  let text = markdown.replace(/```([\s\S]*?)```/g, (_m, code: string) => {
    codeSnippets.push(
      `<pre class="post-code"><code>${escapeHtml(code.replace(/^\n|\n$/g, ""))}</code></pre>`,
    );
    return `${CODE_TOKEN}${codeSnippets.length - 1}\u0000`;
  });

  // 2. Inline code.
  text = text.replace(/`([^`\n]+)`/g, (_m, code: string) => {
    codeSnippets.push(`<code class="post-code-inline">${escapeHtml(code)}</code>`);
    return `${CODE_TOKEN}${codeSnippets.length - 1}\u0000`;
  });

  // 3. Escape everything that's left.
  text = escapeHtml(text);

  // 4. Markdown links [text](url) — only http(s).
  text = text.replace(
    /\[([^\]\n]{1,120})\]\((https?:\/\/[^\s)]+)\)/g,
    (_m, label: string, href: string) => {
      const url = safeUrl(href);
      if (!url) return label;
      return `<a href="${url}" rel="nofollow noopener" target="_blank">${label}</a>`;
    },
  );

  // 5. Autolink bare urls (that are not already inside an attribute).
  text = text.replace(
    /(^|[\s(])((?:https?:\/\/)[^\s<>)]+)/g,
    (_m, prefix: string, href: string) => {
      const url = safeUrl(href);
      if (!url) return `${prefix}${href}`;
      return `${prefix}<a href="${url}" rel="nofollow noopener" target="_blank">${escapeHtml(href)}</a>`;
    },
  );

  // 6. Bold / italic.
  text = text.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");

  // 7. Blocks: blockquotes + paragraphs.
  const blocks = text.split(/\n{2,}/).map((block) => {
    const trimmed = block.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith(`${CODE_TOKEN}`)) return trimmed;
    if (/^(&gt;)/.test(trimmed)) {
      const inner = trimmed
        .split("\n")
        .map((l) => l.replace(/^&gt;\s?/, ""))
        .join("<br/>");
      return `<blockquote class="post-quote">${inner}</blockquote>`;
    }
    return `<p>${trimmed.replaceAll("\n", "<br/>")}</p>`;
  });
  text = blocks.filter(Boolean).join("\n");

  // 8. Restore code snippets.
  text = text.replace(
    new RegExp(`${CODE_TOKEN}(\\d+)\u0000`, "g"),
    (_m, idx: string) => codeSnippets[Number(idx)] ?? "",
  );

  return text;
}

/** True when the body contains any outbound link (trust-level gate). */
export function containsLink(markdown: string): boolean {
  return /https?:\/\//i.test(markdown);
}

/** @username mentions (username plugin format: 3-16 [a-z0-9_]). */
export function extractMentions(markdown: string): string[] {
  const found = new Set<string>();
  for (const match of markdown.matchAll(/(^|[\s(>])@([a-z0-9_]{3,16})\b/gi)) {
    found.add(match[2]!.toLowerCase());
  }
  return [...found].slice(0, 10);
}
