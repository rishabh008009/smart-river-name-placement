# Quick Answer Cheat Sheet - Print This!

## 🎯 The One Question You Know

**Q: What algorithm did you use and why?**

**A:** "I used a **multi-factor weighted scoring algorithm** that evaluates every possible text position using 4 factors:

1. **Curvature (40%)** - Penalizes curved sections because curved text is hard to read
2. **Width (20%)** - Prefers wider sections so text has breathing room  
3. **Position (20%)** - Favors center placement for aesthetics
4. **Straightness (20%)** - Rewards consistent direction for smooth text flow

I chose this over simpler approaches like centroid placement because:
- ✅ Considers river shape, not just center point
- ✅ Avoids problematic areas (sharp curves, narrow sections)
- ✅ Balances multiple competing factors
- ✅ Produces readable, aesthetically pleasing results

The weights are based on readability research - curvature has the biggest impact, so it gets 40%."

---

## 🔥 Top 10 Most Likely Questions

### 1. How does it work?
"5-stage pipeline: Parse WKT → Extract centerline → Analyze geometry → Score candidates → Place text"

### 2. What's the input format?
"WKT POLYGON format with thousands of coordinate pairs. I parse it, extract the centerline, and find the optimal path."

### 3. How do you handle edge cases?
"Text too long? Return best available with warning. All sections rejected? Provide fallback. Very narrow? Reject and use widest section."

### 4. What's the time complexity?
"O(n*m) where n=polygon points, m=candidates. ~16ms for 1000-point polygon. Fast enough for real-time."

### 5. Why JavaScript?
"Browser-native, no installation needed, Canvas API for graphics, instant demo, easy deployment."

### 6. How do you extract the centerline?
"Sample perpendicular cross-sections through the polygon, find intersections with boundaries, average them to get the middle, smooth the result."

### 7. How do you ensure text stays inside?
"Centerline is by definition inside the polygon. We only use sections wide enough for text with padding."

### 8. What would you improve with more time?
"Machine learning to learn optimal weights, collision detection with other features, multiple placements for long rivers, GPU acceleration."

### 9. How is this better than existing solutions?
"vs Centroid: considers shape. vs Manual: automated and scalable. vs Simple path: intelligent selection and multi-factor optimization."

### 10. Can you explain the scoring?
"Each candidate gets 4 scores (0-100). Multiply by weights (40%, 20%, 20%, 20%), sum them up. Highest score wins. Ties broken by preferring center."

---

## 💡 If You Get Stuck

### Nervous? Say This:
"Let me show you the code" → Open GitHub and walk through the files

### Demo Breaks? Say This:
"The algorithm works like this..." → Explain with the problem statement screenshot

### Don't Know Answer? Say This:
"That's a great question. Based on my current implementation, [explain what you did]. With more research, I'd explore [mention alternative]."

---

## 🎤 Opening Line

"Hi, I'm [Name]. I built a system that automatically places river names on maps by analyzing geometry and scoring thousands of possible positions to find the most readable placement."

---

## 🎬 Closing Line

"This solution balances readability, aesthetics, and technical constraints using transparent, multi-factor optimization. The code is tested, documented, and ready for production. Thank you!"

---

## 📊 Key Numbers to Remember

- **193 tests** passing
- **4 scoring factors** (40%, 20%, 20%, 20%)
- **~16ms** processing time
- **1000+ points** in hackathon river
- **7 core modules**
- **100% JavaScript**

---

## 🚨 Emergency Backup

If everything fails, you can still explain:
1. The problem (show PDF)
2. Your approach (draw on whiteboard)
3. The algorithm (explain scoring)
4. The results (show GitHub code)

**You know this inside-out. You got this! 💪**
