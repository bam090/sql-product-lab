const $ = (id) => document.getElementById(id);
let catalog, current, dirty = false, busy = false, selectionRevision = 0;
const drafts = new Map();
async function api(path, options = {}) {
  let response;
  try { response = await fetch(path, options); }
  catch (_) { throw new Error('실행 서버에 연결되지 않았어요. ReviewApplication이 실행 중인지 확인한 뒤 다시 시도해 주세요.'); }
  let body;
  try { body = await response.json(); }
  catch (_) { throw new Error('서버 응답을 읽지 못했어요. 잠시 후 다시 실행해 주세요.'); }
  if (!response.ok) throw new Error(body.message || '요청을 처리하지 못했어요.');
  return body;
}
function cell(tag, value) {
  const el = document.createElement(tag);
  el.textContent = value === null ? 'NULL' : String(value);
  if (value === null) el.className = 'null';
  return el;
}
function table(target, columns, rows) {
  target.replaceChildren();
  const t = document.createElement('table');
  const head = document.createElement('thead'), tr = document.createElement('tr');
  columns.forEach((c) => tr.append(cell('th', c))); head.append(tr); t.append(head);
  const body = document.createElement('tbody');
  rows.forEach((row) => { const r = document.createElement('tr'); row.forEach((v) => r.append(cell('td', v))); body.append(r); });
  t.append(body); target.append(t);
}
function error(message) { $('error').hidden = !message; $('error').textContent = message; }
async function select(exercise) {
  if (busy) return;
  if (current && dirty) drafts.set(current.id, $('sql').value);
  current = exercise;
  selectionRevision++;
  $('sql').readOnly = true; $('run').disabled = true; $('save').disabled = true;
  $('title').textContent = exercise.title;
  $('step').textContent = `${exercise.id} / ${exercise.optional ? '선택 연습' : '핵심 연습'}`;
  $('minutes').textContent = `약 ${exercise.minutes}분`;
  $('filename').textContent = `sql/${exercise.id}.sql`;
  $('requirements').replaceChildren(...exercise.requirements.map((r) => cell('li', r)));
  $('hints').textContent = exercise.hints.join(' · ');
  table($('expected'), exercise.columns, exercise.expectedRows);
  document.querySelectorAll('.exercise').forEach((b) => { b.classList.toggle('active', b.dataset.id === exercise.id); b.setAttribute('aria-current', b.dataset.id === exercise.id ? 'step' : 'false'); });
  error(''); $('comparison').textContent = ''; $('result-meta').textContent = '';
  $('result').replaceChildren(cell('p', 'SQL을 실행하면 실제 조회 결과가 표시됩니다.'));
  await load(false);
}
async function load(force) {
  const revision = selectionRevision, selectedId = current.id;
  if (force && dirty && !confirm('저장하지 않은 SQL을 파일 내용으로 바꿀까요?')) return;
  try {
    if (!force && drafts.has(current.id)) { $('sql').value = drafts.get(current.id); dirty = true; }
    else { const loaded = await api(`/api/sql/${selectedId}`); if (revision !== selectionRevision) return; $('sql').value = loaded.sql; dirty = false; drafts.delete(selectedId); }
    $('save-status').textContent = dirty ? '아직 파일에 저장하지 않은 내용이 있어요.' : '파일 내용을 불러왔어요.';
  } catch (e) { if (revision === selectionRevision) error(e.message); }
  finally { if (revision === selectionRevision) { $('sql').readOnly = false; $('run').disabled = false; $('save').disabled = false; } }
}
$('sql').addEventListener('input', () => { dirty = true; $('save-status').textContent = '저장하지 않은 변경 사항'; });
$('reload').addEventListener('click', () => load(true));
$('save').addEventListener('click', async () => {
  const savedId = current.id, savedSql = $('sql').value;
  try {
    await api(`/api/sql/${savedId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sql: savedSql }) });
    drafts.delete(savedId);
    if (current.id === savedId && $('sql').value === savedSql) { dirty = false; $('save-status').textContent = `sql/${savedId}.sql에 저장했어요.`; }
  } catch (e) { error(e.message); }
});
async function run() {
  if (busy || !current || $('sql').readOnly) return;
  busy = true; $('run').disabled = true; $('run').textContent = '실행 중…'; error(''); $('comparison').textContent = '';
  try {
    const result = await api('/api/query', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ exerciseId: current.id, sql: $('sql').value }) });
    table($('result'), result.columns, result.rows);
    $('result-meta').textContent = `${result.rowCount}행 · ${result.elapsedMs}ms${result.truncated ? ' · 최대 200행만 표시' : ''}`;
    const normalize = (rows) => rows.map((r) => r.map((v) => v === null ? null : String(v)));
    const same = JSON.stringify(result.columns) === JSON.stringify(current.columns) && JSON.stringify(normalize(result.rows)) === JSON.stringify(normalize(current.expectedRows));
    $('comparison').textContent = same ? '기대 결과와 같아요. SQL이 요구사항을 어떻게 반영했는지도 설명해 보세요.' : '기대 결과와 달라요. 반환 열 이름, 조건, 정렬 순서를 확인해 보세요.';
    $('comparison').className = `comparison${same ? '' : ' mismatch'}`;
  } catch (e) { error(e.message); $('result').replaceChildren(); $('result-meta').textContent = ''; }
  finally { busy = false; $('run').disabled = false; $('run').textContent = '실행하기 →'; }
}
$('run').addEventListener('click', run);
$('sql').addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); run(); } });
window.addEventListener('beforeunload', (e) => { if (dirty || drafts.size) { e.preventDefault(); e.returnValue = ''; } });
async function init() {
  try {
    catalog = await api('/api/exercises');
    catalog.schema.columns.forEach((c) => { const tr = document.createElement('tr'); [c.name,c.type,c.description].forEach((v) => tr.append(cell('td',v))); $('schema').append(tr); });
    let previous = '';
    const labels = { 'codex/select': '01 열 선택과 결과 가공', 'codex/filters': '02 조건으로 상품 찾기', 'codex/integration': '03 종합 조회' };
    const order = ['codex/select', 'codex/filters', 'codex/integration'];
    [...catalog.exercises].sort((a, b) => order.indexOf(a.branch) - order.indexOf(b.branch)).forEach((e) => {
      if (e.branch !== previous) { const p = cell('p', labels[e.branch] || e.branch); p.className = 'group-label'; $('exercises').append(p); previous = e.branch; }
      const b = document.createElement('button'); b.className = 'exercise'; b.dataset.id = e.id; b.append(cell('span', e.id), document.createTextNode(e.title)); b.addEventListener('click', () => select(e)); $('exercises').append(b);
    });
    await select(catalog.exercises[0]);
    try { await api('/api/health'); $('connection').textContent = 'Supabase 연결됨'; }
    catch (_) { $('connection').textContent = 'DB 연결 준비 중'; $('connection').classList.add('offline'); }
  } catch (e) { error(e.message); }
}
init();
