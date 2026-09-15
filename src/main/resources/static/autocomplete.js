(function (root) {
  const KEYWORDS = [
    'SELECT', 'FROM', 'AS', 'DISTINCT', 'WHERE', 'AND', 'OR', 'IN', 'LIKE',
    'LOWER', 'TRIM', 'IS', 'NOT', 'NULL', 'BETWEEN', 'ORDER BY', 'BY', 'ASC',
    'DESC', 'ROUND', 'LIMIT', 'OFFSET', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
    'GROUP BY', 'COUNT', 'SUM', 'AVG', 'JOIN', 'INNER', 'LEFT', 'RIGHT',
    'FULL', 'OUTER', 'CROSS', 'ON', 'USING', 'EXISTS', 'UNION ALL', 'COALESCE'
  ];

  function createCandidates(schema) {
    const schemas = Array.isArray(schema) ? schema : [schema];
    const candidates = [
      ...KEYWORDS.map((value) => ({ value, kind: '키워드' })),
      ...schemas.flatMap((item) => [
        { value: item.name + '.' + item.table, kind: '테이블' },
        { value: item.table, kind: '테이블' },
        ...item.columns.map((column) => ({ value: column.name, kind: '컬럼', tables: [item.name + '.' + item.table] }))
      ])
    ];
    const unique = new Map();
    for (const candidate of candidates) {
      const previous = unique.get(candidate.value);
      if (previous?.tables && candidate.tables) previous.tables.push(...candidate.tables);
      else unique.set(candidate.value, candidate);
    }
    return [...unique.values()];
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

  function completions(sql, cursor, candidates, limit = 6) {
    if (!Number.isInteger(cursor) || cursor < 0 || cursor > sql.length || !isCodePosition(sql, cursor)) return null;
    let range = tokenRange(sql, cursor);
    let prefix = sql.slice(range.start, cursor);
    // Complete a multi-word keyword as one range, including an existing trailing word.
    const phrase = sql.slice(0, cursor).match(/\b(ORDER|GROUP|UNION)[ \t]+([A-Za-z]*)$/i);
    if (phrase && isCodePosition(sql, phrase.index)) {
      const value = phrase[1].toUpperCase() === 'UNION' ? 'UNION ALL' : phrase[1].toUpperCase() + ' BY';
      const prefix = phrase[1].toUpperCase() + ' ' + phrase[2].toUpperCase();
      if (value.startsWith(prefix) && prefix !== value) {
        return { range: { start: phrase.index, end: range.end }, items: [{ value, kind: '키워드' }] };
      }
    }
    const before = sql.slice(0, range.start);
    // ponytail: single SELECT with unquoted FROM/JOIN names; nested query scopes need a parser.
    const tables = candidates.filter((item) => item.kind === '테이블');
    const aliases = new Map();
    const references = /\b(?:FROM|JOIN)\s+([A-Za-z_][\w]*(?:\.[A-Za-z_][\w]*)?)(?:\s+(?:AS\s+)?([A-Za-z_][\w]*))?/gi;
    for (const match of sql.matchAll(references)) {
      if (!isCodePosition(sql, match.index)) continue;
      const table = tables.find((item) => item.value.toLowerCase() === match[1].toLowerCase()
        || item.value.split('.').pop().toLowerCase() === match[1].toLowerCase());
      if (!table) continue;
      aliases.set(match[1].toLowerCase(), table.value);
      aliases.set(table.value.split('.').pop().toLowerCase(), table.value);
      if (match[2] && !KEYWORDS.includes(match[2].toUpperCase())) aliases.set(match[2].toLowerCase(), table.value);
    }
    const tablePosition = /\b(?:FROM|JOIN)\s*$/i.test(before);
    if (/\bAS\s*$/i.test(before)) return null;
    let available = candidates;
    const dot = prefix.lastIndexOf('.');
    if (!tablePosition && dot >= 0) {
      const qualifier = prefix.slice(0, dot).toLowerCase();
      const table = aliases.get(qualifier)
        || tables.find((item) => item.value.toLowerCase() === qualifier)?.value;
      if (!table) return null;
      available = candidates.filter((item) => item.tables?.includes(table));
      range = { start: range.start + dot + 1, end: range.end };
      prefix = prefix.slice(dot + 1);
    } else if (tablePosition) available = tables;
    if (prefix && !/^[A-Za-z_][A-Za-z0-9_.]*$/.test(prefix)) return null;
    if (!prefix && !tablePosition && dot < 0) return null;
    const foldedPrefix = prefix.toUpperCase();
    const items = available.filter((candidate) => {
      const foldedValue = candidate.value.toUpperCase();
      return foldedValue.startsWith(foldedPrefix) && (foldedValue !== foldedPrefix || (candidate.kind === '키워드' && foldedValue.length === 2));
    }).slice(0, limit);
    if (items.length === 1 && items[0].value.includes(' ')) {
      const trailing = items[0].value.split(' ')[1];
      const suffix = sql.slice(range.end).match(new RegExp('^[ \\t]+' + trailing + '\\b', 'i'));
      if (suffix) range.end += suffix[0].length;
    }
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
