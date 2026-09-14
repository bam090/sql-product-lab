(function (root) {
  function matches(result, exercise) {
    if (result.truncated || JSON.stringify(result.columns) !== JSON.stringify(exercise.columns)) return false;
    const rows = (values) => values.map((row) => JSON.stringify(row.map((value) => value === null ? null : String(value))));
    const actual = rows(result.rows), expected = rows(exercise.expectedRows);
    if (exercise.orderMatters === false) { actual.sort(); expected.sort(); }
    return JSON.stringify(actual) === JSON.stringify(expected);
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { matches };
  else root.SqlResultComparison = { matches };
})(typeof globalThis !== 'undefined' ? globalThis : this);
