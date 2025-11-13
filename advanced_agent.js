//-------------------------------------------------------------------------
// BEAM SEARCH AGENT
//-------------------------------------------------------------------------

const BEAM_WIDTH = 4;   
const LOOKAHEAD_DEPTH = 2;

// Beam search - keeps the best k moves and looks ahead
function selectBestMoveBeamSearch(piece) {
    let currentBoard = copyBlocks(blocks);
    
    // Try all possible placements for current piece
    let beam = [];
    for (let dir = 0; dir < 4; dir++) {
        for (let x = -piece.type.size + 1; x < nx; x++) {
            if (!occupiedOnBoard(piece.type, x, 0, dir, currentBoard)) {
                let y = getDropPositionForBeam(piece.type, x, dir, currentBoard);
                
                if (!occupiedOnBoard(piece.type, x, y, dir, currentBoard)) {
                    // Simulate placing the piece
                    let newBoard = copyBlocks(currentBoard);
                    eachblock(piece.type, x, y, dir, function(bx, by) {
                        if (bx >= 0 && bx < nx && by >= 0 && by < ny) {
                            newBoard[bx][by] = piece.type;
                        }
                    });
                    
                    let linesCleared = clearLinesFromBoard(newBoard);
                    let score = evaluateBeamBoard(newBoard, linesCleared);
                    
                    beam.push({
                        move: {piece: {type: piece.type, dir: dir, x: x, y: y}, x: x, y: y},
                        board: newBoard,
                        score: score,
                        firstMove: {piece: {type: piece.type, dir: dir, x: x, y: y}, x: x, y: y}
                    });
                }
            }
        }
    }
    
    // Keep only the top k moves
    beam.sort((a, b) => b.score - a.score);
    beam = beam.slice(0, BEAM_WIDTH);
    
    // Look ahead to the next piece if we can
    if (next && LOOKAHEAD_DEPTH > 1) {
        let nextBeam = [];
        
        for (let state of beam) {
            // Try placing the next piece after each beam state
            for (let dir = 0; dir < 4; dir++) {
                for (let x = -next.type.size + 1; x < nx; x++) {
                    if (!occupiedOnBoard(next.type, x, 0, dir, state.board)) {
                        let y = getDropPositionForBeam(next.type, x, dir, state.board);
                        
                        if (!occupiedOnBoard(next.type, x, y, dir, state.board)) {
                            let newBoard = copyBlocks(state.board);
                            eachblock(next.type, x, y, dir, function(bx, by) {
                                if (bx >= 0 && bx < nx && by >= 0 && by < ny) {
                                    newBoard[bx][by] = next.type;
                                }
                            });
                            
                            let linesCleared = clearLinesFromBoard(newBoard);
                            let score = evaluateBeamBoard(newBoard, linesCleared);
                            
                            nextBeam.push({
                                board: newBoard,
                                score: score,
                                firstMove: state.firstMove  // remember the original move
                            });
                        }
                    }
                }
            }
        }
        
        if (nextBeam.length > 0) {
            nextBeam.sort((a, b) => b.score - a.score);
            
            // Group by first move and average the scores
            let moveScores = {};
            for (let state of nextBeam) {
                let key = state.firstMove.x + '_' + state.firstMove.piece.dir;
                if (!moveScores[key]) {
                    moveScores[key] = {move: state.firstMove, scores: []};
                }
                moveScores[key].scores.push(state.score);
            }
            
            // Pick the first move with best average outcome
            let bestMove = null;
            let bestAvg = -Infinity;
            for (let key in moveScores) {
                let avg = moveScores[key].scores.reduce((a, b) => a + b, 0) / moveScores[key].scores.length;
                if (avg > bestAvg) {
                    bestAvg = avg;
                    bestMove = moveScores[key].move;
                }
            }
            
            return bestMove;
        }
    }
    
    // No lookahead possible, just return the best immediate move
    return beam.length > 0 ? beam[0].firstMove : null;
}

function getDropPositionForBeam(type, x, dir, board) {
    let y = 0;
    while (y < ny && !occupiedOnBoard(type, x, y + 1, dir, board)) {
        y++;
    }
    return y;
}

function clearLinesFromBoard(board) {
    let linesCleared = 0;
    for (let y = ny - 1; y >= 0; y--) {
        let complete = true;
        for (let x = 0; x < nx; x++) {
            if (board[x][y] === 0) {
                complete = false;
                break;
            }
        }
        if (complete) {
            linesCleared++;
            // shift everything down
            for (let yy = y; yy > 0; yy--) {
                for (let x = 0; x < nx; x++) {
                    board[x][yy] = board[x][yy - 1];
                }
            }
            for (let x = 0; x < nx; x++) {
                board[x][0] = 0;
            }
            y++; // check this row again
        }
    }
    return linesCleared;
}

function evaluateBeamBoard(board, linesCleared) {
    let aggregateHeight = 0;
    let holes = 0;
    let bumpiness = 0;
    let wells = 0;
    let maxHeight = 0;
    let blockades = 0;
    
    let columnHeights = new Array(nx).fill(0);
    
    // get column heights
    for (let x = 0; x < nx; x++) {
        for (let y = 0; y < ny; y++) {
            if (board[x][y] !== 0) {
                columnHeights[x] = ny - y;
                aggregateHeight += columnHeights[x];
                maxHeight = Math.max(maxHeight, columnHeights[x]);
                break;
            }
        }
    }
    
    // count holes
    for (let x = 0; x < nx; x++) {
        let blockFound = false;
        for (let y = 0; y < ny; y++) {
            if (board[x][y] !== 0) {
                blockFound = true;
            } else if (blockFound && board[x][y] === 0) {
                holes++;
                
                // is this hole covered?
                let covered = false;
                for (let y2 = y - 1; y2 >= 0; y2--) {
                    if (board[x][y2] !== 0) {
                        covered = true;
                        break;
                    }
                }
                if (covered) blockades++;
            }
        }
    }
    
    // surface roughness
    for (let x = 0; x < nx - 1; x++) {
        bumpiness += Math.abs(columnHeights[x] - columnHeights[x + 1]);
    }
    
    // wells (dangerous dips in the surface)
    for (let x = 0; x < nx; x++) {
        let leftHeight = (x === 0) ? ny : columnHeights[x - 1];
        let rightHeight = (x === nx - 1) ? ny : columnHeights[x + 1];
        let currentHeight = columnHeights[x];
        
        if (currentHeight < leftHeight && currentHeight < rightHeight) {
            wells += Math.min(leftHeight, rightHeight) - currentHeight;
        }
    }
    
    // weights tuned from testing
    return (
        -0.51 * aggregateHeight +
        2.0 * linesCleared +        // lines cleared are worth more in lookahead
        -0.36 * holes +
        -0.18 * bumpiness +
        -0.75 * wells +
        -0.45 * maxHeight +
        -0.3 * blockades
    );
}


//-------------------------------------------------------------------------
// MCTS AGENT
// Uses UCB1 to balance exploration vs exploitation
//-------------------------------------------------------------------------

const MCTS_ITERATIONS = 50;
const MCTS_C = 1.414;  // sqrt(2)
const MCTS_DEPTH = 3;

class MCTSNode {
    constructor(move, board) {
        this.move = move;
        this.board = board;
        this.wins = 0;
        this.visits = 0;
        this.children = [];
        this.parent = null;
    }
    
    // UCB1 formula: wi/ni + c*sqrt(ln(t)/ni)
    ucb1(parentVisits) {
        if (this.visits === 0) return Infinity;  // unvisited nodes get priority
        
        let exploitation = this.wins / this.visits;
        let exploration = MCTS_C * Math.sqrt(Math.log(parentVisits) / this.visits);
        
        return exploitation + exploration;
    }
    
    selectBestChild() {
        let parentVisits = this.visits;
        return this.children.reduce((best, child) => 
            child.ucb1(parentVisits) > best.ucb1(parentVisits) ? child : best
        );
    }
}

function selectBestMoveMCTS(piece) {
    let currentBoard = copyBlocks(blocks);
    let root = new MCTSNode(null, currentBoard);
    
    // run a bunch of simulations
    for (let i = 0; i < MCTS_ITERATIONS; i++) {
        let node = root;
        let board = copyBlocks(currentBoard);
        
        // 1. selection - go down the tree using UCB1
        while (node.children.length > 0) {
            node = node.selectBestChild();
            board = copyBlocks(node.board);
        }
        
        // 2. expansion - add child nodes
        if (node.visits > 0 || node === root) {
            let moves = getAllMovesForMCTS(piece, board);
            for (let move of moves) {
                let newBoard = applyMoveToBoard(move, board);
                let child = new MCTSNode(move, newBoard);
                child.parent = node;
                node.children.push(child);
            }
            
            if (node.children.length > 0) {
                node = node.children[0];
                board = copyBlocks(node.board);
            }
        }
        
        // 3. simulation - random playout
        let reward = simulateRandomPlayout(board, MCTS_DEPTH);
        
        // 4. backpropagation - update all parent nodes
        while (node !== null) {
            node.visits++;
            node.wins += reward;
            node = node.parent;
        }
    }
    
    // pick the most visited move (not highest score)
    if (root.children.length > 0) {
        let bestChild = root.children.reduce((best, child) => 
            child.visits > best.visits ? child : best
        );
        return bestChild.move;
    }
    
    return null;
}

function getAllMovesForMCTS(piece, board) {
    let moves = [];
    for (let dir = 0; dir < 4; dir++) {
        for (let x = -piece.type.size + 1; x < nx; x++) {
            let y = getDropPositionForBeam(piece.type, x, dir, board);
            if (!occupiedOnBoard(piece.type, x, y, dir, board)) {
                moves.push({piece: {type: piece.type, dir: dir, x: x, y: y}, x: x, y: y});
            }
        }
    }
    return moves;
}

function applyMoveToBoard(move, board) {
    let newBoard = copyBlocks(board);
    eachblock(move.piece.type, move.x, move.y, move.piece.dir, function(x, y) {
        if (x >= 0 && x < nx && y >= 0 && y < ny) {
            newBoard[x][y] = move.piece.type;
        }
    });
    clearLinesFromBoard(newBoard);
    return newBoard;
}

function occupiedOnBoard(type, x, y, dir, board) {
    let result = false;
    eachblock(type, x, y, dir, function(bx, by) {
        if ((bx < 0) || (bx >= nx) || (by < 0) || (by >= ny) || board[bx][by]) {
            result = true;
        }
    });
    return result;
}

function simulateRandomPlayout(board, depth) {
    let simBoard = copyBlocks(board);
    let totalScore = 0;
    
    for (let d = 0; d < depth; d++) {
        // pick a random piece
        let randomPiece = [i, j, l, o, s, t, z][Math.floor(Math.random() * 7)];
        let moves = getAllMovesForMCTS({type: randomPiece}, simBoard);
        
        if (moves.length === 0) break;  // game over
        
        // place it randomly
        let move = moves[Math.floor(Math.random() * moves.length)];
        simBoard = applyMoveToBoard(move, simBoard);
        
        totalScore += evaluateBeamBoard(simBoard, 0);
    }
    
    return totalScore / (depth * 100);
}
