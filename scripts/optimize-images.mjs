#!/usr/bin/env node
import { readdir, stat } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const execFileAsync = promisify(execFile);

const IMAGES_DIR = path.resolve(process.cwd(), "public/images");

async function optimizeWithSips(inputFile, outputFile) {
  // Use sips to resize and compress images
  // Resize to max 1200px width and 80% quality
  await execFileAsync("sips", [
    "-Z",
    "1200", // resize to max 1200px (maintaining aspect ratio)
    "-s",
    "formatOptions",
    "80", // 80% quality for JPEG
    inputFile,
    "--out",
    outputFile,
  ]);
}

async function main() {
  console.log(`[optimize] Processing images in: ${IMAGES_DIR}`);

  const files = await readdir(IMAGES_DIR);
  const jpgFiles = files.filter((f) => f.toLowerCase().endsWith(".jpg"));

  if (jpgFiles.length === 0) {
    console.log("[optimize] No JPG files found.");
    return;
  }

  let optimized = 0;
  for (const file of jpgFiles) {
    const inputPath = path.join(IMAGES_DIR, file);
    const tempPath = path.join(IMAGES_DIR, `temp_${file}`);

    try {
      const beforeStat = await stat(inputPath);
      const beforeSize = (beforeStat.size / 1024 / 1024).toFixed(1);

      // Skip if already small enough (< 500KB)
      if (beforeStat.size < 500 * 1024) {
        console.log(
          `[optimize] Skip (already small): ${file} (${beforeSize}MB)`
        );
        continue;
      }

      console.log(`[optimize] Processing: ${file} (${beforeSize}MB)`);

      // Optimize to temporary file
      await optimizeWithSips(inputPath, tempPath);

      const afterStat = await stat(tempPath);
      const afterSize = (afterStat.size / 1024 / 1024).toFixed(1);
      const saved = ((beforeStat.size - afterStat.size) / 1024 / 1024).toFixed(
        1
      );

      // Replace original with optimized
      await execFileAsync("mv", [tempPath, inputPath]);

      console.log(
        `[optimize] ✓ ${file}: ${beforeSize}MB → ${afterSize}MB (saved ${saved}MB)`
      );
      optimized++;
    } catch (error) {
      console.error(`[optimize] Failed: ${file}`, error.message);
      // Clean up temp file if it exists
      try {
        await execFileAsync("rm", [tempPath]);
      } catch {}
    }
  }

  console.log(`[optimize] Done. Optimized ${optimized} file(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
