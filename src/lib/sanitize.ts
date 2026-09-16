/**
 * Conservative HTML sanitiser for admin-authored show notes.
 *
 * Only the admin can write this content, so this is defence in depth rather
 * than the primary control: it means a compromised editor account still cannot
 * plant a stored XSS payload on a public page. The approach is an allowlist —
 * anything not explicitly permitted is dropped.
 */

const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "s",
  "h2", "h3", "h4",
  "ul", "ol", "li",
  "blockquote", "code", "pre", "hr",
  "a", "figure", "figcaption", "img",
  "table", "thead", "tbody", "tr", "th", "td",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target", "rel"]),
  img: new Set(["src", "alt", "title", "width", "height", "loading"]),
};

/** Blocks javascript:, data: and other script-capable URL schemes. */
function isSafeUrl(value: string): boolean {
  const trimmed = value.trim().toLowerCase();
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return true;
  return /^(https?:|mailto:|tel:)/.test(trimmed);
}

export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return "";

  // Drop whole elements whose content is never renderable prose.
  let html = input.replace(
    /<(script|style|iframe|object|embed|form|input|button|svg|math)\b[\s\S]*?<\/\1\s*>/gi,
    "",
  );
  html = html.replace(/<(script|style|iframe|object|embed|form|input|button)\b[^>]*\/?>/gi, "");
  html = html.replace(/<!--[\s\S]*?-->/g, "");

  return html.replace(/<(\/?)([a-zA-Z][a-zA-Z0-9-]*)([^>]*)>/g, (match, closing: string, rawName: string, attrs: string) => {
    const tag = rawName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return "";
    if (closing) return `</${tag}>`;

    const allowed = ALLOWED_ATTRS[tag];
    if (!allowed) return `<${tag}>`;

    const kept: string[] = [];
    const attrPattern = /([a-zA-Z-]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
    let attr: RegExpExecArray | null;

    while ((attr = attrPattern.exec(attrs)) !== null) {
      const name = attr[1].toLowerCase();
      const value = attr[3] ?? attr[4] ?? "";

      if (!allowed.has(name)) continue;
      if ((name === "href" || name === "src") && !isSafeUrl(value)) continue;

      kept.push(`${name}="${escapeAttr(value)}"`);
    }

    // Anything opening in a new tab must not be able to reach window.opener.
    if (tag === "a" && kept.some((entry) => entry.startsWith('target="_blank"'))) {
      if (!kept.some((entry) => entry.startsWith("rel="))) kept.push('rel="noopener noreferrer"');
    }
    if (tag === "img" && !kept.some((entry) => entry.startsWith("loading="))) {
      kept.push('loading="lazy"');
    }

    return `<${tag}${kept.length > 0 ? ` ${kept.join(" ")}` : ""}>`;
  });
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Plain text from HTML, for meta descriptions and reading-time estimates. */
export function htmlToText(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}
