const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const BLOG_DIR = '/home/conanxin/workspace/medium-archive/site/src/content/blog';
const REPORTS_DIR = '/home/conanxin/workspace/medium-archive/reports';

if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

const mdFiles = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md')).sort();
const total = mdFiles.length;

const results = {
  total, frontmatterComplete: 0,
  emptyTitle: [], suspiciousTitle: [], missingPubDate: [], invalidPubDate: [], defaultPubDate: [],
  emptyDescription: [], missingOriginalUrl: [], draftAnomaly: [],
  emptyBody: [], shortBody: [], slugAnomaly: [],
  duplicateTitles: [], duplicateSlugs: [], titleGarbled: [], bodyGarbled: [],
  htmlNoise: [], formattingIssues: []
};

const titles = {};
const slugs = {};

function isGarbled(text) {
  if (!text) return false;
  let unusual = 0;
  for (const c of text) {
    const cp = c.codePointAt(0);
    if (cp > 0x3000 && !(cp >= 0x4e00 && cp <= 0x9fff) && !(cp >= 0x3000 && cp <= 0x303f) && !(cp >= 0xff00 && cp <= 0xffef)) unusual++;
  }
  return unusual / text.length > 0.15;
}

for (const fname of mdFiles) {
  const content = fs.readFileSync(path.join(BLOG_DIR, fname), 'utf-8');
  let fm = {}, body = content;
  if (content.startsWith('---')) {
    const parts = content.split('---');
    if (parts.length >= 3) {
      const fmText = parts[1];
      body = parts.slice(2).join('---').trim();
      for (const line of fmText.trim().split('\n')) {
        const idx = line.indexOf(':');
        if (idx > 0 && !line.trim().startsWith('#')) {
          fm[line.slice(0, idx).trim()] = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        }
      }
    }
  }

  const title = fm.title || '';
  const pubDate = fm.pubDate || '';
  const description = fm.description || '';
  const originalUrl = fm.originalUrl || '';
  const draft = fm.draft || '';

  if (!title || title === 'unknown' || title === 'Untitled') results.emptyTitle.push(fname);
  if (isGarbled(title)) results.titleGarbled.push(fname);
  if (title.length > 200 || title.length < 2) results.suspiciousTitle.push(fname);
  titles[title] = (titles[title] || 0) + 1;

  if (!pubDate) results.missingPubDate.push(fname);
  else {
    const d = new Date(pubDate);
    if (isNaN(d.getTime())) results.invalidPubDate.push(fname);
    else if (d.getFullYear() < 2000 || d.getFullYear() > 2030) results.invalidPubDate.push(fname);
    else if (d.getFullYear() === 1970) results.defaultPubDate.push(fname);
  }

  if (!description) results.emptyDescription.push(fname);
  if (!originalUrl) results.missingOriginalUrl.push(fname);
  if (draft !== 'true' && draft !== 'false' && draft !== '') results.draftAnomaly.push(fname);

  if (!body) results.emptyBody.push(fname);
  else if (body.length < 50) results.shortBody.push(fname);

  if (isGarbled(body)) results.bodyGarbled.push(fname);
  if (/<div|<\/div>|<span|<\/span>|<style|<\/style>/i.test(body)) results.htmlNoise.push(fname);
  if ((body.match(/\n\n\n/g) || []).length > 5 || body.includes('\\n') || body.includes('\\t')) results.formattingIssues.push(fname);

  const slug = fname.replace('.md', '');
  slugs[slug] = (slugs[slug] || 0) + 1;
  if (/--/.test(slug) || slug.startsWith('-') || slug.endsWith('-') || !/^[-\w]+$/.test(slug)) results.slugAnomaly.push(fname);

  if (title && pubDate && (draft === 'true' || draft === 'false' || draft === '')) results.frontmatterComplete++;
}

results.duplicateTitles = Object.entries(titles).filter(([,c]) => c > 1).map(([t]) => t);
results.duplicateSlugs = Object.entries(slugs).filter(([,c]) => c > 1).map(([s]) => s);

// Images
const imgMd = /!\[[^\]]*\]\(([^)]+)\)/g;
const imgHtml = /<img[^>]+src=["']([^"']+)["']/gi;
const imgSrc = /src=["']([^"']+)["']/gi;
const linkMd = /\[([^\]]+)\]\(([^)]+)\)/g;
const linkHtml = /<a[^>]+href=["']([^"']+)["']/gi;

const imageRecords = [];
const imageUrls = new Set();
const linkRecords = [];
const linkUrls = new Set();

for (const fname of mdFiles) {
  const content = fs.readFileSync(path.join(BLOG_DIR, fname), 'utf-8');

  let m;
  while ((m = imgMd.exec(content)) !== null) {
    const url = m[1];
    imageUrls.add(url);
    const domain = new URL(url, 'https://example.com').hostname;
    imageRecords.push({ file: fname, image_url: url, image_type: 'markdown', domain, is_remote: !!domain && !domain.startsWith('localhost'), is_medium_cdn: domain && domain.toLowerCase().includes('medium') });
  }
  while ((m = imgHtml.exec(content)) !== null) {
    const url = m[1];
    imageUrls.add(url);
    const domain = new URL(url, 'https://example.com').hostname;
    imageRecords.push({ file: fname, image_url: url, image_type: 'html_img', domain, is_remote: !!domain && !domain.startsWith('localhost'), is_medium_cdn: domain && domain.toLowerCase().includes('medium') });
  }

  while ((m = linkMd.exec(content)) !== null) {
    const url = m[2];
    if (url.startsWith('!')) continue;
    linkUrls.add(url);
    const domain = new URL(url, 'https://example.com').hostname;
    linkRecords.push({ file: fname, link_url: url, link_type: 'markdown', domain, is_remote: !!domain && !domain.startsWith('localhost'), is_medium_link: domain && domain.toLowerCase().includes('medium') });
  }
  while ((m = linkHtml.exec(content)) !== null) {
    const url = m[1];
    linkUrls.add(url);
    const domain = new URL(url, 'https://example.com').hostname;
    linkRecords.push({ file: fname, link_url: url, link_type: 'html_a', domain, is_remote: !!domain && !domain.startsWith('localhost'), is_medium_link: domain && domain.toLowerCase().includes('medium') });
  }
}

// Image HEAD sampling
const remoteImages = Array.from(imageUrls).filter(u => u.startsWith('http'));
const uniqueRemote = [...new Set(remoteImages)];
const sampleSize = Math.min(200, uniqueRemote.length);
const sampled = uniqueRemote.slice(0, sampleSize);

const imageStatus = {};
let checked = 0;

function checkImage(url) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.request(url, { method: 'HEAD', timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (res) => {
      imageStatus[url] = {
        status_code: res.statusCode,
        content_type: res.headers['content-type'] || 'unknown',
        content_length: res.headers['content-length'] || 'unknown'
      };
      resolve();
    });
    req.on('error', (err) => {
      imageStatus[url] = { status_code: 'error', content_type: err.message.slice(0, 50), content_length: 'error' };
      resolve();
    });
    req.on('timeout', () => {
      req.destroy();
      imageStatus[url] = { status_code: 'timeout', content_type: 'timeout', content_length: 'timeout' };
      resolve();
    });
    req.end();
  });
}

async function runChecks() {
  for (let i = 0; i < sampled.length; i++) {
    await checkImage(sampled[i]);
    checked++;
    if (checked % 50 === 0) console.log(`Checked ${checked}/${sampleSize} images...`);
  }

  for (const rec of imageRecords) {
    const url = rec.image_url;
    if (imageStatus[url]) {
      rec.status_code = imageStatus[url].status_code;
      rec.content_type = imageStatus[url].content_type;
      rec.content_length = imageStatus[url].content_length;
      const sc = rec.status_code;
      if (sc === 200) { rec.risk_level = 'low'; rec.notes = 'OK'; }
      else if ([301, 302, 303, 307, 308].includes(sc)) { rec.risk_level = 'low'; rec.notes = 'Redirect'; }
      else if (sc === 403) { rec.risk_level = 'medium'; rec.notes = 'Forbidden - may need browser UA'; }
      else if (sc === 404) { rec.risk_level = 'high'; rec.notes = 'Not found - image missing'; }
      else { rec.risk_level = 'high'; rec.notes = `Error: ${sc}`; }
    } else {
      rec.status_code = 'not_checked';
      rec.content_type = 'not_checked';
      rec.content_length = 'not_checked';
      rec.risk_level = 'unknown';
      rec.notes = 'Not in sample';
    }
  }

  // Domain stats
  const imageDomains = {};
  for (const rec of imageRecords) {
    if (rec.domain) imageDomains[rec.domain] = (imageDomains[rec.domain] || 0) + 1;
  }
  const linkDomains = {};
  for (const rec of linkRecords) {
    if (rec.domain) linkDomains[rec.domain] = (linkDomains[rec.domain] || 0) + 1;
  }

  // Save JSON
  const qualityJson = {
    scan_time: '2026-06-10',
    total_markdown: total,
    frontmatter_complete: results.frontmatterComplete,
    empty_title_count: results.emptyTitle.length,
    empty_title_files: results.emptyTitle,
    suspicious_title_count: results.suspiciousTitle.length,
    suspicious_title_files: results.suspiciousTitle.slice(0, 20),
    missing_pubDate_count: results.missingPubDate.length,
    missing_pubDate_files: results.missingPubDate,
    invalid_pubDate_count: results.invalidPubDate.length,
    invalid_pubDate_files: results.invalidPubDate.slice(0, 20),
    default_pubDate_count: results.defaultPubDate.length,
    empty_description_count: results.emptyDescription.length,
    missing_originalUrl_count: results.missingOriginalUrl.length,
    draft_anomaly_count: results.draftAnomaly.length,
    empty_body_count: results.emptyBody.length,
    short_body_count: results.shortBody.length,
    short_body_files: results.shortBody.slice(0, 20),
    slug_anomaly_count: results.slugAnomaly.length,
    slug_anomaly_files: results.slugAnomaly.slice(0, 20),
    duplicate_titles_count: results.duplicateTitles.length,
    duplicate_titles: results.duplicateTitles.slice(0, 20),
    duplicate_slugs_count: results.duplicateSlugs.length,
    title_garbled_count: results.titleGarbled.length,
    title_garbled_files: results.titleGarbled.slice(0, 20),
    body_garbled_count: results.bodyGarbled.length,
    body_garbled_files: results.bodyGarbled.slice(0, 20),
    html_noise_count: results.htmlNoise.length,
    html_noise_files: results.htmlNoise.slice(0, 20),
    formatting_issues_count: results.formattingIssues.length,
    formatting_issues_files: results.formattingIssues.slice(0, 20),
    image_stats: {
      total_references: imageRecords.length,
      unique_urls: imageUrls.size,
      remote_urls: Array.from(imageUrls).filter(u => u.startsWith('http')).length,
      local_urls: Array.from(imageUrls).filter(u => !u.startsWith('http')).length,
      medium_cdn_urls: Array.from(imageUrls).filter(u => u.toLowerCase().includes('medium')).length,
      non_medium_remote: Array.from(imageUrls).filter(u => u.startsWith('http') && !u.toLowerCase().includes('medium')).length,
      data_uri_count: Array.from(imageUrls).filter(u => u.startsWith('data:')).length,
      http_non_https: Array.from(imageUrls).filter(u => u.startsWith('http:')).length,
      sampled_count: sampleSize,
      status_200: Object.values(imageStatus).filter(s => s.status_code === 200).length,
      status_3xx: Object.values(imageStatus).filter(s => [301, 302, 303, 307, 308].includes(s.status_code)).length,
      status_403: Object.values(imageStatus).filter(s => s.status_code === 403).length,
      status_404: Object.values(imageStatus).filter(s => s.status_code === 404).length,
      status_timeout: Object.values(imageStatus).filter(s => s.status_code === 'timeout').length,
      status_error: Object.values(imageStatus).filter(s => s.status_code === 'error').length,
      image_domains_top20: Object.entries(imageDomains).sort((a, b) => b[1] - a[1]).slice(0, 20),
    },
    link_stats: {
      total_references: linkRecords.length,
      unique_urls: linkUrls.size,
      medium_links: linkRecords.filter(r => r.is_medium_link).length,
      external_links: linkRecords.filter(r => r.is_remote && !r.is_medium_link).length,
      empty_anchor_links: Array.from(linkUrls).filter(u => u.startsWith('#') || u === '').length,
      http_non_https: Array.from(linkUrls).filter(u => u.startsWith('http:')).length,
      link_domains_top20: Object.entries(linkDomains).sort((a, b) => b[1] - a[1]).slice(0, 20),
    }
  };

  fs.writeFileSync(path.join(REPORTS_DIR, 'phase4a-content-quality.json'), JSON.stringify(qualityJson, null, 2), 'utf-8');

  // Save CSVs
  const csvImage = [
    'file,image_url,image_type,domain,is_remote,is_medium_cdn,status_code,content_type,content_length,risk_level,notes',
    ...imageRecords.map(r => `${r.file},"${r.image_url}",${r.image_type},${r.domain || ''},${r.is_remote},${r.is_medium_cdn},${r.status_code},${r.content_type},${r.content_length},${r.risk_level},"${r.notes}"`)
  ].join('\n');
  fs.writeFileSync(path.join(REPORTS_DIR, 'phase4a-image-inventory.csv'), csvImage, 'utf-8');

  const csvLink = [
    'file,link_url,link_type,domain,is_remote,is_medium_link,risk_level,notes',
    ...linkRecords.map(r => `${r.file},"${r.link_url}",${r.link_type},${r.domain || ''},${r.is_remote},${r.is_medium_link},${r.risk_level || 'unknown'},${r.notes || ''}`)
  ].join('\n');
  fs.writeFileSync(path.join(REPORTS_DIR, 'phase4a-link-inventory.csv'), csvLink, 'utf-8');

  console.log('=== Phase 4A Scan Complete ===');
  console.log(`Total Markdown: ${total}`);
  console.log(`Frontmatter complete: ${results.frontmatterComplete}`);
  console.log(`Empty titles: ${results.emptyTitle.length}`);
  console.log(`Missing pubDate: ${results.missingPubDate.length}`);
  console.log(`Empty descriptions: ${results.emptyDescription.length}`);
  console.log(`Missing originalUrl: ${results.missingOriginalUrl.length}`);
  console.log(`Empty bodies: ${results.emptyBody.length}`);
  console.log(`Short bodies: ${results.shortBody.length}`);
  console.log(`HTML noise: ${results.htmlNoise.length}`);
  console.log(`Formatting issues: ${results.formattingIssues.length}`);
  console.log(`Duplicate titles: ${results.duplicateTitles.length}`);
  console.log(`Title garbled: ${results.titleGarbled.length}`);
  console.log(`Body garbled: ${results.bodyGarbled.length}`);
  console.log('');
  console.log(`Image references: ${imageRecords.length}`);
  console.log(`Unique image URLs: ${imageUrls.size}`);
  console.log(`Remote images: ${Array.from(imageUrls).filter(u => u.startsWith('http')).length}`);
  console.log(`Medium CDN images: ${Array.from(imageUrls).filter(u => u.toLowerCase().includes('medium')).length}`);
  console.log(`Sampled: ${sampleSize}`);
  console.log(`  200: ${Object.values(imageStatus).filter(s => s.status_code === 200).length}`);
  console.log(`  3xx: ${Object.values(imageStatus).filter(s => [301, 302, 303, 307, 308].includes(s.status_code)).length}`);
  console.log(`  403: ${Object.values(imageStatus).filter(s => s.status_code === 403).length}`);
  console.log(`  404: ${Object.values(imageStatus).filter(s => s.status_code === 404).length}`);
  console.log(`  timeout: ${Object.values(imageStatus).filter(s => s.status_code === 'timeout').length}`);
  console.log(`  error: ${Object.values(imageStatus).filter(s => s.status_code === 'error').length}`);
  console.log('');
  console.log(`Link references: ${linkRecords.length}`);
  console.log(`Unique links: ${linkUrls.size}`);
  console.log(`Medium links: ${linkRecords.filter(r => r.is_medium_link).length}`);
  console.log(`External links: ${linkRecords.filter(r => r.is_remote && !r.is_medium_link).length}`);
  console.log('');
  console.log('Top image domains:');
  Object.entries(imageDomains).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([d, c]) => console.log(`  ${d}: ${c}`));
}

runChecks().catch(console.error);
