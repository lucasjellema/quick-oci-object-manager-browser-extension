/**
 * Simple test file to verify Jest setup
 */

describe('Simple Test Suite', () => {
  test('true should be true', () => {
    expect(true).toBe(true);
  });

  test('math should work', () => {
    expect(1 + 1).toBe(2);
  });

  test('strings should concatenate', () => {
    expect('hello ' + 'world').toBe('hello world');
  });

  test('arrays should be iterable', () => {
    const array = [1, 2, 3];
    let sum = 0;
    array.forEach(num => {
      sum += num;
    });
    expect(sum).toBe(6);
  });
});
