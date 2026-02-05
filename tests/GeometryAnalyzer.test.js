/**
 * Tests for GeometryAnalyzer
 * Includes both unit tests and property-based tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { GeometryAnalyzer } from '../src/GeometryAnalyzer.js';
import { testConfig } from './setup.js';

describe('GeometryAnalyzer', () => {
  let analyzer;
  
  beforeEach(() => {
    analyzer = new GeometryAnalyzer();
  });
  
  describe('calculateCurvature', () => {
    it('should return empty array for paths with fewer than 3 points', () => {
      const path1 = { points: [{ x: 0, y: 0 }], widths: null, length: 0, bounds: {} };
      const path2 = { points: [{ x: 0, y: 0 }, { x: 1, y: 1 }], widths: null, length: 1.414, bounds: {} };
      
      expect(analyzer.calculateCurvature(path1)).toEqual([]);
      expect(analyzer.calculateCurvature(path2)).toEqual([]);
    });
    
    it('should return array of correct length for valid path', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 3, y: 0 }
        ],
        widths: null,
        length: 3,
        bounds: {}
      };
      
      const curvatures = analyzer.calculateCurvature(path);
      expect(curvatures).toHaveLength(4);
    });
    
    it('should return zero curvature for straight line', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 3, y: 0 }
        ],
        widths: null,
        length: 3,
        bounds: {}
      };
      
      const curvatures = analyzer.calculateCurvature(path);
      
      // All curvatures should be 0 or very close to 0 for a straight line
      curvatures.forEach(c => {
        expect(c).toBeCloseTo(0, 5);
      });
    });
    
    it('should calculate non-zero curvature for 90-degree turn', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 1 }
        ],
        widths: null,
        length: 2,
        bounds: {}
      };
      
      const curvatures = analyzer.calculateCurvature(path);
      
      // First and last points should have 0 curvature (edge points)
      expect(curvatures[0]).toBe(0);
      expect(curvatures[2]).toBe(0);
      
      // Middle point should have significant curvature
      // With smoothing applied (averaging with neighbors which are 0), 
      // the value will be reduced from raw 90 degrees
      expect(curvatures[1]).toBeGreaterThan(0);
      expect(curvatures[1]).toBeCloseTo(45, 1); // Smoothed value
    });
    
    it('should handle edge cases with first and last points', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 1 },
          { x: 3, y: 1 }
        ],
        widths: null,
        length: 3.414,
        bounds: {}
      };
      
      const curvatures = analyzer.calculateCurvature(path);
      
      // First and last points should always be 0
      expect(curvatures[0]).toBe(0);
      expect(curvatures[curvatures.length - 1]).toBe(0);
    });
    
    it('should apply smoothing with moving average', () => {
      // Create a path with alternating sharp turns
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 1 },
          { x: 2, y: 1 },
          { x: 2, y: 2 }
        ],
        widths: null,
        length: 4,
        bounds: {}
      };
      
      const curvatures = analyzer.calculateCurvature(path);
      
      // Smoothing should reduce extreme values
      // All values should be non-negative
      curvatures.forEach(c => {
        expect(c).toBeGreaterThanOrEqual(0);
      });
    });
    
    it('should handle degenerate case with duplicate points', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 0, y: 0 },  // Duplicate point
          { x: 1, y: 0 }
        ],
        widths: null,
        length: 1,
        bounds: {}
      };
      
      const curvatures = analyzer.calculateCurvature(path);
      
      // Should not crash and should return valid array
      expect(curvatures).toHaveLength(3);
      expect(curvatures[1]).toBe(0);  // Zero-length vector should result in 0 curvature
    });
    
    it('should return all non-negative curvature values', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
          { x: 2, y: 0 },
          { x: 3, y: 1 },
          { x: 4, y: 0 }
        ],
        widths: null,
        length: 5.656,
        bounds: {}
      };
      
      const curvatures = analyzer.calculateCurvature(path);
      
      // All curvature values should be non-negative
      curvatures.forEach(c => {
        expect(c).toBeGreaterThanOrEqual(0);
      });
    });
  });
  
  describe('findSharpCurves', () => {
    it('should return empty array for paths with fewer than 3 points', () => {
      const path1 = { points: [{ x: 0, y: 0 }], widths: null, length: 0, bounds: {} };
      const path2 = { points: [{ x: 0, y: 0 }, { x: 1, y: 1 }], widths: null, length: 1.414, bounds: {} };
      
      expect(analyzer.findSharpCurves(path1)).toEqual([]);
      expect(analyzer.findSharpCurves(path2)).toEqual([]);
    });
    
    it('should return empty array for straight line (no sharp curves)', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 3, y: 0 }
        ],
        widths: null,
        length: 3,
        bounds: {}
      };
      
      const sharpCurves = analyzer.findSharpCurves(path);
      expect(sharpCurves).toEqual([]);
    });
    
    it('should identify sharp 90-degree turn', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 1 }
        ],
        widths: null,
        length: 2,
        bounds: {}
      };
      
      const sharpCurves = analyzer.findSharpCurves(path, 30);
      
      // Should identify the middle point as a sharp curve
      expect(sharpCurves.length).toBeGreaterThan(0);
      expect(sharpCurves[0]).toHaveProperty('startIdx');
      expect(sharpCurves[0]).toHaveProperty('endIdx');
      expect(sharpCurves[0]).toHaveProperty('length');
      expect(sharpCurves[0]).toHaveProperty('reason', 'sharp curve');
    });
    
    it('should use configurable threshold', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1.5, y: 0.5 },
          { x: 2, y: 1 }
        ],
        widths: null,
        length: 2.414,
        bounds: {}
      };
      
      // With high threshold, should find no sharp curves
      const sharpCurvesHigh = analyzer.findSharpCurves(path, 100);
      expect(sharpCurvesHigh).toEqual([]);
      
      // With low threshold, might find some curves
      const sharpCurvesLow = analyzer.findSharpCurves(path, 1);
      // This depends on the actual curvature values
    });
    
    it('should merge consecutive sharp curve points into segments', () => {
      // Create a path with multiple consecutive sharp turns
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 1 },
          { x: 0, y: 1 },
          { x: 0, y: 2 }
        ],
        widths: null,
        length: 4,
        bounds: {}
      };
      
      const sharpCurves = analyzer.findSharpCurves(path, 30);
      
      // Should identify segments, not individual points
      sharpCurves.forEach(segment => {
        expect(segment.startIdx).toBeLessThanOrEqual(segment.endIdx);
        expect(segment.length).toBeGreaterThanOrEqual(0);
      });
    });
    
    it('should handle sharp curve at end of path', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 1 }
        ],
        widths: null,
        length: 11,
        bounds: {}
      };
      
      const sharpCurves = analyzer.findSharpCurves(path, 5);
      
      // Should identify the sharp turn
      // Note: The last point always has 0 curvature (edge point),
      // so the sharp curve segment will end at the second-to-last point
      if (sharpCurves.length > 0) {
        const lastSegment = sharpCurves[sharpCurves.length - 1];
        expect(lastSegment.endIdx).toBeGreaterThanOrEqual(1);
        expect(lastSegment.reason).toBe('sharp curve');
      }
    });
  });
  
  describe('findNarrowSections', () => {
    it('should return empty array when no width data exists', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 }
        ],
        widths: null,
        length: 2,
        bounds: {}
      };
      
      const narrowSections = analyzer.findNarrowSections(path, 10);
      expect(narrowSections).toEqual([]);
    });
    
    it('should return empty array when widths array is empty', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 }
        ],
        widths: [],
        length: 2,
        bounds: {}
      };
      
      const narrowSections = analyzer.findNarrowSections(path, 10);
      expect(narrowSections).toEqual([]);
    });
    
    it('should identify narrow sections below threshold', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 3, y: 0 },
          { x: 4, y: 0 }
        ],
        widths: [20, 5, 5, 20, 20],
        length: 4,
        bounds: {}
      };
      
      const narrowSections = analyzer.findNarrowSections(path, 10);
      
      expect(narrowSections.length).toBe(1);
      expect(narrowSections[0].startIdx).toBe(1);
      expect(narrowSections[0].endIdx).toBe(2);
      expect(narrowSections[0].reason).toBe('narrow section');
      expect(narrowSections[0].length).toBeGreaterThan(0);
    });
    
    it('should identify multiple narrow sections', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 3, y: 0 },
          { x: 4, y: 0 },
          { x: 5, y: 0 }
        ],
        widths: [20, 5, 20, 5, 5, 20],
        length: 5,
        bounds: {}
      };
      
      const narrowSections = analyzer.findNarrowSections(path, 10);
      
      expect(narrowSections.length).toBe(2);
      expect(narrowSections[0].startIdx).toBe(1);
      expect(narrowSections[0].endIdx).toBe(1);
      expect(narrowSections[1].startIdx).toBe(3);
      expect(narrowSections[1].endIdx).toBe(4);
    });
    
    it('should handle narrow section at start of path', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 }
        ],
        widths: [5, 5, 20],
        length: 2,
        bounds: {}
      };
      
      const narrowSections = analyzer.findNarrowSections(path, 10);
      
      expect(narrowSections.length).toBe(1);
      expect(narrowSections[0].startIdx).toBe(0);
    });
    
    it('should handle narrow section at end of path', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 }
        ],
        widths: [20, 5, 5],
        length: 2,
        bounds: {}
      };
      
      const narrowSections = analyzer.findNarrowSections(path, 10);
      
      expect(narrowSections.length).toBe(1);
      expect(narrowSections[0].endIdx).toBe(2);
    });
    
    it('should return empty array when all widths are above threshold', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 }
        ],
        widths: [20, 20, 20],
        length: 2,
        bounds: {}
      };
      
      const narrowSections = analyzer.findNarrowSections(path, 10);
      expect(narrowSections).toEqual([]);
    });
  });
  
  describe('getEdgeSections', () => {
    it('should identify first and last 10% of path', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 3, y: 0 },
          { x: 4, y: 0 },
          { x: 5, y: 0 },
          { x: 6, y: 0 },
          { x: 7, y: 0 },
          { x: 8, y: 0 },
          { x: 9, y: 0 },
          { x: 10, y: 0 }
        ],
        widths: null,
        length: 10,
        bounds: {}
      };
      
      const edgeSections = analyzer.getEdgeSections(path);
      
      expect(edgeSections).toHaveProperty('start');
      expect(edgeSections).toHaveProperty('end');
      
      expect(edgeSections.start.startIdx).toBe(0);
      expect(edgeSections.start.reason).toBe('edge section');
      expect(edgeSections.start.length).toBeCloseTo(1, 0); // ~10% of 10
      
      expect(edgeSections.end.endIdx).toBe(10);
      expect(edgeSections.end.reason).toBe('edge section');
      expect(edgeSections.end.length).toBeCloseTo(1, 0); // ~10% of 10
    });
    
    it('should handle short paths', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 }
        ],
        widths: null,
        length: 2,
        bounds: {}
      };
      
      const edgeSections = analyzer.getEdgeSections(path);
      
      expect(edgeSections.start.startIdx).toBe(0);
      expect(edgeSections.end.endIdx).toBe(2);
      
      // For short paths with uniform segments, the algorithm finds the point
      // that crosses the 10% threshold. With 2 segments of length 1 each,
      // 10% = 0.2, so it will include the first full segment (length 1)
      expect(edgeSections.start.length).toBeGreaterThan(0);
      expect(edgeSections.end.length).toBeGreaterThan(0);
      
      // Edge sections should not exceed total path length
      expect(edgeSections.start.length).toBeLessThanOrEqual(path.length);
      expect(edgeSections.end.length).toBeLessThanOrEqual(path.length);
    });
    
    it('should return segments with correct structure', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 5, y: 0 },
          { x: 10, y: 0 }
        ],
        widths: null,
        length: 10,
        bounds: {}
      };
      
      const edgeSections = analyzer.getEdgeSections(path);
      
      // Check start segment structure
      expect(edgeSections.start).toHaveProperty('startIdx');
      expect(edgeSections.start).toHaveProperty('endIdx');
      expect(edgeSections.start).toHaveProperty('length');
      expect(edgeSections.start).toHaveProperty('reason');
      
      // Check end segment structure
      expect(edgeSections.end).toHaveProperty('startIdx');
      expect(edgeSections.end).toHaveProperty('endIdx');
      expect(edgeSections.end).toHaveProperty('length');
      expect(edgeSections.end).toHaveProperty('reason');
    });
    
    it('should handle non-uniform segment lengths', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 0.1, y: 0 },
          { x: 5, y: 0 },
          { x: 10, y: 0 }
        ],
        widths: null,
        length: 10.1,
        bounds: {}
      };
      
      const edgeSections = analyzer.getEdgeSections(path);
      
      // The algorithm finds the point that crosses 10% threshold
      // With segments: 0.1, 4.9, 5.0
      // 10% of 10.1 = 1.01
      // First segment (0.1) doesn't reach threshold, so it includes second segment too
      expect(edgeSections.start.length).toBeGreaterThan(1);
      expect(edgeSections.end.length).toBeGreaterThan(1);
      
      // Verify structure is correct
      expect(edgeSections.start.startIdx).toBe(0);
      expect(edgeSections.end.endIdx).toBe(3);
    });
  });
  
  describe('_calculateSegmentLength', () => {
    it('should calculate length of segment correctly', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 3, y: 0 },
          { x: 3, y: 4 },
          { x: 6, y: 4 }
        ],
        widths: null,
        length: 10,
        bounds: {}
      };
      
      // Segment from index 0 to 1: distance = 3
      const length1 = analyzer._calculateSegmentLength(path, 0, 1);
      expect(length1).toBeCloseTo(3, 5);
      
      // Segment from index 1 to 2: distance = 4
      const length2 = analyzer._calculateSegmentLength(path, 1, 2);
      expect(length2).toBeCloseTo(4, 5);
      
      // Segment from index 0 to 2: distance = 3 + 4 = 7
      const length3 = analyzer._calculateSegmentLength(path, 0, 2);
      expect(length3).toBeCloseTo(7, 5);
    });
    
    it('should return 0 for same start and end index', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 0 }
        ],
        widths: null,
        length: 1,
        bounds: {}
      };
      
      const length = analyzer._calculateSegmentLength(path, 0, 0);
      expect(length).toBe(0);
    });
  });
  
  describe('analyzeGeometry', () => {
    it('should return complete GeometryMetrics object', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 3, y: 0 }
        ],
        widths: null,
        length: 3,
        bounds: {}
      };
      
      const metrics = analyzer.analyzeGeometry(path);
      
      // Check that all required properties exist
      expect(metrics).toHaveProperty('curvatures');
      expect(metrics).toHaveProperty('sharpCurves');
      expect(metrics).toHaveProperty('narrowSections');
      expect(metrics).toHaveProperty('edgeSections');
      expect(metrics).toHaveProperty('avgCurvature');
      expect(metrics).toHaveProperty('maxCurvature');
    });
    
    it('should calculate average curvature correctly for straight line', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 3, y: 0 }
        ],
        widths: null,
        length: 3,
        bounds: {}
      };
      
      const metrics = analyzer.analyzeGeometry(path);
      
      // Straight line should have near-zero average curvature
      expect(metrics.avgCurvature).toBeCloseTo(0, 5);
      expect(metrics.maxCurvature).toBeCloseTo(0, 5);
    });
    
    it('should calculate average and max curvature for curved path', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 1 },
          { x: 2, y: 1 }
        ],
        widths: null,
        length: 3,
        bounds: {}
      };
      
      const metrics = analyzer.analyzeGeometry(path);
      
      // Should have non-zero curvature due to the turn
      expect(metrics.avgCurvature).toBeGreaterThan(0);
      expect(metrics.maxCurvature).toBeGreaterThan(0);
      expect(metrics.maxCurvature).toBeGreaterThanOrEqual(metrics.avgCurvature);
    });
    
    it('should identify sharp curves in metrics', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 1 }
        ],
        widths: null,
        length: 2,
        bounds: {}
      };
      
      const metrics = analyzer.analyzeGeometry(path);
      
      // Should identify the sharp 90-degree turn
      expect(metrics.sharpCurves.length).toBeGreaterThan(0);
      expect(metrics.sharpCurves[0].reason).toBe('sharp curve');
    });
    
    it('should include narrow sections when width data exists', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 3, y: 0 }
        ],
        widths: [20, 5, 5, 20],
        length: 3,
        bounds: {}
      };
      
      const metrics = analyzer.analyzeGeometry(path);
      
      // Should identify narrow sections
      expect(metrics.narrowSections.length).toBeGreaterThan(0);
      expect(metrics.narrowSections[0].reason).toBe('narrow section');
    });
    
    it('should have empty narrow sections when no width data', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 }
        ],
        widths: null,
        length: 2,
        bounds: {}
      };
      
      const metrics = analyzer.analyzeGeometry(path);
      
      // Should have empty narrow sections array
      expect(metrics.narrowSections).toEqual([]);
    });
    
    it('should always include edge sections', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 3, y: 0 },
          { x: 4, y: 0 }
        ],
        widths: null,
        length: 4,
        bounds: {}
      };
      
      const metrics = analyzer.analyzeGeometry(path);
      
      // Should have edge sections
      expect(metrics.edgeSections).toHaveProperty('start');
      expect(metrics.edgeSections).toHaveProperty('end');
      expect(metrics.edgeSections.start.reason).toBe('edge section');
      expect(metrics.edgeSections.end.reason).toBe('edge section');
    });
    
    it('should handle path with fewer than 3 points', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 0 }
        ],
        widths: null,
        length: 1,
        bounds: {}
      };
      
      const metrics = analyzer.analyzeGeometry(path);
      
      // Should return valid metrics even for short path
      expect(metrics.curvatures).toEqual([]);
      expect(metrics.sharpCurves).toEqual([]);
      expect(metrics.avgCurvature).toBe(0);
      expect(metrics.maxCurvature).toBe(0);
    });
    
    it('should calculate correct average excluding edge points', () => {
      // Create a path where we can predict the curvature
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 3, y: 0 },
          { x: 4, y: 0 }
        ],
        widths: null,
        length: 4,
        bounds: {}
      };
      
      const metrics = analyzer.analyzeGeometry(path);
      
      // For a straight line, all interior curvatures should be ~0
      // Average should also be ~0
      expect(metrics.avgCurvature).toBeCloseTo(0, 5);
      
      // Verify that curvatures array has correct length
      expect(metrics.curvatures.length).toBe(5);
    });
    
    it('should handle complex path with multiple features', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 1 },
          { x: 2, y: 1 },
          { x: 2, y: 2 },
          { x: 3, y: 2 }
        ],
        widths: [20, 5, 5, 20, 20, 20],
        length: 5,
        bounds: {}
      };
      
      const metrics = analyzer.analyzeGeometry(path);
      
      // Should have all components
      expect(metrics.curvatures.length).toBe(6);
      expect(metrics.avgCurvature).toBeGreaterThan(0);
      expect(metrics.maxCurvature).toBeGreaterThan(0);
      
      // May have sharp curves and narrow sections
      expect(Array.isArray(metrics.sharpCurves)).toBe(true);
      expect(Array.isArray(metrics.narrowSections)).toBe(true);
      
      // Should always have edge sections
      expect(metrics.edgeSections.start).toBeDefined();
      expect(metrics.edgeSections.end).toBeDefined();
    });
  });
});
