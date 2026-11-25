import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRIVACY_DOCUMENT, TERMS_DOCUMENT } from '../src/data/legalDocuments.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
const templatePath = path.join(distDir, 'index.html');

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderDocumentHtml(doc) {
  const summaryItems = doc.summaryPoints
    .map((point) => `<li>${escapeHtml(point)}</li>`)
    .join('');

  const sectionBlocks = doc.sections
    .map((sec, idx) => {
      const paragraphs = (sec.paragraphs || [])
        .map((p) => `<p>${escapeHtml(p)}</p>`)
        .join('');
      const bullets = sec.bullets?.length
        ? `<ul>${sec.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>`
        : '';
      return `<section id="${escapeHtml(sec.id)}"><h2>${idx + 1}. ${escapeHtml(sec.title)}</h2>${paragraphs}${bullets}</section>`;
    })
    .join('');

  return `<main style="max-width:960px;margin:0 auto;padding:32px 16px;font-family:Inter,sans-serif;color:#1E293B;line-height:1.6">
  <header>
    <p><strong>${escapeHtml(doc.eyebrow)}</strong> — Human Shelter Realty Corp.</p>
    <h1>${escapeHtml(doc.title)}</h1>
    <p>Last updated: ${escapeHtml(doc.lastUpdated)}</p>
  </header>
  <section aria-label="Summary">
    <h2>The Short Version</h2>
    <ul>${summaryItems}</ul>
  </section>
  <section aria-label="Notice">
    <h2>${escapeHtml(doc.noticeTitle)}</h2>
    <p>${escapeHtml(doc.noticeBody)}</p>
  </section>
  ${sectionBlocks}
  <footer>
    <h2>Questions or Data Requests?</h2>
    <p>Email: support@humanshelter.info | Phone: +63 917 320 6778 | Address: 26 Domitilla St., Provident Village, Tañong, Marikina City, Philippines</p>
  </footer>
</main>`;
}

const baseHtml = fs.readFileSync(templatePath, 'utf8');

const pages = [
  { outFile: 'privacy.html', doc: PRIVACY_DOCUMENT },
  { outFile: 'terms.html', doc: TERMS_DOCUMENT },
];

for (const { outFile, doc } of pages) {
  const contentHtml = renderDocumentHtml(doc);
  const pageHtml = baseHtml
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(doc.pageTitle)}</title>`)
    .replace('<div id="root"></div>', `<div id="root">${contentHtml}</div>`);

  fs.writeFileSync(path.join(distDir, outFile), pageHtml, 'utf8');
  console.log(`Prerendered dist/${outFile}`);
}
