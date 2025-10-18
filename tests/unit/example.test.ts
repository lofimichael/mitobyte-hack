import { describe, it, expect } from 'vitest';
import { z } from 'zod';

/**
 * Unit Tests - Fast, isolated tests with no external dependencies
 *
 * These tests verify pure functions and business logic in isolation.
 * All external dependencies (database, API calls) should be mocked.
 */

describe('Pure Functions', () => {
  // Example: Test a pure utility function
  const calculateTotal = (items: { price: number }[]) => {
    return items.reduce((sum, item) => sum + item.price, 0);
  };

  it('calculates total price correctly', () => {
    const items = [
      { price: 10 },
      { price: 20 },
      { price: 30 },
    ];

    const total = calculateTotal(items);
    expect(total).toBe(60);
  });

  it('returns 0 for empty array', () => {
    expect(calculateTotal([])).toBe(0);
  });
});

describe('Zod Schema Validation', () => {
  // Example: Test schema validation logic
  const userSchema = z.object({
    email: z.string().email(),
    name: z.string().min(2),
    age: z.number().min(0).optional(),
  });

  it('validates correct user data', () => {
    const validUser = {
      email: 'test@example.com',
      name: 'Test User',
    };

    expect(() => userSchema.parse(validUser)).not.toThrow();
  });

  it('rejects invalid email', () => {
    const invalidUser = {
      email: 'not-an-email',
      name: 'Test User',
    };

    expect(() => userSchema.parse(invalidUser)).toThrow();
  });

  it('rejects short name', () => {
    const invalidUser = {
      email: 'test@example.com',
      name: 'T',
    };

    expect(() => userSchema.parse(invalidUser)).toThrow();
  });
});

describe('Date Formatting', () => {
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  it('formats date correctly', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    expect(formatDate(date)).toBe('2024-01-15');
  });
});
