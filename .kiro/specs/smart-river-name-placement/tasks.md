# Implementation Plan: Smart River Name Placement

## Overview

This implementation plan breaks down the Smart River Name Placement system into discrete coding tasks. The approach follows a bottom-up strategy: build core data structures and algorithms first, then add rendering and UI layers. Given the hackathon deadline (Feb 6th), tasks are prioritized for rapid development with optional testing tasks marked for flexibility.

## Tasks

- [x] 1. Set up project structure and testing framework
  - Create HTML file with canvas element
  - Set up JavaScript module structure (ES6 modules)
  - Install and configure fast-check for property-based testing
  - Install and configure Jest or Vitest as test runner
  - Create basic project file structure (src/, tests/, examples/)
  - _Requirements: 6.1, 6.2_

- [x] 2. Implement River Path Parser
  - [x] 2.1 Create RiverPath data structure and parser class
    - Define RiverPath interface with points, widths, length, and bounds
    - Implement parse() method to convert coordinate arrays to RiverPath objects
    - Implement validation logic (minimum 3 points, numeric values)
    - Calculate total path length and bounding box
    - Handle optional width data extraction
    - _Requirements: 1.1, 1.3, 1.4_
  
  - [ ]* 2.2 Write property test for valid coordinate parsing
    - **Property 1: Valid coordinate parsing preserves structure**
    - **Validates: Requirements 1.1, 1.3, 1.4**
  
  - [ ]* 2.3 Write property test for invalid input handling
    - **Property 2: Invalid input produces errors**
    - **Validates: Requirements 1.2**
  
  - [ ]* 2.4 Write unit tests for parser edge cases
    - Test exactly 3 points (minimum valid)
    - Test with and without width data
    - Test various invalid formats
    - _Requirements: 1.2, 1.3_

- [x] 3. Implement Geometry Analyzer
  - [x] 3.1 Create GeometryAnalyzer class with curvature calculation
    - Implement calculateCurvature() using three-point angle method
    - Apply smoothing with moving average (window size 3)
    - Handle edge cases (first and last points)
    - Return array of curvature values
    - _Requirements: 2.1_
  
  - [x] 3.2 Implement sharp curve and narrow section detection
    - Implement findSharpCurves() with configurable threshold (default 30 deg/unit)
    - Implement findNarrowSections() for width-based filtering
    - Implement getEdgeSections() to identify first/last 10% of path
    - Return Segment objects with startIdx, endIdx, length, and reason
    - _Requirements: 2.2, 2.3, 2.5_
  
  - [x] 3.3 Implement analyzeGeometry() to compute overall metrics
    - Calculate average and max curvature
    - Combine all analysis results into GeometryMetrics object
    - _Requirements: 2.1, 2.2, 2.3, 2.5_
  
  - [ ]* 3.4 Write property test for curvature calculation completeness
    - **Property 3: Curvature calculation completeness**
    - **Validates: Requirements 2.1**
  
  - [ ]* 3.5 Write property test for sharp curve detection
    - **Property 4: Sharp curve detection**
    - **Validates: Requirements 2.2**
  
  - [ ]* 3.6 Write property test for narrow section detection
    - **Property 5: Narrow section detection**
    - **Validates: Requirements 2.3**
  
  - [ ]* 3.7 Write property test for edge section exclusion
    - **Property 6: Edge section exclusion**
    - **Validates: Requirements 2.5**

- [x] 4. Checkpoint - Verify core analysis works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement Placement Scorer
  - [x] 5.1 Create PlacementScorer class with scoring algorithm
    - Implement scoreSegment() with weighted scoring (curvature 40%, width 20%, position 20%, straightness 20%)
    - Calculate individual score components
    - Return overall score (0-100 scale)
    - _Requirements: 2.4_
  
  - [x] 5.2 Implement candidate finding and selection
    - Implement findCandidates() to generate all valid placement positions
    - Filter out rejected segments (sharp curves, narrow sections, edges)
    - Implement selectOptimal() to choose highest-scoring candidate
    - Handle tie-breaking (prefer center positions)
    - _Requirements: 3.1, 3.3_
  
  - [x] 5.3 Add text length constraint validation
    - Ensure selected segments are long enough for text
    - Return warning if no suitable placement exists
    - Provide best available option as fallback
    - _Requirements: 3.4, 3.5_
  
  - [ ]* 5.4 Write property test for placement score validity
    - **Property 7: Placement score validity and optimal selection**
    - **Validates: Requirements 2.4, 3.1, 3.3**
  
  - [ ]* 5.5 Write property test for text length constraint
    - **Property 9: Text length constraint**
    - **Validates: Requirements 3.4**
  
  - [ ]* 5.6 Write unit tests for scoring edge cases
    - Test with no valid candidates
    - Test with tied scores
    - Test with text longer than any segment
    - _Requirements: 3.5_

- [x] 6. Implement Text Placer
  - [x] 6.1 Create TextPlacer class with character positioning
    - Implement interpolatePosition() to find point at specific distance along path
    - Calculate tangent angle at each position
    - Implement placeText() to generate CharacterPlacement array
    - Measure character widths using canvas measureText
    - _Requirements: 3.2_
  
  - [ ]* 6.2 Write property test for text orientation smoothness
    - **Property 8: Text orientation smoothness**
    - **Validates: Requirements 3.2**
  
  - [ ]* 6.3 Write property test for character placement completeness
    - **Property 10: Character placement completeness**
    - **Validates: Requirements 4.1, 4.2**

- [x] 7. Implement Canvas Renderer
  - [x] 7.1 Create CanvasRenderer class with river drawing
    - Implement drawRiver() with path stroking
    - Support variable width rendering when Width_Profile exists
    - Use blue color for river (#2196F3)
    - _Requirements: 4.1, 4.4_
  
  - [x] 7.2 Implement text rendering along path
    - Implement drawText() using CharacterPlacement array
    - Apply rotation and translation for each character
    - Use black fill with white outline for contrast
    - _Requirements: 4.2_
  
  - [x] 7.3 Implement visualization of rejected areas and candidates
    - Implement drawRejectedAreas() with red semi-transparent overlay
    - Implement drawCandidates() with green circles and score labels
    - Highlight selected position with bright green
    - _Requirements: 4.5, 7.2_
  
  - [x] 7.4 Add clear() method and rendering utilities
    - Implement canvas clearing and reset
    - Add helper methods for coordinate transformation
    - _Requirements: 4.1_
  
  - [ ]* 7.5 Write property test for width visualization
    - **Property 11: Width visualization conditional rendering**
    - **Validates: Requirements 4.4**
  
  - [ ]* 7.6 Write property test for rejected area visualization
    - **Property 12: Rejected area visualization**
    - **Validates: Requirements 4.5, 7.2**

- [x] 8. Checkpoint - Verify rendering works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Create example river data
  - [x] 9.1 Create at least 3 example river shapes
    - Example 1: Straight river (simple baseline)
    - Example 2: Gently curved river (typical case)
    - Example 3: Complex river with sharp bends (challenging case)
    - Store examples in examples.js with descriptive names
    - _Requirements: 5.1_

- [x] 10. Implement UI Controller
  - [x] 10.1 Create UIController class with example loading
    - Implement loadExample() to load pre-defined rivers
    - Wire up example selection buttons/dropdown
    - Trigger analysis and rendering pipeline
    - _Requirements: 5.1, 5.2_
  
  - [x] 10.2 Add custom input processing
    - Implement processCustomInput() for user-provided coordinates
    - Parse input string (JSON or CSV format)
    - Handle parsing errors gracefully
    - _Requirements: 5.5_
  
  - [x] 10.3 Implement river name input and metrics display
    - Implement updateRiverName() to change text and re-render
    - Implement displayMetrics() to show scores, curvature, width
    - Display top 3 candidates with scores
    - Show processing time
    - Display algorithm decision summary
    - _Requirements: 5.3, 5.4, 5.5, 7.1, 7.3, 7.5_
  
  - [x] 10.4 Add visualization toggle controls
    - Toggle for showing/hiding rejected areas
    - Toggle for showing/hiding candidate positions
    - Toggle for showing/hiding metrics overlay
    - _Requirements: 7.2_

- [x] 11. Build HTML interface
  - [x] 11.1 Create main HTML page structure
    - Add canvas element (800x600 minimum)
    - Add example selection controls
    - Add custom river name input field
    - Add custom coordinate input area
    - Add visualization toggle checkboxes
    - _Requirements: 6.1, 6.3, 6.4_
  
  - [x] 11.2 Add metrics display panel
    - Create panel for placement score and breakdown
    - Create panel for top 3 candidates
    - Create panel for processing time
    - Create panel for algorithm explanation
    - _Requirements: 5.3, 5.4, 7.1, 7.3, 7.5_
  
  - [x] 11.3 Add instructions and styling
    - Write clear usage instructions
    - Apply basic CSS for clean layout
    - Ensure responsive design for laptop screens (1280x720+)
    - Add error message display area
    - _Requirements: 6.3, 6.4, 6.5_

- [x] 12. Implement error handling and messaging
  - [x] 12.1 Add comprehensive error handling
    - Wrap parser calls with try-catch
    - Handle "no suitable placement" gracefully
    - Handle canvas unavailable scenario
    - Display user-friendly error messages in UI
    - _Requirements: 6.5_
  
  - [ ]* 12.2 Write property test for error messages
    - **Property 13: Error messages for all errors**
    - **Validates: Requirements 6.5**

- [x] 13. Wire everything together and test integration
  - [x] 13.1 Connect all components in main application flow
    - Wire parser → analyzer → scorer → placer → renderer pipeline
    - Add timing instrumentation
    - Test with all example rivers
    - Verify metrics display correctly
    - _Requirements: 5.2, 5.3, 5.4_
  
  - [ ]* 13.2 Write property test for candidate transparency
    - **Property 14: Candidate transparency**
    - **Validates: Requirements 7.1**
  
  - [ ]* 13.3 Write property test for metrics availability
    - **Property 15: Metrics availability**
    - **Validates: Requirements 5.3, 7.3, 7.5**
  
  - [ ]* 13.4 Write integration tests
    - Test full pipeline with example rivers
    - Test error scenarios end-to-end
    - Test custom input workflow
    - _Requirements: 5.2, 6.5_

- [x] 14. Final checkpoint and demo preparation
  - Run all tests and fix any failures
  - Test on presentation laptop/browser
  - Verify all 3 examples work correctly
  - Practice demo flow (straight → curved → complex)
  - Prepare explanation of algorithm for judges
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Focus on getting visual demo working first (tasks 1-8, 9-11)
- Property tests provide strong correctness guarantees but can be added after core functionality works
- Each checkpoint ensures incremental validation before moving forward
- Given the 2-day deadline, prioritize tasks 1-11 and 13.1 for Day 1, leaving Day 2 for polish and testing
