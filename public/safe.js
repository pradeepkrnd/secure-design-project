'use strict';
function calculate(raw) {
  if (typeof raw !== 'string' || raw.length > 200) {
    throw new Error('Input must be a string of at most 200 characters.');
  }
  let data;
  try { data = JSON.parse(raw); }
  catch { throw new Error('Enter a valid JSON object.'); }
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Expected an object with a, b, and op.');
  }
  const keys = Object.keys(data).sort().join(',');
  if (keys !== 'a,b,op') throw new Error('Only a, b, and op are allowed.');
  const { a, b, op } = data;
  if (typeof a !== 'number' || typeof b !== 'number' ||
      !Number.isFinite(a) || !Number.isFinite(b) ||
      Math.abs(a) > 1e6 || Math.abs(b) > 1e6) {
    throw new Error('Operands must be finite numbers within +/-1000000.');
  }
  let result;
  switch (op) {
    case 'add': result = a + b; break;
    case 'subtract': result = a - b; break;
    case 'multiply': result = a * b; break;
    case 'divide':
      if (b === 0) throw new Error('Division by zero is not allowed.');
      result = a / b; break;
    default: throw new Error('Unsupported operation.');
  }
  if (!Number.isFinite(result)) throw new Error('Result must be finite.');
  return result;
}
if (typeof module !== 'undefined') module.exports = { calculate };
