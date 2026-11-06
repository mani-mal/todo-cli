'use strict';

const fs = require('fs');
const path = require('path');

const FIXTURES = path.join(__dirname, 'fixtures');

function fixtureNames() {
  try {
    return fs.readdirSync(FIXTURES).filter((name) => name.endsWith('.todo.json')).sort();
  } catch {
    return [];
  }
}

function fixtureItems(name) {
  const raw = fs.readFileSync(path.join(FIXTURES, name), 'utf8');
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed.items) ? parsed.items : [];
}

module.exports = { fixtureNames, fixtureItems, FIXTURES };
