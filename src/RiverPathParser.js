/**
 * RiverPathParser
 * Converts input coordinate data into structured river path representation
 * Supports both coordinate arrays and WKT POLYGON format
 */

import { WKTParser } from './WKTParser.js';

export class RiverPathParser {
  constructor() {
    this.wktParser = new WKTParser();
  }

  /**
   * Parse coordinate array or WKT string into RiverPath object
   * @param {Array<[number, number]> | Array<[number, number, number]> | string} data
   * @returns {RiverPath | Error}
   */
  parse(data) {
    let coordinates;

    // Check if input is a WKT string
    if (typeof data === 'string') {
      try {
        // Parse WKT POLYGON and extract centerline
        const polygonCoords = this.wktParser.parsePolygon(data);
        coordinates = this.wktParser.extractCenterline(polygonCoords);
      } catch (error) {
        return new Error(`WKT parsing failed: ${error.message}`);
      }
    } else if (Array.isArray(data)) {
      coordinates = data;
    } else {
      return new Error('Invalid input: expected coordinate array or WKT string');
    }

    // Validate input first
    const validationResult = this.validate(coordinates);
    if (!validationResult.valid) {
      return new Error(validationResult.error);
    }

    // Extract points and optional width data
    const points = [];
    const widths = [];
    let hasWidthData = false;

    for (const coord of coordinates) {
      points.push({ x: coord[0], y: coord[1] });
      
      if (coord.length === 3) {
        hasWidthData = true;
        widths.push(coord[2]);
      } else if (hasWidthData) {
        // If we started with width data, all points should have it
        widths.push(null);
      }
    }

    // Calculate total path length
    let totalLength = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      totalLength += Math.sqrt(dx * dx + dy * dy);
    }

    // Calculate bounding box
    let minX = points[0].x;
    let maxX = points[0].x;
    let minY = points[0].y;
    let maxY = points[0].y;

    for (let i = 1; i < points.length; i++) {
      minX = Math.min(minX, points[i].x);
      maxX = Math.max(maxX, points[i].x);
      minY = Math.min(minY, points[i].y);
      maxY = Math.max(maxY, points[i].y);
    }

    // Create RiverPath object
    return {
      points,
      widths: hasWidthData ? widths : null,
      length: totalLength,
      bounds: { minX, maxX, minY, maxY }
    };
  }

  /**
   * Validate coordinate data
   * @param {Array} coordinates
   * @returns {ValidationResult}
   */
  validate(coordinates) {
    // Check if coordinates is an array
    if (!Array.isArray(coordinates)) {
      return {
        valid: false,
        error: 'Coordinates must be an array'
      };
    }

    // Check minimum number of points
    if (coordinates.length < 3) {
      return {
        valid: false,
        error: 'River path must have at least 3 coordinate points'
      };
    }

    // Validate each coordinate
    for (let i = 0; i < coordinates.length; i++) {
      const coord = coordinates[i];

      // Check if coordinate is an array
      if (!Array.isArray(coord)) {
        return {
          valid: false,
          error: `Coordinate at index ${i} must be an array`
        };
      }

      // Check coordinate length (must be [x, y] or [x, y, width])
      if (coord.length < 2 || coord.length > 3) {
        return {
          valid: false,
          error: `Coordinate at index ${i} must have 2 or 3 elements [x, y] or [x, y, width]`
        };
      }

      // Check if values are numeric
      for (let j = 0; j < coord.length; j++) {
        if (typeof coord[j] !== 'number' || !isFinite(coord[j])) {
          return {
            valid: false,
            error: `Coordinates must be numeric [x, y] or [x, y, width] arrays`
          };
        }
      }
    }

    return { valid: true };
  }
}
