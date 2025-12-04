// --- Core Game Constants & Variables ---
const BOARD_SIZE = 4;
let board = []; // 4x4 array to hold tile values (0 for empty)
let score = 0;
let isGameOver = false;

// --- Touch Tracking Variables ---
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
const SWIPE_THRESHOLD = 50; // Minimum distance (pixels) to register a swipe

// --- DOM Element References ---
const boardElement = document.getElementById('board');
const scoreElement = document.getElementById('score');
const messageElement = document.getElementById('message');
const newGameButton = document.getElementById('new-game-button');

// --- 1. Initialization and Setup ---

function initializeBoard() {
    // Reset the board array to all zeros
    board = Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(0));
    score = 0;
    isGameOver = false;
    scoreElement.textContent = score;
    messageElement.textContent = '';
    messageElement.classList.remove('incorrect');
    
    // Add two starting tiles (usually 2 or 4)
    addRandomTile();
    addRandomTile();
    
    drawBoard();
}

// --- 2. Drawing the Board (Rendering Logic) ---

function drawBoard() {
    boardElement.innerHTML = ''; // Clear the existing grid
    
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const value = board[r][c];
            
            // Create the cell container (the empty slot)
            const cell = document.createElement('div');
            cell.classList.add('cell');
            
            if (value > 0) {
                // If there's a tile, create the tile element inside the cell
                const tile = document.createElement('div');
                tile.classList.add('tile');
                
                // Set the value and corresponding color class
                tile.textContent = value;
                
                // Determine the correct CSS class based on the value
                if (value <= 2048) {
                    tile.classList.add(`tile-${value}`);
                } else {
                    tile.classList.add('tile-super'); // For values beyond 2048
                }
                
                cell.appendChild(tile);
            }
            
            boardElement.appendChild(cell);
        }
    }
}

// --- 3. Spawning New Tiles ---

function getEmptyCells() {
    const emptyCells = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === 0) {
                emptyCells.push({ r, c });
            }
        }
    }
    return emptyCells;
}

function addRandomTile() {
    const emptyCells = getEmptyCells();
    
    if (emptyCells.length === 0) {
        return; // No space left
    }
    
    // Select a random empty position
    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    const { r, c } = emptyCells[randomIndex];
    
    // 90% chance of a 2, 10% chance of a 4
    const newValue = (Math.random() < 0.9) ? 2 : 4;
    board[r][c] = newValue;
}

// --- 4. Tile Movement and Merging Logic ---

// Helper function to remove zeros and merge matching tiles in a single line (row/column)
function operateLine(line) {
    // 1. Filter out zeros (compacting)
    let newLine = line.filter(val => val !== 0);
    let scoreIncrease = 0;
    let didMerge = false;
    let originalLength = newLine.length;

    // 2. Merge tiles
    for (let i = 0; i < newLine.length - 1; i++) {
        if (newLine[i] !== 0 && newLine[i] === newLine[i + 1]) {
            newLine[i] *= 2; // Merge
            scoreIncrease += newLine[i];
            newLine[i + 1] = 0; // Set next tile to zero
            didMerge = true;
        }
    }

    // 3. Re-filter zeros (to consolidate merged tiles)
    newLine = newLine.filter(val => val !== 0);

    // 4. Pad with zeros to return to original length
    while (newLine.length < BOARD_SIZE) {
        newLine.push(0);
    }
    
    return { newLine, scoreIncrease, didMerge };
}

// Main move function (takes direction)
function moveTiles(direction) {
    if (isGameOver) return;
    
    let moved = false;
    let totalScoreIncrease = 0;
    
    // Deep clone the board before the move to check for changes
    const originalBoardSnapshot = JSON.stringify(board);

    for (let i = 0; i < BOARD_SIZE; i++) {
        let line;
        
        // 1. Get the line (row or column) based on direction
        if (direction === 'left' || direction === 'right') {
            line = board[i];
        } else { // up or down
            line = board.map(row => row[i]);
        }
        
        // 2. Reverse the line if moving right or down (for easier merge logic)
        if (direction === 'right' || direction === 'down') {
            line.reverse();
        }

        // 3. Operate (merge and compact) the line
        const { newLine, scoreIncrease, didMerge } = operateLine(line);

        totalScoreIncrease += scoreIncrease;
        
        // 4. Reverse the line back if needed
        if (direction === 'right' || direction === 'down') {
            newLine.reverse();
        }

        // 5. Put the operated line back into the main board
        if (direction === 'left' || direction === 'right') {
            board[i] = newLine;
        } else { // up or down
            for (let j = 0; j < BOARD_SIZE; j++) {
                board[j][i] = newLine[j];
            }
        }
    }
    
    // Check if the board actually changed state
    if (JSON.stringify(board) !== originalBoardSnapshot) {
        moved = true;
    }
    
    // Update score and game state
    if (moved) {
        score += totalScoreIncrease;
        scoreElement.textContent = score;
        addRandomTile();
        checkGameState();
        drawBoard();
    }
}

// --- 5. Game State Check ---

function checkGameState() {
    // Check for Win (reaching 2048)
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === 2048) {
                messageElement.textContent = '🏆 You Win! Keep Playing or Start New.';
            }
        }
    }

    // Check for Lose (no empty cells AND no possible moves)
    if (getEmptyCells().length === 0) {
        if (!canMove()) {
            isGameOver = true;
            messageElement.textContent = `Game Over! Final Score: ${score}`;
            messageElement.classList.add('incorrect'); // Use error styling
        }
    }
}

function canMove() {
    // Check for horizontal merges
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE - 1; c++) {
            if (board[r][c] === board[r][c + 1]) return true;
        }
    }
    // Check for vertical merges
    for (let c = 0; c < BOARD_SIZE; c++) {
        for (let r = 0; r < BOARD_SIZE - 1; r++) {
            if (board[r][c] === board[r + 1][c]) return true;
        }
    }
    return false;
}

// --- 6. Event Listeners ---

// Handle keyboard input for movement
document.addEventListener('keydown', (event) => {
    let direction;
    switch (event.key) {
        case 'ArrowUp':
            direction = 'up';
            break;
        case 'ArrowDown':
            direction = 'down';
            break;
        case 'ArrowLeft':
            direction = 'left';
            break;
        case 'ArrowRight':
            direction = 'right';
            break;
        default:
            return; // Ignore other keys
    }
    event.preventDefault(); // Stop page scrolling on arrow key press
    moveTiles(direction);
});

// New Game Button
newGameButton.addEventListener('click', initializeBoard);


// --- Touch Event Listeners for Swipe Control ---

// 6.1 Record the starting point of the touch
boardElement.addEventListener('touchstart', (event) => {
    // We only care about the first touch point for simplicity
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
    // Do NOT preventDefault here unless absolutely necessary, 
    // as it can block scrolling on many mobile browsers.
    // If you experience unwanted scrolling, change passive to false and uncomment:
    // event.preventDefault(); 
}, { passive: true }); 

// 6.2 Record the movement point for quick calculation
boardElement.addEventListener('touchmove', (event) => {
    // We update end point on move to handle quicker detection 
    touchEndX = event.touches[0].clientX;
    touchEndY = event.touches[0].clientY;
});


// 6.3 Calculate the swipe direction upon touch end
boardElement.addEventListener('touchend', (event) => {
    if (isGameOver) return;
    
    // Use the last recorded position (from touchmove or touchend)
    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;

    // Reset touch variables
    touchStartX = 0;
    touchStartY = 0;
    touchEndX = 0;
    touchEndY = 0;


    let direction;

    // Determine if the swipe was horizontal or vertical AND exceeded the threshold
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
        // Horizontal swipe
        direction = dx > 0 ? 'right' : 'left';
    } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > SWIPE_THRESHOLD) {
        // Vertical swipe
        direction = dy > 0 ? 'down' : 'up';
    } else {
        return; // Swipe too short or ambiguous
    }

    if (direction) {
        moveTiles(direction);
    }
});


// --- Initial Call ---
initializeBoard();