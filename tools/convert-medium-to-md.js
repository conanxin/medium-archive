#!/usr/bin/env node
/**
 * Convert Medium export HTML files to Markdown with frontmatter
 * for Astro content collection.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const POSTS_DIR = path.resolve(__dirname, '../raw/medium-export/posts');
const OUT_DIR = path.resolve(__dirname, '../site/src/content/blog');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .substring(0, 80);
}

function safeFilename(dateStr, title, id) {
  const base = slugify(title || 'untitled');
  const shortId = id ? id.slice(-6) : 'unknown';
  return `${dateStr}-${base}-${shortId}.md`;
}

function extractMeta(html, filename) {
  // title
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  const title = titleMatch ? titleMatch[1].trim() : '';

  // subtitle / description
  const subMatch = html.match(/<section data-field="subtitle"[^>]*>([\s\S]*?)<\/section>/);
  const description = subMatch
    ? subMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    : '';

  // pubDate
  const timeMatch = html.match(/<time[^>]*datetime="([^"]+)"/);
  const pubDate = timeMatch ? timeMatch[1].trim() : '';

  // canonical url
  const canonicalMatch = html.match(/<a[^>]*class="p-canonical"[^>]*href="([^"]+)"/);
  const originalUrl = canonicalMatch ? canonicalMatch[1].trim() : '';

  // medium post id from filename: ...--<id>.html
  const idMatch = filename.match(/--([a-f0-9]+)\.html$/);
  const mediumId = idMatch ? idMatch[1] : '';

  // date from filename prefix: YYYY-MM-DD_...
  const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})_/);
  const dateStr = dateMatch ? dateMatch[1] : (pubDate ? pubDate.slice(0, 10) : 'unknown');

  return { title, description, pubDate, originalUrl, mediumId, dateStr };
}

function extractBodyHtml(html) {
  const bodyMatch = html.match(/<section data-field="body"[^>]*>([\s\S]*)<\/section>\s*<footer>/);
  if (!bodyMatch) return null;
  return bodyMatch[1].trim();
}

function htmlToMarkdownViaPandoc(htmlFragment) {
  // Write fragment to temp file and run pandoc
  const tmpFile = path.join('/tmp', `medium-${Date.now()}.html`);
  fs.writeFileSync(tmpFile, `<!DOCTYPE html><html><body>${htmlFragment}</body></html>`, 'utf8');
  try {
    const md = execSync(`pandoc -f html -t markdown --wrap=none "${tmpFile}"`, {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    });
    fs.unlinkSync(tmpFile);
    return md.trim();
  } catch (e) {
    try { fs.unlinkSync(tmpFile); } catch (_) {}
    throw e;
  }
}

function buildFrontmatter(meta) {
  const lines = [
    '---',
    `title: "${meta.title.replace(/"/g, '\\"')}"`,
  ];
  if (meta.description) {
    lines.push(`description: "${meta.description.replace(/"/g, '\\"')}"`);
  }
  if (meta.pubDate) {
    lines.push(`pubDate: ${meta.pubDate}`);
  }
  lines.push(`source: "Medium"`);
  if (meta.originalUrl) {
    lines.push(`originalUrl: "${meta.originalUrl}"`);
  }
  lines.push(`draft: false`);
  lines.push('---');
  return lines.join('\n');
}

const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.html'));
console.log(`Found ${files.length} HTML files in posts/`);

let success = 0;
let failed = 0;
const failedFiles = [];

for (const filename of files) {
  const filepath = path.join(POSTS_DIR, filename);
  const html = fs.readFileSync(filepath, 'utf8');
  const meta = extractMeta(html, filename);

  const bodyHtml = extractBodyHtml(html);
  if (!bodyHtml) {
    failed++;
    failedFiles.push({ filename, reason: 'no body section' });
    continue;
  }

  let mdBody;
  try {
    mdBody = htmlToMarkdownViaPandoc(bodyHtml);
  } catch (e) {
    failed++;
    failedFiles.push({ filename, reason: `pandoc error: ${e.message}` });
    continue;
  }

  const frontmatter = buildFrontmatter(meta);
  const outFilename = safeFilename(meta.dateStr, meta.title, meta.mediumId);
  const outPath = path.join(OUT_DIR, outFilename);

  fs.writeFileSync(outPath, frontmatter + '\n\n' + mdBody + '\n', 'utf8');
  success++;
}

console.log(`\nConversion complete:`);
console.log(`  Success: ${success}`);
console.log(`  Failed:  ${failed}`);
if (failedFiles.length > 0) {
  console.log(`\nFailed files:`);
  failedFiles.forEach(f => console.log(`  - ${f.filename}: ${f.reason}`));
}

// Write summary JSON for report generation
const summary = {
  totalFiles: files.length,
  success,
  failed,
  failedFiles,
  outputDir: OUT_DIR,
};
fs.writeFileSync(
  path.resolve(__dirname, '../reports/conversion-summary.json'),
  JSON.stringify(summary, null, 2),
  'utf8'
);
