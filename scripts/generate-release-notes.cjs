const fs = require('fs');

const rawTag = process.env.TAG_NAME;
const tag = rawTag.replace(/^v/, '');

const history = JSON.parse(fs.readFileSync('update/history.json', 'utf8'));
const i18n = JSON.parse(fs.readFileSync('source/i18n/zh-CN.json', 'utf8'));

const entry = history.find((e) => e.version === tag || e.version === rawTag);

if (!entry) {
  console.log('No matching version found, fallback');
  fs.writeFileSync('RELEASE_NOTES.md', '# ' + rawTag);
  fs.writeFileSync('RELEASE_TITLE.txt', rawTag);
  process.exit(0);
}

const get = (key) => i18n.changelog?.[key] ?? i18n[key] ?? '';

const title = get(entry.titleKey) || rawTag;
const changes = get(entry.changesKey) || '';
const imageAlt = get(entry.imageAltKey) || '';
const image = entry.image || '';

const imageUrl = image
  ? 'https://raw.githubusercontent.com/etherfun/perfectwall/' + rawTag + '/' + image
  : '';
const imageTag = imageUrl ? '<img src="' + imageUrl + '">' : '';
const caption = imageAlt ? imageAlt : '';

const notes =
  imageTag +
  (imageTag && caption ? '\n\n' + caption : '') +
  (imageTag && changes ? '\n\n' : '') +
  changes;

fs.writeFileSync('RELEASE_NOTES.md', notes);
fs.writeFileSync('RELEASE_TITLE.txt', rawTag + ' - ' + title);

console.log('Release generated:', rawTag);
