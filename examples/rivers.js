/**
 * Example river data for demonstration
 * Each example includes coordinate points and optional width data
 */

export const exampleRivers = {
  // Example 1: Straight river (simple baseline)
  straight: {
    name: 'Straight River',
    description: 'A simple straight river for baseline testing',
    coordinates: [
      [100, 300, 20],
      [200, 300, 22],
      [300, 300, 21],
      [400, 300, 23],
      [500, 300, 22],
      [600, 300, 21],
      [700, 300, 20]
    ]
  },

  // Example 2: Gently curved river (typical case)
  curved: {
    name: 'Curved River',
    description: 'A gently curved river representing typical scenarios',
    coordinates: [
      [100, 400, 18],
      [150, 380, 19],
      [200, 350, 20],
      [250, 320, 22],
      [300, 300, 24],
      [350, 290, 25],
      [400, 285, 26],
      [450, 290, 25],
      [500, 300, 24],
      [550, 320, 22],
      [600, 350, 20],
      [650, 380, 19],
      [700, 400, 18]
    ]
  },

  // Example 3: Complex river with sharp bends (challenging case)
  complex: {
    name: 'Complex River',
    description: 'A complex river with sharp bends and varying width',
    coordinates: [
      [100, 500, 15],
      [150, 480, 16],
      [200, 450, 18],
      [220, 400, 12],  // Narrow section
      [230, 350, 10],  // Very narrow
      [250, 300, 12],
      [300, 280, 20],
      [350, 270, 25],
      [400, 275, 28],
      [450, 300, 26],  // Sharp curve starts
      [480, 350, 22],
      [490, 400, 18],
      [485, 450, 16],  // Sharp curve
      [470, 480, 14],
      [450, 500, 15],
      [430, 510, 16],
      [410, 515, 18],
      [390, 512, 20],
      [370, 505, 22],
      [350, 490, 24],
      [340, 470, 25],
      [335, 450, 26],
      [340, 430, 25],
      [360, 415, 24],
      [390, 410, 22],
      [420, 415, 20],
      [450, 425, 18],
      [480, 440, 16],
      [510, 460, 15],
      [540, 485, 14],
      [570, 510, 15],
      [600, 530, 16],
      [630, 540, 18],
      [660, 535, 20],
      [690, 520, 22],
      [710, 500, 24]
    ]
  }
};
