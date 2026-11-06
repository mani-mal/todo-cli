#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "$0")"

test -f README.md

fail=0

echo "== lint (node --check)"
for f in bin/*.js test/*.js; do
  node --check "$f" || fail=1
done

echo "== fixtures"
node --eval "require('./test/fixtures.js').fixtureNames().forEach(n => require('./test/fixtures.js').fixtureItems(n))" || fail=1

echo "== tests (node --test)"
node --test test/*.test.js > /tmp/todo-test-out.txt 2>&1 || fail=1
tail -8 /tmp/todo-test-out.txt >&2
grep -q "^# fail 0" /tmp/todo-test-out.txt || fail=1
rm -f /tmp/todo-test-out.txt

if [ "$fail" -eq 0 ]; then
  echo "checks passed"
fi
exit "$fail"
