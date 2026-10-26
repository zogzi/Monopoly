import { readdir, readFile, writeFile } from "node:fs/promises";
import { gzipSync, brotliCompressSync, constants } from "node:zlib";
import path from "node:path";
let raw = 0,
  compressed = 0;
async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await visit(filename);
      continue;
    }
    if (!/\.(?:js|css|html|svg|json)$/.test(entry.name)) continue;
    const buffer = await readFile(filename);
    if (buffer.length < 1024) continue;
    const brotli = brotliCompressSync(buffer, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 9 },
    });
    await Promise.all([
      writeFile(filename + ".br", brotli),
      writeFile(filename + ".gz", gzipSync(buffer, { level: 9 })),
    ]);
    raw += buffer.length;
    compressed += brotli.length;
  }
}
await visit("dist");
console.log(
  `Precompressed text assets: ${raw} → ${compressed} bytes (${Math.round((1 - compressed / raw) * 100)}% smaller with Brotli).`,
);
