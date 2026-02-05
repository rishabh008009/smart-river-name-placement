/**
 * Main application entry point
 * Initializes the Smart River Name Placement system
 */

import { UIController } from './UIController.js';

console.log('Smart River Name Placement System - Initializing...');

// Initialize UI Controller
let uiController;

try {
  uiController = new UIController('riverCanvas');
  console.log('UIController initialized successfully');
} catch (error) {
  console.error('Failed to initialize UIController:', error);
  const errorPanel = document.getElementById('error-panel');
  if (errorPanel) {
    errorPanel.textContent = `Initialization error: ${error.message}`;
    errorPanel.style.display = 'block';
  }
}

// Wire up example buttons
document.getElementById('example1')?.addEventListener('click', () => {
  uiController.loadExample('straight');
});

document.getElementById('example2')?.addEventListener('click', () => {
  uiController.loadExample('curved');
});

document.getElementById('example3')?.addEventListener('click', () => {
  uiController.loadExample('complex');
});

// Wire up WKT file loader
document.getElementById('loadWKT')?.addEventListener('click', () => {
  uiController.loadWKTFile('examples/river.wkt');
});

// Wire up river name update
document.getElementById('updateName')?.addEventListener('click', () => {
  const nameInput = document.getElementById('riverName');
  if (nameInput) {
    uiController.updateRiverName(nameInput.value);
  }
});

// Allow Enter key to update name
document.getElementById('riverName')?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    uiController.updateRiverName(e.target.value);
  }
});

// Wire up custom coordinates
document.getElementById('loadCustom')?.addEventListener('click', () => {
  const coordsInput = document.getElementById('customCoords');
  if (coordsInput) {
    uiController.processCustomInput(coordsInput.value);
  }
});

// Wire up visualization toggles
document.getElementById('showRejected')?.addEventListener('change', (e) => {
  uiController.toggleVisualization('rejectedAreas', e.target.checked);
});

document.getElementById('showCandidates')?.addEventListener('change', (e) => {
  uiController.toggleVisualization('candidates', e.target.checked);
});

document.getElementById('showMetrics')?.addEventListener('change', (e) => {
  uiController.toggleVisualization('metrics', e.target.checked);
});

// Load the first example by default
if (uiController) {
  setTimeout(() => {
    uiController.loadExample('straight');
  }, 100);
}

console.log('System initialized successfully');
