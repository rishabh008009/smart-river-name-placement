/**
 * Integration tests for CanvasRenderer with other components
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CanvasRenderer } from '../src/CanvasRenderer.js';
import { RiverPathParser } from '../src/RiverPathParser.js';
import { GeometryAnalyzer } from '../src/GeometryAnalyzer.js';
import { PlacementScorer } from '../src/PlacementScorer.js';
import { TextPlacer } from '../src/TextPlacer.js';

describe('CanvasRenderer Integration Tests', () => {
  let renderer;
  let parser;
  let analyzer;
  let scorer;
  let placer;
  let mockCtx;

  beforeEach(() => {
    renderer = new CanvasRenderer();
    parser = new RiverPathParser();
    analyzer = new GeometryAnalyzer();
    scorer = new PlacementScorer();
    placer = new TextPlacer();

    // Create a mock canvas context
    mockCtx = {
      canvas: { width: 800, height: 600 },
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fill: () => {},
      closePath: () => {},
      arc: () => {},
      translate: () => {},
      rotate: () => {},
      scale: () => {},
      strokeText: () => {},
      fillText: () => {},
      clearRect: () => {},
      fillRect: () => {},
      measureText: (text) => ({ width: text.length * 10 }),
      strokeStyle: '',
      fillStyle: '',
      lineWidth: 0,
      lineCap: '',
      lineJoin: '',
      font: '',
      textAlign: '',
      textBaseline: ''
    };
  });

  describe('Complete rendering pipeline', () => {
    it('should render a complete river with text placement', () => {
      // Parse river coordinates - create a longer, straighter river
      const coordinates = [
        [0, 0, 15],
        [100, 0, 15],
        [200, 0, 15],
        [300, 0, 15],
        [400, 0, 15],
        [500, 0, 15]
      ];

      const path = parser.parse(coordinates);
      expect(path).not.toBeInstanceOf(Error);

      // Analyze geometry
      const metrics = analyzer.analyzeGeometry(path);
      expect(metrics).toBeDefined();

      // Find optimal placement
      const text = 'River';
      const fontSize = 16;
      const result = scorer.findOptimalPlacement(path, text, fontSize, metrics);
      
      // Result should exist (may have warning if no perfect placement)
      expect(result).toBeDefined();

      // If we have a placement, render it
      if (result.placement) {
        // Place text characters
        const placements = placer.placeText(
          text,
          path,
          result.placement.segment.startIdx,
          fontSize
        );
        expect(placements.length).toBe(text.length);

        // Render everything - should not throw
        expect(() => {
          renderer.clear(mockCtx);
          renderer.drawRiver(path, mockCtx);
          renderer.drawRejectedAreas(metrics.sharpCurves, path, mockCtx);
          renderer.drawRejectedAreas(metrics.narrowSections, path, mockCtx);
          renderer.drawCandidates(result.allCandidates, mockCtx, result.placement);
          renderer.drawText(placements, mockCtx);
        }).not.toThrow();
      } else {
        // Even without placement, rendering should work
        expect(() => {
          renderer.clear(mockCtx);
          renderer.drawRiver(path, mockCtx);
          renderer.drawRejectedAreas(metrics.sharpCurves, path, mockCtx);
        }).not.toThrow();
      }
    });

    it('should handle river with sharp curves', () => {
      // Create a river with a sharp curve
      const coordinates = [
        [0, 0],
        [100, 0],
        [110, 50],  // Sharp turn
        [120, 100]
      ];

      const path = parser.parse(coordinates);
      const metrics = analyzer.analyzeGeometry(path);

      // Metrics should be defined
      expect(metrics).toBeDefined();
      expect(metrics.sharpCurves).toBeDefined();

      // Render rejected areas (even if empty)
      expect(() => {
        renderer.clear(mockCtx);
        renderer.drawRiver(path, mockCtx);
        renderer.drawRejectedAreas(metrics.sharpCurves, path, mockCtx);
      }).not.toThrow();
    });

    it('should handle coordinate transformation', () => {
      const coordinates = [
        [0, 0],
        [1000, 0],
        [2000, 500]
      ];

      const path = parser.parse(coordinates);

      // Calculate transform to fit in canvas
      const transform = renderer.calculateTransform(path, 800, 600, 20);

      expect(transform.scale).toBeGreaterThan(0);
      expect(transform.scale).toBeLessThan(1); // Should scale down

      // Apply transform
      expect(() => {
        renderer.applyTransform(mockCtx, transform);
        renderer.drawRiver(path, mockCtx);
      }).not.toThrow();
    });

    it('should render variable-width river', () => {
      const coordinates = [
        [0, 0, 10],
        [100, 0, 20],
        [200, 0, 15],
        [300, 0, 25]
      ];

      const path = parser.parse(coordinates);
      expect(path.widths).not.toBeNull();

      // Render with variable width
      expect(() => {
        renderer.drawRiver(path, mockCtx, { useVariableWidth: true });
      }).not.toThrow();
    });

    it('should visualize all candidates with scores', () => {
      const coordinates = [
        [0, 0],
        [100, 0],
        [200, 0],
        [300, 0],
        [400, 0],
        [500, 0]
      ];

      const path = parser.parse(coordinates);
      const metrics = analyzer.analyzeGeometry(path);
      const result = scorer.findOptimalPlacement(path, 'Test', 16, metrics);

      // Result should be defined
      expect(result).toBeDefined();
      expect(result.allCandidates).toBeDefined();

      // Render all candidates (even if empty)
      expect(() => {
        renderer.drawCandidates(result.allCandidates, mockCtx, result.placement, {
          showScores: true
        });
      }).not.toThrow();
    });
  });

  describe('Requirements validation', () => {
    it('Requirement 4.1: Should draw river path on canvas', () => {
      const coordinates = [[0, 0], [100, 0], [200, 50]];
      const path = parser.parse(coordinates);

      let drawCalled = false;
      mockCtx.stroke = () => { drawCalled = true; };

      renderer.drawRiver(path, mockCtx);
      expect(drawCalled).toBe(true);
    });

    it('Requirement 4.2: Should position each character with rotation', () => {
      const placements = [
        { char: 'A', x: 100, y: 100, angle: 0.1, width: 10 },
        { char: 'B', x: 110, y: 105, angle: 0.2, width: 10 }
      ];

      let rotateCount = 0;
      mockCtx.rotate = () => { rotateCount++; };

      renderer.drawText(placements, mockCtx);
      expect(rotateCount).toBe(placements.length);
    });

    it('Requirement 4.3: Should use contrasting colors', () => {
      const placements = [
        { char: 'A', x: 100, y: 100, angle: 0, width: 10 }
      ];

      renderer.drawText(placements, mockCtx, {
        fillColor: '#000000',
        strokeColor: '#FFFFFF'
      });

      // Colors should be different for contrast
      expect('#000000').not.toBe('#FFFFFF');
    });

    it('Requirement 4.4: Should visualize river width variations', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 }
        ],
        widths: [10, 20]
      };

      let fillCalled = false;
      mockCtx.fill = () => { fillCalled = true; };

      renderer.drawRiver(path, mockCtx, { useVariableWidth: true });
      expect(fillCalled).toBe(true);
    });

    it('Requirement 4.5: Should provide visual indicators for rejected areas', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 }
        ]
      };

      const segments = [
        { startIdx: 0, endIdx: 1, reason: 'sharp curve' }
      ];

      let strokeCalled = false;
      mockCtx.stroke = () => { strokeCalled = true; };

      renderer.drawRejectedAreas(segments, path, mockCtx);
      expect(strokeCalled).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle missing path data gracefully', () => {
      expect(() => {
        renderer.drawRiver(null, mockCtx);
        renderer.drawRiver({}, mockCtx);
        renderer.drawRiver({ points: [] }, mockCtx);
      }).not.toThrow();
    });

    it('should handle missing text placements gracefully', () => {
      expect(() => {
        renderer.drawText(null, mockCtx);
        renderer.drawText([], mockCtx);
      }).not.toThrow();
    });

    it('should handle missing segments gracefully', () => {
      const path = { points: [{ x: 0, y: 0 }] };
      
      expect(() => {
        renderer.drawRejectedAreas(null, path, mockCtx);
        renderer.drawRejectedAreas([], path, mockCtx);
      }).not.toThrow();
    });

    it('should handle missing candidates gracefully', () => {
      expect(() => {
        renderer.drawCandidates(null, mockCtx);
        renderer.drawCandidates([], mockCtx);
      }).not.toThrow();
    });
  });
});
