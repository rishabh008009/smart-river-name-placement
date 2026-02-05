/**
 * WKTParser
 * Parses Well-Known Text (WKT) format for river polygons
 */

export class WKTParser {
  /**
   * Parse WKT POLYGON string into coordinate array
   * @param {string} wktString - WKT format string (e.g., "POLYGON((x1 y1, x2 y2, ...))")
   * @returns {Array<Array<number>>} Array of [x, y] coordinates
   */
  parsePolygon(wktString) {
    if (!wktString || typeof wktString !== 'string') {
      throw new Error('Invalid WKT string');
    }

    // Remove whitespace and normalize
    const normalized = wktString.trim();

    // Check if it's a POLYGON
    if (!normalized.startsWith('POLYGON')) {
      throw new Error('Only POLYGON geometry is supported');
    }

    // Extract coordinates between the outermost parentheses
    // POLYGON((x1 y1, x2 y2, ...))
    const match = normalized.match(/POLYGON\s*\(\s*\((.*?)\)\s*\)/i);
    
    if (!match || !match[1]) {
      throw new Error('Invalid POLYGON format');
    }

    const coordString = match[1];
    
    // Split by comma to get individual coordinate pairs
    const pairs = coordString.split(',');
    
    const coordinates = [];
    
    for (const pair of pairs) {
      // Split by whitespace to get x and y
      const parts = pair.trim().split(/\s+/);
      
      if (parts.length >= 2) {
        const x = parseFloat(parts[0]);
        const y = parseFloat(parts[1]);
        
        if (!isNaN(x) && !isNaN(y)) {
          coordinates.push([x, y]);
        }
      }
    }

    if (coordinates.length < 3) {
      throw new Error('POLYGON must have at least 3 coordinates');
    }

    return coordinates;
  }

  /**
   * Extract centerline from polygon boundary
   * Uses a simplified approach: finds the medial axis by sampling points
   * @param {Array<Array<number>>} polygonCoords - Polygon boundary coordinates
   * @returns {Array<Array<number>>} Centerline coordinates with estimated widths
   */
  extractCenterline(polygonCoords) {
    if (!polygonCoords || polygonCoords.length < 3) {
      throw new Error('Invalid polygon coordinates');
    }

    // For a river polygon, we'll use a simplified approach:
    // 1. Find the longest dimension (length of river)
    // 2. Sample points along that dimension
    // 3. For each sample, find the center between opposite banks

    // Calculate bounding box
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    for (const [x, y] of polygonCoords) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }

    const width = maxX - minX;
    const height = maxY - minY;

    // Determine primary direction (horizontal or vertical)
    const isHorizontal = width > height;

    // Sample along the primary direction
    const numSamples = Math.min(100, Math.floor(polygonCoords.length / 2));
    const centerline = [];

    if (isHorizontal) {
      // Sample along X axis
      for (let i = 0; i < numSamples; i++) {
        const x = minX + (width * i) / (numSamples - 1);
        const intersections = this._findIntersections(polygonCoords, x, 'vertical');
        
        if (intersections.length >= 2) {
          // Find center between top and bottom
          const yValues = intersections.map(p => p.y).sort((a, b) => a - b);
          const centerY = (yValues[0] + yValues[yValues.length - 1]) / 2;
          const riverWidth = yValues[yValues.length - 1] - yValues[0];
          
          centerline.push([x, centerY, riverWidth]);
        }
      }
    } else {
      // Sample along Y axis
      for (let i = 0; i < numSamples; i++) {
        const y = minY + (height * i) / (numSamples - 1);
        const intersections = this._findIntersections(polygonCoords, y, 'horizontal');
        
        if (intersections.length >= 2) {
          // Find center between left and right
          const xValues = intersections.map(p => p.x).sort((a, b) => a - b);
          const centerX = (xValues[0] + xValues[xValues.length - 1]) / 2;
          const riverWidth = xValues[xValues.length - 1] - xValues[0];
          
          centerline.push([centerX, y, riverWidth]);
        }
      }
    }

    // Smooth the centerline
    return this._smoothCenterline(centerline);
  }

  /**
   * Find intersections of a line with the polygon
   * @private
   */
  _findIntersections(polygonCoords, value, direction) {
    const intersections = [];
    
    for (let i = 0; i < polygonCoords.length; i++) {
      const p1 = polygonCoords[i];
      const p2 = polygonCoords[(i + 1) % polygonCoords.length];
      
      if (direction === 'vertical') {
        // Vertical line at x = value
        if ((p1[0] <= value && p2[0] >= value) || (p1[0] >= value && p2[0] <= value)) {
          if (p2[0] !== p1[0]) {
            const t = (value - p1[0]) / (p2[0] - p1[0]);
            const y = p1[1] + t * (p2[1] - p1[1]);
            intersections.push({ x: value, y });
          }
        }
      } else {
        // Horizontal line at y = value
        if ((p1[1] <= value && p2[1] >= value) || (p1[1] >= value && p2[1] <= value)) {
          if (p2[1] !== p1[1]) {
            const t = (value - p1[1]) / (p2[1] - p1[1]);
            const x = p1[0] + t * (p2[0] - p1[0]);
            intersections.push({ x, y: value });
          }
        }
      }
    }
    
    return intersections;
  }

  /**
   * Smooth centerline using moving average
   * @private
   */
  _smoothCenterline(centerline) {
    if (centerline.length < 3) {
      return centerline;
    }

    const smoothed = [];
    const windowSize = 3;

    for (let i = 0; i < centerline.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(centerline.length, i + Math.ceil(windowSize / 2));
      
      let sumX = 0, sumY = 0, sumW = 0;
      let count = 0;
      
      for (let j = start; j < end; j++) {
        sumX += centerline[j][0];
        sumY += centerline[j][1];
        sumW += centerline[j][2] || 0;
        count++;
      }
      
      smoothed.push([
        sumX / count,
        sumY / count,
        sumW / count
      ]);
    }

    return smoothed;
  }
}
