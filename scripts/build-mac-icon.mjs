import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const svgPath = path.join(root, "public", "favicon.svg");
const buildDir = path.join(root, "build");
const pngPath = path.join(buildDir, "icon.png");
const iconsetDir = path.join(buildDir, "icon.iconset");
const icnsPath = path.join(buildDir, "icon.icns");

const sizes = [
  { name: "icon_16x16.png", size: 16 },
  { name: "icon_16x16@2x.png", size: 32 },
  { name: "icon_32x32.png", size: 32 },
  { name: "icon_32x32@2x.png", size: 64 },
  { name: "icon_128x128.png", size: 128 },
  { name: "icon_128x128@2x.png", size: 256 },
  { name: "icon_256x256.png", size: 256 },
  { name: "icon_256x256@2x.png", size: 512 },
  { name: "icon_512x512.png", size: 512 },
  { name: "icon_512x512@2x.png", size: 1024 },
];

fs.mkdirSync(buildDir, { recursive: true });
if (fs.existsSync(iconsetDir)) {
  fs.rmSync(iconsetDir, { recursive: true, force: true });
}
fs.mkdirSync(iconsetDir, { recursive: true });

await sharp(svgPath).resize(1024, 1024).png().toFile(pngPath);

for (const { name, size } of sizes) {
  await sharp(svgPath)
    .resize(size, size)
    .png()
    .toFile(path.join(iconsetDir, name));
}

const { spawnSync } = await import("node:child_process");
const iconutil = spawnSync("iconutil", ["-c", "icns", iconsetDir, "-o", icnsPath], {
  stdio: "inherit",
});
if (iconutil.status !== 0) {
  console.error("iconutil failed; electron-builder will fall back to build/icon.png");
  process.exit(iconutil.status ?? 1);
}

console.log(`Wrote ${icnsPath}`);
