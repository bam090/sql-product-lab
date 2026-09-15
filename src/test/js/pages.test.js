const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const test = require('node:test');
const SqlResultComparison = require('../../main/resources/static/result-comparison.js');

const root = path.resolve(__dirname, '../../..');
const setup = Promise.all([
  import('@electric-sql/pglite'),
  import('../../../pages/sql-runtime.mjs'),
  readFile(path.join(root, 'exercises.json'), 'utf8').then(JSON.parse),
  Promise.all(['seed.sql', 'join-seed.sql'].map(file => readFile(path.join(root, 'setup', file), 'utf8')))
    .then(parts => parts.join('\n'))
]);

test('Pages starters are generated from the catalog without local answer files', async () => {
  const [, { starterSql }, catalog] = await setup;
  assert.equal(new Set(catalog.exercises.map(exercise => exercise.id)).size, catalog.exercises.length);
  assert.deepEqual([...new Set(catalog.exercises.map(exercise => exercise.category))].sort(), ['joins', 'order-by', 'select', 'where']);
  for (const exercise of catalog.exercises) {
    const sql = starterSql(exercise, catalog.schema);
    assert.match(sql, new RegExp(`^-- ${exercise.id} ·`));
    assert.match(sql, /-- TODO:/);
    assert.doesNotMatch(sql, /^(?!\s*--).*\bSELECT\b/im);
    for (const table of exercise.tables || [catalog.schema.table]) assert.ok(sql.includes(`practice.${table}`));
  }
});

test('Pages validator accepts comments and rejects multiple or mutating statements', async () => {
  const [, { validateSingleSelect }] = await setup;
  assert.match(validateSingleSelect("-- lead;\nSELECT 'a;b' AS value; -- tail"), /^-- lead;/);
  assert.throws(() => validateSingleSelect('DELETE FROM practice.products'), /SELECT 문 하나/);
  assert.throws(() => validateSingleSelect('SELECT 1; SELECT 2'), /SELECT 문 하나/);
});

test('PGlite runs the catalog queries and SqlResultComparison checks their results', async (context) => {
  const [{ PGlite }, { comparisonExercise, runReadOnlyQuery, seedDatabase }, catalog, seedSql] = await setup;
  const db = await PGlite.create();
  context.after(() => db.close());
  await seedDatabase(db, seedSql);

  let queries = { B1: 'SELECT * FROM practice.products' };
  if (process.env.SQL_LAB_QUERY_FIXTURE) {
    queries = JSON.parse(await readFile(process.env.SQL_LAB_QUERY_FIXTURE, 'utf8'));
    assert.deepEqual(Object.keys(queries).sort(), catalog.exercises.map(({ id }) => id).sort());
  }

  for (const exercise of catalog.exercises.filter(({ id }) => queries[id])) {
    const result = await runReadOnlyQuery(db, queries[exercise.id]);
    assert.equal(SqlResultComparison.matches(result, comparisonExercise(exercise)), true, exercise.id);
  }
});
