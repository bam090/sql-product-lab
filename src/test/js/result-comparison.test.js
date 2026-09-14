const test = require('node:test');
const assert = require('node:assert/strict');
const { matches } = require('../../main/resources/static/result-comparison.js');

test('unordered warmups accept row order changes while keeping duplicate counts', () => {
  const exercise = { columns: ['category'], expectedRows: [['A'], ['A'], ['B']], orderMatters: false };
  assert.equal(matches({ columns: ['category'], rows: [['B'], ['A'], ['A']] }, exercise), true);
  assert.equal(matches({ columns: ['category'], rows: [['B'], ['B'], ['A']] }, exercise), false);
});

test('sorting exercises still require the expected order by default', () => {
  const exercise = { columns: ['id'], expectedRows: [[1], [2]] };
  assert.equal(matches({ columns: ['id'], rows: [[2], [1]] }, exercise), false);
  assert.equal(matches({ columns: ['id'], rows: [['1'], ['2']] }, exercise), true);
});

test('column names, null values and truncated results remain significant', () => {
  const exercise = { columns: ['value'], expectedRows: [[null]], orderMatters: false };
  assert.equal(matches({ columns: ['other'], rows: [[null]] }, exercise), false);
  assert.equal(matches({ columns: ['value'], rows: [['null']] }, exercise), false);
  assert.equal(matches({ columns: ['value'], rows: [[null]], truncated: true }, exercise), false);
  assert.equal(matches({ columns: ['value'], rows: [[null]] }, exercise), true);
});
