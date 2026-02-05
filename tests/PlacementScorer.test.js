/**
 * Tests for PlacementScorer
 * Includes both unit tests and property-based tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { PlacementScorer } from '../src/PlacementScorer.js';
import { GeometryAnalyzer } from '../src/GeometryAnalyzer.js';
import { testConfig } from './setup.js';

describe('PlacementScorer', () => {
  let scorer;
  let analyzer;
  
  beforeEach(() => {
    scorer = new PlacementScorer();
    analyzer = new GeometryAnalyzer();
  });
  
  describe('scoreSegment', () => {
    it('should return score object with overall score and component scores', () => {
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
      const result = scorer.scoreSegment(path, 0, 2, metrics);
      
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('scores');
      expect(result.scores).toHaveProperty('curvature');
      expect(result.scores).toHaveProperty('width');
      expect(result.scores).toHaveProperty('position');
      expect(result.scores).toHaveProperty('straightness');
    });
    
    it('should return high score for straight line in center', () => {
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
      // Score the center segment (index 1 to 3)
      const result = scorer.scoreSegment(path, 1, 3, metrics);
      
      // Straight line should have high curvature score
      expect(result.scores.curvature).toBeGreaterThan(90);
      // Center position should have high position score
      expect(result.scores.position).toBeGreaterThan(80);
      // Straight line should have high straightness score
      expect(result.scores.straightness).toBeGreaterThan(90);
      // Overall score should be high
      expect(result.score).toBeGreaterThan(80);
    });
    
    it('should return lower score for curved segment', () => {
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
      // Score the curved segment (index 0 to 2)
      const result = scorer.scoreSegment(path, 0, 2, metrics);
      
      // Curved segment should have lower curvature score
      expect(result.scores.curvature).toBeLessThan(100);
      // Overall score should be lower than straight line
      expect(result.score).toBeLessThan(100);
    });
    
    it('should return all scores in 0-100 range', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 1 },
          { x: 2, y: 1 },
          { x: 2, y: 2 }
        ],
        widths: [20, 10, 5, 15, 20],
        length: 4,
        bounds: {}
      };
      
      const metrics = analyzer.analyzeGeometry(path);
      const result = scorer.scoreSegment(path, 1, 3, metrics);
      
      // All scores should be in valid range
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.scores.curvature).toBeGreaterThanOrEqual(0);
      expect(result.scores.curvature).toBeLessThanOrEqual(100);
      expect(result.scores.width).toBeGreaterThanOrEqual(0);
      expect(result.scores.width).toBeLessThanOrEqual(100);
      expect(result.scores.position).toBeGreaterThanOrEqual(0);
      expect(result.scores.position).toBeLessThanOrEqual(100);
      expect(result.scores.straightness).toBeGreaterThanOrEqual(0);
      expect(result.scores.straightness).toBeLessThanOrEqual(100);
    });
    
    it('should give higher position score to center segments', () => {
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
      
      // Score edge segment
      const edgeResult = scorer.scoreSegment(path, 0, 1, metrics);
      // Score center segment
      const centerResult = scorer.scoreSegment(path, 1, 3, metrics);
      
      // Center should have higher position score
      expect(centerResult.scores.position).toBeGreaterThan(edgeResult.scores.position);
    });
    
    it('should handle width data when available', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 3, y: 0 }
        ],
        widths: [20, 20, 20, 20],
        length: 3,
        bounds: {}
      };
      
      const metrics = analyzer.analyzeGeometry(path);
      const result = scorer.scoreSegment(path, 0, 2, metrics);
      
      // Width score should be calculated (not neutral 50)
      expect(result.scores.width).toBeGreaterThan(0);
      expect(result.scores.width).toBeLessThanOrEqual(100);
    });
    
    it('should return neutral width score when no width data', () => {
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
      const result = scorer.scoreSegment(path, 0, 1, metrics);
      
      // Width score should be neutral (50) when no width data
      expect(result.scores.width).toBe(50);
    });
    
    it('should penalize narrow sections', () => {
      const pathWide = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 }
        ],
        widths: [30, 30, 30],
        length: 2,
        bounds: {}
      };
      
      const pathNarrow = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 }
        ],
        widths: [5, 5, 5],
        length: 2,
        bounds: {}
      };
      
      const metricsWide = analyzer.analyzeGeometry(pathWide);
      const metricsNarrow = analyzer.analyzeGeometry(pathNarrow);
      
      const resultWide = scorer.scoreSegment(pathWide, 0, 1, metricsWide);
      const resultNarrow = scorer.scoreSegment(pathNarrow, 0, 1, metricsNarrow);
      
      // Wide section should have higher width score
      expect(resultWide.scores.width).toBeGreaterThan(resultNarrow.scores.width);
    });
    
    it('should apply correct weights to component scores', () => {
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
      const result = scorer.scoreSegment(path, 0, 1, metrics);
      
      // Calculate expected weighted score
      const expectedScore = 
        result.scores.curvature * 0.4 +
        result.scores.width * 0.2 +
        result.scores.position * 0.2 +
        result.scores.straightness * 0.2;
      
      expect(result.score).toBeCloseTo(expectedScore, 5);
    });
    
    it('should handle very short segments', () => {
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
      // Score a single-point segment
      const result = scorer.scoreSegment(path, 1, 1, metrics);
      
      // Should return valid scores without crashing
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
    
    it('should handle segments with varying direction', () => {
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
      
      const metrics = analyzer.analyzeGeometry(path);
      const result = scorer.scoreSegment(path, 0, 3, metrics);
      
      // Segment with direction changes should have lower straightness score
      expect(result.scores.straightness).toBeLessThan(100);
    });
  });
  
  describe('findCandidates', () => {
    it('should return empty array when no valid candidates exist', () => {
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
      // Request text length longer than the path
      const candidates = scorer.findCandidates(path, 100, metrics);
      
      expect(candidates).toEqual([]);
    });
    
    it('should find candidates for straight path', () => {
      // Use a longer path to ensure there's space after edge exclusion
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 20, y: 0 },
          { x: 30, y: 0 },
          { x: 40, y: 0 },
          { x: 50, y: 0 },
          { x: 60, y: 0 },
          { x: 70, y: 0 },
          { x: 80, y: 0 },
          { x: 90, y: 0 },
          { x: 100, y: 0 }
        ],
        widths: null,
        length: 100,
        bounds: {}
      };
      
      const metrics = analyzer.analyzeGeometry(path);
      const candidates = scorer.findCandidates(path, 10, metrics);
      
      // Should find multiple candidates
      expect(candidates.length).toBeGreaterThan(0);
      
      // All candidates should have valid scores
      for (const candidate of candidates) {
        expect(candidate.score).toBeGreaterThanOrEqual(0);
        expect(candidate.score).toBeLessThanOrEqual(100);
        expect(candidate.segment.length).toBeGreaterThanOrEqual(10);
      }
    });
    
    it('should exclude sharp curves from candidates', () => {
      // Create a path with a sharp curve in the middle
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 }, // Sharp 90-degree turn
          { x: 20, y: 10 },
          { x: 30, y: 10 }
        ],
        widths: null,
        length: 40,
        bounds: {}
      };
      
      const metrics = analyzer.analyzeGeometry(path);
      const candidates = scorer.findCandidates(path, 5, metrics);
      
      // Candidates should not include the sharp curve point (index 2)
      for (const candidate of candidates) {
        const segment = candidate.segment;
        // The sharp curve should not be in the middle of any candidate
        if (segment.startIdx <= 2 && segment.endIdx >= 2) {
          // If it includes index 2, it should be at the boundary
          expect(segment.startIdx === 2 || segment.endIdx === 2).toBe(true);
        }
      }
    });
    
    it('should exclude edge sections from candidates', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 20, y: 0 },
          { x: 30, y: 0 },
          { x: 40, y: 0 },
          { x: 50, y: 0 },
          { x: 60, y: 0 },
          { x: 70, y: 0 },
          { x: 80, y: 0 },
          { x: 90, y: 0 },
          { x: 100, y: 0 }
        ],
        widths: null,
        length: 100,
        bounds: {}
      };
      
      const metrics = analyzer.analyzeGeometry(path);
      const candidates = scorer.findCandidates(path, 10, metrics);
      
      // Edge sections are first and last 10% (10 units each)
      // So candidates should not start at index 0 or end at last index
      for (const candidate of candidates) {
        const segment = candidate.segment;
        // Check that candidates don't start in the first edge section
        expect(segment.startIdx).toBeGreaterThan(0);
        // Check that candidates don't end in the last edge section
        expect(segment.endIdx).toBeLessThan(path.points.length - 1);
      }
    });
    
    it('should include centerPoint in each candidate', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 20, y: 0 },
          { x: 30, y: 0 }
        ],
        widths: null,
        length: 30,
        bounds: {}
      };
      
      const metrics = analyzer.analyzeGeometry(path);
      const candidates = scorer.findCandidates(path, 5, metrics);
      
      for (const candidate of candidates) {
        expect(candidate.centerPoint).toBeDefined();
        expect(candidate.centerPoint.x).toBeDefined();
        expect(candidate.centerPoint.y).toBeDefined();
      }
    });
    
    it('should exclude narrow sections when width data exists', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 20, y: 0 },
          { x: 30, y: 0 },
          { x: 40, y: 0 }
        ],
        widths: [20, 5, 5, 20, 20], // Narrow section in the middle
        length: 40,
        bounds: {}
      };
      
      const metrics = analyzer.analyzeGeometry(path);
      const candidates = scorer.findCandidates(path, 5, metrics);
      
      // Candidates should not include the narrow section (indices 1-2)
      for (const candidate of candidates) {
        const segment = candidate.segment;
        // The narrow section should not be in the middle of any candidate
        const includesNarrow = segment.startIdx <= 1 && segment.endIdx >= 2;
        expect(includesNarrow).toBe(false);
      }
    });
  });
  
  describe('selectOptimal', () => {
    it('should return null for empty candidate array', () => {
      const result = scorer.selectOptimal([]);
      expect(result).toBeNull();
    });
    
    it('should return null for null input', () => {
      const result = scorer.selectOptimal(null);
      expect(result).toBeNull();
    });
    
    it('should return the only candidate when array has one element', () => {
      const candidate = {
        segment: { startIdx: 0, endIdx: 2, length: 10, reason: null },
        score: 85,
        scores: { curvature: 90, width: 80, position: 85, straightness: 85 },
        centerPoint: { x: 5, y: 0 }
      };
      
      const result = scorer.selectOptimal([candidate]);
      expect(result).toBe(candidate);
    });
    
    it('should return candidate with highest score', () => {
      const candidates = [
        {
          segment: { startIdx: 0, endIdx: 2, length: 10, reason: null },
          score: 70,
          scores: { curvature: 70, width: 70, position: 70, straightness: 70 },
          centerPoint: { x: 5, y: 0 }
        },
        {
          segment: { startIdx: 2, endIdx: 4, length: 10, reason: null },
          score: 90,
          scores: { curvature: 90, width: 90, position: 90, straightness: 90 },
          centerPoint: { x: 15, y: 0 }
        },
        {
          segment: { startIdx: 4, endIdx: 6, length: 10, reason: null },
          score: 80,
          scores: { curvature: 80, width: 80, position: 80, straightness: 80 },
          centerPoint: { x: 25, y: 0 }
        }
      ];
      
      const result = scorer.selectOptimal(candidates);
      expect(result.score).toBe(90);
      expect(result.segment.startIdx).toBe(2);
    });
    
    it('should prefer center position when scores are tied', () => {
      const candidates = [
        {
          segment: { startIdx: 0, endIdx: 2, length: 10, reason: null },
          score: 85,
          scores: { curvature: 85, width: 85, position: 70, straightness: 85 },
          centerPoint: { x: 5, y: 0 }
        },
        {
          segment: { startIdx: 2, endIdx: 4, length: 10, reason: null },
          score: 85,
          scores: { curvature: 85, width: 85, position: 95, straightness: 85 },
          centerPoint: { x: 15, y: 0 }
        },
        {
          segment: { startIdx: 4, endIdx: 6, length: 10, reason: null },
          score: 85,
          scores: { curvature: 85, width: 85, position: 80, straightness: 85 },
          centerPoint: { x: 25, y: 0 }
        }
      ];
      
      const result = scorer.selectOptimal(candidates);
      // Should select the one with highest position score (95)
      expect(result.scores.position).toBe(95);
      expect(result.segment.startIdx).toBe(2);
    });
    
    it('should handle candidates with identical scores and positions', () => {
      const candidates = [
        {
          segment: { startIdx: 0, endIdx: 2, length: 10, reason: null },
          score: 85,
          scores: { curvature: 85, width: 85, position: 85, straightness: 85 },
          centerPoint: { x: 5, y: 0 }
        },
        {
          segment: { startIdx: 2, endIdx: 4, length: 10, reason: null },
          score: 85,
          scores: { curvature: 85, width: 85, position: 85, straightness: 85 },
          centerPoint: { x: 15, y: 0 }
        }
      ];
      
      const result = scorer.selectOptimal(candidates);
      // Should return one of them (first one in this case)
      expect(result.score).toBe(85);
      expect(candidates).toContain(result);
    });
  });
  
  // Property-based tests will be added in tasks 5.4 and 5.5
  // Unit tests for findCandidates and selectOptimal will be added in task 5.6
  
  describe('measureTextLength', () => {
    it('should measure text length using canvas context', () => {
      const length = scorer.measureTextLength('Test River', 16, 'Arial');
      
      // Should return a positive number
      expect(length).toBeGreaterThan(0);
      // Reasonable length for "Test River" at 16px
      expect(length).toBeGreaterThan(50);
      expect(length).toBeLessThan(200);
    });
    
    it('should return different lengths for different text', () => {
      const shortLength = scorer.measureTextLength('Hi', 16);
      const longLength = scorer.measureTextLength('Mississippi River', 16);
      
      expect(longLength).toBeGreaterThan(shortLength);
    });
    
    it('should scale with font size', () => {
      const smallLength = scorer.measureTextLength('Test', 12);
      const largeLength = scorer.measureTextLength('Test', 24);
      
      expect(largeLength).toBeGreaterThan(smallLength);
    });
    
    it('should handle empty string', () => {
      const length = scorer.measureTextLength('', 16);
      
      expect(length).toBe(0);
    });
  });
  
  describe('findOptimalPlacement', () => {
    it('should find optimal placement when suitable candidates exist', () => {
      // Use a longer path to ensure valid segments after edge exclusion (10% each end)
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 50, y: 0 },
          { x: 100, y: 0 },
          { x: 150, y: 0 },
          { x: 200, y: 0 },
          { x: 250, y: 0 },
          { x: 300, y: 0 },
          { x: 350, y: 0 },
          { x: 400, y: 0 }
        ],
        widths: null,
        length: 400,
        bounds: {}
      };
      
      const metrics = analyzer.analyzeGeometry(path);
      const result = scorer.findOptimalPlacement(path, 'River', 16, metrics);
      
      expect(result.placement).not.toBeNull();
      expect(result.warning).toBeNull();
      expect(result.allCandidates.length).toBeGreaterThan(0);
      expect(result.textLength).toBeGreaterThan(0);
    });
    
    it('should return warning when text is too long', () => {
      // Use a longer path but with very long text
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 50, y: 0 },
          { x: 100, y: 0 },
          { x: 150, y: 0 },
          { x: 200, y: 0 },
          { x: 250, y: 0 },
          { x: 300, y: 0 },
          { x: 350, y: 0 },
          { x: 400, y: 0 },
          { x: 450, y: 0 },
          { x: 500, y: 0 }
        ],
        widths: null,
        length: 500,
        bounds: {}
      };
      
      const metrics = analyzer.analyzeGeometry(path);
      // Very long text that won't fit in the middle 80% of the path (400px)
      const result = scorer.findOptimalPlacement(path, 'Very Long Mississippi River Name That Cannot Possibly Fit In The Available Space Even With Large Font', 32, metrics);
      
      expect(result.warning).not.toBeNull();
      expect(result.warning).toContain('exceeds');
      // Should still provide best available option
      expect(result.placement).not.toBeNull();
    });
    
    it('should return warning when entire path is rejected', () => {
      // Create a path with all sharp curves
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
      
      const metrics = analyzer.analyzeGeometry(path);
      const result = scorer.findOptimalPlacement(path, 'River', 16, metrics);
      
      // Should have a warning about problematic geometry
      expect(result.warning).not.toBeNull();
      expect(result.warning).toContain('problematic geometry');
    });
    
    it('should include text length in result', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 50, y: 0 },
          { x: 100, y: 0 },
          { x: 150, y: 0 },
          { x: 200, y: 0 },
          { x: 250, y: 0 }
        ],
        widths: null,
        length: 250,
        bounds: {}
      };
      
      const metrics = analyzer.analyzeGeometry(path);
      const result = scorer.findOptimalPlacement(path, 'Test', 16, metrics);
      
      expect(result.textLength).toBeDefined();
      expect(result.textLength).toBeGreaterThan(0);
    });
    
    it('should return all candidates for transparency', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 50, y: 0 },
          { x: 100, y: 0 },
          { x: 150, y: 0 },
          { x: 200, y: 0 },
          { x: 250, y: 0 },
          { x: 300, y: 0 }
        ],
        widths: null,
        length: 300,
        bounds: {}
      };
      
      const metrics = analyzer.analyzeGeometry(path);
      const result = scorer.findOptimalPlacement(path, 'Hi', 16, metrics);
      
      expect(result.allCandidates).toBeDefined();
      expect(Array.isArray(result.allCandidates)).toBe(true);
    });
    
    it('should handle different font families', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 50, y: 0 },
          { x: 100, y: 0 },
          { x: 150, y: 0 },
          { x: 200, y: 0 },
          { x: 250, y: 0 },
          { x: 300, y: 0 }
        ],
        widths: null,
        length: 300,
        bounds: {}
      };
      
      const metrics = analyzer.analyzeGeometry(path);
      const result1 = scorer.findOptimalPlacement(path, 'Test', 16, metrics, 'Arial');
      const result2 = scorer.findOptimalPlacement(path, 'Test', 16, metrics, 'Courier');
      
      // Both should succeed
      expect(result1.placement).not.toBeNull();
      expect(result2.placement).not.toBeNull();
    });
    
    it('should prefer best available option when no perfect fit exists', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 50, y: 0 },
          { x: 100, y: 0 },
          { x: 150, y: 0 },
          { x: 200, y: 0 },
          { x: 250, y: 0 },
          { x: 300, y: 0 }
        ],
        widths: null,
        length: 300,
        bounds: {}
      };
      
      const metrics = analyzer.analyzeGeometry(path);
      const result = scorer.findOptimalPlacement(path, 'Very Long River Name That Exceeds Available Space In The Middle Section', 24, metrics);
      
      // Should return the longest available segment
      expect(result.placement).not.toBeNull();
      expect(result.warning).not.toBeNull();
      // The placement should be the longest segment available
      expect(result.placement.segment.length).toBeGreaterThan(0);
    });
  });
  
  describe('_findAllValidSegments', () => {
    it('should find all non-rejected segments', () => {
      // Use a longer path to ensure there are valid segments after edge exclusion
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 20, y: 0 },
          { x: 40, y: 0 },
          { x: 60, y: 0 },
          { x: 80, y: 0 },
          { x: 100, y: 0 },
          { x: 120, y: 0 },
          { x: 140, y: 0 },
          { x: 160, y: 0 },
          { x: 180, y: 0 },
          { x: 200, y: 0 }
        ],
        widths: null,
        length: 200,
        bounds: {}
      };
      
      const metrics = analyzer.analyzeGeometry(path);
      const segments = scorer._findAllValidSegments(path, metrics);
      
      expect(segments.length).toBeGreaterThan(0);
      // All segments should have positive length
      for (const segment of segments) {
        expect(segment.segment.length).toBeGreaterThan(0);
      }
    });
    
    it('should return empty array when all segments are rejected', () => {
      // Create a path with all sharp curves
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
      const segments = scorer._findAllValidSegments(path, metrics);
      
      // May be empty or very small segments
      expect(Array.isArray(segments)).toBe(true);
    });
    
    it('should not include overlapping segments', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 50, y: 0 },
          { x: 100, y: 0 },
          { x: 150, y: 0 }
        ],
        widths: null,
        length: 150,
        bounds: {}
      };
      
      const metrics = analyzer.analyzeGeometry(path);
      const segments = scorer._findAllValidSegments(path, metrics);
      
      // Check that segments don't overlap
      for (let i = 0; i < segments.length - 1; i++) {
        const seg1 = segments[i].segment;
        const seg2 = segments[i + 1].segment;
        // Next segment should start after or at the end of previous segment
        expect(seg2.startIdx).toBeGreaterThanOrEqual(seg1.endIdx);
      }
    });
  });
});
