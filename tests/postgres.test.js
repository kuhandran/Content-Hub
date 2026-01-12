/**
 * Unit tests for lib/postgres.js
 * We mock the 'postgres' module to capture init options without opening a real connection.
 */

const originalEnv = { ...process.env };

describe('lib/postgres.js', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.NODE_ENV;
    delete process.env.DATABASE_URL;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('returns null when DATABASE_URL is missing', () => {
    const sql = require('../lib/postgres');
    expect(sql).toBeNull();
  });

  test('requires SSL in production', () => {
    process.env.DATABASE_URL = 'postgres://user:pass@host/db';
    process.env.NODE_ENV = 'production';

    const mockFn = jest.fn(() => ({ mock: true }));
    jest.doMock('postgres', () => mockFn);

    const sql = require('../lib/postgres');
    expect(sql).toBeDefined();
    expect(mockFn).toHaveBeenCalled();
    const args = mockFn.mock.calls[0];
    expect(args[0]).toBe(process.env.DATABASE_URL);
    expect(args[1]).toMatchObject({ ssl: 'require' });
  });

  test('prefers SSL in non-production', () => {
    process.env.DATABASE_URL = 'postgres://user:pass@host/db';
    process.env.NODE_ENV = 'development';

    const mockFn = jest.fn(() => ({ mock: true }));
    jest.doMock('postgres', () => mockFn);

    const sql = require('../lib/postgres');
    expect(sql).toBeDefined();
    expect(mockFn).toHaveBeenCalled();
    const args = mockFn.mock.calls[0];
    expect(args[1]).toMatchObject({ ssl: 'prefer' });
  });
});
