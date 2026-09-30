'use strict';
const assert = require('node:assert/strict');
const { calculate } = require('../public/safe.js');
let count = 0;
for (const [op, expected] of [['add',5],['subtract',-1],['multiply',6],['divide',2/3]]) {
  assert.equal(calculate(JSON.stringify({a:2,b:3,op})), expected); count++;
}
for (const raw of [
  '2+3', 'null', '[]', '{}', '{"a":"2","b":3,"op":"add"}',
  '{"a":2,"b":0,"op":"divide"}', '{"a":2,"b":3,"op":"eval"}',
  '{"a":1e309,"b":3,"op":"add"}',
  '{"a":1000001,"b":3,"op":"add"}',
  '{"a":2,"b":3,"op":"add","extra":1}',
  '{"a":2,"b":3,"op":"add","__proto__":{}}',
  'document.querySelector("#marker").textContent="EVAL executed"; 5',
  ' '.repeat(201)
]) { assert.throws(() => calculate(raw)); count++; }
console.log(`PASS: ${count} calculator assertions`);
