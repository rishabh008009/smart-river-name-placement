/**
 * Integration tests for TextPlacer
 * Validates Requirements 3.2 - Text follows river path direction with smooth orientation transitions
 */

import { describe, it, expect } from 'vitest';
import { TextPlacer } from '../src/TextPlacer.js';
import { RiverPathParser } from '../src/RiverPathParser.js';

describe('TextPlacer Integration Tests', () => {
  describe('Requirement 3.2: Text orientation smoothness', () => {
    it('should place text with smooth angle transitions along curved path', () => {
      const parser = new RiverPathParser();
      const placer = new TextPlacer();

      // Create a gently curved path
      const coordinates = [
        [0, 0],
        [10, 0],
        [20, 2],
        [30, 5],
        [40, 9],
        [50, 14]
      ];

      const path = parser.parse(coordinates);
      const placements = placer.placeText('RIVER', path, 0, 16);

      expect(placements).toHaveLength(5);

      // Check that angles change smoothly (no sudden jumps)
      for (let i = 1; i < placements.length; i++) {
        const angleDiff = Math.abs(placements[i].angle - placements[i - 1].angle);
        
        // Angle change should be small between consecutive characters
        // For a smooth curve, this should be less than 15 degrees (0.26 radians)
        expect(angleDiff).toBeLessThan(0.3);
      }
    });

    it('should handle straight path with consistent angles', () => {
      const parser = new RiverPathParser();
      const placer = new TextPlacer();

      const coordinates = [
        [0, 0],
        [50, 0],
        [100, 0]
      ];

      const path = parser.parse(coordinates);
      const placements = placer.placeText('STRAIGHT', path, 0, 16);

      // All characters should have the same angle (horizontal)
      const firstAngle = placements[0].angle;
      for (const placement of placements) {
        expect(placement.angle).toBeCloseTo(firstAngle, 5);
      }
    });

    it('should calculate correct tangent angles at each position', () => {
      const placer = new TextPlacer();

      // Horizontal line
      const horizontalPath = {
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 }
        ]
      };

      const horizontalPos = placer.interpolatePosition(horizontalPath, 0, 5);
      expect(horizontalPos.angle).toBeCloseTo(0, 5); // 0 degrees

      // Vertical line (upward)
      const verticalPath = {
        points: [
          { x: 0, y: 0 },
          { x: 0, y: 10 }
        ]
      };

      const verticalPos = placer.interpolatePosition(verticalPath, 0, 5);
      expect(verticalPos.angle).toBeCloseTo(Math.PI / 2, 5); // 90 degrees

      // Diagonal line (45 degrees)
      const diagonalPath = {
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 10 }
        ]
      };

      const diagonalPos = placer.interpolatePosition(diagonalPath, 0, 5);
      expect(diagonalPos.angle).toBeCloseTo(Math.PI / 4, 5); // 45 degrees
    });
  });

  describe('Character positioning accuracy', () => {
    it('should position characters sequentially along path', () => {
      const parser = new RiverPathParser();
      const placer = new TextPlacer();

      const coordinates = [
        [0, 0],
        [50, 0],
        [100, 0]
      ];

      const path = parser.parse(coordinates);
      const placements = placer.placeText('ABC', path, 0, 16);

      // Characters should be positioned in order
      expect(placements[0].x).toBeLessThan(placements[1].x);
      expect(placements[1].x).toBeLessThan(placements[2].x);

      // All should be on the same horizontal line
      expect(placements[0].y).toBe(0);
      expect(placements[1].y).toBe(0);
      expect(placements[2].y).toBe(0);
    });

    it('should measure character widths correctly', () => {
      const placer = new TextPlacer();

      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 }
        ]
      };

      const placements = placer.placeText('A', path, 0, 16);

      // Character width should be positive and reasonable
      expect(placements[0].width).toBeGreaterThan(0);
      expect(placements[0].width).toBeLessThan(50); // Sanity check
    });

    it('should handle different font sizes', () => {
      const placer = new TextPlacer();

      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 }
        ]
      };

      const small = placer.placeText('A', path, 0, 12);
      const large = placer.placeText('A', path, 0, 24);

      // Larger font should have wider characters
      expect(large[0].width).toBeGreaterThan(small[0].width);
    });
  });

  describe('Path interpolation', () => {
    it('should interpolate correctly at segment boundaries', () => {
      const placer = new TextPlacer();

      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 20, y: 0 }
        ]
      };

      // At exactly 10 units, should be at second point
      const pos = placer.interpolatePosition(path, 0, 10);
      expect(pos.x).toBe(10);
      expect(pos.y).toBe(0);
    });

    it('should handle interpolation across multiple segments', () => {
      const placer = new TextPlacer();

      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 20, y: 0 },
          { x: 30, y: 0 }
        ]
      };

      // 25 units should be in the third segment
      const pos = placer.interpolatePosition(path, 0, 25);
      expect(pos.x).toBe(25);
      expect(pos.y).toBe(0);
    });

    it('should handle curved paths correctly', () => {
      const placer = new TextPlacer();

      // L-shaped path
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 }
        ]
      };

      // First segment (horizontal)
      const pos1 = placer.interpolatePosition(path, 0, 5);
      expect(pos1.x).toBe(5);
      expect(pos1.y).toBe(0);
      expect(pos1.angle).toBeCloseTo(0);

      // Second segment (vertical)
      const pos2 = placer.interpolatePosition(path, 0, 15);
      expect(pos2.x).toBe(10);
      expect(pos2.y).toBe(5);
      expect(pos2.angle).toBeCloseTo(Math.PI / 2);
    });
  });

  describe('Edge cases', () => {
    it('should handle text longer than path gracefully', () => {
      const placer = new TextPlacer();

      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 }
        ]
      };

      // Very long text on short path
      const placements = placer.placeText('VERYLONGTEXT', path, 0, 16);

      // Should still place all characters
      expect(placements).toHaveLength(12);

      // Last character should be at end of path
      expect(placements[placements.length - 1].x).toBe(10);
    });

    it('should handle single point path at last index', () => {
      const placer = new TextPlacer();

      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 }
        ]
      };

      // Start at last point
      const pos = placer.interpolatePosition(path, 1, 0);
      expect(pos.x).toBe(10);
      expect(pos.y).toBe(0);
    });

    it('should handle zero-length text', () => {
      const placer = new TextPlacer();

      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 }
        ]
      };

      const placements = placer.placeText('', path, 0, 16);
      expect(placements).toEqual([]);
    });
  });
});
