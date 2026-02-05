# 5-Minute Demo Script

## 🎬 Exact Words to Say (Practice This!)

---

### SLIDE 1: Introduction (20 seconds)
**[Show problem statement PDF]**

"Good morning! I'm [Your Name], and I've built a Smart River Name Placement system. 

The challenge: automatically place river names inside complex polygon geometries in a way that's readable and visually appealing. 

Traditional centroid-based approaches don't work because they ignore river shape, width, and curvature."

---

### SLIDE 2: The Problem (30 seconds)
**[Keep PDF visible, point to ELBE example]**

"Look at this example - the river has sharp bends, varying width, and complex geometry. 

Where should we place the text? 

The centroid might be in a narrow section or sharp curve. We need something smarter.

My solution analyzes the entire river and scores every possible position using multiple factors."

---

### SLIDE 3: Live Demo - Part 1 (45 seconds)
**[Switch to browser at localhost:5173]**

"Let me show you. Here's my system running live.

**[Click 'Straight River']**
First, a simple baseline - straight river, text placed in the center. Easy.

**[Click 'Curved River']**
Now a gentle curve - notice how the text follows the river's natural flow.

**[Click 'Complex River']**
Here's where it gets interesting. This river has sharp bends.

**[Point to red areas]**
See these red overlays? Those are rejected areas - sharp curves where text would be unreadable.

**[Point to green circles]**
These green circles are candidate positions with their scores."

---

### SLIDE 4: Live Demo - Part 2 (45 seconds)
**[Stay in browser]**

"Now, the real challenge - the hackathon river with actual WKT polygon data.

**[Click 'Load Hackathon River (WKT)']**

This polygon has over 1,000 coordinate points. The system:
- Parses the WKT format
- Extracts a centerline from the polygon boundaries
- Analyzes geometry
- Scores candidates
- Places text optimally

All in about 16 milliseconds.

**[Point to metrics panel]**
Here you can see the analysis: curvature metrics, rejected segments, and the score breakdown."

---

### SLIDE 5: Interactive Demo (30 seconds)
**[Stay in browser]**

"Let me show you the interactivity.

**[Type 'Mississippi River' in the input]**
**[Click 'Update Name']**

The system recalculates for longer text.

**[Uncheck 'Show Rejected Areas']**
**[Uncheck 'Show Candidate Positions']**

You can toggle visualizations to see just the final result or understand the algorithm's decision-making process."

---

### SLIDE 6: The Algorithm (60 seconds)
**[Can stay in browser or switch to whiteboard]**

"How does it work? Multi-factor weighted scoring.

Every possible text position gets scored on 4 factors:

**1. Curvature - 40% weight**
Sharp curves make text hard to read, so this gets the highest penalty.
Uses 3-point angle calculation with smoothing.

**2. Width - 20% weight**
Wider sections give text breathing room.
Calculated from polygon boundary distances.

**3. Position - 20% weight**
Center placement is aesthetically pleasing.
Avoids edges where text might be cut off.

**4. Straightness - 20% weight**
Consistent direction ensures smooth text flow.
Measures variance in segment angles.

The algorithm generates all valid candidates, scores each one, and selects the highest. If there's a tie, it prefers the more centered option.

These weights are based on readability research - curvature has the biggest impact on legibility."

---

### SLIDE 7: Technical Highlights (45 seconds)
**[Can show GitHub or stay in browser]**

"Key technical achievements:

**WKT Polygon Parsing** - Handles multi-line format with thousands of coordinates

**Centerline Extraction** - Samples perpendicular cross-sections to find the medial axis between opposite banks

**Auto-Scaling** - Works with any coordinate system. Our hackathon river has coordinates in the 11,000-24,000 range.

**Comprehensive Testing** - 193 passing tests including property-based tests for edge cases.

**Real-time Performance** - 16 milliseconds for 1000-point polygons.

The entire system is built in vanilla JavaScript with no frameworks - just clean, efficient code."

---

### SLIDE 8: Closing (20 seconds)
**[Show GitHub repository]**

"This solution balances multiple competing factors - readability, aesthetics, and technical constraints. 

It's not just placing text at the centroid; it's understanding river geometry and making intelligent decisions.

The code is open source, fully tested, and ready for production use.

Thank you! I'm happy to answer questions."

---

## 🎯 Demo Flow Checklist

Before you start:
- [ ] Browser open to localhost:5173
- [ ] Problem statement PDF ready
- [ ] GitHub repository in another tab
- [ ] Console cleared (F12 → Clear)
- [ ] All buttons tested

During demo:
- [ ] Speak clearly and confidently
- [ ] Point to specific features
- [ ] Make eye contact with judges
- [ ] Pause for questions
- [ ] Show enthusiasm!

---

## ⏱️ Timing Breakdown

- Introduction: 20s
- Problem: 30s
- Demo Part 1: 45s
- Demo Part 2: 45s
- Interactive: 30s
- Algorithm: 60s
- Technical: 45s
- Closing: 20s
- **Total: 4:55** (leaves 5-65 seconds for questions)

---

## 🎤 Voice Tips

- **Pace**: Speak slightly slower than normal
- **Volume**: Loud enough for back of room
- **Enthusiasm**: Show you're excited about what you built
- **Pauses**: Pause after key points to let them sink in
- **Eye contact**: Look at judges, not just the screen

---

## 💡 If Things Go Wrong

### Demo doesn't load?
"Let me show you the code instead" → Open GitHub

### Button doesn't work?
"The algorithm works like this..." → Explain with PDF

### Forget what to say?
Look at metrics panel and describe what you see

### Nervous?
Take a deep breath, smile, and remember: **You built this. You know it better than anyone.**

---

## 🚀 Power Phrases

Use these to sound confident:

- "As you can see here..."
- "Notice how the algorithm..."
- "This is particularly interesting because..."
- "The key innovation is..."
- "What makes this unique is..."
- "The system handles this by..."

---

## 🎯 Remember

1. **Start strong**: Confident introduction
2. **Show, don't just tell**: Live demo is your strength
3. **Explain clearly**: Algorithm in simple terms
4. **End strong**: Confident closing
5. **Be yourself**: Authentic enthusiasm wins

**You've got this! 💪🚀**
