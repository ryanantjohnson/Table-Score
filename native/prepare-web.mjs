import { mkdir, readFile, copyFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const nativeDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryDirectory = resolve(nativeDirectory, '..');
const webDirectory = resolve(nativeDirectory, 'www');
const documents = ['index.html', 'legal.html'];
const files = [...documents, 'app-platform.js', 'app-intro.js', 'app-feedback.js'];

// Check both source files before changing the generated bundle.
for (const file of documents) {
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
// Stamp the actual store identity into the bundled page, before app-intro loads.
// The signed iOS workflow already supplies TR_VERSION and TR_BUILD_NUMBER.
let build;
if (process.env.TR_VERSION && process.env.TR_BUILD_NUMBER) {
  build = {platform:'iOS', version:process.env.TR_VERSION, number:process.env.TR_BUILD_NUMBER};
} else if (process.env.TR_BUILD_PLATFORM === 'Android') {
  const gradle = await readFile(resolve(nativeDirectory, 'android/app/build.gradle'), 'utf8');
  const version = gradle.match(/versionName\s+"([^"]+)"/)?.[1];
  const number = process.env.GITHUB_RUN_NUMBER
    ? String(1000 + Number(process.env.GITHUB_RUN_NUMBER))
    : gradle.match(/versionCode\s+(\d+)/)?.[1];
  if (!version || !number) throw new Error('Android build identity is missing.');
  build = {platform:'Android', version, number};
}
if (build) {
  if (!/^[0-9.]+$/.test(build.version) || !/^[0-9.]+$/.test(build.number)) throw new Error('Invalid store version/build.');
  const target = resolve(webDirectory, 'index.html');
  const html = await readFile(target, 'utf8');
  await writeFile(target, html.replace('<head>', '<head>\n<script>window.tableRecBuild=' + JSON.stringify(build) + ';</script>'));
}
console.log('TableRec web bundle prepared in native/www.');
