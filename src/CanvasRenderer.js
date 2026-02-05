/**
 * CanvasRenderer
 * Visualizes river paths and placed text on HTML5 canvas
 */

export class CanvasRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) {
      throw new Error('Failed to get 2D context from canvas');
    }
  }

  /**
   * Clear the canvas
   */
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Draw river path with optional width visualization
   * @param {RiverPath} path - River path object with points and optional widths
   * @param {RenderOptions} options - Rendering options
   */
  drawRiver(path, options = {}) {
    if (!path || !path.points || path.points.length < 2) {
      return;
    }

    const {
      color = '#2196F3',
      lineWidth = 3,
      useVariableWidth = true
    } = options;

    const points = path.points;
    const hasWidthData = path.widths && path.widths.length === points.length;

    this.ctx.save();

    // If we have width data and variable width is enabled, draw with variable width
    if (hasWidthData && useVariableWidth) {
      this._drawVariableWidthRiver(path, color);
    } else {
      // Draw constant-width river
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = lineWidth;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';

      this.ctx.beginPath();
      this.ctx.moveTo(points[0].x, points[0].y);

      for (let i = 1; i < points.length; i++) {
        this.ctx.lineTo(points[i].x, points[i].y);
      }

      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  /**
   * Draw river with variable width based on width profile
   * @private
   * @param {RiverPath} path
   * @param {string} color
   */
  _drawVariableWidthRiver(path, color) {
    const points = path.points;
    const widths = path.widths;

    this.ctx.fillStyle = color;

    // Draw the river as a series of trapezoids between consecutive points
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const w1 = widths[i] || 3;
      const w2 = widths[i + 1] || 3;

      // Calculate perpendicular direction
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length === 0) continue;

      // Normalized perpendicular vector
      const perpX = -dy / length;
      const perpY = dx / length;

      // Calculate the four corners of the trapezoid
      const x1Left = p1.x + perpX * w1 / 2;
      const y1Left = p1.y + perpY * w1 / 2;
      const x1Right = p1.x - perpX * w1 / 2;
      const y1Right = p1.y - perpY * w1 / 2;

      const x2Left = p2.x + perpX * w2 / 2;
      const y2Left = p2.y + perpY * w2 / 2;
      const x2Right = p2.x - perpX * w2 / 2;
      const y2Right = p2.y - perpY * w2 / 2;

      // Draw the trapezoid
      this.ctx.beginPath();
      this.ctx.moveTo(x1Left, y1Left);
      this.ctx.lineTo(x2Left, y2Left);
      this.ctx.lineTo(x2Right, y2Right);
      this.ctx.lineTo(x1Right, y1Right);
      this.ctx.closePath();
      this.ctx.fill();
    }
  }

  /**
   * Draw text along path using character placements
   * @param {Array<CharacterPlacement>} placements - Array of character placements
   * @param {TextOptions} options - Text rendering options
   */
  drawText(placements, options = {}) {
    if (!placements || placements.length === 0) {
      return;
    }

    const {
      fontSize = 16,
      fontFamily = 'Arial',
      fillColor = '#000000',
      strokeColor = '#FFFFFF',
      strokeWidth = 3
    } = options;

    this.ctx.save();

    // Set font
    this.ctx.font = `${fontSize}px ${fontFamily}`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    // Draw each character at its calculated position and rotation
    for (const placement of placements) {
      this.ctx.save();

      // Translate to character position
      this.ctx.translate(placement.x, placement.y);

      // Rotate to character angle
      this.ctx.rotate(placement.angle);

      // Draw white outline for contrast
      if (strokeWidth > 0) {
        this.ctx.strokeStyle = strokeColor;
        this.ctx.lineWidth = strokeWidth;
        this.ctx.lineJoin = 'round';
        this.ctx.strokeText(placement.char, 0, 0);
      }

      // Draw black fill
      this.ctx.fillStyle = fillColor;
      this.ctx.fillText(placement.char, 0, 0);

      this.ctx.restore();
    }

    this.ctx.restore();
  }

  /**
   * Visualize rejected areas (sharp curves, narrow sections)
   * @param {RiverPath} path - River path object
   * @param {Array<Segment>} segments - Array of rejected segments
   * @param {Object} options - Rendering options
   */
  drawRejectedAreas(path, segments, options = {}) {
    if (!segments || segments.length === 0 || !path || !path.points) {
      return;
    }

    const {
      color = 'rgba(255, 0, 0, 0.3)',
      lineWidth = 8
    } = options;

    this.ctx.save();

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    // Draw each rejected segment
    for (const segment of segments) {
      const points = path.points;
      const startIdx = segment.startIdx;
      const endIdx = segment.endIdx;

      if (startIdx >= points.length || endIdx >= points.length) {
        continue;
      }

      this.ctx.beginPath();
      this.ctx.moveTo(points[startIdx].x, points[startIdx].y);

      for (let i = startIdx + 1; i <= endIdx; i++) {
        if (i < points.length) {
          this.ctx.lineTo(points[i].x, points[i].y);
        }
      }

      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  /**
   * Draw candidate positions with scores
   * @param {RiverPath} path - River path object
   * @param {Array<Candidate>} candidates - Array of candidate placements
   * @param {Segment} selectedSegment - The selected optimal segment (optional)
   * @param {Object} options - Rendering options
   */
  drawCandidates(path, candidates, selectedSegment = null, options = {}) {
    if (!candidates || candidates.length === 0) {
      return;
    }

    const {
      candidateColor = 'rgba(0, 255, 0, 0.5)',
      selectedColor = 'rgba(0, 255, 0, 1)',
      circleRadius = 8,
      fontSize = 12,
      showScores = true
    } = options;

    this.ctx.save();

    // Draw each candidate
    for (const candidate of candidates) {
      const isSelected = selectedSegment && 
        candidate.segment.startIdx === selectedSegment.startIdx &&
        candidate.segment.endIdx === selectedSegment.endIdx;

      const centerPoint = candidate.centerPoint;

      // Draw circle at center point
      this.ctx.beginPath();
      this.ctx.arc(centerPoint.x, centerPoint.y, circleRadius, 0, 2 * Math.PI);
      this.ctx.fillStyle = isSelected ? selectedColor : candidateColor;
      this.ctx.fill();

      // Draw border for selected candidate
      if (isSelected) {
        this.ctx.strokeStyle = '#00FF00';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
      }

      // Draw score label if enabled
      if (showScores) {
        this.ctx.fillStyle = '#000000';
        this.ctx.font = `${fontSize}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        
        const scoreText = candidate.score.toFixed(1);
        const labelY = centerPoint.y + circleRadius + 2;
        
        // Draw white background for text
        const textMetrics = this.ctx.measureText(scoreText);
        const textWidth = textMetrics.width;
        const padding = 2;
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.fillRect(
          centerPoint.x - textWidth / 2 - padding,
          labelY - padding,
          textWidth + padding * 2,
          fontSize + padding * 2
        );
        
        // Draw score text
        this.ctx.fillStyle = '#000000';
        this.ctx.fillText(scoreText, centerPoint.x, labelY);
      }
    }

    this.ctx.restore();
  }
}
