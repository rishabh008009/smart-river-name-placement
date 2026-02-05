/**
 * TextPlacer
 * Calculates exact character positions and rotations along the selected path segment
 */

export class TextPlacer {
  constructor() {
    // Create a temporary canvas for measuring text
    this.measureCanvas = null;
    this.measureCtx = null;
  }

  /**
   * Get or create canvas context for text measurement
   * @param {number} fontSize
   * @returns {CanvasRenderingContext2D}
   */
  getMeasureContext(fontSize) {
    // Check if we're in a browser environment
    if (typeof document !== 'undefined' && !this.measureCanvas) {
      try {
        this.measureCanvas = document.createElement('canvas');
        this.measureCtx = this.measureCanvas.getContext('2d');
      } catch (e) {
        // Canvas creation failed, fall back to mock
        this.measureCtx = null;
      }
    }
    
    // If we have a real context, configure it
    if (this.measureCtx) {
      this.measureCtx.font = `${fontSize}px Arial`;
      return this.measureCtx;
    }
    
    // For testing environment or if canvas failed, return a mock context
    return {
      font: `${fontSize}px Arial`,
      measureText: (char) => ({ width: fontSize * 0.6 }) // Approximate width
    };
  }

  /**
   * Measure total text length in pixels
   * @param {string} text
   * @param {HTMLCanvasElement} canvas
   * @returns {number}
   */
  measureTextLength(text, canvas) {
    if (!text || text.length === 0) {
      return 0;
    }

    const fontSize = 16; // Default font size
    let ctx;
    
    if (canvas) {
      ctx = canvas.getContext('2d');
      ctx.font = `${fontSize}px Arial`;
    } else {
      ctx = this.getMeasureContext(fontSize);
    }

    let totalWidth = 0;
    for (let i = 0; i < text.length; i++) {
      const metrics = ctx.measureText(text[i]);
      totalWidth += metrics.width;
    }

    return totalWidth;
  }

  /**
   * Calculate position and rotation for each character
   * @param {string} text
   * @param {RiverPath} path
   * @param {number} startIdx
   * @param {number} fontSize
   * @returns {Array<CharacterPlacement>}
   */
  placeText(text, path, startIdx, fontSize) {
    if (!text || text.length === 0) {
      return [];
    }

    if (!path || !path.points || path.points.length === 0) {
      throw new Error('Invalid path: path must have points');
    }

    if (startIdx < 0 || startIdx >= path.points.length) {
      throw new Error(`Invalid startIdx: ${startIdx} (path has ${path.points.length} points)`);
    }

    const ctx = this.getMeasureContext(fontSize);
    const placements = [];
    let currentDistance = 0;

    // Place each character along the path
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      // Measure character width
      const metrics = ctx.measureText(char);
      const charWidth = metrics.width;

      // Calculate position at current distance (center of character)
      const position = this.interpolatePosition(path, startIdx, currentDistance + charWidth / 2);

      // Store character placement
      placements.push({
        char,
        x: position.x,
        y: position.y,
        angle: position.angle,
        width: charWidth
      });

      // Move to next character position
      currentDistance += charWidth;
    }

    return placements;
  }

  /**
   * Interpolate position along path at specific distance
   * @param {RiverPath} path
   * @param {number} startIdx
   * @param {number} distance
   * @returns {{x: number, y: number, angle: number}}
   */
  interpolatePosition(path, startIdx, distance) {
    if (!path || !path.points || path.points.length === 0) {
      throw new Error('Invalid path: path must have points');
    }

    if (startIdx < 0 || startIdx >= path.points.length) {
      throw new Error(`Invalid startIdx: ${startIdx} (path has ${path.points.length} points)`);
    }

    const points = path.points;
    let remainingDistance = distance;
    let currentIdx = startIdx;

    // Handle edge case: distance is 0
    if (distance === 0) {
      // Return position at startIdx with angle to next point
      if (currentIdx < points.length - 1) {
        const dx = points[currentIdx + 1].x - points[currentIdx].x;
        const dy = points[currentIdx + 1].y - points[currentIdx].y;
        const angle = Math.atan2(dy, dx);
        return {
          x: points[currentIdx].x,
          y: points[currentIdx].y,
          angle
        };
      } else {
        // At last point, use angle from previous segment
        const dx = points[currentIdx].x - points[currentIdx - 1].x;
        const dy = points[currentIdx].y - points[currentIdx - 1].y;
        const angle = Math.atan2(dy, dx);
        return {
          x: points[currentIdx].x,
          y: points[currentIdx].y,
          angle
        };
      }
    }

    // Walk along the path until we've covered the required distance
    while (currentIdx < points.length - 1) {
      const p1 = points[currentIdx];
      const p2 = points[currentIdx + 1];

      // Calculate segment length
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const segmentLength = Math.sqrt(dx * dx + dy * dy);

      // Check if the target distance is within this segment
      if (remainingDistance <= segmentLength) {
        // Interpolate within this segment
        const t = remainingDistance / segmentLength;
        const x = p1.x + dx * t;
        const y = p1.y + dy * t;
        const angle = Math.atan2(dy, dx);

        return { x, y, angle };
      }

      // Move to next segment
      remainingDistance -= segmentLength;
      currentIdx++;
    }

    // If we've gone past the end of the path, return the last point
    const lastIdx = points.length - 1;
    const dx = points[lastIdx].x - points[lastIdx - 1].x;
    const dy = points[lastIdx].y - points[lastIdx - 1].y;
    const angle = Math.atan2(dy, dx);

    return {
      x: points[lastIdx].x,
      y: points[lastIdx].y,
      angle
    };
  }
}
