const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

test('navigation renders two levels with four categories and keeps every exercise selectable', async () => {
  const root = path.resolve(__dirname, '../../..');
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'exercises.json'), 'utf8'));
  const source = fs.readFileSync(path.join(root, 'src/main/resources/static/lab.js'), 'utf8');
  const element = (tag) => ({
    tag, children: [], dataset: {}, listeners: {}, classList: { add() {} },
    append(...nodes) { this.children.push(...nodes); },
    setAttribute() {},
    addEventListener(name, callback) { this.listeners[name] = callback; }
  });
  const nodes = new Map();
  let selected;
  const context = vm.createContext({
    document: {
      getElementById(id) { if (!nodes.has(id)) nodes.set(id, element('div')); return nodes.get(id); },
      createElement: element,
      createTextNode: text => ({ textContent: text })
    },
    window: {},
    api: async route => route === '/api/exercises' ? catalog : { status: 'ok' },
    cell: (tag, text) => Object.assign(element(tag), { textContent: text }),
    select: async exercise => { selected = exercise.id; },
    error: message => { throw new Error(message); }
  });
  vm.runInContext(source.slice(0, source.indexOf('async function api(')), context);
  vm.runInContext(source.slice(source.indexOf('async function init()')).replace(/init\(\);\s*$/, ''), context);
  await context.init();
  const sections = nodes.get('exercises').children;
  assert.deepEqual(sections.map(section => section.children[0].textContent), ['기본 개념 문제', '응용 문제']);
  const buttons = [];
  for (const section of sections) {
    const groups = section.children.slice(1);
    assert.equal(groups.length, 4);
    assert.deepEqual(groups.map(group => group.children[0].textContent.split(' · ')[0]), ['01 SELECT', '02 WHERE', '03 ORDER BY', '04 JOIN']);
    buttons.push(...groups.flatMap(group => group.children[1].children.filter(node => node.tag === 'button')));
  }
  assert.deepEqual(buttons.map(button => button.dataset.id).sort(), catalog.exercises.map(exercise => exercise.id).sort());
  for (const button of buttons) { await button.listeners.click(); assert.equal(selected, button.dataset.id); }
});
