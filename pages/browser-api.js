import { comparisonExercise, starterSql } from './sql-runtime.mjs';

const STORAGE_PREFIX = 'sql-product-lab:';
const INIT_TIMEOUT_MS = 60000;
const REQUEST_TIMEOUT_MS = 5000;
let catalogPromise, readyPromise, worker, nextId = 1;
const pending = new Map();

function stopWorker(message) {
  worker?.terminate();
  worker = null;
  readyPromise = null;
  for (const request of pending.values()) {
    clearTimeout(request.timer);
    request.reject(new Error(message));
  }
  pending.clear();
}

function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL('./db-worker.js', document.baseURI), { type: 'module', name: 'sql-product-lab-db' });
  worker.onmessage = ({ data }) => {
    const request = pending.get(data.id);
    if (!request) return;
    clearTimeout(request.timer);
    pending.delete(data.id);
    if (data.error) request.reject(new Error(data.error));
    else request.resolve(data.result);
  };
  worker.onerror = () => stopWorker('브라우저 DB를 시작하지 못했어요. 페이지를 새로고침한 뒤 다시 시도해 주세요.');
  return worker;
}

function callWorker(type, sql, timeoutMs, timeoutMessage) {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    const timer = setTimeout(() => {
      stopWorker(timeoutMessage);
    }, timeoutMs);
    pending.set(id, { resolve, reject, timer });
    getWorker().postMessage({ id, type, sql });
  });
}

function ensureReady() {
  return readyPromise ||= callWorker(
    'health',
    undefined,
    INIT_TIMEOUT_MS,
    '브라우저 DB 준비가 60초를 넘었어요. 네트워크를 확인하고 페이지를 새로고침해 주세요.'
  ).catch((error) => { readyPromise = null; throw error; });
}

async function catalog() {
  return catalogPromise ||= fetch('./exercises.json').then(async (response) => {
    if (!response.ok) throw new Error('연습 문제를 불러오지 못했어요.');
    return response.json();
  });
}

async function requireExercise(id) {
  const value = await catalog();
  const exercise = value.exercises.find((item) => item.id === id);
  if (!exercise) throw new Error('알 수 없는 연습 번호입니다.');
  return { value, exercise };
}

async function pagesApi(path, options = {}) {
  if (path === '/api/exercises') return catalog();
  if (path === '/api/health') return ensureReady();
  if (path === '/api/query' && options.method === 'POST') {
    const body = JSON.parse(options.body || '{}');
    await requireExercise(body.exerciseId);
    await ensureReady();
    return callWorker(
      'query',
      body.sql,
      REQUEST_TIMEOUT_MS,
      'SQL 실행이 5초를 넘어 브라우저 DB를 초기화했어요. 쿼리를 단순하게 바꿔 다시 시도해 주세요.'
    );
  }

  const match = path.match(/^\/api\/sql\/([A-Za-z0-9_-]+)$/);
  if (!match) throw new Error('알 수 없는 요청입니다.');
  const { value, exercise } = await requireExercise(match[1]);
  const key = STORAGE_PREFIX + exercise.id;
  if (options.method === 'POST') {
    const body = JSON.parse(options.body || '{}');
    if (typeof body.sql !== 'string') throw new Error('저장할 SQL이 없습니다.');
    try { localStorage.setItem(key, body.sql); }
    catch (_) { throw new Error('브라우저에 SQL을 저장하지 못했어요. 저장 공간과 브라우저 설정을 확인해 주세요.'); }
    return { sql: body.sql };
  }
  try {
    const saved = localStorage.getItem(key);
    return { sql: saved === null ? starterSql(exercise, value.schema) : saved };
  } catch (_) {
    throw new Error('브라우저에 저장한 SQL을 읽지 못했어요. 브라우저 설정을 확인해 주세요.');
  }
}
pagesApi.comparisonExercise = comparisonExercise;
window.SqlLabPagesApi = pagesApi;
