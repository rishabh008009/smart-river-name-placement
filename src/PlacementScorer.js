/**
 * PlacementScorer
 * Evaluates potential text placement positions and assigns scores
 */

export class PlacementScorer {
  constructor() {
    // Create a canvas for text measurement
    this._measurementCanvas = null;
    this._measurementContext = null;
  }

  /**
   * Measure the actual length of text in pixels
   * @param {string} text - The text to measure
   * @param {number} fontSize - Font size in pixels
   * @param {string} fontFamily - Font family (default: 'Arial')
   * @returns {number} - Text width in pixels
   */
  measureTextLength(text, fontSize = 16, fontFamily = 'Arial') {
    // Create canvas context if not already created
    if (!this._measurementContext) {
      if (typeof document !== 'undefined') {
        this._measurementCanvas = document.createElement('canvas');
        this._measurementContext = this._measurementCanvas.getContext('2d');
      }
      
      // If still null (jsdom or other test environment), use fallback
      if (!this._measurementContext) {
        // Fallback for testing environments without canvas support
        // Approximate: average character width is ~0.6 * fontSize
        return text.length * fontSize * 0.6;
      }
    }

    // Set font for measurement
    this._measurementContext.font = `${fontSize}px ${fontFamily}`;
    
    // Measure text
    const metrics = this._measurementContext.measureText(text);
    return metrics.width;
  }
  /**
   * Score a specific segment for text placement
   * @param {RiverPath} path
   * @param {number} startIdx - Starting point index
   * @param {number} endIdx - Ending point index
   * @param {GeometryMetrics} metrics
   * @returns {{score: number, scores: {curvature: number, width: number, position: number, straightness: number}}}
   */
  scoreSegment(path, startIdx, endIdx, metrics) {
    // Calculate individual score components
    const curvatureScore = this._calculateCurvatureScore(path, startIdx, endIdx, metrics);
    const widthScore = this._calculateWidthScore(path, startIdx, endIdx);
    const positionScore = this._calculatePositionScore(path, startIdx, endIdx);
    const straightnessScore = this._calculateStraightnessScore(path, startIdx, endIdx);
    
    // Apply weights: curvature 40%, width 20%, position 20%, straightness 20%
    const overallScore = 
      curvatureScore * 0.4 +
      widthScore * 0.2 +
      positionScore * 0.2 +
      straightnessScore * 0.2;
    
    return {
      score: overallScore,
      scores: {
        curvature: curvatureScore,
        width: widthScore,
        position: positionScore,
        straightness: straightnessScore
      }
    };
  }

  /**
   * Calculate curvature score (0-100, higher is better)
   * Lower curvature = higher score
   * @private
   */
  _calculateCurvatureScore(path, startIdx, endIdx, metrics) {
    const curvatures = metrics.curvatures;
    
    // Calculate average curvature for this segment
    let sum = 0;
    let count = 0;
    
    for (let i = startIdx; i <= endIdx; i++) {
      if (i < curvatures.length) {
        sum += curvatures[i];
        count++;
      }
    }
    
    const avgCurvature = count > 0 ? sum / count : 0;
    
    // Score = max(0, 100 - avgCurvature * 3)
    // This penalizes curved sections heavily
    const score = Math.max(0, 100 - avgCurvature * 3);
    
    return score;
  }

  /**
   * Calculate width score (0-100, higher is better)
   * Wider sections = higher score
   * @private
   */
  _calculateWidthScore(path, startIdx, endIdx) {
    // If no width data, return neutral score
    if (!path.widths || path.widths.length === 0) {
      return 50; // Neutral score when width data is unavailable
    }
    
    // Calculate average width for this segment
    let sum = 0;
    let count = 0;
    
    for (let i = startIdx; i <= endIdx; i++) {
      if (i < path.widths.length && path.widths[i] !== null) {
        sum += path.widths[i];
        count++;
      }
    }
    
    const avgWidth = count > 0 ? sum / count : 0;
    
    // Ideal width (this is a reasonable assumption for text placement)
    const idealWidth = 20;
    
    // Score = min(100, (avgWidth / idealWidth) * 100)
    // This rewards wider sections up to the ideal width
    const score = Math.min(100, (avgWidth / idealWidth) * 100);
    
    return score;
  }

  /**
   * Calculate position score (0-100, higher is better)
   * Center positions = higher score
   * @private
   */
  _calculatePositionScore(path, startIdx, endIdx) {
    const points = path.points;
    const totalLength = path.length;
    
    // Calculate the distance from start to the center of this segment
    let distanceToSegmentStart = 0;
    for (let i = 0; i < startIdx; i++) {
      if (i < points.length - 1) {
        const p1 = points[i];
        const p2 = points[i + 1];
        distanceToSegmentStart += Math.sqrt(
          Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
        );
      }
    }
    
    // Calculate segment length
    let segmentLength = 0;
    for (let i = startIdx; i < endIdx; i++) {
      if (i < points.length - 1) {
        const p1 = points[i];
        const p2 = points[i + 1];
        segmentLength += Math.sqrt(
          Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
        );
      }
    }
    
    // Center of segment
    const segmentCenter = distanceToSegmentStart + segmentLength / 2;
    
    // Distance from path center
    const pathCenter = totalLength / 2;
    const centerDistance = Math.abs(segmentCenter - pathCenter);
    
    // Maximum possible distance from center
    const maxDistance = totalLength / 2;
    
    // Score = 100 * (1 - centerDistance / maxDistance)
    // This prefers positions closer to the center
    const score = maxDistance > 0 
      ? 100 * (1 - centerDistance / maxDistance)
      : 100;
    
    return score;
  }

  /**
   * Calculate straightness score (0-100, higher is better)
   * Consistent direction = higher score
   * @private
   */
  _calculateStraightnessScore(path, startIdx, endIdx) {
    const points = path.points;
    
    // Need at least 2 segments (3 points) to calculate direction variance
    if (endIdx - startIdx < 2) {
      return 100; // Very short segment, assume straight
    }
    
    // Calculate direction angles for each segment
    const angles = [];
    
    for (let i = startIdx; i < endIdx; i++) {
      if (i < points.length - 1) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        angles.push(angle);
      }
    }
    
    if (angles.length === 0) {
      return 100;
    }
    
    // Calculate variance in direction
    // First, normalize angles to handle wraparound (-π to π)
    const avgAngle = angles.reduce((sum, a) => sum + a, 0) / angles.length;
    
    // Calculate variance
    let varianceSum = 0;
    for (const angle of angles) {
      // Calculate angular difference (handling wraparound)
      let diff = angle - avgAngle;
      // Normalize to [-π, π]
      while (diff > Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;
      
      varianceSum += diff * diff;
    }
    
    const variance = varianceSum / angles.length;
    
    // Convert variance (in radians²) to degrees for scoring
    const varianceDegrees = Math.sqrt(variance) * (180 / Math.PI);
    
    // Score = max(0, 100 - varianceDegrees * 5)
    // This rewards consistent direction
    const score = Math.max(0, 100 - varianceDegrees * 5);
    
    return score;
  }

  /**
   * Find all candidate positions for text of given length
   * @param {RiverPath} path
   * @param {number} textLength
   * @param {GeometryMetrics} metrics
   * @returns {Array<Candidate>}
   */
  findCandidates(path, textLength, metrics) {
    const points = path.points;
    const candidates = [];
    
    // Build a set of rejected point indices for quick lookup
    const rejectedIndices = new Set();
    
    // Add sharp curve indices to rejected set
    for (const segment of metrics.sharpCurves) {
      for (let i = segment.startIdx; i <= segment.endIdx; i++) {
        rejectedIndices.add(i);
      }
    }
    
    // Add narrow section indices to rejected set
    for (const segment of metrics.narrowSections) {
      for (let i = segment.startIdx; i <= segment.endIdx; i++) {
        rejectedIndices.add(i);
      }
    }
    
    // Add edge section indices to rejected set
    const edgeSections = metrics.edgeSections;
    for (let i = edgeSections.start.startIdx; i <= edgeSections.start.endIdx; i++) {
      rejectedIndices.add(i);
    }
    for (let i = edgeSections.end.startIdx; i <= edgeSections.end.endIdx; i++) {
      rejectedIndices.add(i);
    }
    
    // Generate all possible candidate segments
    // A candidate segment must:
    // 1. Be long enough to fit the text
    // 2. Not contain any rejected indices
    
    for (let startIdx = 0; startIdx < points.length - 1; startIdx++) {
      // Skip if start point is rejected
      if (rejectedIndices.has(startIdx)) {
        continue;
      }
      
      // Try to extend the segment and create candidates of various lengths
      let segmentLength = 0;
      
      for (let endIdx = startIdx + 1; endIdx < points.length; endIdx++) {
        // Check if the end point is rejected
        if (rejectedIndices.has(endIdx)) {
          break;
        }
        
        // Calculate distance from previous point to this point
        const p1 = points[endIdx - 1];
        const p2 = points[endIdx];
        const distance = Math.sqrt(
          Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
        );
        
        segmentLength += distance;
        
        // Check if any point in between is rejected
        let hasRejectedPoint = false;
        for (let i = startIdx + 1; i < endIdx; i++) {
          if (rejectedIndices.has(i)) {
            hasRejectedPoint = true;
            break;
          }
        }
        
        if (hasRejectedPoint) {
          break;
        }
        
        // If segment is long enough, create a candidate
        if (segmentLength >= textLength) {
          // Score this segment
          const scoreResult = this.scoreSegment(path, startIdx, endIdx, metrics);
          
          // Calculate center point for visualization
          const centerPoint = this._calculateCenterPoint(path, startIdx, endIdx);
          
          candidates.push({
            segment: {
              startIdx,
              endIdx,
              length: segmentLength,
              reason: null
            },
            score: scoreResult.score,
            scores: scoreResult.scores,
            centerPoint
          });
        }
      }
    }
    
    return candidates;
  }

  /**
   * Find optimal placement with text length validation
   * Returns placement result with warnings if no suitable placement exists
   * @param {RiverPath} path
   * @param {string} text - The text to place
   * @param {number} fontSize - Font size in pixels
   * @param {GeometryMetrics} metrics
   * @param {string} fontFamily - Font family (default: 'Arial')
   * @returns {{placement: Candidate|null, warning: string|null, allCandidates: Array<Candidate>}}
   */
  findOptimalPlacement(path, text, fontSize, metrics, fontFamily = 'Arial') {
    // Measure the actual text length
    const textLength = this.measureTextLength(text, fontSize, fontFamily);
    
    // Find all candidates that can fit the text
    const candidates = this.findCandidates(path, textLength, metrics);
    
    // If we have suitable candidates, select the optimal one
    if (candidates.length > 0) {
      const optimal = this.selectOptimal(candidates);
      return {
        placement: optimal,
        warning: null,
        allCandidates: candidates,
        textLength
      };
    }
    
    // No suitable placement found - try to find the best available option
    // Find the longest available segment, even if it's too short
    const allSegments = this._findAllValidSegments(path, metrics);
    
    if (allSegments.length === 0) {
      // No valid segments at all (entire path is rejected)
      return {
        placement: null,
        warning: 'No suitable placement found: entire river path has problematic geometry (sharp curves, narrow sections, or too short)',
        allCandidates: [],
        textLength
      };
    }
    
    // Find the longest segment
    let longestSegment = allSegments[0];
    for (const segment of allSegments) {
      if (segment.segment.length > longestSegment.segment.length) {
        longestSegment = segment;
      }
    }
    
    // Return the longest segment with a warning
    return {
      placement: longestSegment,
      warning: `Text length (${textLength.toFixed(1)}px) exceeds longest suitable segment (${longestSegment.segment.length.toFixed(1)}px). Text may be truncated or overlap.`,
      allCandidates: allSegments,
      textLength
    };
  }

  /**
   * Find all valid segments regardless of text length
   * Used as fallback when no suitable placement exists
   * @private
   * @param {RiverPath} path
   * @param {GeometryMetrics} metrics
   * @returns {Array<Candidate>}
   */
  _findAllValidSegments(path, metrics) {
    const points = path.points;
    const segments = [];
    
    // Build a set of rejected point indices
    const rejectedIndices = new Set();
    
    for (const segment of metrics.sharpCurves) {
      for (let i = segment.startIdx; i <= segment.endIdx; i++) {
        rejectedIndices.add(i);
      }
    }
    
    for (const segment of metrics.narrowSections) {
      for (let i = segment.startIdx; i <= segment.endIdx; i++) {
        rejectedIndices.add(i);
      }
    }
    
    const edgeSections = metrics.edgeSections;
    for (let i = edgeSections.start.startIdx; i <= edgeSections.start.endIdx; i++) {
      rejectedIndices.add(i);
    }
    for (let i = edgeSections.end.startIdx; i <= edgeSections.end.endIdx; i++) {
      rejectedIndices.add(i);
    }
    
    // Find all continuous non-rejected segments
    for (let startIdx = 0; startIdx < points.length - 1; startIdx++) {
      if (rejectedIndices.has(startIdx)) {
        continue;
      }
      
      let segmentLength = 0;
      let endIdx = startIdx;
      
      for (let i = startIdx + 1; i < points.length; i++) {
        if (rejectedIndices.has(i)) {
          break;
        }
        
        const p1 = points[i - 1];
        const p2 = points[i];
        const distance = Math.sqrt(
          Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
        );
        
        segmentLength += distance;
        endIdx = i;
      }
      
      // Only add segments with some length
      if (segmentLength > 0 && endIdx > startIdx) {
        const scoreResult = this.scoreSegment(path, startIdx, endIdx, metrics);
        const centerPoint = this._calculateCenterPoint(path, startIdx, endIdx);
        
        segments.push({
          segment: {
            startIdx,
            endIdx,
            length: segmentLength,
            reason: null
          },
          score: scoreResult.score,
          scores: scoreResult.scores,
          centerPoint
        });
        
        // Skip to the end of this segment to avoid overlapping segments
        startIdx = endIdx;
      }
    }
    
    return segments;
  }

  /**
   * Select optimal placement from candidates
   * @param {Array<Candidate>} candidates
   * @returns {Candidate}
   */
  selectOptimal(candidates) {
    // If no candidates, return null
    if (!candidates || candidates.length === 0) {
      return null;
    }
    
    // If only one candidate, return it
    if (candidates.length === 1) {
      return candidates[0];
    }
    
    // Find the highest score
    let maxScore = -1;
    for (const candidate of candidates) {
      if (candidate.score > maxScore) {
        maxScore = candidate.score;
      }
    }
    
    // Find all candidates with the highest score (for tie-breaking)
    const topCandidates = candidates.filter(c => c.score === maxScore);
    
    // If only one top candidate, return it
    if (topCandidates.length === 1) {
      return topCandidates[0];
    }
    
    // Tie-breaking: prefer center positions
    // Find the candidate with the highest position score
    let bestCandidate = topCandidates[0];
    let bestPositionScore = topCandidates[0].scores.position;
    
    for (let i = 1; i < topCandidates.length; i++) {
      const candidate = topCandidates[i];
      if (candidate.scores.position > bestPositionScore) {
        bestCandidate = candidate;
        bestPositionScore = candidate.scores.position;
      }
    }
    
    return bestCandidate;
  }

  /**
   * Calculate the center point of a segment for visualization
   * @private
   * @param {RiverPath} path
   * @param {number} startIdx
   * @param {number} endIdx
   * @returns {{x: number, y: number}}
   */
  _calculateCenterPoint(path, startIdx, endIdx) {
    const points = path.points;
    
    // Calculate the total length of the segment
    let totalLength = 0;
    for (let i = startIdx; i < endIdx; i++) {
      if (i < points.length - 1) {
        const p1 = points[i];
        const p2 = points[i + 1];
        totalLength += Math.sqrt(
          Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
        );
      }
    }
    
    // Find the point at half the total length
    const targetLength = totalLength / 2;
    let accumulatedLength = 0;
    
    for (let i = startIdx; i < endIdx; i++) {
      if (i < points.length - 1) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const segmentLength = Math.sqrt(
          Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
        );
        
        if (accumulatedLength + segmentLength >= targetLength) {
          // The center point is on this segment
          const remainingLength = targetLength - accumulatedLength;
          const ratio = segmentLength > 0 ? remainingLength / segmentLength : 0;
          
          return {
            x: p1.x + (p2.x - p1.x) * ratio,
            y: p1.y + (p2.y - p1.y) * ratio
          };
        }
        
        accumulatedLength += segmentLength;
      }
    }
    
    // Fallback: return the last point if we couldn't find the center
    return points[endIdx] || points[points.length - 1];
  }
}
