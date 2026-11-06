#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const STORE = path.join(process.env.TODO_STORE || process.env.HOME || '.', '.todo.json');
function load() {
  const store = process.env.TODO_STORE || STORE;
  try {
    const raw = fs.readFileSync(store, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

function save(items) {
  const store = process.env.TODO_STORE || STORE;
  fs.writeFileSync(store, JSON.stringify({ items }, null, 2) + '\n');
}

function nextId(items) {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

function addItem(title) {
  const items = load();
  const item = { id: nextId(items), title, done: false, created_at: new Date().toISOString() };
  items.push(item);
  save(items);
  return item;
}

function listItems() {
  return load();
}

module.exports = { addItem, listItems, load, save, nextId, STORE };

if (require.main === module) {
  const [, , command, ...rest] = process.argv;
  if (command === 'add') {
    const title = rest.join(' ').trim();
    if (!title) {
      console.error('usage: todo add TITLE');
      process.exit(2);
    }
    const item = addItem(title);
    console.log(`added #${item.id} ${item.title}`);
  } else if (command === 'list') {
    const doneOnly = rest.includes('--done');
    const all = listItems();
    const items = doneOnly ? all.filter((item) => item.done === true) : all;
    if (items.length === 0) {
      console.log('(empty)');
    } else {
      for (const item of items) {
        console.log(`[${item.done ? 'x' : ' '}] #${item.id} ${item.title}`);
      }
    }
  } else {
    console.error('usage: todo add TITLE | todo list');
    process.exit(2);
  }
}
