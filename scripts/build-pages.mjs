import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const output = new URL('../dist-pages/', import.meta.url);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const file of ['autocomplete.js', 'result-comparison.js', 'lab.js', 'style.css']) {
  await cp(new URL(`../src/main/resources/static/${file}`, import.meta.url), new URL(file, output));
}
await cp(new URL('../exercises.json', import.meta.url), new URL('exercises.json', output));
const seedParts = await Promise.all(['seed.sql', 'join-seed.sql'].map(file =>
  readFile(new URL(`../setup/${file}`, import.meta.url), 'utf8')));
await writeFile(new URL('seed.sql', output), seedParts.join('\n'));
for (const file of ['pglite.wasm', 'initdb.wasm', 'pglite.data']) {
  await cp(new URL(`../node_modules/@electric-sql/pglite/dist/${file}`, import.meta.url), new URL(file, output));
}

await Promise.all([
  build({ entryPoints: [fileURLToPath(new URL('../pages/browser-api.js', import.meta.url))], outfile: fileURLToPath(new URL('browser-api.js', output)), bundle: true, format: 'iife', platform: 'browser', target: 'es2022' }),
  build({ entryPoints: [fileURLToPath(new URL('../pages/db-worker.js', import.meta.url))], outfile: fileURLToPath(new URL('db-worker.js', output)), bundle: true, format: 'esm', platform: 'browser', target: 'es2022' })
]);

let html = await readFile(new URL('../src/main/resources/templates/index.html', import.meta.url), 'utf8');
const replacements = new Map([
  ['href="/style.css"', 'href="./style.css"'],
  ['src="/autocomplete.js"', 'src="./autocomplete.js"'],
  ['src="/result-comparison.js"', 'src="./result-comparison.js"'],
  ['src="/lab.js"', 'src="./lab.js"'],
  ['  <script src="./lab.js" defer></script>', '  <script src="./browser-api.js" defer></script>\n  <script src="./lab.js" defer></script>'],
  ['href="/" class="brand"', 'href="./" class="brand"'],
  ['IntelliJ에서는 <code>sql/문제번호.sql</code>을 수정하세요. 웹에서 저장한 내용도 같은 파일에 반영됩니다.', '작성한 SQL은 이 브라우저에 연습별로 저장됩니다. 다른 기기나 브라우저와는 공유되지 않습니다.'],
  ['>파일 다시 읽기<', '>브라우저 저장본 다시 읽기<'],
  ['>파일에 저장<', '>브라우저에 저장<'],
  ['Supabase PostgreSQL · 조회 전용 실습', '브라우저 PostgreSQL(PGlite) · 이 기기에서만 SQL 저장 · 조회 전용 실습'],
  ['<p class="panel-label">실제 데이터베이스</p>', '<p class="panel-label">브라우저 데이터베이스</p>'],
  ['SQL을 실행하면 실제 데이터베이스의 결과가 여기에 표시됩니다.', 'SQL을 실행하면 브라우저 PostgreSQL의 결과가 여기에 표시됩니다.']
]);
for (const [from, to] of replacements) {
  if (!html.includes(from)) throw new Error(`index.html 변환 대상을 찾지 못했습니다: ${from}`);
  html = html.replace(from, to);
}
// Changed assets get new URLs so returning learners do not keep stale editor styles/scripts.
for (const file of ['style.css', 'autocomplete.js', 'result-comparison.js', 'lab.js', 'browser-api.js']) {
  const hash = createHash('sha256').update(await readFile(new URL(file, output))).digest('hex').slice(0, 12);
  html = html.replaceAll(`"./${file}"`, `"./${file}?v=${hash}"`);
}
await writeFile(new URL('index.html', output), html);
