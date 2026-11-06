'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');

const store = require('../bin/todo.js');

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
