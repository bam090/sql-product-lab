const MAX_SQL_BYTES = 16 * 1024;
const RESULT_LIMIT = 200;

function invalid(message) {
  throw new Error(message);
}

function scanSql(sql) {
  let state = 'normal', blockDepth = 0, dollarDelimiter = null;
  const structural = [];
  const terminators = [];

  for (let i = 0; i < sql.length; i++) {
    const current = sql[i], next = sql[i + 1];
    if (state === 'normal') {
      if (current === "'") state = 'single';
      else if (current === '"') state = 'double';
      else if (current === '-' && next === '-') { state = 'line'; structural.push(' ', ' '); i++; continue; }
      else if (current === '/' && next === '*') { state = 'block'; blockDepth = 1; structural.push(' ', ' '); i++; continue; }
      else if (current === '$') {
        const match = sql.slice(i).match(/^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/);
        if (match) { state = 'dollar'; dollarDelimiter = match[0]; structural.push(...' '.repeat(match[0].length)); i += match[0].length - 1; continue; }
      }
      structural.push(state === 'normal' ? current : ' ');
      if (state === 'normal' && current === ';') terminators.push(i);
      continue;
    }

    structural.push(current === '\n' ? '\n' : ' ');
    if (state === 'single' && current === "'" && next === "'") { structural.push(' '); i++; }
    else if (state === 'single' && current === "'") state = 'normal';
    else if (state === 'double' && current === '"' && next === '"') { structural.push(' '); i++; }
    else if (state === 'double' && current === '"') state = 'normal';
    else if (state === 'line' && current === '\n') state = 'normal';
    else if (state === 'block' && current === '/' && next === '*') { structural.push(' '); blockDepth++; i++; }
    else if (state === 'block' && current === '*' && next === '/') { structural.push(' '); blockDepth--; i++; if (!blockDepth) state = 'normal'; }
    else if (state === 'dollar' && sql.startsWith(dollarDelimiter, i)) {
      structural.push(...' '.repeat(dollarDelimiter.length - 1));
      i += dollarDelimiter.length - 1;
      state = 'normal';
      dollarDelimiter = null;
    }
  }

  if (!['normal', 'line'].includes(state)) invalid('닫히지 않은 문자열, 식별자 또는 주석이 있습니다.');
  return { structural: structural.join(''), terminators };
}

export function validateSingleSelect(sql) {
  if (typeof sql !== 'string' || !sql.trim()) invalid('실행할 SQL을 작성해 주세요.');
  if (new TextEncoder().encode(sql).length > MAX_SQL_BYTES) invalid('SQL은 16KB 이하로 작성해 주세요.');
  if (sql.includes('\0')) invalid('SQL에 허용되지 않은 문자가 있습니다.');

  const { structural, terminators } = scanSql(sql);
  const trimmed = structural.trimStart();
  if (!/^select(?![A-Za-z0-9_$])/i.test(trimmed)) invalid('SELECT 문 하나만 실행할 수 있습니다.');
  if (terminators.length > 1 || (terminators.length === 1 && structural.slice(terminators[0] + 1).trim())) {
    invalid('SELECT 문 하나만 실행할 수 있습니다.');
  }
  return terminators.length ? sql.slice(0, terminators[0]) : sql;
}

function normalizeValue(value, dataTypeID) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'bigint') return Number.isSafeInteger(Number(value)) ? Number(value) : String(value);
  if (Number(dataTypeID) === 1700 && typeof value === 'string' && Number.isFinite(Number(value))) return Number(value);
  if (value instanceof Date) {
    const two = (part) => String(part).padStart(2, '0');
    const date = `${value.getFullYear()}-${two(value.getMonth() + 1)}-${two(value.getDate())}`;
    const time = `${two(value.getHours())}:${two(value.getMinutes())}`;
    const seconds = value.getSeconds() || value.getMilliseconds() ? `:${two(value.getSeconds())}` : '';
    const fraction = value.getMilliseconds() ? `.${String(value.getMilliseconds()).padStart(3, '0').replace(/0+$/, '')}` : '';
    return `${date}T${time}${seconds}${fraction}`;
  }
  if (Number(dataTypeID) === 1114 && typeof value === 'string') {
    return value.replace(' ', 'T').replace(/\.0+$/, '');
  }
  return value;
}

export async function runReadOnlyQuery(db, sql) {
  const query = validateSingleSelect(sql);
  const startedAt = performance.now();
  await db.exec("BEGIN TRANSACTION READ ONLY; SET LOCAL statement_timeout = '3000ms'; SET LOCAL search_path = pg_catalog, practice;");
  try {
    const result = await db.query(`SELECT * FROM (\n${query}\n) AS __lab_query LIMIT ${RESULT_LIMIT + 1}`, [], { rowMode: 'array' });
    const truncated = result.rows.length > RESULT_LIMIT;
    const rows = result.rows.slice(0, RESULT_LIMIT).map((row) => row.map((value, index) => normalizeValue(value, result.fields[index]?.dataTypeID)));
    return {
      columns: result.fields.map((field) => field.name),
      rows,
      rowCount: rows.length,
      elapsedMs: Math.max(0, Math.round(performance.now() - startedAt)),
      truncated
    };
  } finally {
    await db.exec('ROLLBACK');
  }
}

export async function seedDatabase(db, seedSql) {
  await db.exec(seedSql);
  await db.exec('ALTER TABLE practice.products ALTER COLUMN product_name TYPE text COLLATE "und-x-icu", ALTER COLUMN category TYPE text COLLATE "und-x-icu", ALTER COLUMN description TYPE text COLLATE "und-x-icu"');
}

export function comparisonExercise(exercise) {
  return {
    ...exercise,
    expectedRows: exercise.expectedRows.map((row) => row.map((value) =>
      typeof value === 'string' ? value.replace(/^(\d{4}-\d\d-\d\dT\d\d:\d\d):00$/, '$1') : value
    ))
  };
}

export function starterSql(exercise, schema) {
  const lines = [`-- ${exercise.id} · ${exercise.title}`];
  if (exercise.scenario) lines.push(`-- 상황: ${exercise.scenario}`);
  if (exercise.level === 'basic') {
    if (exercise.concept) lines.push(`-- 한 줄 개념: ${exercise.concept}`);
    if (exercise.syntaxFrame) lines.push(`-- 문법 틀: ${exercise.syntaxFrame}`);
  }
  if (schema?.name && schema?.table) {
    const tables = exercise.tables || [schema.table];
    lines.push(`-- 대상 테이블: ${tables.map(table => `${schema.name}.${table}`).join(', ')}`);
  }
  lines.push(`-- 반환 열: ${exercise.columns.join(', ')}`);
  for (const requirement of exercise.requirements) lines.push(`-- ${requirement}`);
  lines.push('', '-- TODO: 아래에 SELECT 문 하나를 작성하세요.', '');
  return lines.join('\n');
}
