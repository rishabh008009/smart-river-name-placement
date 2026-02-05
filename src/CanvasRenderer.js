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
   * Resize canvas to match parent container
   */
  resizeToParent() {
    const parent = this.canvas.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  /**
   * Reset transform and clear canvas safely
   */
  clear() {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  }

  /**
   * Calculate and apply transformation to fit river in canvas
   */
  fitToCanvas(path) {
    if (!path || !path.bounds) return;

    const { minX, maxX, minY, maxY } = path.bounds;
    const padding = 40;

    const dataWidth = maxX - minX;
    const dataHeight = maxY - minY;

    if (dataWidth === 0 || dataHeight === 0) return;

    const availableWidth = this.canvas.width - padding * 2;
    const availableHeight = this.canvas.height - padding * 2;

    const scale = Math.min(
      availableWidth / dataWidth,
      availableHeight / dataHeight
    );

    const offsetX =
      padding +
      (availableWidth - dataWidth * scale) / 2 -
      minX * scale;

    const offsetY =
      padding +
      (availableHeight - dataHeight * scale) / 2 -
      minY * scale;

    this.ctx.translate(offsetX, offsetY);
    this.ctx.scale(scale, scale);
  }

  /**
   * Draw river path
   */
  drawRiver(path, options = {}) {
    if (!path || !path.points || path.points.length < 2) return;
    this._lastPath = path;
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.fitToCanvas(path);

    const {
      color = '#2196F3',
      lineWidth = 3,
      useVariableWidth = true
    } = options;

    const points = path.points;
    const hasWidthData =
      useVariableWidth &&
      path.widths &&
      path.widths.length === points.length;

    if (hasWidthData) {
      this._drawVariableWidthRiver(path, color);
    } else {
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
   * Variable-width river drawing
   */
  _drawVariableWidthRiver(path, color) {
    const { points, widths } = path;
    this.ctx.fillStyle = color;

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const w1 = widths[i] || 3;
      const w2 = widths[i + 1] || 3;

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.hypot(dx, dy);
      if (len === 0) continue;

      const px = -dy / len;
      const py = dx / len;

      this.ctx.beginPath();
      this.ctx.moveTo(p1.x + px * w1 / 2, p1.y + py * w1 / 2);
      this.ctx.lineTo(p2.x + px * w2 / 2, p2.y + py * w2 / 2);
      this.ctx.lineTo(p2.x - px * w2 / 2, p2.y - py * w2 / 2);
      this.ctx.lineTo(p1.x - px * w1 / 2, p1.y - py * w1 / 2);
      this.ctx.closePath();
      this.ctx.fill();
    }
  }

  /**
   * Draw text placements
   */
  drawText(placements, options = {}) {
    if (!placements || placements.length === 0) return;

    this.ctx.save();

    // 🔥 THIS IS WHAT WAS MISSING
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.fitToCanvas(this._lastPath);

    const {
      fontSize = 16,
      fontFamily = 'Arial',
      fillColor = '#000',
      strokeColor = '#FFF',
      strokeWidth = 3
    } = options;

    this.ctx.font = `${fontSize}px ${fontFamily}`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    for (const p of placements) {
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.angle);

      if (strokeWidth > 0) {
        this.ctx.lineWidth = strokeWidth;
        this.ctx.strokeStyle = strokeColor;
        this.ctx.strokeText(p.char, 0, 0);
      }

      this.ctx.fillStyle = fillColor;
      this.ctx.fillText(p.char, 0, 0);

      this.ctx.restore();
    }

    this.ctx.restore();
  }

  /**
   * Draw rejected river segments
   */
  drawRejectedAreas(path, segments, options = {}) {
    if (!path || !segments?.length) return;

    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.fitToCanvas(path);

    const { color = 'rgba(255,0,0,0.3)', lineWidth = 8 } = options;

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.lineCap = 'round';

    for (const seg of segments) {
      this.ctx.beginPath();
      this.ctx.moveTo(
        path.points[seg.startIdx].x,
        path.points[seg.startIdx].y
      );
      for (let i = seg.startIdx + 1; i <= seg.endIdx; i++) {
        this.ctx.lineTo(path.points[i].x, path.points[i].y);
      }
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  /**
   * Draw candidate placement markers
   */
  drawCandidates(path, candidates, selectedSegment = null, options = {}) {
    if (!candidates?.length) return;

    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.fitToCanvas(path);

    const {
      candidateColor = 'rgba(0,255,0,0.5)',
      selectedColor = 'rgba(0,255,0,1)',
      radius = 8
    } = options;

    for (const c of candidates) {
      const isSelected =
        selectedSegment &&
        c.segment.startIdx === selectedSegment.startIdx &&
        c.segment.endIdx === selectedSegment.endIdx;

      this.ctx.beginPath();
      this.ctx.arc(c.centerPoint.x, c.centerPoint.y, radius, 0, Math.PI * 2);
      this.ctx.fillStyle = isSelected ? selectedColor : candidateColor;
      this.ctx.fill();
    }

    this.ctx.restore();
  }
}
