# Smart River Name Placement - Demo Instructions

## Quick Start

### 1. Start the Application

```bash
npm run dev
```

Then open your browser to http://localhost:5173

### 2. Try the Examples

Click the three example buttons to see different river types:

- **Straight River**: Simple baseline case with minimal curvature
- **Curved River**: Typical gentle curve scenario
- **Complex River**: Challenging case with sharp bends and varying width

### 3. Customize the River Name

1. Type a new name in the "River Name" input field
2. Click "Update Name" or press Enter
3. Watch the text reposition along the river

### 4. Explore Visualizations

Toggle the checkboxes to see:

- **Rejected Areas** (red overlay): Shows sections with sharp curves, narrow width, or at edges
- **Candidate Positions** (green circles): Shows all potential placement positions with scores
- **Metrics**: Detailed analysis including:
  - Processing time
  - Geometry metrics (curvature, rejected segments)
  - Selected placement score and breakdown
  - Top 3 candidate positions

### 5. Try Custom Coordinates

Enter your own river coordinates in JSON format:

```json
[[100, 300, 20], [200, 320, 22], [300, 350, 21], [400, 380, 23]]
```

Format: `[x, y, width]` for each point

## What to Look For

### Algorithm Intelligence

- The algorithm **avoids sharp curves** (marked in red)
- It **prefers the center** of the river path
- It **considers width** when available
- It **ensures straightness** for readability

### Visual Feedback

- **Blue line**: The river path
- **Red overlay**: Rejected areas (sharp curves, narrow sections, edges)
- **Green circles**: Candidate positions (larger = higher score)
- **Black text with white outline**: Final placement

### Metrics Panel

- **Score Breakdown**: See how each factor contributes (curvature 40%, width 20%, position 20%, straightness 20%)
- **Top Candidates**: Compare the top 3 placement options
- **Processing Time**: Typically under 5ms for real-time performance

## Demo Flow Suggestion

1. Start with **Straight River** - show the baseline case
2. Move to **Curved River** - show how it handles gentle curves
3. Try **Complex River** - demonstrate rejection of problematic areas
4. Change the river name to something long like "Mississippi River" - show text length handling
5. Toggle visualizations on/off to explain the algorithm's decision-making
6. Show the metrics panel to explain the scoring system

## Technical Highlights

- **Real-time analysis**: Sub-5ms processing for instant feedback
- **Geometric analysis**: Curvature calculation with smoothing
- **Intelligent scoring**: Multi-factor weighted algorithm
- **Visual transparency**: Shows all candidates and rejected areas
- **Robust error handling**: Graceful fallbacks for edge cases

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari

Requires HTML5 Canvas support.
