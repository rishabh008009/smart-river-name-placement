/**
 * GeometryAnalyzer
 * Analyzes river shape characteristics to identify suitable text placement areas
 */

export class GeometryAnalyzer {
  /**
   * Calculate curvature at each point along the path
   * Uses three-point angle method with smoothing
   * @param {RiverPath} path
   * @returns {Array<number>} Array of curvature values (degrees per unit distance)
   */
  calculateCurvature(path) {
    const points = path.points;
    const n = points.length;
    
    // Need at least 3 points to calculate curvature
    if (n < 3) {
      return [];
    }
    
    // Calculate raw curvature values for each interior point
    const rawCurvatures = new Array(n).fill(0);
    
    for (let i = 1; i < n - 1; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      
      // Create two vectors
      const v1x = p1.x - p0.x;
      const v1y = p1.y - p0.y;
      const v2x = p2.x - p1.x;
      const v2y = p2.y - p1.y;
      
      // Calculate vector magnitudes
      const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
      const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);
      
      // Handle degenerate case (zero-length vectors)
      if (mag1 === 0 || mag2 === 0) {
        rawCurvatures[i] = 0;
        continue;
      }
      
      // Calculate dot product
      const dotProduct = v1x * v2x + v1y * v2y;
      
      // Calculate angle between vectors (in radians)
      const cosAngle = dotProduct / (mag1 * mag2);
      // Clamp to [-1, 1] to handle floating point errors
      const clampedCos = Math.max(-1, Math.min(1, cosAngle));
      const angleRad = Math.acos(clampedCos);
      
      // Convert to degrees
      const angleDeg = angleRad * (180 / Math.PI);
      
      // Calculate average distance
      const avgDistance = (mag1 + mag2) / 2;
      
      // Calculate curvature (degrees per unit distance)
      rawCurvatures[i] = avgDistance > 0 ? angleDeg / avgDistance : 0;
    }
    
    // Apply smoothing with moving average (window size 3)
    const smoothedCurvatures = new Array(n).fill(0);
    
    for (let i = 0; i < n; i++) {
      if (i === 0 || i === n - 1) {
        // Edge points: no curvature
        smoothedCurvatures[i] = 0;
      } else if (i === 1) {
        // Second point: average of itself and next
        smoothedCurvatures[i] = (rawCurvatures[i] + rawCurvatures[i + 1]) / 2;
      } else if (i === n - 2) {
        // Second-to-last point: average of previous and itself
        smoothedCurvatures[i] = (rawCurvatures[i - 1] + rawCurvatures[i]) / 2;
      } else {
        // Interior points: moving average of 3 points
        smoothedCurvatures[i] = (rawCurvatures[i - 1] + rawCurvatures[i] + rawCurvatures[i + 1]) / 3;
      }
    }
    
    return smoothedCurvatures;
  }

  /**
   * Identify segments with excessive curvature
   * @param {RiverPath} path
   * @param {number} threshold - Default 30 degrees per unit
   * @returns {Array<Segment>}
   */
  findSharpCurves(path, threshold = 30) {
    const curvatures = this.calculateCurvature(path);
    const points = path.points;
    const segments = [];
    
    if (points.length < 3) {
      return segments;
    }
    
    let inSharpCurve = false;
    let startIdx = -1;
    
    for (let i = 0; i < curvatures.length; i++) {
      if (curvatures[i] > threshold) {
        if (!inSharpCurve) {
          // Start of a new sharp curve segment
          inSharpCurve = true;
          startIdx = i;
        }
      } else {
        if (inSharpCurve) {
          // End of sharp curve segment
          const endIdx = i - 1;
          const segmentLength = this._calculateSegmentLength(path, startIdx, endIdx);
          segments.push({
            startIdx,
            endIdx,
            length: segmentLength,
            reason: 'sharp curve'
          });
          inSharpCurve = false;
        }
      }
    }
    
    // Handle case where sharp curve extends to end of path
    if (inSharpCurve) {
      const endIdx = curvatures.length - 1;
      const segmentLength = this._calculateSegmentLength(path, startIdx, endIdx);
      segments.push({
        startIdx,
        endIdx,
        length: segmentLength,
        reason: 'sharp curve'
      });
    }
    
    return segments;
  }

  /**
   * Find narrow sections below width threshold
   * @param {RiverPath} path
   * @param {number} minWidth
   * @returns {Array<Segment>}
   */
  findNarrowSections(path, minWidth) {
    const segments = [];
    
    // If no width data, return empty array
    if (!path.widths || path.widths.length === 0) {
      return segments;
    }
    
    const widths = path.widths;
    let inNarrowSection = false;
    let startIdx = -1;
    
    for (let i = 0; i < widths.length; i++) {
      if (widths[i] < minWidth) {
        if (!inNarrowSection) {
          // Start of a new narrow section
          inNarrowSection = true;
          startIdx = i;
        }
      } else {
        if (inNarrowSection) {
          // End of narrow section
          const endIdx = i - 1;
          const segmentLength = this._calculateSegmentLength(path, startIdx, endIdx);
          segments.push({
            startIdx,
            endIdx,
            length: segmentLength,
            reason: 'narrow section'
          });
          inNarrowSection = false;
        }
      }
    }
    
    // Handle case where narrow section extends to end of path
    if (inNarrowSection) {
      const endIdx = widths.length - 1;
      const segmentLength = this._calculateSegmentLength(path, startIdx, endIdx);
      segments.push({
        startIdx,
        endIdx,
        length: segmentLength,
        reason: 'narrow section'
      });
    }
    
    return segments;
  }

  /**
   * Identify edge sections (first/last 10% of path)
   * @param {RiverPath} path
   * @returns {{start: Segment, end: Segment}}
   */
  getEdgeSections(path) {
    const points = path.points;
    const totalLength = path.length;
    const edgeThreshold = totalLength * 0.1; // 10% of path length
    
    // Find the index where we've traveled 10% of the path from the start
    let accumulatedLength = 0;
    let startEndIdx = 0;
    
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const segmentLength = Math.sqrt(
        Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
      );
      accumulatedLength += segmentLength;
      
      if (accumulatedLength >= edgeThreshold) {
        startEndIdx = i + 1; // Include the point that crosses the threshold
        break;
      }
    }
    
    // If we never reached the threshold, use the last point
    if (startEndIdx === 0 && points.length > 1) {
      startEndIdx = points.length - 1;
    }
    
    // Find the index where we have 10% of the path remaining from the end
    accumulatedLength = 0;
    let endStartIdx = points.length - 1;
    
    for (let i = points.length - 1; i > 0; i--) {
      const p1 = points[i];
      const p2 = points[i - 1];
      const segmentLength = Math.sqrt(
        Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
      );
      accumulatedLength += segmentLength;
      
      if (accumulatedLength >= edgeThreshold) {
        endStartIdx = i - 1; // Include the point that crosses the threshold
        break;
      }
    }
    
    // If we never reached the threshold, use the first point
    if (endStartIdx === points.length - 1 && points.length > 1) {
      endStartIdx = 0;
    }
    
    const startSegmentLength = this._calculateSegmentLength(path, 0, startEndIdx);
    const endSegmentLength = this._calculateSegmentLength(path, endStartIdx, points.length - 1);
    
    return {
      start: {
        startIdx: 0,
        endIdx: startEndIdx,
        length: startSegmentLength,
        reason: 'edge section'
      },
      end: {
        startIdx: endStartIdx,
        endIdx: points.length - 1,
        length: endSegmentLength,
        reason: 'edge section'
      }
    };
  }

  /**
   * Calculate overall geometry metrics
   * @param {RiverPath} path
   * @returns {GeometryMetrics}
   */
  analyzeGeometry(path) {
    // Calculate curvature values for all points
    const curvatures = this.calculateCurvature(path);
    
    // Find sharp curves (default threshold: 30 degrees per unit)
    const sharpCurves = this.findSharpCurves(path, 30);
    
    // Find narrow sections if width data exists
    // Use a reasonable minimum width threshold (e.g., 10 units)
    const narrowSections = path.widths && path.widths.length > 0 
      ? this.findNarrowSections(path, 10)
      : [];
    
    // Get edge sections (first/last 10% of path)
    const edgeSections = this.getEdgeSections(path);
    
    // Calculate average curvature (excluding edge points which are always 0)
    let avgCurvature = 0;
    if (curvatures.length > 2) {
      // Sum curvatures excluding first and last points
      const interiorCurvatures = curvatures.slice(1, -1);
      const sum = interiorCurvatures.reduce((acc, val) => acc + val, 0);
      avgCurvature = sum / interiorCurvatures.length;
    }
    
    // Calculate max curvature
    const maxCurvature = curvatures.length > 0 
      ? Math.max(...curvatures)
      : 0;
    
    return {
      curvatures,
      sharpCurves,
      narrowSections,
      edgeSections,
      avgCurvature,
      maxCurvature
    };
  }

  /**
   * Helper method to calculate the length of a segment between two indices
   * @private
   * @param {RiverPath} path
   * @param {number} startIdx
   * @param {number} endIdx
   * @returns {number}
   */
  _calculateSegmentLength(path, startIdx, endIdx) {
    const points = path.points;
    let length = 0;
    
    for (let i = startIdx; i < endIdx; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const segmentLength = Math.sqrt(
        Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
      );
      length += segmentLength;
    }
    
    return length;
  }
}
