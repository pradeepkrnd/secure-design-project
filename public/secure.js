'use strict';
document.querySelector('#render').addEventListener('click', () => {
  const input = document.querySelector('#comment').value;
  const preview = document.querySelector('#preview');
  if (input.length > 500) {
    preview.textContent = 'Comment must be 500 characters or fewer.';
    return;
  }
  preview.textContent = input; // Plain text, never parsed as HTML
});
document.querySelector('#calculate').addEventListener('click', () => {
  try {
    const result = calculate(document.querySelector('#expression').value);
    document.querySelector('#result').textContent = String(result);
  } catch (error) {
    document.querySelector('#result').textContent = error.message;
  }
});
