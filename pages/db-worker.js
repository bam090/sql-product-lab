import { PGlite } from '@electric-sql/pglite';
import { runReadOnlyQuery, seedDatabase } from './sql-runtime.mjs';

let dbPromise;

async function fetchAsset(name, type = 'arrayBuffer') {
  const response = await fetch(new URL(name, self.location.href));
  if (!response.ok) throw new Error(`브라우저 DB 파일을 불러오지 못했어요 (${name}).`);
  return response[type]();
}

async function initialize() {
  const [pgliteBytes, initdbBytes, fsBundle, seedSql] = await Promise.all([
    fetchAsset('pglite.wasm'),
    fetchAsset('initdb.wasm'),
    fetchAsset('pglite.data', 'blob'),
    fetchAsset('seed.sql', 'text')
  ]);
  const [pgliteWasmModule, initdbWasmModule] = await Promise.all([
    WebAssembly.compile(pgliteBytes),
    WebAssembly.compile(initdbBytes)
  ]);
  const db = await PGlite.create({ pgliteWasmModule, initdbWasmModule, fsBundle });
  await seedDatabase(db, seedSql);
  return db;
}

async function handle({ type, sql }) {
  const db = await (dbPromise ||= initialize());
  if (type === 'health') {
    const result = await db.query('SELECT 1 AS ok');
    return { status: result.rows[0]?.ok === 1 ? 'ok' : 'error' };
  }
  if (type === 'query') return runReadOnlyQuery(db, sql);
  throw new Error('알 수 없는 브라우저 DB 요청입니다.');
}

let queue = Promise.resolve();
self.onmessage = ({ data }) => {
  queue = queue.then(async () => {
    try { self.postMessage({ id: data.id, result: await handle(data) }); }
    catch (error) { self.postMessage({ id: data.id, error: String(error?.message || error).slice(0, 800) }); }
  });
};
