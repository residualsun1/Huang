import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { detailPage, collectionPage, notFoundPage } from "./template.mjs";
import { homePage } from "./homepage.mjs";
import { escapeHtml, parseFrontmatter, normalizeList, deriveDescription } from "./frontmatter.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentRoot = path.join(root, "content");
const publicRoot = path.join(root, "public");
const distRoot = path.join(root, "dist");
const clientRoot = path.join(distRoot, "client");
const siteUrl = String(process.env.SITE_URL || process.env.CF_PAGES_URL || "https://guozheng.dev")
  .trim()
  .replace(/\/+$/, "");
const buildCommit = String(process.env.CF_PAGES_COMMIT_SHA || process.env.GITHUB_SHA || "").trim();
let stylesVersion = "development";

function gitOutput(args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function ensureCompleteGitHistory() {
  let shallow;
  try {
    shallow = gitOutput(["rev-parse", "--is-shallow-repository"]);
  } catch {
    throw new Error("无法读取 Git 历史；文章修改日期和修改次数需要在 Git 仓库中构建");
  }

  if (shallow !== "true") return;
  try {
    gitOutput(["fetch", "--unshallow", "--quiet", "origin"]);
  } catch {
    throw new Error("当前仓库是浅克隆，且无法补全 Git 历史；不能可靠计算文章修改次数");
  }
}

function contentHistory(relativePath, publishedDate) {
  const dates = gitOutput(["log", "--follow", "--format=%cs", "--", relativePath])
    .split(/\r?\n/)
    .map((date) => date.trim())
    .filter(Boolean);
  return {
    updatedDate: dates[0] || publishedDate,
    modificationCount: Math.max(0, dates.length - 1),
  };
}

const groups = [
  { key: "projects", number: "01", label: "项目", eyebrow: "PROJECT" },
  { key: "writings", number: "02", label: "写作", eyebrow: "WRITING" },
  { key: "readings", number: "03", label: "阅读", eyebrow: "READING" },
];

async function findMarkdownFiles(directory, relativeDirectory = "") {
  const currentDirectory = path.join(directory, relativeDirectory);
  const directoryEntries = await readdir(currentDirectory, { withFileTypes: true });
  const files = [];

  for (const directoryEntry of directoryEntries.sort((a, b) => a.name.localeCompare(b.name))) {
    const relativePath = path.join(relativeDirectory, directoryEntry.name);
    if (directoryEntry.isDirectory()) {
      files.push(...await findMarkdownFiles(directory, relativePath));
    } else if (directoryEntry.isFile() && directoryEntry.name.toLowerCase().endsWith(".md")) {
      files.push(relativePath);
    }
  }

  return files;
}

async function loadContent(group) {
  const directory = path.join(contentRoot, group.key);
  const files = await findMarkdownFiles(directory);
  const entries = [];
  const slugSources = new Map();

  for (const file of files) {
    const source = await readFile(path.join(directory, file), "utf8");
    const { data, body } = parseFrontmatter(source);
    const repositoryPath = path.relative(root, path.join(directory, file)).split(path.sep).join("/");
    const history = contentHistory(repositoryPath, data.date);
    const slug = String(data.slug || path.basename(file, path.extname(file))).trim();
    const displayPath = file.split(path.sep).join("/");
    if (!data.title || !data.date) {
      throw new Error(`${group.key}/${displayPath} 缺少 title 或 date`);
    }
    if (!slug || /[/\\?#]/.test(slug) || slug === "." || slug === "..") throw new Error(`无效 slug: ${slug}`);
    if (slugSources.has(slug)) {
      throw new Error(
        `${group.key} 中存在重复 slug「${slug}」：${slugSources.get(slug)} 与 ${displayPath}`,
      );
    }
    slugSources.set(slug, displayPath);
    entries.push({
      ...data,
      slug,
      pinned: String(data.pinned || "").trim().toLowerCase() === "true",
      ...history,
      author: String(data.author || "").trim(),
      tags: normalizeList(data.tags),
      homeDescription: String(data.description || "").trim(),
      description: data.description || deriveDescription(body),
      body: body.replace(/<!--([\s\S]*?)-->/g, "").trim(),
      href: `/${group.key}/${slug}/`,
      group,
    });
  }

  return entries.sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

const absoluteUrl = (pathname) => new URL(pathname, `${siteUrl}/`).href;

export { detailPage } from "./template.mjs";

async function writeDiscoveryFiles(collections) {
  await writeFile(
    path.join(clientRoot, "robots.txt"),
    `User-agent: *\nAllow: /\n${siteUrl ? `Sitemap: ${absoluteUrl("/sitemap.xml")}\n` : ""}`,
    "utf8",
  );

  if (!siteUrl) return;

  const paths = [
    "/",
    ...collections.flatMap(({ group, entries }) => [
      `/${group.key}/`,
      ...entries.map((entry) => entry.href),
    ]),
  ];
  const urls = paths
    .map((pathname) => `  <url><loc>${escapeHtml(absoluteUrl(pathname))}</loc></url>`)
    .join("\n");
  await writeFile(
    path.join(clientRoot, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    "utf8",
  );
}

export async function buildSite() {
  ensureCompleteGitHistory();
  await rm(distRoot, { recursive: true, force: true });
  await mkdir(clientRoot, { recursive: true });
  await cp(publicRoot, clientRoot, { recursive: true });
  const styleFiles = ["styles.css", "homepage.css", "homepage.js", "site-chrome.css", "reader.css", "fonts.css"];
  const styles = await Promise.all(styleFiles.map((name) => readFile(path.join(publicRoot, name))));
  stylesVersion = createHash("sha256").update(Buffer.concat(styles)).digest("hex").slice(0, 12);

  const collections = [];
  for (const group of groups) {
    const entries = await loadContent(group);
    collections.push({ group, entries });
    for (const [index, entry] of entries.entries()) {
      const target = path.join(clientRoot, group.key, entry.slug);
      await mkdir(target, { recursive: true });
      const previousEntry = entries[index + 1];
      const nextEntry = entries[index - 1];
      await writeFile(path.join(target, "index.html"), detailPage(entry, previousEntry, nextEntry), "utf8");
    }
  }

  await writeFile(path.join(clientRoot, "index.html"), homePage(collections), "utf8");
  await writeFile(path.join(clientRoot, "404.html"), notFoundPage(), "utf8");
  for (const collection of collections) {
    const target = path.join(clientRoot, collection.group.key);
    await mkdir(target, { recursive: true });
    await writeFile(path.join(target, "index.html"), collectionPage(collection), "utf8");
  }
  await writeDiscoveryFiles(collections);
  await writeFile(
    path.join(clientRoot, "version.json"),
    `${JSON.stringify({
      commit: buildCommit || "local",
      shortCommit: buildCommit ? buildCommit.slice(0, 7) : "local",
      branch: String(process.env.CF_PAGES_BRANCH || "").trim() || "local",
      assetVersion: stylesVersion,
    }, null, 2)}\n`,
    "utf8",
  );
  await mkdir(path.join(distRoot, "server"), { recursive: true });
  await writeFile(
    path.join(distRoot, "server", "index.js"),
    'export default { async fetch(request, env) { return env.ASSETS.fetch(request); } };\n',
    "utf8",
  );
  await mkdir(path.join(distRoot, ".openai"), { recursive: true });
  await cp(path.join(root, ".openai", "hosting.json"), path.join(distRoot, ".openai", "hosting.json"));

  const total = collections.reduce((sum, collection) => sum + collection.entries.length, 0);
  console.log(`已生成 ${total} 篇内容到 dist/client`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await buildSite();
}
