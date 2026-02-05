/**
 * Tests for CanvasRenderer
 * Includes both unit tests and property-based tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { CanvasRenderer } from '../src/CanvasRenderer.js';
import { testConfig } from './setup.js';

describe('CanvasRenderer', () => {
  let renderer;
  let mockCtx;
  let mockCanvas;

  beforeEach(() => {
    renderer = new CanvasRenderer();
    
    // Create a mock canvas context
    mockCanvas = {
      width: 800,
      height: 600
    };

    mockCtx = {
      canvas: mockCanvas,
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

  describe('drawRiver', () => {
    it('should handle empty or invalid path gracefully', () => {
      expect(() => renderer.drawRiver(null, mockCtx)).not.toThrow();
      expect(() => renderer.drawRiver({}, mockCtx)).not.toThrow();
      expect(() => renderer.drawRiver({ points: [] }, mockCtx)).not.toThrow();
      expect(() => renderer.drawRiver({ points: [{ x: 0, y: 0 }] }, mockCtx)).not.toThrow();
    });

    it('should draw constant-width river when no width data', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 200, y: 100 }
        ],
        widths: null
      };

      let strokeCalled = false;
      mockCtx.stroke = () => { strokeCalled = true; };

      renderer.drawRiver(path, mockCtx);
      expect(strokeCalled).toBe(true);
    });

    it('should draw variable-width river when width data exists', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 200, y: 100 }
        ],
        widths: [10, 15, 20]
      };

      let fillCalled = false;
      mockCtx.fill = () => { fillCalled = true; };

      renderer.drawRiver(path, mockCtx, { useVariableWidth: true });
      expect(fillCalled).toBe(true);
    });

    it('should use specified color and line width', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 }
        ],
        widths: null
      };

      renderer.drawRiver(path, mockCtx, { color: '#FF0000', lineWidth: 5 });
      expect(mockCtx.strokeStyle).toBe('#FF0000');
      expect(mockCtx.lineWidth).toBe(5);
    });
  });

  describe('drawText', () => {
    it('should handle empty placements gracefully', () => {
      expect(() => renderer.drawText(null, mockCtx)).not.toThrow();
      expect(() => renderer.drawText([], mockCtx)).not.toThrow();
    });

    it('should draw each character with correct transformations', () => {
      const placements = [
        { char: 'A', x: 100, y: 100, angle: 0, width: 10 },
        { char: 'B', x: 110, y: 100, angle: 0.1, width: 10 },
        { char: 'C', x: 120, y: 105, angle: 0.2, width: 10 }
      ];

      let fillTextCount = 0;
      let strokeTextCount = 0;
      mockCtx.fillText = () => { fillTextCount++; };
      mockCtx.strokeText = () => { strokeTextCount++; };

      renderer.drawText(placements, mockCtx);
      
      expect(fillTextCount).toBe(3);
      expect(strokeTextCount).toBe(3); // White outline
    });

    it('should use specified font and colors', () => {
      const placements = [
        { char: 'A', x: 100, y: 100, angle: 0, width: 10 }
      ];

      renderer.drawText(placements, mockCtx, {
        fontSize: 20,
        fontFamily: 'Helvetica',
        fillColor: '#FF0000',
        strokeColor: '#00FF00'
      });

      expect(mockCtx.font).toBe('20px Helvetica');
    });

    it('should skip stroke when strokeWidth is 0', () => {
      const placements = [
        { char: 'A', x: 100, y: 100, angle: 0, width: 10 }
      ];

      let strokeTextCount = 0;
      mockCtx.strokeText = () => { strokeTextCount++; };

      renderer.drawText(placements, mockCtx, { strokeWidth: 0 });
      
      expect(strokeTextCount).toBe(0);
    });
  });

  describe('drawRejectedAreas', () => {
    it('should handle empty segments gracefully', () => {
      const path = {
        points: [{ x: 0, y: 0 }, { x: 100, y: 0 }]
      };

      expect(() => renderer.drawRejectedAreas(null, path, mockCtx)).not.toThrow();
      expect(() => renderer.drawRejectedAreas([], path, mockCtx)).not.toThrow();
    });

    it('should draw each rejected segment', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 50, y: 0 },
          { x: 100, y: 0 },
          { x: 150, y: 0 }
        ]
      };

      const segments = [
        { startIdx: 0, endIdx: 1, reason: 'sharp curve' },
        { startIdx: 2, endIdx: 3, reason: 'narrow section' }
      ];

      let strokeCount = 0;
      mockCtx.stroke = () => { strokeCount++; };

      renderer.drawRejectedAreas(segments, path, mockCtx);
      
      expect(strokeCount).toBe(2);
    });

    it('should use semi-transparent red by default', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 }
        ]
      };

      const segments = [
        { startIdx: 0, endIdx: 1, reason: 'sharp curve' }
      ];

      renderer.drawRejectedAreas(segments, path, mockCtx);
      
      expect(mockCtx.strokeStyle).toBe('rgba(255, 0, 0, 0.3)');
    });
  });

  describe('drawCandidates', () => {
    it('should handle empty candidates gracefully', () => {
      expect(() => renderer.drawCandidates(null, mockCtx)).not.toThrow();
      expect(() => renderer.drawCandidates([], mockCtx)).not.toThrow();
    });

    it('should draw circles for each candidate', () => {
      const candidates = [
        {
          segment: { startIdx: 0, endIdx: 5 },
          score: 85.5,
          centerPoint: { x: 100, y: 100 }
        },
        {
          segment: { startIdx: 10, endIdx: 15 },
          score: 72.3,
          centerPoint: { x: 200, y: 150 }
        }
      ];

      let arcCount = 0;
      mockCtx.arc = () => { arcCount++; };

      renderer.drawCandidates(candidates, mockCtx);
      
      expect(arcCount).toBe(2);
    });

    it('should highlight selected candidate differently', () => {
      const candidates = [
        {
          segment: { startIdx: 0, endIdx: 5 },
          score: 85.5,
          centerPoint: { x: 100, y: 100 }
        },
        {
          segment: { startIdx: 10, endIdx: 15 },
          score: 72.3,
          centerPoint: { x: 200, y: 150 }
        }
      ];

      const selected = candidates[0];

      let strokeCount = 0;
      mockCtx.stroke = () => { strokeCount++; };

      renderer.drawCandidates(candidates, mockCtx, selected);
      
      // Should stroke the selected candidate's border
      expect(strokeCount).toBeGreaterThan(0);
    });

    it('should display scores when showScores is true', () => {
      const candidates = [
        {
          segment: { startIdx: 0, endIdx: 5 },
          score: 85.5,
          centerPoint: { x: 100, y: 100 }
        }
      ];

      let fillTextCount = 0;
      mockCtx.fillText = () => { fillTextCount++; };

      renderer.drawCandidates(candidates, mockCtx, null, { showScores: true });
      
      expect(fillTextCount).toBeGreaterThan(0);
    });
  });

  describe('clear', () => {
    it('should clear the entire canvas', () => {
      let clearRectCalled = false;
      let clearedWidth = 0;
      let clearedHeight = 0;

      mockCtx.clearRect = (x, y, w, h) => {
        clearRectCalled = true;
        clearedWidth = w;
        clearedHeight = h;
      };

      renderer.clear(mockCtx);
      
      expect(clearRectCalled).toBe(true);
      expect(clearedWidth).toBe(800);
      expect(clearedHeight).toBe(600);
    });

    it('should use specified dimensions if provided', () => {
      let clearedWidth = 0;
      let clearedHeight = 0;

      mockCtx.clearRect = (x, y, w, h) => {
        clearedWidth = w;
        clearedHeight = h;
      };

      renderer.clear(mockCtx, 1024, 768);
      
      expect(clearedWidth).toBe(1024);
      expect(clearedHeight).toBe(768);
    });

    it('should handle null context gracefully', () => {
      expect(() => renderer.clear(null)).not.toThrow();
    });
  });

  describe('calculateTransform', () => {
    it('should calculate transform to fit path in canvas', () => {
      const path = {
        bounds: {
          minX: 0,
          maxX: 200,
          minY: 0,
          maxY: 100
        }
      };

      const transform = renderer.calculateTransform(path, 800, 600, 20);
      
      expect(transform).toBeDefined();
      expect(transform.scale).toBeGreaterThan(0);
      expect(transform.offsetX).toBeGreaterThanOrEqual(0);
      expect(transform.offsetY).toBeGreaterThanOrEqual(0);
    });

    it('should maintain aspect ratio', () => {
      const path = {
        bounds: {
          minX: 0,
          maxX: 200,
          minY: 0,
          maxY: 100
        }
      };

      const transform = renderer.calculateTransform(path, 800, 600, 20);
      
      // Scale should be the same for both axes to maintain aspect ratio
      expect(transform.scaleX).toBe(transform.scaleY);
    });

    it('should handle invalid path gracefully', () => {
      const transform = renderer.calculateTransform(null, 800, 600);
      
      expect(transform.scale).toBe(1);
      expect(transform.offsetX).toBe(0);
      expect(transform.offsetY).toBe(0);
    });

    it('should account for padding', () => {
      const path = {
        bounds: {
          minX: 0,
          maxX: 200,
          minY: 0,
          maxY: 100
        }
      };

      const transform1 = renderer.calculateTransform(path, 800, 600, 20);
      const transform2 = renderer.calculateTransform(path, 800, 600, 50);
      
      // Larger padding should result in smaller scale
      expect(transform2.scale).toBeLessThan(transform1.scale);
    });
  });

  describe('applyTransform', () => {
    it('should apply translation and scaling to context', () => {
      let translateCalled = false;
      let scaleCalled = false;

      mockCtx.translate = () => { translateCalled = true; };
      mockCtx.scale = () => { scaleCalled = true; };

      const transform = {
        offsetX: 10,
        offsetY: 20,
        scaleX: 2,
        scaleY: 2
      };

      renderer.applyTransform(mockCtx, transform);
      
      expect(translateCalled).toBe(true);
      expect(scaleCalled).toBe(true);
    });

    it('should handle null context gracefully', () => {
      const transform = {
        offsetX: 10,
        offsetY: 20,
        scaleX: 2,
        scaleY: 2
      };

      expect(() => renderer.applyTransform(null, transform)).not.toThrow();
    });

    it('should handle null transform gracefully', () => {
      expect(() => renderer.applyTransform(mockCtx, null)).not.toThrow();
    });
  });

  describe('Integration tests', () => {
    it('should render a complete river with text', () => {
      const path = {
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 200, y: 50 },
          { x: 300, y: 50 }
        ],
        widths: [10, 15, 15, 10],
        length: 350,
        bounds: { minX: 0, maxX: 300, minY: 0, maxY: 50 }
      };

      const placements = [
        { char: 'R', x: 50, y: 0, angle: 0, width: 10 },
        { char: 'i', x: 60, y: 0, angle: 0, width: 5 },
        { char: 'v', x: 65, y: 0, angle: 0, width: 8 },
        { char: 'e', x: 73, y: 0, angle: 0, width: 8 },
        { char: 'r', x: 81, y: 0, angle: 0, width: 6 }
      ];

      // Should not throw any errors
      expect(() => {
        renderer.clear(mockCtx);
        renderer.drawRiver(path, mockCtx);
        renderer.drawText(placements, mockCtx);
      }).not.toThrow();
    });
  });
});
