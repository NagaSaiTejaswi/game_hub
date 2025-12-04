// --- Core Game Variables ---
let currentBoard = [];     
let solutionBoard = [];    
let selectedCell = null;   
let mistakes = 0;
const MAX_MISTAKES = 3;
let selectedPadButton = null;

// --- DYNAMIC DIMENSIONS ---
let N = 9; // Current board size (9, 6, or 3)
let K = 3; // Current inner box size (3 for N=9, 2 for N=6, 1 for N=3)

const DIMENSIONS = {
    'easy': { N: 3, K: 1, maxKeep: 5 }, // N=3 (3x3 grid, no box rule, keep 3-5 cells)
    'medium': { N: 6, K: 2, maxKeep: 18 }, // N=6 (6x6 grid, 2x3 boxes, keep 15-18 cells)
    'hard': { N: 9, K: 3, maxKeep: 30 } // N=9 (9x9 grid, 3x3 boxes, keep 25-30 cells)
};

// --- Timer Variables ---
let timeElapsed = 0;
let timerInterval;

// --- Sudoku Generation Variables ---
let tempGrid = []; // Dynamic size array
const ALL_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// --- DOM Element References ---
const sudokuGrid = document.getElementById('sudoku-grid');
const numberPad = document.getElementById('number-pad');
const difficultySelect = document.getElementById('difficulty-select');
const newGameButton = document.getElementById('new-game-button');
const checkButton = document.getElementById('check-button');
const messageElement = document.getElementById('message');
const timerElement = document.getElementById('timer');
const mistakesElement = document.getElementById('mistakes');


// ###########################################
// ### SECTION 1: CORE GENERATION LOGIC    ###
// ###########################################

/**
 * Main function to generate a complete puzzle and its solution based on N.
 */
function generateSudoku() {
    // Initialize tempGrid dynamically
    tempGrid = Array(N).fill(0).map(() => Array(N).fill(0));
    
    // 1. Generate the fully solved board using backtracking
    fillGrid();
    const solution = tempGrid.map(row => [...row]);

    // 2. Remove cells to create the puzzle based on N and difficulty settings
    const { maxKeep } = DIMENSIONS[difficultySelect.value];
    // Calculate a dynamic minKeep based on maxKeep (e.g., maxKeep - 5)
    const minKeep = maxKeep - Math.floor(N * 0.5); 
    const cellsToKeep = Math.floor(Math.random() * (maxKeep - minKeep + 1)) + minKeep;
    
    const puzzle = removeCells(solution, cellsToKeep);

    return { puzzle, solution };
}

/**
 * Uses backtracking to recursively fill the NxN tempGrid.
 */
function fillGrid() {
    for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
            if (tempGrid[r][c] === 0) {
                // Numbers to try are 1 to N
                const numbers = ALL_NUMBERS.slice(0, N).sort(() => Math.random() - 0.5);

                for (let num of numbers) {
                    if (isSafe(r, c, num)) {
                        tempGrid[r][c] = num;
                        if (fillGrid()) {
                            return true;
                        }
                        tempGrid[r][c] = 0; // Backtrack
                    }
                }
                return false;
            }
        }
    }
    return true;
}

/**
 * Checks if 'num' can be placed in tempGrid[r][c] without conflicts.
 */
function isSafe(r, c, num) {
    // 1. Check row and column
    for (let i = 0; i < N; i++) {
        if (tempGrid[r][i] === num || tempGrid[i][c] === num) {
            return false;
        }
    }

    // 2. Check inner box (Only applies if N=6 or N=9)
    if (N > 3) {
        let boxRows = (N === 6) ? 2 : K; // 2 for 6x6, 3 for 9x9
        let boxCols = (N === 6) ? 3 : K; // 3 for 6x6, 3 for 9x9

        const boxStartRow = r - r % boxRows;
        const boxStartCol = c - c % boxCols;

        for (let i = 0; i < boxRows; i++) {
            for (let j = 0; j < boxCols; j++) {
                if (tempGrid[boxStartRow + i][boxStartCol + j] === num) {
                    return false;
                }
            }
        }
    }
    return true;
}

/**
 * Removes numbers from the solved grid until 'cellsToKeep' remains.
 */
function removeCells(solvedGrid, cellsToKeep) {
    const puzzle = solvedGrid.map(row => [...row]);
    let count = N * N;

    const allCoords = [];
    for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
            allCoords.push({ r, c });
        }
    }
    allCoords.sort(() => Math.random() - 0.5);

    for (const { r, c } of allCoords) {
        if (count <= cellsToKeep) break;
        puzzle[r][c] = 0;
        count--;
    }

    return puzzle;
}


// ###########################################
// ### SECTION 2: GAME STATE & DOM UTILS   ###
// ###########################################

/**
 * Creates the N*N cell divs and updates the grid's CSS columns.
 */
function createGrid() {
    sudokuGrid.innerHTML = '';
    
    // Set CSS grid property dynamically
    sudokuGrid.className = `grid-${N}x${N}`; // Sets class like "grid-9x9"
    sudokuGrid.style.gridTemplateColumns = `repeat(${N}, 1fr)`;
    sudokuGrid.style.gridTemplateRows = `repeat(${N}, 1fr)`;
    sudokuGrid.style.maxWidth = `${N * 50}px`; // Adjust visual width


    for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.addEventListener('click', handleCellSelection);
            sudokuGrid.appendChild(cell);
        }
    }
}

/**
 * Populates the DOM grid with numbers from the current board state.
 */
function displayBoard(board) {
    const cells = sudokuGrid.querySelectorAll('.cell');
    
    // Only display number pad buttons 1 to N
    document.querySelectorAll('.pad-button:not(.clear)').forEach(button => {
        const val = parseInt(button.dataset.value);
        button.style.display = (val <= N) ? 'flex' : 'none';
    });


    cells.forEach(cell => {
        const r = parseInt(cell.dataset.row);
        const c = parseInt(cell.dataset.col);
        const value = board[r][c];
        
        cell.textContent = value === 0 ? '' : value;
        cell.classList.remove('initial', 'selected', 'error');

        if (value !== 0) {
            cell.classList.add('initial'); 
            cell.removeEventListener('click', handleCellSelection);
        } else {
            cell.addEventListener('click', handleCellSelection);
        }
    });
}

/**
 * Starts the elapsed time timer.
 */
function startTimer() {
    clearInterval(timerInterval);
    timeElapsed = 0;
    timerElement.textContent = `Time Elapsed: 00:00`;
    
    timerInterval = setInterval(() => {
        timeElapsed++;
        const minutes = Math.floor(timeElapsed / 60);
        const seconds = timeElapsed % 60;
        timerElement.textContent = `Time Elapsed: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}


// ###########################################
// ### SECTION 3: GAME CONTROL & HANDLERS  ###
// ###########################################

/**
 * Initializes and starts a new Sudoku game.
 */
function startNewGame() {
    // 1. Reset state & Set Dynamic Dimensions
    clearInterval(timerInterval);
    selectedCell = null;
    mistakes = 0;
    
    const difficulty = difficultySelect.value;
    N = DIMENSIONS[difficulty].N;
    K = DIMENSIONS[difficulty].K;

    mistakesElement.textContent = `Mistakes: ${mistakes} / ${MAX_MISTAKES}`;
    messageElement.textContent = 'Starting new game...';

    // 2. Setup/Resize Grid
    createGrid(); 

    // 3. Generate a new puzzle and its solution
    const { puzzle, solution } = generateSudoku(); 
    
    currentBoard = puzzle.map(arr => [...arr]);
    solutionBoard = solution;

    // 4. Populate and display the board
    displayBoard(currentBoard);
    
    // 5. Reset message and start timer
    messageElement.textContent = '';
    startTimer();
}

/**
 * Handles cell selection by the user.
 */
function handleCellSelection(event) {
    // Deselect previous cell
    if (selectedCell) {
        selectedCell.classList.remove('selected');
    }

    const cell = event.target;
    
    // 2. Prevent selecting initial (pre-filled) cells.
    if (cell.classList.contains('initial')) {
        selectedCell = null;
        return;
    }
    
    // 3. Select the new cell and apply the highlight.
    selectedCell = cell;
    selectedCell.classList.add('selected');
}

/**
 * Handles input from the number pad.
 */
function handlePadInput(event) {
    if (!selectedCell) {
        messageElement.textContent = 'Please select a square first.';
        return;
    }

    const value = parseInt(event.currentTarget.dataset.value);
    const r = parseInt(selectedCell.dataset.row);
    const c = parseInt(selectedCell.dataset.col);

    // 1. HANDLE CLEAR (value 0)
    if (value === 0) {
        selectedCell.textContent = '';
        currentBoard[r][c] = 0; // Set the internal board value to 0
        selectedCell.classList.remove('error');
        selectedCell.classList.remove('hint-error'); // Also clear hint errors
        return;
    }
    
    // Ignore input greater than the current board size (e.g., input 7 on a 6x6 board)
    if (value > N) return;

    // 2. Handle Number Input (value 1-9)
    // Update the visual cell and the internal board state
    selectedCell.textContent = value;
    currentBoard[r][c] = value;

    // Check move immediately and check for win
    checkMove(r, c, value);
    checkWinCondition();
}

// --- Function to Handle Keyboard Input ---
function handleKeyboardInput(event) {
    // We only care about key presses when a cell is actively selected
    if (!selectedCell) {
        // Optional: Provide a message indicating a cell must be selected
        // messageElement.textContent = 'Please select a square first.';
        return; 
    }

    const key = event.key;
    let value = 0; // Default to 0 (Clear)

    // Check for number keys (1-9)
    if (key >= '1' && key <= String(N)) {
        value = parseInt(key);
    } 
    // Check for Clear (Delete/Backspace)
    else if (key === 'Delete' || key === 'Backspace') {
        // Value remains 0 for clearing
        event.preventDefault(); // Prevent browser back/navigation for backspace
    } else {
        // Ignore all other keys (letters, symbols, arrows, etc.)
        return;
    }

    const r = parseInt(selectedCell.dataset.row);
    const c = parseInt(selectedCell.dataset.col);

    // --- Apply the input (Logic mirrored from handlePadInput) ---

    // 1. Handle Clear (value 0)
    if (value === 0) {
        selectedCell.textContent = '';
        currentBoard[r][c] = 0;
        selectedCell.classList.remove('error', 'hint-error');
        // Clear number pad highlight if necessary (since no number was entered)
        if (selectedPadButton) {
            selectedPadButton.classList.remove('pad-selected');
            selectedPadButton = null;
        }
        return;
    }

    // 2. Handle Number Input (value 1-N)
    selectedCell.textContent = value;
    currentBoard[r][c] = value;

    // Optional: Highlight the corresponding number pad button temporarily
    const padButtonToHighlight = document.querySelector(`.pad-button[data-value="${value}"]`);
    if (selectedPadButton) {
        selectedPadButton.classList.remove('pad-selected');
    }
    if (padButtonToHighlight) {
        padButtonToHighlight.classList.add('pad-selected');
        selectedPadButton = padButtonToHighlight;
    }
    
    // Check move immediately and check for win
    checkMove(r, c, value);
    checkWinCondition();
}

/**
 * Checks if the last move made by the user is correct against the solution.
 */
function checkMove(r, c, value) {
    if (value === solutionBoard[r][c]) {
        selectedCell.classList.remove('error');
    } else {
        if (!selectedCell.classList.contains('error')) {
            mistakes++;
        }
        mistakesElement.textContent = `Mistakes: ${mistakes} / ${MAX_MISTAKES}`;
        selectedCell.classList.add('error');
        
        if (mistakes >= MAX_MISTAKES) {
            clearInterval(timerInterval);
            messageElement.textContent = `🚫 Game Over! Too many mistakes. Click 'New Game' to try again.`;
            sudokuGrid.querySelectorAll('.cell').forEach(cell => cell.removeEventListener('click', handleCellSelection));
            numberPad.querySelectorAll('.pad-button').forEach(btn => btn.removeEventListener('click', handlePadInput));
        }
    }
}

/**
 * Checks if the board is complete and correctly solved.
 */
function checkWinCondition() {
    // 1. Check if the board is visually complete (no zeros)
    const isComplete = currentBoard.every(row => row.every(cell => cell !== 0));
    
    if (isComplete && mistakes < MAX_MISTAKES) {
        // 2. Check if the complete board matches the solution
        const isSolved = currentBoard.every((row, r) => 
            row.every((cell, c) => cell === solutionBoard[r][c])
        );

        if (isSolved) {
            clearInterval(timerInterval);
            messageElement.textContent = `🎉 Congratulations! Puzzle solved in ${timeElapsed} seconds!`;
            // Disable further input
            sudokuGrid.querySelectorAll('.cell').forEach(cell => cell.removeEventListener('click', handleCellSelection));
        } else {
            messageElement.textContent = 'Board complete, but some numbers are still incorrect.';
        }
    }
}

/**
 * Handles the 'Check Solution' button click. Iterates through the entire
 * user-entered board and highlights incorrect cells without increasing the mistake count.
 */
function handleCheckSolution() {
    messageElement.textContent = 'Checking board for errors...';
    let errorsFound = false;

    sudokuGrid.querySelectorAll('.cell:not(.initial)').forEach(cell => {
        const r = parseInt(cell.dataset.row);
        const c = parseInt(cell.dataset.col);
        const userValue = currentBoard[r][c];

        // Only check cells that have a value entered by the user
        if (userValue !== 0) {
            if (userValue !== solutionBoard[r][c]) {
                cell.classList.add('hint-error');
                errorsFound = true;
            } else {
                cell.classList.remove('hint-error');
            }
        } else {
            cell.classList.remove('hint-error');
        }
    });

    if (errorsFound) {
        messageElement.textContent = 'Some errors highlighted in red. Find the solution!';
    } else {
        messageElement.textContent = 'No errors found so far! Keep going!';
    }

    // Remove hint-error class after a short delay (e.g., 3 seconds)
    setTimeout(() => {
        sudokuGrid.querySelectorAll('.hint-error').forEach(cell => {
            cell.classList.remove('hint-error');
        });
        messageElement.textContent = ''; // Clear message after hint disappears
    }, 3000);
}


// ###########################################
// ### SECTION 4: INITIALIZATION           ###
// ###########################################

document.addEventListener('DOMContentLoaded', () => {
    // Setup control listeners

    // 1. Setup structure and pad listeners
    createGrid(); 
    document.querySelectorAll('.pad-button').forEach(button => {
        button.addEventListener('click', handlePadInput);
    });
    
    newGameButton.addEventListener('click', startNewGame);
    difficultySelect.addEventListener('change', startNewGame);
    checkButton.addEventListener('click', () => {
        // Optional: Provide instant feedback on incorrect cells
        if (mistakes < MAX_MISTAKES) {
            checkWinCondition();
        }
    });

    // Update the checkButton listener
    checkButton.addEventListener('click', handleCheckSolution);
    document.addEventListener('keydown', handleKeyboardInput);

    // Start the first game
    startNewGame(); 
});