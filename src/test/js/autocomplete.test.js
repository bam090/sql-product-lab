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
