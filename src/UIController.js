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
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      throw new Error(`Canvas element with id "${canvasId}" not found`);
    }

    this.parser = new RiverPathParser();
    this.analyzer = new GeometryAnalyzer();
    this.scorer = new PlacementScorer();
    this.placer = new TextPlacer();
    this.renderer = new CanvasRenderer(this.canvas);

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
      
      // Fetch the WKT file
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to load WKT file: ${response.statusText}`);
      }
      
      const wktString = await response.text();
      
      // Parse WKT data
      this.currentRiver = this.parser.parse(wktString);
      
      if (this.currentRiver instanceof Error) {
        throw this.currentRiver;
      }
      
      this.currentRiverName = 'Hackathon River';
      
      // Run the full pipeline
      this.renderPipeline(startTime);
      
      this.clearError();
    } catch (error) {
      this.displayError(`Failed to load WKT file: ${error.message}`);
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
    }

    // Re-render if we have a river loaded
    if (this.currentRiver) {
      const startTime = performance.now();
      this.renderPipeline(startTime);
    }
  }

  /**
   * Run the full analysis and rendering pipeline
   * @param {number} startTime
   */
  renderPipeline(startTime) {
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
    
    // Render everything
    this.renderer.clear();
    this.renderer.drawRiver(this.currentRiver);
    
    if (this.showRejectedAreas && metrics.rejectedSegments) {
      this.renderer.drawRejectedAreas(this.currentRiver, metrics.rejectedSegments);
    }
    
    if (this.showCandidates && candidates.length > 0) {
      this.renderer.drawCandidates(
        this.currentRiver,
        candidates,
        placement ? placement.segment : null
      );
    }
    
    if (characterPlacements.length > 0) {
      this.renderer.drawText(characterPlacements);
    }
    
    // Display metrics
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    
    if (this.showMetrics) {
      this.displayMetrics(metrics, placement, candidates, result.warning, processingTime);
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
    const metricsPanel = document.getElementById('metrics-panel');
    if (!metricsPanel) return;

    let html = '<h3>Analysis Results</h3>';
    
    // Processing time
    html += `<p><strong>Processing Time:</strong> ${processingTime.toFixed(2)}ms</p>`;
    
    // Warning if any
    if (warning) {
      html += `<p style="color: #f44336;"><strong>Warning:</strong> ${warning}</p>`;
    }
    
    // Geometry metrics
    html += '<h4>Geometry Metrics</h4>';
    html += `<p><strong>Average Curvature:</strong> ${metrics.avgCurvature?.toFixed(2) || 'N/A'} deg/unit</p>`;
    html += `<p><strong>Max Curvature:</strong> ${metrics.maxCurvature?.toFixed(2) || 'N/A'} deg/unit</p>`;
    html += `<p><strong>Rejected Segments:</strong> ${metrics.rejectedSegments?.length || 0}</p>`;
    
    // Placement info
    if (placement && placement.segment) {
      html += '<h4>Selected Placement</h4>';
      html += `<p><strong>Score:</strong> ${placement.score.toFixed(2)}/100</p>`;
      html += `<p><strong>Position:</strong> Index ${placement.segment.startIdx} to ${placement.segment.endIdx}</p>`;
      html += `<p><strong>Length:</strong> ${placement.segment.length.toFixed(2)} units</p>`;
      
      // Score breakdown
      if (placement.scores) {
        html += '<h4>Score Breakdown</h4>';
        html += `<p>Curvature: ${placement.scores.curvature?.toFixed(1) || 'N/A'}</p>`;
        html += `<p>Width: ${placement.scores.width?.toFixed(1) || 'N/A'}</p>`;
        html += `<p>Position: ${placement.scores.position?.toFixed(1) || 'N/A'}</p>`;
        html += `<p>Straightness: ${placement.scores.straightness?.toFixed(1) || 'N/A'}</p>`;
      }
      
      // Top candidates
      if (candidates && candidates.length > 0) {
        html += '<h4>Top 3 Candidates</h4>';
        const topCandidates = candidates
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);
        
        topCandidates.forEach((candidate, index) => {
          html += `<p>${index + 1}. Score: ${candidate.score.toFixed(2)} (Index ${candidate.segment.startIdx}-${candidate.segment.endIdx})</p>`;
        });
      }
    } else {
      html += '<p><strong>Warning:</strong> No suitable placement found</p>';
    }
    
    metricsPanel.innerHTML = html;
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
