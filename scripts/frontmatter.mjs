// Preserved from Huang/scripts/build.mjs.
const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

function parseFrontmatter(source) {
  const normalized = source.replaceAll("\r\n", "\n");
  if (!normalized.startsWith("---\n")) return { data: {}, body: normalized };
  const end = normalized.indexOf("\n---\n", 4);
  if (end < 0) return { data: {}, body: normalized };

  const data = {};
  let activeKey = "";
  const parseValue = (rawValue) => {
    let value = rawValue.trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    return value;
  };

  for (const line of normalized.slice(4, end).split("\n")) {
    const arrayItem = line.match(/^\s+-\s+(.+)$/);
    if (arrayItem && activeKey) {
      if (!Array.isArray(data[activeKey])) data[activeKey] = [];
      data[activeKey].push(parseValue(arrayItem[1]));
      continue;
    }

    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim();
    const value = parseValue(line.slice(separator + 1));
    data[key] = value;
    activeKey = key;
  }
  return { data, body: normalized.slice(end + 5).trim() };
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  const source = String(value || "").trim().replace(/^\[|\]$/g, "");
  if (!source) return [];
  return source.split(",").map((item) => item.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
}

function deriveDescription(markdown) {
  const plainText = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<!--([\s\S]*?)-->/g, " ")
    .replace(/\{\{[<%][\s\S]*?[>%]\}\}/g, " ")
    .replace(/^\[\^[^\]]+\]:.*$/gm, " ")
    .replace(/\[\^[^\]]+\]/g, "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*>\d.]+\s+/gm, "")
    .replace(/[*_`~]/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!plainText) return "阅读全文。";
  return plainText.length > 92 ? `${plainText.slice(0, 92)}…` : plainText;
}


export { escapeHtml, parseFrontmatter, normalizeList, deriveDescription };
