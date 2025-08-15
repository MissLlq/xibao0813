#!/usr/bin/env node
import { readdir, stat } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const execFileAsync = promisify(execFile);

const ASSETS_DIR = path.resolve(process.cwd(), "src/assets/xibao");
const INPUT_EXTS = new Set([
  ".heic",
  ".HEIC",
  ".png",
  ".PNG",
  ".jpeg",
  ".JPEG",
  ".jpg",
  ".JPG",
]);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const res = path.resolve(dir, entry.name);
      if (entry.isDirectory()) return walk(res);
      return res;
    })
  );
  return files.flat();
}

async function convertWithSips(inputFile, outputFile) {
  // sips converts to jpeg; ensure output dir exists (same dir here)
  await execFileAsync("sips", [
    "-s",
    "format",
    "jpeg",
    inputFile,
    "--out",
    outputFile,
  ]);
}

async function main() {
  console.log(`[convert] Scanning: ${ASSETS_DIR}`);
  const all = await walk(ASSETS_DIR);
  const targets = all.filter((f) => INPUT_EXTS.has(path.extname(f)));
  if (targets.length === 0) {
    console.log("[convert] No images needing conversion found.");
    return;
  }

  let converted = 0;
  for (const input of targets) {
    const dir = path.dirname(input);
    const base = path.basename(input, path.extname(input));
    const output = path.join(dir, `${base}.jpg`);

    try {
      // Check if the file is actually HEIF format (even if it has .jpg extension)
      const { stdout: fileInfo } = await execFileAsync("file", [input]);
      const isHeif = fileInfo.includes("HEIF") || fileInfo.includes("HEVC");
      const isAlreadyJpeg =
        fileInfo.includes("JFIF") || fileInfo.includes("JPEG image data");

      // Skip if already a proper JPEG and not HEIF
      if (isAlreadyJpeg && !isHeif) {
        console.log(`[convert] Skip (already JPEG): ${path.basename(input)}`);
        continue;
      }

      // Skip if output exists and is newer, but only for non-HEIF files
      if (!isHeif) {
        let skip = false;
        try {
          const [inStat, outStat] = await Promise.all([
            stat(input),
            stat(output),
          ]);
          skip = outStat.mtimeMs >= inStat.mtimeMs;
        } catch {
          // output missing, proceed
        }
        if (skip) {
          console.log(`[convert] Skip up-to-date: ${path.basename(output)}`);
          continue;
        }
      }

      console.log(
        `[convert] ${path.basename(input)} -> ${path.basename(output)} ${
          isHeif ? "(HEIF->JPEG)" : ""
        }`
      );
      await convertWithSips(input, output);
      converted++;
    } catch (err) {
      console.error(`[convert] Failed: ${input}`, err.message);
    }
  }

  console.log(`[convert] Done. Converted ${converted} file(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
