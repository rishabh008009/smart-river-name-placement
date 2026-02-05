# Smart River Name Placement

An intelligent text positioning system for map visualization, developed for HACK ARENA 3.0.

## Overview

The Smart River Name Placement system analyzes river geometry to find optimal positions for placing river names along river paths. It considers factors like curvature, width, and straightness to ensure text is readable and visually appealing.

## Features

- **Geometric Analysis**: Calculates curvature and identifies problematic areas (sharp curves, narrow sections)
- **Intelligent Scoring**: Evaluates potential text positions using a weighted scoring algorithm
- **Visual Rendering**: Displays rivers and text on HTML5 canvas with visual indicators
- **Interactive Demo**: Pre-loaded examples and custom input support
- **Algorithm Transparency**: Shows metrics, candidate positions, and decision-making process

## Project Structure

```
smart-river-name-placement/
├── src/                      # Source code
│   ├── main.js              # Application entry point
│   ├── RiverPathParser.js   # Parse coordinate data
│   ├── GeometryAnalyzer.js  # Analyze river geometry
│   ├── PlacementScorer.js   # Score placement positions
│   ├── TextPlacer.js        # Calculate character positions
│   ├── CanvasRenderer.js    # Render on canvas
│   └── UIController.js      # Handle user interactions
├── tests/                    # Test files
│   ├── setup.js             # Test configuration
│   ├── RiverPathParser.test.js
│   ├── GeometryAnalyzer.test.js
│   ├── PlacementScorer.test.js
│   ├── TextPlacer.test.js
│   └── CanvasRenderer.test.js
├── examples/                 # Example river data
│   └── rivers.js
├── index.html               # Main HTML page
├── styles.css               # Styling
├── package.json             # Dependencies
├── vitest.config.js         # Test configuration
└── README.md                # This file
```

## Getting Started

### Installation

```bash
npm install
```

### Running the Application

#### Option 1: Development Server (Recommended)

```bash
npm run dev
```

Open your browser to the URL shown (typically http://localhost:5173)

#### Option 2: Direct File Access

Simply open `index.html` in a modern web browser. Note: Some features may require a local server due to ES6 module restrictions.

### Using the Application

1. **Load an Example**: Click one of the example buttons (Straight River, Curved River, Complex River)
2. **Customize the Name**: Type a new river name in the input field and click "Update Name" or press Enter
3. **Toggle Visualizations**: Use the checkboxes to show/hide:
   - Rejected Areas (red overlay showing problematic sections)
   - Candidate Positions (green circles showing potential placements)
   - Metrics (detailed analysis results)
4. **Try Custom Coordinates**: Enter your own river coordinates in JSON format:
   ```json
   [[x1, y1, width1], [x2, y2, width2], ...]
   ```

### Testing

Run all tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run tests with coverage:

```bash
npm run test:coverage
```

### Building

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Technology Stack

- **HTML5 Canvas**: For rendering graphics
- **Vanilla JavaScript**: ES6 modules for clean architecture
- **Vite**: Fast development server and build tool
- **Vitest**: Fast unit test runner
- **fast-check**: Property-based testing library

## Testing Strategy

The project uses a dual testing approach:

1. **Unit Tests**: Test specific examples and edge cases
2. **Property-Based Tests**: Verify universal properties across randomized inputs (minimum 100 iterations per property)

## Requirements

- Modern web browser with HTML5 Canvas support
- Node.js 16+ (for development)
- Minimum screen resolution: 1280x720

## License

MIT

## HACK ARENA 3.0

This project was developed for the HACK ARENA 3.0 hackathon.
