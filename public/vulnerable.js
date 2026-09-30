'use strict';
document.querySelector('#render').addEventListener('click', () => {
  const input = document.querySelector('#comment').value;
  document.querySelector('#preview').innerHTML = input; // Unsafe HTML sink
});
document.querySelector('#calculate').addEventListener('click', () => {
  const input = document.querySelector('#expression').value;
  try {
    const result = eval(input); // Unsafe runtime compilation of user input
    document.querySelector('#result').textContent = String(result);
  } catch {
    document.querySelector('#result').textContent = 'Invalid expression.';
  }
});
