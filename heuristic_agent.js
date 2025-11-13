// Improved Heuristic evaluation function with additional features
function evaluateBoard(board) {
    let aggregateHeight = 0;
    let completeLines = 0;
    let holes = 0;
    let bumpiness = 0;
    let wells = 0;
    let maxHeight = 0;
    let blockades = 0;
    let linesCleared = 0;
    
    let columnHeights = new Array(nx).fill(0);
    
    // Calculate aggregate height, column heights, and max height
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
    
    // Calculate complete lines (lines ready to clear)
    for (let y = 0; y < ny; y++) {
        let complete = true;
        for (let x = 0; x < nx; x++) {
            if (board[x][y] === 0) {
                complete = false;
                break;
            }
        }
        if (complete) {
            completeLines++;
            linesCleared++;
        }
    }
    
    // Calculate holes
    for (let x = 0; x < nx; x++) {
        let blockFound = false;
        for (let y = 0; y < ny; y++) {
            if (board[x][y] !== 0) {
                blockFound = true;
            } else if (blockFound && board[x][y] === 0) {
                holes++;
            }
        }
    }
    
    // Calculate bumpiness (surface roughness)
    for (let x = 0; x < nx - 1; x++) {
        bumpiness += Math.abs(columnHeights[x] - columnHeights[x + 1]);
    }
    
    // Calculate wells (columns lower than both neighbors)
    for (let x = 0; x < nx; x++) {
        let leftHeight = (x === 0) ? ny : columnHeights[x - 1];
        let rightHeight = (x === nx - 1) ? ny : columnHeights[x + 1];
        let currentHeight = columnHeights[x];
        
        // A well is a column that's lower than both neighbors
        if (currentHeight < leftHeight && currentHeight < rightHeight) {
            let wellDepth = Math.min(leftHeight, rightHeight) - currentHeight;
            wells += wellDepth;
        }
    }
    
    // Calculate blockades (covered holes - harder to clear)
    for (let x = 0; x < nx; x++) {
        let blockFound = false;
        for (let y = 0; y < ny; y++) {
            if (board[x][y] !== 0) {
                blockFound = true;
            } else if (blockFound && board[x][y] === 0) {
                // Check if this hole is covered by blocks above
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
    
    // Weighted combination of features
    // Based on empirical testing and machine learning principles
    return (
        -0.510066 * aggregateHeight +   // Original proven weight
        0.760666 * completeLines +      // Original proven weight
        -0.35663 * holes +              // Original proven weight
        -0.184483 * bumpiness +         // Original proven weight
        -0.75 * wells +                 // Wells are dangerous
        -0.45 * maxHeight +             // High stacks = game over risk
        -0.25 * blockades +             // Covered holes are worse than open holes
        +1.5 * linesCleared             // Immediate line clears = points
    );
}

// Function to deep copy the blocks array
function copyBlocks(blocks) {
    let new_blocks = [];
    for (let x = 0; x < nx; x++) {
        new_blocks[x] = [];
        for (let y = 0; y < ny; y++) {
            new_blocks[x][y] = blocks[x][y];
        }
    }
    return new_blocks;
}

// Generate all possible moves for the current piece
function getPossibleMoves(piece) {
    let moves = [];
    
    // For each rotation of the piece
    for (let dir = 0; dir < 4; dir++) {
        let testPiece = {
            type: piece.type,
            dir: dir,
            x: piece.x,
            y: piece.y
        };
        
        // For each horizontal position (allowing pieces near edges)
        for (let x = -piece.type.size + 1; x < nx; x++) {
            // Check if position is valid
            if (!occupied(testPiece.type, x, 0, dir)) {
                let y = getDropPosition(testPiece, x);
                
                // Double-check final position is valid
                if (!occupied(testPiece.type, x, y, dir)) {
                    let new_blocks = copyBlocks(blocks);
                    
                    // Place piece on the board
                    eachblock(testPiece.type, x, y, dir, function(bx, by) {
                        if (bx >= 0 && bx < nx && by >= 0 && by < ny) {
                            new_blocks[bx][by] = testPiece.type;
                        }
                    });
                    
                    moves.push({
                        piece: {type: testPiece.type, dir: dir, x: x, y: y},
                        x: x,
                        y: y,
                        board: new_blocks
                    });
                }
            }
        }
    }
    return moves;
}

// Select the best move based on heuristic evaluation
function selectBestMove(piece) {
    let moves = getPossibleMoves(piece);
    let bestMove = null;
    let bestScore = -Infinity;
    
    moves.forEach(move => {
        let score = evaluateBoard(move.board);
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    });
    
    return bestMove;
}

// Function to get the drop position of the piece
function getDropPosition(piece, x) {
    let y = 0;
    while (y < ny && !occupied(piece.type, x, y + 1, piece.dir)) {
        y++;
    }
    return y;
}
