const $ = (id) => document.getElementById(id);
let catalog, current, dirty = false, busy = false, selectionRevision = 0;
let sourceDialogTrigger = null, sourceRevision = 0;
let autocompleteCandidates = [], autocompleteMatch = null, autocompleteIndex = 0, composing = false;
const drafts = new Map();
const SOURCE_TABLE_SQL = 'SELECT * FROM practice.products ORDER BY product_id';
const BRANCH_LABELS = {
  'codex/select': '01 열 선택과 결과 가공',
  'codex/filters': '02 조건으로 상품 찾기',
  'codex/integration': '03 종합 조회'
};
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
function markSqlDirty() {
  dirty = true;
  $('save-status').textContent = '저장하지 않은 변경 사항';
}
function closeAutocomplete() {
  autocompleteMatch = null;
  autocompleteIndex = 0;
  $('sql-suggestions').hidden = true;
  $('sql-suggestions').replaceChildren();
  $('sql').setAttribute('aria-expanded', 'false');
  $('sql').removeAttribute('aria-activedescendant');
}
function selectAutocomplete(index) {
  if (!autocompleteMatch) return;
  autocompleteIndex = (index + autocompleteMatch.items.length) % autocompleteMatch.items.length;
  [...$('sql-suggestions').children].forEach((option, optionIndex) => {
    option.setAttribute('aria-selected', optionIndex === autocompleteIndex ? 'true' : 'false');
  });
  const active = $(`sql-suggestion-${autocompleteIndex}`);
  $('sql').setAttribute('aria-activedescendant', active.id);
  active.scrollIntoView({ block: 'nearest' });
}
function renderAutocomplete(match) {
  autocompleteMatch = match;
  autocompleteIndex = 0;
  const options = match.items.map((item, index) => {
    const option = document.createElement('div');
    option.id = `sql-suggestion-${index}`;
    option.className = 'autocomplete-option';
    option.setAttribute('role', 'option');
    option.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
    const value = cell('span', item.value), kind = cell('span', item.kind);
    value.className = 'autocomplete-value'; kind.className = 'autocomplete-kind';
    option.append(value, kind);
    option.addEventListener('mouseenter', () => selectAutocomplete(index));
    option.addEventListener('mousedown', (event) => event.preventDefault());
    option.addEventListener('click', () => acceptAutocomplete(index));
    return option;
  });
  $('sql-suggestions').replaceChildren(...options);
  $('sql-suggestions').hidden = false;
  $('sql').setAttribute('aria-expanded', 'true');
  $('sql').setAttribute('aria-activedescendant', options[0].id);
}
function refreshAutocomplete() {
  const editor = $('sql');
  if (composing || editor.readOnly || editor.selectionStart !== editor.selectionEnd) {
    closeAutocomplete();
    return;
  }
  const match = SqlAutocomplete.completions(editor.value, editor.selectionStart, autocompleteCandidates);
  if (match) renderAutocomplete(match);
  else closeAutocomplete();
}
function acceptAutocomplete(index) {
  if (!autocompleteMatch) return;
  const item = autocompleteMatch.items[index], range = autocompleteMatch.range;
  $('sql').setRangeText(item.value, range.start, range.end, 'end');
  markSqlDirty();
  closeAutocomplete();
}
async function select(exercise) {
  if (busy) return;
  closeAutocomplete();
  if (current && dirty) drafts.set(current.id, $('sql').value);
  current = exercise;
  selectionRevision++;
  $('sql').readOnly = true; $('run').disabled = true; $('save').disabled = true;
  $('topic-title').textContent = BRANCH_LABELS[exercise.branch] || '상품 조회 SQL 연습';
  $('title').textContent = exercise.title;
  $('step').textContent = `${exercise.id} / ${exercise.optional ? '선택 연습' : '핵심 연습'}`;
  $('minutes').textContent = `약 ${exercise.minutes}분`;
  $('filename').textContent = `sql/${exercise.id}.sql`;
  $('requirements').replaceChildren(...exercise.requirements.map((r) => cell('li', r)));
  $('hints').textContent = exercise.hints.join(' · ');
  table($('expected'), exercise.columns, exercise.expectedRows);
  document.querySelectorAll('.exercise').forEach((b) => { b.classList.toggle('active', b.dataset.id === exercise.id); b.setAttribute('aria-current', b.dataset.id === exercise.id ? 'step' : 'false'); });
  error(''); $('comparison').textContent = ''; $('result-meta').textContent = '';
  $('after-run').hidden = true;
  $('result').replaceChildren(cell('p', 'SQL을 실행하면 실제 조회 결과가 표시됩니다.'));
  await load(false);
}
async function load(force) {
  closeAutocomplete();
  const revision = selectionRevision, selectedId = current.id;
  if (force && dirty && !confirm('저장하지 않은 SQL을 파일 내용으로 바꿀까요?')) return;
  try {
    if (!force && drafts.has(current.id)) { $('sql').value = drafts.get(current.id); dirty = true; }
    else { const loaded = await api(`/api/sql/${selectedId}`); if (revision !== selectionRevision) return; $('sql').value = loaded.sql; dirty = false; drafts.delete(selectedId); }
    $('save-status').textContent = dirty ? '아직 파일에 저장하지 않은 내용이 있어요.' : '파일 내용을 불러왔어요.';
  } catch (e) { if (revision === selectionRevision) error(e.message); }
  finally { if (revision === selectionRevision) { $('sql').readOnly = false; $('run').disabled = false; $('save').disabled = false; } }
}
$('sql').addEventListener('input', () => { markSqlDirty(); if (!composing) refreshAutocomplete(); });
$('sql').addEventListener('compositionstart', () => { composing = true; closeAutocomplete(); });
$('sql').addEventListener('compositionend', () => { composing = false; refreshAutocomplete(); });
$('sql').addEventListener('click', refreshAutocomplete);
$('sql').addEventListener('blur', closeAutocomplete);
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
  closeAutocomplete();
  busy = true; $('run').disabled = true; $('run').textContent = '실행 중…'; error(''); $('comparison').textContent = '';
  $('after-run').hidden = false;
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
$('sql').addEventListener('keydown', (e) => {
  if (e.isComposing || composing) return;
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); closeAutocomplete(); run(); return; }
  if (!autocompleteMatch) return;
  if (e.key === 'ArrowDown') { e.preventDefault(); selectAutocomplete(autocompleteIndex + 1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); selectAutocomplete(autocompleteIndex - 1); }
  else if (e.key === 'Tab') { e.preventDefault(); acceptAutocomplete(autocompleteIndex); }
  else if (e.key === 'Escape') { e.preventDefault(); closeAutocomplete(); }
  else if (e.key === 'Enter') closeAutocomplete();
});
$('sql').addEventListener('keyup', (e) => {
  if (!composing && !autocompleteMatch && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) refreshAutocomplete();
});
async function openSourceTable() {
  if (!current) return;
  const dialog = $('source-dialog');
  const revision = ++sourceRevision;
  const exerciseId = current.id;
  sourceDialogTrigger = $('open-source');
  $('source-error').hidden = true;
  $('source-error').textContent = '';
  $('source-status').textContent = '원본 테이블을 불러오고 있어요…';
  const loading = cell('p', '실제 데이터베이스에서 상품 데이터를 조회하는 중입니다.');
  loading.className = 'empty';
  $('source-result').replaceChildren(loading);
  dialog.setAttribute('aria-busy', 'true');
  dialog.showModal();
  try {
    const result = await api('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exerciseId, sql: SOURCE_TABLE_SQL })
    });
    if (revision !== sourceRevision || !dialog.open) return;
    table($('source-result'), result.columns, result.rows);
    $('source-status').textContent = `${result.rowCount}행${result.truncated ? ' · 최대 200행만 표시' : ''}`;
  } catch (e) {
    if (revision !== sourceRevision || !dialog.open) return;
    $('source-result').replaceChildren();
    $('source-status').textContent = '원본 테이블을 불러오지 못했어요.';
    $('source-error').textContent = e.message;
    $('source-error').hidden = false;
  } finally {
    if (revision === sourceRevision) dialog.removeAttribute('aria-busy');
  }
}
$('open-source').addEventListener('click', openSourceTable);
$('close-source').addEventListener('click', () => $('source-dialog').close());
$('source-dialog').addEventListener('click', (e) => {
  const dialog = $('source-dialog');
  const bounds = dialog.getBoundingClientRect();
  const outside = e.clientX < bounds.left || e.clientX > bounds.right || e.clientY < bounds.top || e.clientY > bounds.bottom;
  if (outside) dialog.close();
});
$('source-dialog').addEventListener('close', () => {
  sourceRevision++;
  if (sourceDialogTrigger) sourceDialogTrigger.focus();
  sourceDialogTrigger = null;
});
window.addEventListener('beforeunload', (e) => { if (dirty || drafts.size) { e.preventDefault(); e.returnValue = ''; } });
async function init() {
  try {
    catalog = await api('/api/exercises');
    autocompleteCandidates = SqlAutocomplete.createCandidates(catalog.schema);
    $('schema-description').textContent = catalog.schema.description;
    $('schema-count').textContent = `${catalog.schema.seedRowCount}행`;
    catalog.schema.columns.forEach((c) => { const tr = document.createElement('tr'); [c.name,c.type,c.description].forEach((v) => tr.append(cell('td',v))); $('schema').append(tr); });
    let previous = '';
    const order = ['codex/select', 'codex/filters', 'codex/integration'];
    [...catalog.exercises].sort((a, b) => order.indexOf(a.branch) - order.indexOf(b.branch)).forEach((e) => {
      if (e.branch !== previous) { const p = cell('p', BRANCH_LABELS[e.branch] || e.branch); p.className = 'group-label'; $('exercises').append(p); previous = e.branch; }
      const b = document.createElement('button'); b.className = 'exercise'; b.dataset.id = e.id; b.append(cell('span', e.id), document.createTextNode(e.title)); b.addEventListener('click', () => select(e)); $('exercises').append(b);
    });
    await select(catalog.exercises[0]);
    $('open-source').disabled = false;
    try { await api('/api/health'); $('connection').textContent = 'Supabase 연결됨'; }
    catch (_) { $('connection').textContent = 'DB 연결 준비 중'; $('connection').classList.add('offline'); }
  } catch (e) { error(e.message); }
}
init();
