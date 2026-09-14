(function (root) {
  const KEYWORDS = [
    'SELECT', 'FROM', 'AS', 'DISTINCT', 'WHERE', 'AND', 'OR', 'IN', 'LIKE',
    'LOWER', 'TRIM', 'IS', 'NOT', 'NULL', 'BETWEEN', 'ORDER BY', 'BY', 'ASC',
    'DESC', 'ROUND', 'LIMIT'
  ];

  function createCandidates(schema) {
    const table = schema.name + '.' + schema.table;
    return [
      ...KEYWORDS.map((value) => ({ value, kind: '키워드' })),
      { value: table, kind: '테이블' },
      ...schema.columns.map((column) => ({ value: column.name, kind: '컬럼' }))
    ];
  }

  function dollarDelimiterAt(sql, start) {
    const match = sql.slice(start).match(/^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/);
    return match ? match[0] : null;
  }

  function isCodePosition(sql, cursor) {
    let state = 'code', blockDepth = 0, dollarDelimiter = null;
    for (let i = 0; i < cursor; i++) {
      const current = sql[i], next = sql[i + 1];
      if (state === 'code') {
        if (current === "'") state = 'single';
        else if (current === '"') state = 'double';
        else if (current === '-' && next === '-') { state = 'line'; i++; }
        else if (current === '/' && next === '*') { state = 'block'; blockDepth = 1; i++; }
        else if (current === '$') {
          const delimiter = dollarDelimiterAt(sql, i);
          if (delimiter) { state = 'dollar'; dollarDelimiter = delimiter; i += delimiter.length - 1; }
        }
      } else if (state === 'single') {
        if (current === '\\' && next !== undefined) i++;
        else if (current === "'" && next === "'") i++;
        else if (current === "'") state = 'code';
      } else if (state === 'double') {
        if (current === '"' && next === '"') i++;
        else if (current === '"') state = 'code';
      } else if (state === 'line') {
        if (current === '\n') state = 'code';
      } else if (state === 'block') {
        if (current === '/' && next === '*') { blockDepth++; i++; }
        else if (current === '*' && next === '/') { blockDepth--; i++; if (blockDepth === 0) state = 'code'; }
      } else if (state === 'dollar' && sql.startsWith(dollarDelimiter, i)) {
        i += dollarDelimiter.length - 1;
        state = 'code';
        dollarDelimiter = null;
      }
    }
    return state === 'code';
  }

  function tokenRange(sql, cursor) {
    const tokenCharacter = /[A-Za-z0-9_.]/;
    let start = cursor, end = cursor;
    while (start > 0 && tokenCharacter.test(sql[start - 1])) start--;
    while (end < sql.length && tokenCharacter.test(sql[end])) end++;
    return { start, end };
  }

  function completions(sql, cursor, candidates, limit = 8) {
    if (!Number.isInteger(cursor) || cursor < 0 || cursor > sql.length || !isCodePosition(sql, cursor)) return null;
    const range = tokenRange(sql, cursor);
    const prefix = sql.slice(range.start, cursor);
    if (!/^[A-Za-z_][A-Za-z0-9_.]*$/.test(prefix)) return null;
    const foldedPrefix = prefix.toUpperCase();
    const items = candidates.filter((candidate) => {
      const foldedValue = candidate.value.toUpperCase();
      return foldedValue.startsWith(foldedPrefix) && (foldedValue !== foldedPrefix || (candidate.kind === '키워드' && foldedValue.length === 2));
    }).slice(0, limit);
    return items.length ? { range, items } : null;
  }

  function applyCompletion(sql, range, value) {
    const text = sql.slice(0, range.start) + value + sql.slice(range.end);
    return { text, cursor: range.start + value.length };
  }

  const api = { createCandidates, isCodePosition, tokenRange, completions, applyCompletion };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SqlAutocomplete = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
