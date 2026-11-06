'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const store = require('../bin/todo.js');
const fixtures = require('./fixtures.js');

function withTempStore(fn) {
  return () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'todo-test-'));
    const file = path.join(dir, '.todo.json');
    const old = process.env.TODO_STORE;
    process.env.TODO_STORE = file;
    try {
      fn();
    } finally {
      if (old === undefined) {
        delete process.env.TODO_STORE;
      } else {
        process.env.TODO_STORE = old;
      }
      fs.rmSync(dir, { recursive: true, force: true });
    }
  };
}

test('add then list round-trips through the store', withTempStore(() => {
  const item = store.addItem('write tests');
  assert.equal(item.id, 1);
  assert.equal(item.done, false);
  const items = store.listItems();
  assert.equal(items.length, 1);
  assert.equal(items[0].title, 'write tests');
}));

test('ids increment across adds', withTempStore(() => {
  store.addItem('first');
  store.addItem('second');
  const items = store.listItems();
  assert.deepEqual(items.map((i) => i.id), [1, 2]);
}));

test('ids restart from 1 when the store is empty', withTempStore(() => {
  store.addItem('one');
  store.save(store.load().filter((i) => i.title !== 'one'));
  store.addItem('two');
  assert.equal(store.listItems()[0].id, 1);
}));

test('missing store lists as empty', withTempStore(() => {
  assert.deepEqual(store.listItems(), []);
}));

test('fixtures load as item arrays', () => {
  const names = fixtures.fixtureNames();
  assert.ok(names.includes('seed-one.todo.json'), 'seed-one fixture exists');
  for (const name of names) {
    assert.ok(Array.isArray(fixtures.fixtureItems(name)), `${name} loads as items`);
  }
});

function runCli(args) {
  const file = process.env.TODO_STORE;
  if (!file) {
    throw new Error('runCli requires an active temp store (use withTempStore)');
  }
  const result = spawnSync(process.execPath, ['bin/todo.js', ...args], {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf8',
    env: { ...process.env, TODO_STORE: file },
  });
  return {
    logs: (result.stdout || '').split('\n').filter((line) => line !== ''),
    errors: (result.stderr || '').split('\n').filter((line) => line !== ''),
    status: result.status,
  };
}

test('list --done lists only completed items', withTempStore(() => {
  const added = store.addItem('pending task');
  store.save([
    { ...added, title: 'finished task', done: true },
  ]);
  const { logs } = runCli(['list', '--done']);
  assert.equal(logs.length, 1);
  assert.match(logs[0], /finished task/);
  assert.doesNotMatch(logs[0], /pending task/);
}));

test('list --done prints (empty) when nothing is completed', withTempStore(() => {
  store.addItem('pending task');
  const { logs } = runCli(['list', '--done']);
  assert.deepEqual(logs, ['(empty)']);
}));

test('list without --done still shows all items', withTempStore(() => {
  const added = store.addItem('pending task');
  store.save([
    { ...added, title: 'finished task', done: true },
    ...store.load().map((i) => ({ ...i, id: i.id + 1 })),
  ]);
  const { logs } = runCli(['list']);
  assert.equal(logs.length, 2);
  assert.match(logs[0], /finished task/);
  assert.match(logs[1], /pending task/);
}));

test('list --done uses the store fixtures shape', () => {
  const items = fixtures.fixtureItems('seed-one.todo.json');
  const doneOnly = items.filter((item) => item.done === true);
  assert.deepEqual(doneOnly, []);
});
