import { createReadStream, existsSync, statSync, watch } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSite } from "./build.mjs";
import { createBuildQueue } from "./build-queue.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientRoot = path.join(root, "dist", "client");
const port = Number(process.env.PORT || 4173);
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

await buildSite();

const server = createServer((request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  const pathname = decodeURIComponent(url.pathname);
  let target = path.join(clientRoot, pathname);
  if (!path.extname(target)) target = path.join(target, "index.html");
  const resolved = path.resolve(target);

  if (!resolved.startsWith(path.resolve(clientRoot)) || !existsSync(resolved) || !statSync(resolved).isFile()) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("页面不存在");
    return;
  }

  response.writeHead(200, {
    "content-type": types[path.extname(resolved)] || "application/octet-stream",
    "cache-control": "no-store",
  });
  createReadStream(resolved).pipe(response);
});

let timer;
const runQueuedBuild = createBuildQueue(buildSite, {
  onSuccess: () => console.log("内容已更新"),
  onError: (error) => console.error(error),
});
const rebuild = () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    void runQueuedBuild();
  }, 120);
};

for (const directory of [path.join(root, "content"), path.join(root, "public")]) {
  watch(directory, { recursive: true }, rebuild);
}

server.listen(port, "127.0.0.1", () => {
  console.log(`本地预览：http://127.0.0.1:${port}`);
});
