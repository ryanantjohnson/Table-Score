import { mkdir, readFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const nativeDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryDirectory = resolve(nativeDirectory, '..');
const webDirectory = resolve(nativeDirectory, 'www');
const files = ['index.html', 'legal.html'];

// Check both source files before changing the generated bundle.
for (const file of files) {
  const source = resolve(repositoryDirectory, file);
  const html = await readFile(source, 'utf8');
  if (!/<html\b/i.test(html) || !/<head\b/i.test(html) || !/<body\b/i.test(html) || !/<\/html>/i.test(html)) {
    throw new Error('Missing or incomplete web document: ' + file);
  }
}

await mkdir(webDirectory, { recursive: true });
for (const file of files) {
  await copyFile(resolve(repositoryDirectory, file), resolve(webDirectory, file));
  console.log('Bundled ' + file);
}
console.log('TableRec web bundle prepared in native/www.');
