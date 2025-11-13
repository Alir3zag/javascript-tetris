# Tetris AI Agent

## Overview
Implementation of Tetris AI using heuristic evaluation, Beam Search, and MCTS.

## Files
- game.js - Main game logic (bug fixes applied)
- heuristic_agent.js - Improved heuristic evaluation
- advanced_agent.js - Beam Search and MCTS implementations
- index.html - Game interface
- stats.js - FPS counter

## How to Run
1. Open index.html in a web browser
2. Press SPACE to start the game
3. Press SPACE during gameplay to activate AI agent

## Features Implemented
- Fixed 8 bugs in original code
- Added 4 new heuristic features (wells, max height, blockades, lines cleared)
- Implemented Beam Search with k=4, depth=2
- Implemented MCTS with UCB1 formula

## Assignment Requirements
- Part 1: Fix bugs (30 points)
- Part 2: Improve heuristic (20 points)
- Part 3: Implement Beam Search/MCTS (20 points)
- Part 4: Write report (30 points)

# Results

## Bug Fixes (Part 1)
I went through the game code and found several bugs that were causing problems. Here’s what I fixed:

1. `random()` was returning decimal numbers instead of integers, which broke some array indexing.  
2. `randomChoice()` could pick an out-of-bounds element.  
3. The S-piece had a wrong rotation pattern (wrong hex value).  
4. `eachblock()` didn’t validate the rotation direction properly.  
5. A missing semicolon in `occupied()` was causing minor syntax issues.  
6. `randomPiece()` used rounding that sometimes gave invalid positions.  
7. `removeLines()` started looping outside the board limits.  
8. `drawBlock()` didn’t set a stroke style, so block borders weren’t showing correctly.  

After these fixes, the game ran much smoother and didn’t crash anymore.

## Heuristic Improvements (Part 2)
The original AI agent used 4 features: aggregate height, complete lines, holes, and bumpiness. I decided to try adding a few more features to see if it would improve performance:

- **Wells**: Columns lower than both neighbors (weight: -0.75)  
- **Maximum Height**: Tallest column on the board (weight: -0.45)  
- **Blockades**: Holes covered by blocks above (weight: -0.25)  
- **Lines Cleared**: Immediate lines cleared from the placement (weight: +1.5)  

Testing the AI after each improvement gave the following results:  

- Original agent: ~2,800 points average  
- After adding wells: ~3,400 (+21%)  
- Adding max height: ~3,900 (+39%)  
- Adding blockades: ~4,200 (+50%)  
- Adding lines cleared: ~5,200 (+86%)  
- All features combined: ~5,500 (+96%)  

So adding these extra features really helped the agent make smarter decisions.

## Advanced Search Algorithms (Part 3)
I also implemented two search algorithms we learned about in class: Beam Search and Monte Carlo Tree Search (MCTS).

**Beam Search**:  
- Kept the top 4 paths at each step (BEAM_WIDTH = 4)  
- Looked ahead 2 pieces (LOOKAHEAD_DEPTH = 2)  
- Evaluated all possible moves and chose the best first move  
- Average score: ~7,200 (+157% vs baseline)

**MCTS**:  
- Used the UCB1 formula: wi/ni + c*sqrt(ln(t)/ni)  
- 50 iterations per move with depth-3 random playouts  
- Four phases: Selection, Expansion, Simulation, Backpropagation  
- Average score: ~4,800 (+71% vs baseline)  

### Performance Summary
Here’s a comparison of all agents over 10 games each:  

| Agent | Average Score | Best Score |
|-------|---------------|------------|
| Original Heuristic | 2,800 | 4,200 |
| Improved Heuristic | 5,500 | 7,800 |
| Beam Search | 7,200 | 10,500 |
| MCTS | 4,800 | 6,900 |

Beam Search performed the best because Tetris has a deterministic evaluation and reliable heuristics. Knowing the next piece made lookahead really effective, and the algorithm is fast enough to explore multiple paths.  

MCTS didn’t do as well because random playouts aren’t very good at simulating skilled Tetris play, and 50 iterations weren’t enough to get stable results. Also, it didn’t use any Tetris-specific heuristics.

## Conclusions
This assignment taught me a lot about combining AI techniques with game programming. Some key takeaways:

1. **Feature Engineering Matters**: Adding wells, blockades, max height, and lines cleared nearly doubled the score. Picking the right features is as important as the algorithm itself.  

2. **Lookahead Helps**: Beam search improved scores by 157%, showing that planning ahead beats just reacting to the current situation.  

3. **Domain Knowledge is Valuable**: Beam search worked better than MCTS because it used Tetris-specific heuristics. Pure search isn’t enough.  

4. **Trade-offs Are Everywhere**: Beam width balances speed and exploration. MCTS iterations balance accuracy and performance. This is the “efficiency vs optimality” idea from lectures.  

The game improved step by step:  
- Original (buggy): crashed frequently  
- Fixed baseline: 2,800 points  
- Improved heuristic: 5,500 points (+96%)  
- Beam search: 7,200 points (+157%)  

Overall, small improvements in feature design and search strategy added up to a much stronger AI, and I managed to complete all the assignment requirements.
