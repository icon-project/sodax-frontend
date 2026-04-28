import { describe, it, expect } from 'vitest';
import { shallowMerge } from './merge.js';

describe('shallowMerge', () => {
  it('returns empty object when no layers', () => {
    expect(shallowMerge<{ a?: number }>()).toEqual({});
  });

  it('returns empty object when all layers are undefined', () => {
    expect(shallowMerge<{ a?: number }>(undefined, undefined)).toEqual({});
  });

  it('skips undefined layers between defined ones', () => {
    expect(shallowMerge({ a: 1 }, undefined, { b: 2 })).toEqual({ a: 1, b: 2 });
  });

  it('later layers override earlier ones', () => {
    expect(shallowMerge({ a: 1, b: 2 }, { b: 3, c: 4 })).toEqual({ a: 1, b: 3, c: 4 });
  });

  it('replaces nested objects wholesale (shallow only)', () => {
    const a = { nested: { x: 1, y: 2 } };
    const b = { nested: { x: 99 } };
    expect(shallowMerge(a, b)).toEqual({ nested: { x: 99 } });
  });

  it('preserves field with explicit undefined value (treated as override)', () => {
    expect(shallowMerge<{ a?: number }>({ a: 1 }, { a: undefined })).toEqual({ a: undefined });
  });
});
