#!/usr/bin/env node

/**
 * Updates the gallery markup in index.html with <img> tags for every file
 * found in assets/gallery. Images are sorted alphabetically and basic alt
 * text is generated from the filename.
 */

const fs = require("fs/promises");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const INDEX_HTML = path.join(ROOT, "index.html");
const GALLERY_DIR = path.join(ROOT, "assets", "gallery");
const BLOCK_PATTERN = /([ \t]*)<!-- gallery:start -->[\s\S]*?<!-- gallery:end -->/;
const INDENT_FALLBACK = "              "; // fallback to match current markup spacing
const VALID_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"]);

function buildAltText(filename) {
  const { name } = path.parse(filename);
  const cleaned = name
    .replace(/[()]+/g, "")
    .replace(/[-_]+/g, " ")
    .replace(/\./g, ":")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return "Wedding celebration moment";
  }

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

async function getGalleryImages() {
  const entries = await fs.readdir(GALLERY_DIR, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && VALID_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

function createSlideMarkup(files, indent) {
  const imageIndent = `${indent}  `;

  return files
    .map((file) => {
      const altText = buildAltText(file).replace(/"/g, "'");
      return [
        `${indent}<div class="swiper-slide gallery__slide">`,
        `${imageIndent}<img src="assets/gallery/${file}" alt="${altText}">`,
        `${indent}</div>`,
      ].join("\n");
    })
    .join("\n");
}

async function updateIndex(files, indent) {
  const html = await fs.readFile(INDEX_HTML, "utf8");

  const match = html.match(BLOCK_PATTERN);
  if (!match) {
    throw new Error("Could not locate gallery markers in index.html");
  }

  const blockIndent = match[1] || indent;
  const slidesMarkup = createSlideMarkup(files, blockIndent);
  const replacement = [
    `${blockIndent}<!-- gallery:start -->`,
    slidesMarkup,
    `${blockIndent}<!-- gallery:end -->`,
  ].join("\n");

  const updatedHtml = html.replace(BLOCK_PATTERN, replacement);
  await fs.writeFile(INDEX_HTML, updatedHtml, "utf8");
}

async function main() {
  const files = await getGalleryImages();

  if (!files.length) {
    console.warn("No images found in assets/gallery. Existing gallery markup left untouched.");
    return;
  }

  await updateIndex(files, INDENT_FALLBACK);
  console.log(`Updated gallery with ${files.length} slide${files.length === 1 ? "" : "s"}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
