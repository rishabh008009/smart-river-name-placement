/**
 * UIController
 * Manages user interactions and coordinates system components
 */

import { RiverPathParser } from './RiverPathParser.js';
import { GeometryAnalyzer } from './GeometryAnalyzer.js';
import { PlacementScorer } from './PlacementScorer.js';
import { TextPlacer } from './TextPlacer.js';
import { CanvasRenderer } from './CanvasRenderer.js';
import { exampleRivers } from '../examples/rivers.js';

export class UIController {
  constructor(canvasId, beforeCanvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      throw new Error(`Canvas element with id "${canvasId}" not found`);
    }

    this.beforeCanvas = beforeCanvasId ? document.getElementById(beforeCanvasId) : null;

    this.parser = new RiverPathParser();
    this.analyzer = new GeometryAnalyzer();
    this.scorer = new PlacementScorer();
    this.placer = new TextPlacer();
    this.renderer = new CanvasRenderer(this.canvas);
    this.beforeRenderer = this.beforeCanvas ? new CanvasRenderer(this.beforeCanvas) : null;

    this.currentRiver = null;
    this.currentRiverName = 'River Name';
    this.showRejectedAreas = true;
    this.showCandidates = true;
    this.showMetrics = true;
  }

  /**
   * Load WKT file from server
   * @param {string} filePath
   */
  async loadWKTFile(filePath) {
    try {
      const startTime = performance.now();
      
      console.log('Loading WKT file from:', filePath);
      
      // Fetch the WKT file
      const response = await fetch(filePath);
      console.log('Fetch response:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const wktString = await response.text();
      console.log('WKT string length:', wktString.length);
      console.log('WKT preview:', wktString.substring(0, 100));
      
      // Parse WKT data
      this.currentRiver = this.parser.parse(wktString);
      
      if (this.currentRiver instanceof Error) {
        throw this.currentRiver;
      }
      
      console.log('Parsed river:', this.currentRiver);
      
      this.currentRiverName = 'Hackathon River';
      
      // Run the full pipeline
      this.renderPipeline(startTime);
      
      this.clearError();
    } catch (error) {
      console.error('WKT loading error:', error);
      this.displayError(`Failed to load WKT file: ${error.message}`);
    }
  }

  loadWKTFromString(wktString) {
    try {
      const startTime = performance.now();

      this.currentRiver = this.parser.parse(wktString);
      if (this.currentRiver instanceof Error) {
        throw this.currentRiver;
      }

      this.currentRiverName = 'Custom WKT River';
      this.renderPipeline(startTime);
      this.clearError();
    } catch (error) {
      this.displayError(`Invalid WKT file: ${error.message}`);
    }
  }


  /**
   * Load and display example river
   * @param {string} exampleId
   */
  loadExample(exampleId) {
    const example = exampleRivers[exampleId];
    if (!example) {
      this.displayError(`Example "${exampleId}" not found`);
      return;
    }

    try {
      const startTime = performance.now();
      
      // Parse river data
      this.currentRiver = this.parser.parse(example.coordinates);
      this.currentRiverName = example.name;
      
      // Run the full pipeline
      this.renderPipeline(startTime);
      
      this.clearError();
    } catch (error) {
      this.displayError(`Failed to load example: ${error.message}`);
    }
  }

  /**
   * Process custom river input
   * @param {string} coordinatesStr
   */
  processCustomInput(coordinatesStr) {
    try {
      const startTime = performance.now();
      
      // Try to parse as JSON first
      let coordinates;
      try {
        coordinates = JSON.parse(coordinatesStr);
      } catch {
        // Try CSV format: "x1,y1,w1;x2,y2,w2;..."
        const rows = coordinatesStr.split(';').map(row => 
          row.split(',').map(val => parseFloat(val.trim()))
        );
        coordinates = rows;
      }
      
      // Parse river data
      this.currentRiver = this.parser.parse(coordinates);
      
      // Run the full pipeline
      this.renderPipeline(startTime);
      
      this.clearError();
    } catch (error) {
      this.displayError(`Failed to parse custom input: ${error.message}`);
    }
  }

  /**
   * Update river name and re-render
   * @param {string} name
   */
  updateRiverName(name) {
    if (!this.currentRiver) {
      this.displayError('Please load a river first');
      return;
    }

    try {
      const startTime = performance.now();
      this.currentRiverName = name || 'River Name';
      this.renderPipeline(startTime);
      this.clearError();
    } catch (error) {
      this.displayError(`Failed to update river name: ${error.message}`);
    }
  }

  /**
   * Toggle visualization options
   * @param {string} option
   * @param {boolean} enabled
   */
  toggleVisualization(option, enabled) {
    if (option === 'rejectedAreas') {
      this.showRejectedAreas = enabled;
    } else if (option === 'candidates') {
      this.showCandidates = enabled;
    } else if (option === 'metrics') {
      this.showMetrics = enabled;

      const bar = document.getElementById('metrics-bar');
      if (bar) {
        bar.style.display = enabled ? 'flex' : 'none';
      }
    }

    if (this.currentRiver) {
      this.renderPipeline(performance.now());
    }
  }

  /**
   * Run the full analysis and rendering pipeline
   * @param {number} startTime
   */
  renderPipeline(startTime) {

    this.renderer.resizeToParent();
    this.beforeRenderer?.resizeToParent();

    // Render "before" view (raw polygon without analysis)
    if (this.beforeRenderer) {
      this.beforeRenderer.clear();
      this.beforeRenderer.drawRiver(this.currentRiver);
    }

    // Analyze geometry
    const metrics = this.analyzer.analyzeGeometry(this.currentRiver);
    
    // Find optimal placement
    const result = this.scorer.findOptimalPlacement(
      this.currentRiver,
      this.currentRiverName,
      16, // font size
      metrics
    );
    
    const placement = result.placement;
    const candidates = result.allCandidates || [];
    
    // Place text characters
    let characterPlacements = [];
    if (placement && placement.segment) {
      characterPlacements = this.placer.placeText(
        this.currentRiverName,
        this.currentRiver,
        placement.segment.startIdx,
        16 // font size
      );
    }
    
    // Render "after" view with analysis and text
    this.renderer.clear();
    this.renderer.drawRiver(this.currentRiver);
    
    if (this.showRejectedAreas && metrics.rejectedSegments) {
      this.renderer.drawRejectedAreas(this.currentRiver, metrics.rejectedSegments);
    }
    
    if (this.showCandidates && candidates.length > 0) {
      this.renderer.drawCandidates(
        this.currentRiver,
        candidates,
        placement ? placement.segment : null,
        {
          showScores: this.showMetrics   // 🔥 checkbox now controls canvas metrics
        }
      );
    }
    
    if (characterPlacements.length > 0) {
      this.renderer.drawText(characterPlacements);
    }
    
    // Display metrics
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    
    const bar = document.getElementById('metrics-bar');

    if (this.showMetrics) {
      if (bar) bar.style.display = 'flex';
      this.displayMetrics(metrics, placement, candidates, result.warning, processingTime);
    } else {
      if (bar) {
        bar.innerHTML = '';
        bar.style.display = 'none';
      }
    }
  }

  /**
   * Display metrics and algorithm explanation
   * @param {GeometryMetrics} metrics
   * @param {Candidate} placement
   * @param {Array<Candidate>} candidates
   * @param {string} warning
   * @param {number} processingTime
   */
  displayMetrics(metrics, placement, candidates, warning, processingTime) {
    const bar = document.getElementById('metrics-bar');
    if (!bar) return;

    const topCandidates = (candidates || [])
      .slice()
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    bar.innerHTML = `
      <div class="metric-col">
        <div class="metric-title">Performance</div>
        <div class="metric-value">${processingTime.toFixed(2)} ms</div>
      </div>

      <div class="metric-col">
        <div class="metric-title">Curvature</div>
        <div class="metric-value">${metrics.avgCurvature?.toFixed(2) ?? '–'}</div>
        <div class="metric-sub">Max: ${metrics.maxCurvature?.toFixed(2) ?? '–'}</div>
      </div>

      <div class="metric-col">
        <div class="metric-title">Rejected Segments</div>
        <div class="metric-value">${metrics.rejectedSegments?.length ?? 0}</div>
      </div>

      <div class="metric-col">
        <div class="metric-title">Placement Score</div>
        <div class="metric-value">
          ${placement?.score?.toFixed(2) ?? 'N/A'}
        </div>
        <div class="metric-sub">
          ${placement
            ? `Idx ${placement.segment.startIdx}–${placement.segment.endIdx}`
            : '—'}
        </div>
      </div>

      <div class="metric-col">
        <div class="metric-title">Score Breakdown</div>
        <div class="metric-sub">Curv ${placement?.scores?.curvature?.toFixed(1) ?? '–'}</div>
        <div class="metric-sub">Width ${placement?.scores?.width?.toFixed(1) ?? '–'}</div>
        <div class="metric-sub">Pos ${placement?.scores?.position?.toFixed(1) ?? '–'}</div>
        <div class="metric-sub">Straight ${placement?.scores?.straightness?.toFixed(1) ?? '–'}</div>
      </div>

      <div class="metric-col">
        <div class="metric-title">Top Candidates</div>
        ${topCandidates
          .map(
            (c, i) =>
              `<div class="metric-sub">${i + 1}. ${c.score.toFixed(1)}</div>`
          )
          .join('')}
      </div>
    `;
  }


  /**
   * Display error message
   * @param {string} message
   */
  displayError(message) {
    const errorPanel = document.getElementById('error-panel');
    if (errorPanel) {
      errorPanel.textContent = message;
      errorPanel.style.display = 'block';
    }
  }

  /**
   * Clear error message
   */
  clearError() {
    const errorPanel = document.getElementById('error-panel');
    if (errorPanel) {
      errorPanel.textContent = '';
      errorPanel.style.display = 'none';
    }
  }
}
