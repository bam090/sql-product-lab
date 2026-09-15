const test = require('node:test');
const assert = require('node:assert/strict');
const autocomplete = require('../../main/resources/static/autocomplete.js');

const schema = {
  name: 'practice',
  table: 'products',
  columns: [
    { name: 'product_id' },
    { name: 'product_name' },
    { name: 'category' },
    { name: 'price' },
    { name: 'stock_quantity' },
    { name: 'description' },
    { name: 'released_at' }
  ]
};
const candidates = autocomplete.createCandidates(schema);

function markedCompletion(markedSql) {
  const cursor = markedSql.indexOf('|');
  assert.notEqual(cursor, -1, 'cursor marker is required');
  return autocomplete.completions(markedSql.replace('|', ''), cursor, candidates);
}

test('matches keywords, the catalog table, and matching catalog columns', () => {
  assert.deepEqual(markedCompletion('SEL|').items.map((item) => item.value), ['SELECT']);
  assert.deepEqual(markedCompletion('SELECT * FROM practice.products LIM|').items.map((item) => item.value), ['LIMIT']);
  assert.deepEqual(markedCompletion('SELECT * FROM practice.products OFF|').items.map((item) => item.value), ['OFFSET']);
  assert.deepEqual(markedCompletion('SELECT * FROM pra|').items.map((item) => item.value), ['practice.products']);
  assert.deepEqual(markedCompletion('SELECT product_|').items.map((item) => item.value), ['product_id', 'product_name']);
});

test('replaces only the token around a middle cursor and preserves the query', () => {
  const sql = 'SELECT product_na, price FROM practice.products';
  const cursor = sql.indexOf('product_') + 'product_'.length;
  const match = autocomplete.completions(sql, cursor, candidates);
  const completed = autocomplete.applyCompletion(sql, match.range, 'product_name');
  assert.equal(completed.text, 'SELECT product_name, price FROM practice.products');
  assert.equal(completed.cursor, 'SELECT product_name'.length);
});

test('offers short keywords from the first letter and keeps them selectable when fully typed', () => {
  for (const keyword of ['AS', 'OR', 'IN', 'IS', 'BY']) {
    for (const prefix of [keyword[0].toLowerCase(), keyword.toLowerCase()]) {
      const match = markedCompletion(`SELECT product_name ${prefix}|`);
      assert.ok(match.items.some((item) => item.value === keyword), keyword + ': ' + prefix);
    }
  }
  assert.equal(markedCompletion('SELECT product_name |'), null);
});

test('does not suggest inside SQL strings, quoted identifiers, or comments', () => {
  const blocked = [
    "SELECT 'SEL|ECT'",
    "SELECT E'it\\'s SEL|ECT'",
    'SELECT \"product_|name\"',
    '-- SEL|',
    '/* product_| */ SELECT product_id',
    '/* outer /* SEL| */ inner */ SELECT product_id',
    'SELECT $$SEL|ECT$$',
    'SELECT $tag$product_|name$tag$'
  ];
  blocked.forEach((sql) => assert.equal(markedCompletion(sql), null, sql));
  assert.deepEqual(markedCompletion('-- comment\nSEL|').items.map((item) => item.value), ['SELECT']);
});

test('completes ORDER BY as one phrase without adding an answer or condition', () => {
  for (const prefix of ['ord', 'ORDER']) {
    const sql = `SELECT * FROM practice.products ${prefix}`;
    const match = autocomplete.completions(sql, sql.length, candidates);
    assert.deepEqual(match.items.map((item) => item.value), ['ORDER BY']);
    assert.equal(autocomplete.applyCompletion(sql, match.range, match.items[0].value).text,
      'SELECT * FROM practice.products ORDER BY');
  }
  assert.deepEqual(candidates.filter((candidate) => /\s/.test(candidate.value)).map((item) => item.value), ['ORDER BY', 'GROUP BY', 'UNION ALL']);
  assert.equal(candidates.some((candidate) => candidate.value.includes('=')), false);
  assert.equal(markedCompletion('SELECT|'), null);
});

test('completes grouping and join syntax with columns from both tables', () => {
  const joined = autocomplete.createCandidates([schema, { name: 'practice', table: 'categories', columns: [{name: 'category'}, {name: 'category_name'}] }]);
  const sql = 'SELECT category, COUNT(*) FROM practice.products GRO';
  const match = autocomplete.completions(sql, sql.length, joined);
  assert.equal(autocomplete.applyCompletion(sql, match.range, match.items[0].value).text,
    'SELECT category, COUNT(*) FROM practice.products GROUP BY');
  assert.equal(joined.filter((item) => item.value === 'category').length, 1);
  for (const value of ['CASE', 'WHEN', 'COUNT', 'JOIN', 'ON', 'practice.categories', 'category_name']) {
    assert.ok(joined.some((item) => item.value === value), value);
  }
});

test('JOIN aliases limit columns, preserve qualifiers, and keep alias entry quiet', () => {
  const joined = autocomplete.createCandidates([schema, {
    name: 'practice', table: 'categories', columns: [{ name: 'category' }, { name: 'category_name' }]
  }]);
  const from = 'FROM practice.products AS p\nJOIN practice.categories AS c\nON ';
  function complete(sql, cursor = sql.length) { return autocomplete.completions(sql, cursor, joined); }
  assert.deepEqual(complete(from + 'c.').items.map(x => x.value), ['category', 'category_name']);
  assert.ok(complete(from + 'p.').items.some(x => x.value === 'product_name'));
  assert.equal(complete(from + 'p.').items.some(x => x.value === 'category_name'), false);
  const sql = from + 'p.category = c.cat';
  const match = complete(sql);
  assert.equal(autocomplete.applyCompletion(sql, match.range, 'category').text, from + 'p.category = c.category');
  const middle = from + 'p.category = c.cat_wrong AND p.price > 10';
  assert.equal(autocomplete.applyCompletion(middle, complete(middle, middle.indexOf('cat_wrong') + 3).range, 'category').text,
    from + 'p.category = c.category AND p.price > 10');
  assert.equal(complete(from + 'unknown.'), null);
  assert.equal(complete('SELECT * FROM practice.products AS '), null);
  assert.equal(complete('SELECT * FROM practice.products AS pr'), null);
  assert.ok(complete('SELECT * FROM ').items.every(x => x.kind === '테이블'));
  assert.deepEqual(complete('SELECT * FROM practice.products p JOIN practice.cat').items.map(x => x.value), ['practice.categories']);
  assert.deepEqual(complete('SELECT * FROM practice.products p JOIN practice.categories c ON C.cat').items.map(x => x.value), ['category', 'category_name']);
  assert.equal(complete("SELECT 'JOIN practice.categories AS c' FROM practice.products p WHERE c."), null);
  assert.equal(complete('-- JOIN practice.categories AS c\nSELECT c.'), null);
  const early = 'SELECT c.cat FROM practice.products p JOIN practice.categories c ON p.category = c.category';
  assert.deepEqual(complete(early, 'SELECT c.cat'.length).items.map(x => x.value), ['category', 'category_name']);
});

test('partial multi-word completions preserve surrounding columns without duplicate BY', () => {
  for (const marked of ['ORDER B| product_id', 'order | product_id', 'ORDER| BY product_id', 'ORD|ER BY product_id', 'ORDER B|Y product_id', 'ORDER\tB| product_id']) {
    const sql = 'SELECT * FROM practice.products ' + marked.replace('|', '');
    const cursor = 'SELECT * FROM practice.products '.length + marked.indexOf('|');
    const match = autocomplete.completions(sql, cursor, candidates);
    assert.equal(autocomplete.applyCompletion(sql, match.range, match.items[0].value).text,
      'SELECT * FROM practice.products ORDER BY product_id', marked);
  }
  assert.equal(markedCompletion('SELECT * FROM practice.products GROUP B|').items[0].value, 'GROUP BY');
  assert.equal(markedCompletion('SELECT * FROM practice.products UNION A|').items[0].value, 'UNION ALL');
  assert.equal(markedCompletion("SELECT 'ORDER B|'"), null);
  assert.equal(markedCompletion('-- ORDER B|'), null);
  const many = Array.from({length: 12}, (_, i) => ({value: 'column_' + i, kind: '컬럼'}));
  assert.equal(autocomplete.completions('col', 3, many).items.length, 6);
});

test('editor keys confirm suggestions, indent without suggestions, and respect composition', () => {
  const fs = require('node:fs'), vm = require('node:vm');
  const source = fs.readFileSync(require('node:path').join(__dirname, '../../main/resources/static/lab.js'), 'utf8');
  let handler, calls = [];
  const editor = {readOnly: false, addEventListener: (_, fn) => {handler = fn;}};
  const context = vm.createContext({
    $: () => editor, composing: false, tabMovesFocus: false, autocompleteMatch: {}, autocompleteIndex: 1,
    acceptAutocomplete: index => calls.push(['accept', index]),
    closeAutocomplete: () => { context.autocompleteMatch = null; calls.push(['close']); },
    indentEditor: shift => calls.push(['indent', shift]), run: () => calls.push(['run']),
    selectAutocomplete: () => {}
  });
  const start = source.indexOf("$('sql').addEventListener('keydown'");
  vm.runInContext(source.slice(start, source.indexOf("$('sql').addEventListener('keyup'", start)), context);
  function press(key, extra = {}) {
    calls = []; let prevented = false;
    handler({key, shiftKey: false, preventDefault() {prevented = true;}, ...extra});
    return {calls, prevented};
  }
  assert.deepEqual(press('Enter'), {calls: [['accept', 1]], prevented: true});
  assert.deepEqual(press('Tab'), {calls: [['accept', 1]], prevented: true});
  context.autocompleteMatch = null;
  assert.deepEqual(press('Enter'), {calls: [], prevented: false});
  assert.deepEqual(press('Tab'), {calls: [['indent', false]], prevented: true});
  assert.deepEqual(press('Tab', {shiftKey: true}), {calls: [['indent', true]], prevented: true});
  context.autocompleteMatch = {};
  assert.deepEqual(press('Enter', {isComposing: true}), {calls: [], prevented: false});
  press('Escape');
  assert.deepEqual(press('Tab'), {calls: [], prevented: false});
  assert.deepEqual(press('Enter', {ctrlKey: true}), {calls: [['close'], ['run']], prevented: true});
});
