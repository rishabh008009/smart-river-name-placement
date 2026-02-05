/**
 * Tests for RiverPathParser
 * Includes both unit tests and property-based tests
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { RiverPathParser } from '../src/RiverPathParser.js';
import { testConfig } from './setup.js';

describe('RiverPathParser', () => {
  const parser = new RiverPathParser();

  describe('Unit Tests - Basic Functionality', () => {
    it('should parse valid coordinates with minimum 3 points', () => {
      const coords = [[0, 0], [10, 10], [20, 0]];
      const result = parser.parse(coords);
      
      expect(result).not.toBeInstanceOf(Error);
      expect(result.points).toHaveLength(3);
      expect(result.points[0]).toEqual({ x: 0, y: 0 });
      expect(result.points[1]).toEqual({ x: 10, y: 10 });
      expect(result.points[2]).toEqual({ x: 20, y: 0 });
    });

    it('should parse coordinates without width data', () => {
      const coords = [[0, 0], [10, 10], [20, 0]];
      const result = parser.parse(coords);
      
      expect(result).not.toBeInstanceOf(Error);
      expect(result.widths).toBeNull();
    });

    it('should parse coordinates with width data', () => {
      const coords = [[0, 0, 5], [10, 10, 8], [20, 0, 6]];
      const result = parser.parse(coords);
      
      expect(result).not.toBeInstanceOf(Error);
      expect(result.widths).toEqual([5, 8, 6]);
    });

    it('should calculate total path length correctly', () => {
      const coords = [[0, 0], [3, 4], [3, 8]]; // 5 + 4 = 9
      const result = parser.parse(coords);
      
      expect(result).not.toBeInstanceOf(Error);
      expect(result.length).toBeCloseTo(9, 5);
    });

    it('should calculate bounding box correctly', () => {
      const coords = [[5, 10], [15, 5], [10, 20]];
      const result = parser.parse(coords);
      
      expect(result).not.toBeInstanceOf(Error);
      expect(result.bounds).toEqual({
        minX: 5,
        maxX: 15,
        minY: 5,
        maxY: 20
      });
    });

    it('should handle exactly 3 points (minimum valid)', () => {
      const coords = [[0, 0], [1, 1], [2, 2]];
      const result = parser.parse(coords);
      
      expect(result).not.toBeInstanceOf(Error);
      expect(result.points).toHaveLength(3);
    });

    it('should handle many points', () => {
      const coords = Array.from({ length: 100 }, (_, i) => [i, i * 2]);
      const result = parser.parse(coords);
      
      expect(result).not.toBeInstanceOf(Error);
      expect(result.points).toHaveLength(100);
    });

    it('should handle negative coordinates', () => {
      const coords = [[-10, -5], [0, 0], [10, 5]];
      const result = parser.parse(coords);
      
      expect(result).not.toBeInstanceOf(Error);
      expect(result.points[0]).toEqual({ x: -10, y: -5 });
      expect(result.bounds.minX).toBe(-10);
      expect(result.bounds.minY).toBe(-5);
    });

    it('should handle floating point coordinates', () => {
      const coords = [[0.5, 1.5], [2.3, 4.7], [5.1, 3.2]];
      const result = parser.parse(coords);
      
      expect(result).not.toBeInstanceOf(Error);
      expect(result.points[0]).toEqual({ x: 0.5, y: 1.5 });
    });

    it('should handle mixed width data (some points with width, some without)', () => {
      const coords = [[0, 0, 5], [10, 10], [20, 0, 6]];
      const result = parser.parse(coords);
      
      expect(result).not.toBeInstanceOf(Error);
      expect(result.widths).toEqual([5, null, 6]);
    });
  });

  describe('Unit Tests - Error Handling', () => {
    it('should return error for fewer than 3 points', () => {
      const coords = [[0, 0], [10, 10]];
      const result = parser.parse(coords);
      
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('at least 3 coordinate points');
    });

    it('should return error for empty array', () => {
      const coords = [];
      const result = parser.parse(coords);
      
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('at least 3 coordinate points');
    });

    it('should return error for non-array input', () => {
      const result = parser.parse('not an array');
      
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('must be an array');
    });

    it('should return error for non-numeric x coordinate', () => {
      const coords = [['a', 0], [10, 10], [20, 0]];
      const result = parser.parse(coords);
      
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('numeric');
    });

    it('should return error for non-numeric y coordinate', () => {
      const coords = [[0, 'b'], [10, 10], [20, 0]];
      const result = parser.parse(coords);
      
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('numeric');
    });

    it('should return error for non-numeric width', () => {
      const coords = [[0, 0, 'wide'], [10, 10, 5], [20, 0, 6]];
      const result = parser.parse(coords);
      
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('numeric');
    });

    it('should return error for NaN values', () => {
      const coords = [[0, 0], [NaN, 10], [20, 0]];
      const result = parser.parse(coords);
      
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('numeric');
    });

    it('should return error for Infinity values', () => {
      const coords = [[0, 0], [Infinity, 10], [20, 0]];
      const result = parser.parse(coords);
      
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('numeric');
    });

    it('should return error for coordinate with wrong number of elements', () => {
      const coords = [[0, 0], [10], [20, 0]];
      const result = parser.parse(coords);
      
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('2 or 3 elements');
    });

    it('should return error for coordinate with too many elements', () => {
      const coords = [[0, 0], [10, 10, 5, 7], [20, 0]];
      const result = parser.parse(coords);
      
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('2 or 3 elements');
    });

    it('should return error for non-array coordinate', () => {
      const coords = [[0, 0], 'not an array', [20, 0]];
      const result = parser.parse(coords);
      
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('must be an array');
    });
  });

  describe('Validation Method', () => {
    it('should return valid for correct input', () => {
      const coords = [[0, 0], [10, 10], [20, 0]];
      const result = parser.validate(coords);
      
      expect(result.valid).toBe(true);
    });

    it('should return invalid with error message for bad input', () => {
      const coords = [[0, 0]];
      const result = parser.validate(coords);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero-length segments', () => {
      const coords = [[0, 0], [0, 0], [10, 10]];
      const result = parser.parse(coords);
      
      expect(result).not.toBeInstanceOf(Error);
      expect(result.points).toHaveLength(3);
    });

    it('should handle collinear points', () => {
      const coords = [[0, 0], [5, 5], [10, 10]];
      const result = parser.parse(coords);
      
      expect(result).not.toBeInstanceOf(Error);
      expect(result.points).toHaveLength(3);
    });

    it('should handle very small coordinates', () => {
      const coords = [[0.001, 0.001], [0.002, 0.002], [0.003, 0.003]];
      const result = parser.parse(coords);
      
      expect(result).not.toBeInstanceOf(Error);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle very large coordinates', () => {
      const coords = [[1e6, 1e6], [2e6, 2e6], [3e6, 3e6]];
      const result = parser.parse(coords);
      
      expect(result).not.toBeInstanceOf(Error);
      expect(result.bounds.maxX).toBe(3e6);
    });

    it('should handle zero width values', () => {
      const coords = [[0, 0, 0], [10, 10, 5], [20, 0, 0]];
      const result = parser.parse(coords);
      
      expect(result).not.toBeInstanceOf(Error);
      expect(result.widths).toEqual([0, 5, 0]);
    });

    it('should handle negative width values', () => {
      const coords = [[0, 0, -5], [10, 10, 5], [20, 0, 3]];
      const result = parser.parse(coords);
      
      expect(result).not.toBeInstanceOf(Error);
      expect(result.widths).toEqual([-5, 5, 3]);
    });
  });
});
