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

test('keeps the candidate set to tokens rather than answers or conditions', () => {
  assert.equal(candidates.some((candidate) => /\s/.test(candidate.value)), false);
  assert.equal(candidates.some((candidate) => candidate.value.includes('=')), false);
  assert.equal(markedCompletion('SELECT|'), null);
});
