/**
 * Unit tests for TextPlacer
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TextPlacer } from '../src/TextPlacer.js';

describe('TextPlacer', () => {
  let placer;

  beforeEach(() => {
    placer = new TextPlacer();
  });

  describe('interpolatePosition', () => {
    it('should return position at startIdx when distance is 0', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 20, y: 0 }
        ]
      };

      const result = placer.interpolatePosition(path, 0, 0);

      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
      expect(result.angle).toBeCloseTo(0); // Horizontal line, angle = 0
    });

    it('should interpolate position within a segment', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 20, y: 0 }
        ]
      };

      const result = placer.interpolatePosition(path, 0, 5);

      expect(result.x).toBe(5);
      expect(result.y).toBe(0);
      expect(result.angle).toBeCloseTo(0);
    });

    it('should handle position at segment boundary', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 20, y: 0 }
        ]
      };

      const result = placer.interpolatePosition(path, 0, 10);

      expect(result.x).toBe(10);
      expect(result.y).toBe(0);
      expect(result.angle).toBeCloseTo(0);
    });

    it('should handle position spanning multiple segments', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 20, y: 0 }
        ]
      };

      const result = placer.interpolatePosition(path, 0, 15);

      expect(result.x).toBe(15);
      expect(result.y).toBe(0);
      expect(result.angle).toBeCloseTo(0);
    });

    it('should calculate correct angle for vertical line', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 0, y: 10 }
        ]
      };

      const result = placer.interpolatePosition(path, 0, 5);

      expect(result.x).toBe(0);
      expect(result.y).toBe(5);
      expect(result.angle).toBeCloseTo(Math.PI / 2); // 90 degrees
    });

    it('should calculate correct angle for diagonal line', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 10 }
        ]
      };

      const result = placer.interpolatePosition(path, 0, 0);

      expect(result.angle).toBeCloseTo(Math.PI / 4); // 45 degrees
    });

    it('should handle distance beyond path end', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 }
        ]
      };

      const result = placer.interpolatePosition(path, 0, 100);

      expect(result.x).toBe(10);
      expect(result.y).toBe(0);
      expect(result.angle).toBeCloseTo(0);
    });

    it('should handle startIdx in middle of path', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 20, y: 0 },
          { x: 30, y: 0 }
        ]
      };

      const result = placer.interpolatePosition(path, 1, 5);

      expect(result.x).toBe(15);
      expect(result.y).toBe(0);
    });

    it('should throw error for invalid path', () => {
      expect(() => {
        placer.interpolatePosition(null, 0, 0);
      }).toThrow('Invalid path');

      expect(() => {
        placer.interpolatePosition({}, 0, 0);
      }).toThrow('Invalid path');

      expect(() => {
        placer.interpolatePosition({ points: [] }, 0, 0);
      }).toThrow('Invalid path');
    });

    it('should throw error for invalid startIdx', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 }
        ]
      };

      expect(() => {
        placer.interpolatePosition(path, -1, 0);
      }).toThrow('Invalid startIdx');

      expect(() => {
        placer.interpolatePosition(path, 5, 0);
      }).toThrow('Invalid startIdx');
    });

    it('should handle position at last point', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 }
        ]
      };

      const result = placer.interpolatePosition(path, 1, 0);

      expect(result.x).toBe(10);
      expect(result.y).toBe(0);
      // Should use angle from previous segment
      expect(result.angle).toBeCloseTo(0);
    });
  });

  describe('placeText', () => {
    it('should return empty array for empty text', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 }
        ]
      };

      const result = placer.placeText('', path, 0, 16);

      expect(result).toEqual([]);
    });

    it('should place single character', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 }
        ]
      };

      const result = placer.placeText('A', path, 0, 16);

      expect(result).toHaveLength(1);
      expect(result[0].char).toBe('A');
      expect(result[0].x).toBeGreaterThan(0); // Should be at center of character
      expect(result[0].y).toBe(0);
      expect(result[0].angle).toBeCloseTo(0);
      expect(result[0].width).toBeGreaterThan(0);
    });

    it('should place multiple characters along path', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 }
        ]
      };

      const result = placer.placeText('ABC', path, 0, 16);

      expect(result).toHaveLength(3);
      expect(result[0].char).toBe('A');
      expect(result[1].char).toBe('B');
      expect(result[2].char).toBe('C');

      // Characters should be positioned sequentially
      expect(result[1].x).toBeGreaterThan(result[0].x);
      expect(result[2].x).toBeGreaterThan(result[1].x);

      // All should have same angle (straight line)
      expect(result[0].angle).toBeCloseTo(0);
      expect(result[1].angle).toBeCloseTo(0);
      expect(result[2].angle).toBeCloseTo(0);
    });

    it('should handle text along curved path', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 }
        ]
      };

      const result = placer.placeText('ABCD', path, 0, 16);

      expect(result).toHaveLength(4);

      // First characters should be horizontal
      expect(result[0].angle).toBeCloseTo(0, 1);

      // Later characters should be vertical (after the corner)
      // This depends on character width, but angle should change
      const firstAngle = result[0].angle;
      const lastAngle = result[result.length - 1].angle;
      
      // Angles should be different for curved path
      // (unless all characters fit in first segment)
      if (result[result.length - 1].x >= 10) {
        expect(Math.abs(lastAngle - firstAngle)).toBeGreaterThan(0.1);
      }
    });

    it('should include character width in placements', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 }
        ]
      };

      const result = placer.placeText('AB', path, 0, 16);

      expect(result[0].width).toBeGreaterThan(0);
      expect(result[1].width).toBeGreaterThan(0);
    });

    it('should throw error for invalid path', () => {
      expect(() => {
        placer.placeText('A', null, 0, 16);
      }).toThrow('Invalid path');

      expect(() => {
        placer.placeText('A', {}, 0, 16);
      }).toThrow('Invalid path');

      expect(() => {
        placer.placeText('A', { points: [] }, 0, 16);
      }).toThrow('Invalid path');
    });

    it('should throw error for invalid startIdx', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 }
        ]
      };

      expect(() => {
        placer.placeText('A', path, -1, 16);
      }).toThrow('Invalid startIdx');

      expect(() => {
        placer.placeText('A', path, 5, 16);
      }).toThrow('Invalid startIdx');
    });

    it('should handle startIdx in middle of path', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 20, y: 0 },
          { x: 30, y: 0 }
        ]
      };

      const result = placer.placeText('AB', path, 1, 16);

      expect(result).toHaveLength(2);
      // Should start from second point
      expect(result[0].x).toBeGreaterThanOrEqual(10);
    });

    it('should handle different font sizes', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 }
        ]
      };

      const result12 = placer.placeText('A', path, 0, 12);
      const result24 = placer.placeText('A', path, 0, 24);

      // Larger font should have wider characters
      expect(result24[0].width).toBeGreaterThan(result12[0].width);
    });

    it('should place characters at center of their width', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 }
        ]
      };

      const result = placer.placeText('A', path, 0, 16);

      // First character should be positioned at half its width
      const expectedX = result[0].width / 2;
      expect(result[0].x).toBeCloseTo(expectedX, 0);
    });
  });

  describe('edge cases', () => {
    it('should handle very short path', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 0 }
        ]
      };

      const result = placer.placeText('A', path, 0, 16);

      expect(result).toHaveLength(1);
      expect(result[0].char).toBe('A');
    });

    it('should handle path with many segments', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 20, y: 0 },
          { x: 30, y: 0 },
          { x: 40, y: 0 },
          { x: 50, y: 0 }
        ]
      };

      const result = placer.placeText('HELLO', path, 0, 16);

      expect(result).toHaveLength(5);
      expect(result.map(p => p.char).join('')).toBe('HELLO');
    });

    it('should handle long text on short path', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 }
        ]
      };

      // Should not throw, but characters will extend beyond path
      const result = placer.placeText('VERYLONGTEXT', path, 0, 16);

      expect(result).toHaveLength(12);
      // Last character should be at end of path
      expect(result[result.length - 1].x).toBe(10);
    });
  });
});
