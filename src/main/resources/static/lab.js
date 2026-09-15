const $ = (id) => document.getElementById(id);
let catalog, current, dirty = false, busy = false, selectionRevision = 0;
let sourceDialogTrigger = null, sourceRevision = 0;
let autocompleteCandidates = [], autocompleteMatch = null, autocompleteIndex = 0, composing = false, tabMovesFocus = false;
const drafts = new Map();
let currentSchema;
const LEVEL_LABELS = { basic: '기본 개념 문제', applied: '응용 문제' };
const CATEGORY_LABELS = {
  'select': '01 SELECT · 열과 결과 만들기',
  'where': '02 WHERE · 조건으로 고르기',
  'order-by': '03 ORDER BY · 순서 정하기',
  'joins': '04 JOIN · 테이블 연결하기'
};
function exerciseCategory(exercise) {
  return exercise.category || (exercise.branch === 'codex/filters' ? 'where' : 'select');
}
function exerciseSchemas(exercise) {
  const schemas = [catalog.schema, ...(catalog.schemas || [])];
  return exercise.tables ? schemas.filter((schema) => exercise.tables.includes(schema.table)) : [catalog.schema];
}
function showSchema(schema) {
  currentSchema = schema;
  $('schema-title').textContent = `${schema.name}.${schema.table}`;
  $('schema-description').textContent = schema.description;
  $('schema-count').textContent = `${schema.seedRowCount}행`;
  $('schema').replaceChildren(...schema.columns.map((column) => {
    const row = document.createElement('tr');
    [column.name, column.type, column.description].forEach((value) => row.append(cell('td', value)));
    return row;
  }));
}
async function api(path, options = {}) {
  if (window.SqlLabPagesApi) return window.SqlLabPagesApi(path, options);
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
function adjustIndent(text, start, end, outdent) {
  if (start === end && !outdent) {
    const inserted = '    ';
    return { text: text.slice(0, start) + inserted + text.slice(end), start: start + inserted.length, end: start + inserted.length };
  }
  const firstLineStart = text.lastIndexOf('\n', start - 1) + 1;
  const selectedEnd = end > start && text[end - 1] === '\n' ? end - 1 : end;
  const lastLineEnd = text.indexOf('\n', selectedEnd);
  const blockEnd = lastLineEnd === -1 ? text.length : lastLineEnd;
  const lines = text.slice(firstLineStart, blockEnd).split('\n');
  let offset = firstLineStart, removedBeforeStart = 0, removedBeforeEnd = 0;
  const adjusted = lines.map((line) => {
    if (!outdent) { offset += line.length + 1; return `    ${line}`; }
    const removed = Math.min(4, (line.match(/^ */) || [''])[0].length);
    if (offset < start) removedBeforeStart += Math.min(removed, start - offset);
    if (offset < end) removedBeforeEnd += Math.min(removed, end - offset);
    offset += line.length + 1;
    return line.slice(removed);
  });
  const changed = adjusted.join('\n');
  return {
    text: text.slice(0, firstLineStart) + changed + text.slice(blockEnd),
    start: outdent ? start - removedBeforeStart : start + 4,
    end: outdent ? end - removedBeforeEnd : end + lines.length * 4
  };
}
function indentEditor(outdent) {
  const editor = $('sql');
  const adjusted = adjustIndent(editor.value, editor.selectionStart, editor.selectionEnd, outdent);
  if (adjusted.text === editor.value) return;
  editor.value = adjusted.text;
  editor.setSelectionRange(adjusted.start, adjusted.end);
  markSqlDirty();
}
function comparison(message, state = '') {
  const target = $('comparison');
  target.hidden = !message;
  target.textContent = message;
  target.className = `comparison${state ? ` ${state}` : ''}`;
}
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
  $('topic-title').textContent = CATEGORY_LABELS[exerciseCategory(exercise)] || '상품 조회 SQL 연습';
  const schemas = exerciseSchemas(exercise);
  $('table-choice').replaceChildren(...schemas.map((schema) => {
    const option = cell('option', `${schema.name}.${schema.table}`);
    option.value = schema.table;
    return option;
  }));
  $('table-choice-label').hidden = schemas.length < 2;
  $('table-choice').hidden = schemas.length < 2;
  showSchema(schemas[0]);
  autocompleteCandidates = SqlAutocomplete.createCandidates(schemas);
  $('title').textContent = exercise.title;
  $('step').textContent = `${exercise.id} / ${LEVEL_LABELS[exercise.level] || '기본 개념 문제'}${exercise.optional ? ' · 선택 연습' : ''}`;
  $('minutes').textContent = `약 ${exercise.minutes}분`;
  $('filename').textContent = window.SqlLabPagesApi ? `브라우저 저장 · ${exercise.id}` : `sql/${exercise.id}.sql`;
  $('requirements').replaceChildren(...exercise.requirements.map((r) => cell('li', r)));
  $('syntax-frame').hidden = !exercise.syntaxFrame;
  $('syntax-frame').textContent = exercise.syntaxFrame ? `문법 틀: ${exercise.syntaxFrame}` : '';
  $('hints').textContent = exercise.hints.join(' · ');
  table($('expected'), exercise.columns, exercise.expectedRows);
  document.querySelectorAll('.exercise').forEach((b) => { b.classList.toggle('active', b.dataset.id === exercise.id); b.setAttribute('aria-current', b.dataset.id === exercise.id ? 'step' : 'false'); });
  error(''); comparison(''); $('result-meta').textContent = '';
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
    $('save-status').textContent = dirty ? '아직 저장하지 않은 내용이 있어요.' : (window.SqlLabPagesApi ? '브라우저 저장본을 불러왔어요.' : '파일 내용을 불러왔어요.');
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
    if (current.id === savedId && $('sql').value === savedSql) { dirty = false; $('save-status').textContent = window.SqlLabPagesApi ? '이 브라우저에 저장했어요.' : `sql/${savedId}.sql에 저장했어요.`; }
  } catch (e) { error(e.message); }
});
async function run() {
  if (busy || !current || $('sql').readOnly) return;
  closeAutocomplete();
  busy = true; $('run').disabled = true; $('run').textContent = '실행 중…'; error(''); comparison('실행 결과를 확인하고 있어요…', 'loading');
  $('result-meta').textContent = ''; $('result').replaceChildren(cell('p', 'SQL을 실행하고 있어요…'));
  $('after-run').hidden = false;
  try {
    const result = await api('/api/query', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ exerciseId: current.id, sql: $('sql').value }) });
    table($('result'), result.columns, result.rows);
    $('result-meta').textContent = `${result.rowCount}행 · ${result.elapsedMs}ms${result.truncated ? ' · 최대 200행만 표시' : ''}`;
    const comparedExercise = window.SqlLabPagesApi?.comparisonExercise?.(current) || current;
    const same = SqlResultComparison.matches(result, comparedExercise);
    const retry = current.orderMatters === false ? '반환 열과 값을 확인해 보세요.' : '반환 열·값·정렬 순서를 확인해 보세요.';
    comparison(same ? '정답이에요 · 기대 결과와 같아요' : `아직 정답이 아니에요 · ${retry}`, same ? '' : 'mismatch');
  } catch (e) { comparison(''); error(e.message); $('result').replaceChildren(); $('result-meta').textContent = ''; }
  finally { busy = false; $('run').disabled = false; $('run').textContent = '실행하기 →'; }
}
$('run').addEventListener('click', run);
$('sql').addEventListener('keydown', (e) => {
  if (e.isComposing || composing || $('sql').readOnly) return;
  if (e.key !== 'Escape' && e.key !== 'Tab') tabMovesFocus = false;
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); closeAutocomplete(); run(); return; }
  if (e.key === 'Escape') { closeAutocomplete(); tabMovesFocus = true; return; }
  if (e.key === 'Tab') {
    if (autocompleteMatch) { e.preventDefault(); acceptAutocomplete(autocompleteIndex); return; }
    if (tabMovesFocus) { tabMovesFocus = false; return; }
    e.preventDefault();
    indentEditor(e.shiftKey);
    return;
  }
  if (!autocompleteMatch) return;
  if (e.key === 'ArrowDown') { e.preventDefault(); selectAutocomplete(autocompleteIndex + 1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); selectAutocomplete(autocompleteIndex - 1); }
  else if (e.key === 'Enter') { e.preventDefault(); acceptAutocomplete(autocompleteIndex); }
});
$('sql').addEventListener('keyup', (e) => {
  if (!composing && !autocompleteMatch && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) refreshAutocomplete();
});
async function openSourceTable() {
  if (!current) return;
  const dialog = $('source-dialog');
  const revision = ++sourceRevision;
  const exerciseId = current.id;
  const schema = currentSchema;
  const sourceSql = `SELECT * FROM ${schema.name}.${schema.table} ORDER BY ${schema.columns[0].name}`;
  $('source-dialog-title').textContent = `원본 테이블 · ${schema.name}.${schema.table}`;
  $('source-description').textContent = `${schema.columns[0].name} 순서로 보여줍니다.`;
  sourceDialogTrigger = $('open-source');
  $('source-error').hidden = true;
  $('source-error').textContent = '';
  $('source-status').textContent = '원본 테이블을 불러오고 있어요…';
  const loading = cell('p', '선택한 테이블을 조회하는 중입니다.');
  loading.className = 'empty';
  $('source-result').replaceChildren(loading);
  dialog.setAttribute('aria-busy', 'true');
  dialog.showModal();
  try {
    const result = await api('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exerciseId, sql: sourceSql })
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
$('table-choice').addEventListener('change', () => {
  showSchema(exerciseSchemas(current).find((schema) => schema.table === $('table-choice').value));
});
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
    for (const [level, label] of Object.entries(LEVEL_LABELS)) {
      const section = document.createElement('details');
      section.className = 'exercise-level';
      section.open = level === (catalog.exercises[0].level || 'basic');
      const heading = cell('summary', label);
      heading.id = `level-${level}`;
      section.setAttribute('aria-labelledby', heading.id);
      section.append(heading);
      for (const [category, categoryLabel] of Object.entries(CATEGORY_LABELS)) {
        const exercises = catalog.exercises.filter(e => (e.level || 'basic') === level && exerciseCategory(e) === category);
        const group = document.createElement('details');
        group.className = 'exercise-group';
        group.open = exercises.includes(catalog.exercises[0]);
        const summary = cell('summary', categoryLabel);
        summary.className = 'group-label';
        const groupList = document.createElement('div');
        groupList.className = 'exercise-list';
        group.append(summary, groupList);
        group.addEventListener('toggle', () => {
          if (group.open) document.querySelectorAll('.exercise-group').forEach((other) => { if (other !== group) other.open = false; });
        });
        for (const e of exercises) {
          const b = document.createElement('button'); b.className = 'exercise'; b.dataset.id = e.id; b.append(cell('span', e.id), document.createTextNode(`${e.title}${e.optional ? ' · 선택' : ''}`)); b.addEventListener('click', () => select(e)); groupList.append(b);
        }
        if (!exercises.length) groupList.append(cell('p', '아직 등록된 문제가 없어요.'));
        section.append(group);
      }
      $('exercises').append(section);
    }
    await select(catalog.exercises[0]);
    $('open-source').disabled = false;
    try { await api('/api/health'); $('connection').textContent = window.SqlLabPagesApi ? '브라우저 DB 준비됨' : 'Supabase 연결됨'; }
    catch (_) { $('connection').textContent = window.SqlLabPagesApi ? '브라우저 DB 초기화 실패' : 'DB 연결 준비 중'; $('connection').classList.add('offline'); }
  } catch (e) { error(e.message); }
}
init();
