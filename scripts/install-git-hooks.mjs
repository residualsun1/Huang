import { chmod, copyFile, mkdir, readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, ".githooks", "pre-push");
const hooksPath = execFileSync("git", ["rev-parse", "--git-path", "hooks"], {
  cwd: root,
  encoding: "utf8",
}).trim();
const hooksDirectory = path.resolve(root, hooksPath);
const target = path.join(hooksDirectory, "pre-push");
const managedMarker = "# Managed by npm run hooks:install.";

let existing = "";
try {
  existing = await readFile(target, "utf8");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

if (existing && !existing.includes(managedMarker)) {
  throw new Error(`已有未受本项目管理的 pre-push hook，未覆盖：${target}`);
}

await mkdir(hooksDirectory, { recursive: true });
await copyFile(source, target);
await chmod(target, 0o755);

console.log("已启用 pre-push 检查；以后执行 git push 前会自动运行 npm test。");
