import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test case (e.g., clearing jsdom)
afterEach(() => {
  cleanup();
});

// Mock environment variables for tests
process.env.NODE_ENV = 'test';

// Optional: Mock fetch globally if needed
// global.fetch = vi.fn();

// Optional: Suppress console errors in tests (uncomment if desired)
// vi.spyOn(console, 'error').mockImplementation(() => {});
