import { afterEach } from 'vitest';

// Optional cleanup after each test case if testing library is present
afterEach(() => {
  if (typeof document !== 'undefined') {
    document.body.innerHTML = '';
  }
});
