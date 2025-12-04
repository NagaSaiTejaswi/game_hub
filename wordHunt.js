// --- Core Game Variables & Master Difficulty Word Lists ---
let gridSize = 8;

// Master lists should be large enough to draw random subsets from.
const EASY_WORDS_MASTER = [
    "CODE", "HTML", "CSS", "ARRAY", "GRID", "NODE", "LOOP", 
    "CLASS", "PIXEL", "WIDTH", "EVENT", "BUG", "TEST", "RUN",
    "DATA", "FILE", "DIR", "KEY", "URL", "TIP", "END" 
];

const MEDIUM_WORDS_MASTER = [
    "JAVASCRIPT", "FUNCTION", "VARIABLE", "RENDER", "CONSOLE",
    "ELEMENT", "ALGORITHM", "LOGIC", "ENGINE", "BOOLEAN", 
    "SYNTAX", "OBJECT", "STRING", "ASSETS", "BUILD", "SERVER",
    "CLIENT", "NETWORK", "SOCKET", "HEADER", "FOOTER"
];

const HARD_WORDS_MASTER = [
    "COMPILER", "ITERATION", "DECLARED", "FRAMEWORK", "REPOSITORY",
    "DEPENDENCY", "ASYNC", "PROMISE", "DEBUGGER", "POLYFILL", 
    "BACKEND", "FRONTEND", "DATABASE", "API", "FIREBASE",
    "AUTHENTICATION", "OPTIMIZATION", "ENVIRONMENT", "INHERITANCE", "ARCHITECTURE"
];

let wordList = []; 
let currentWordMap = []; 
let foundWords = [];
let isDrawing = false; // Initial state must be false
let currentSelection = []; 
let score = 0;

// --- Timer Variables ---
const TIME_LIMIT_EASY = 180; // 3 minutes
const TIME_LIMIT_MEDIUM = 120; // 2 minutes
const TIME_LIMIT_HARD = 90; // 1.5 minutes
let timeLeft = TIME_LIMIT_EASY;
let timerInterval;

// --- DOM Element References ---
const gridElement = document.getElementById('word-grid');
const sizeSelect = document.getElementById('grid-size-select');
const newPuzzleButton = document.getElementById('new-puzzle-button');
const wordListElement = document.getElementById('word-list');
const messageElement = document.getElementById('message');
const foundCountElement = document.getElementById('words-found-count');
const totalCountElement = document.getElementById('total-words-count');
const timerElement = document.getElementById('timer'); 

// --- 1. Initialization and Board Generation ---

function getRandomSubset(arr, size) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, size);
}

function getWordListByDifficulty(size) {
    if (size === 8) {
        timeLeft = TIME_LIMIT_EASY;
        return getRandomSubset(EASY_WORDS_MASTER, 7);
    } else if (size === 10) {
        timeLeft = TIME_LIMIT_MEDIUM;
        return getRandomSubset(MEDIUM_WORDS_MASTER, 10);
    } else if (size === 12) {
        timeLeft = TIME_LIMIT_HARD;
        return getRandomSubset(HARD_WORDS_MASTER, 12);
    } 
    timeLeft = TIME_LIMIT_EASY;
    return getRandomSubset(EASY_WORDS_MASTER, 7); 
}

function initializeGame() {
    gridSize = parseInt(sizeSelect.value);
    
    // 1. Set word list and time limit based on difficulty
    wordList = getWordListByDifficulty(gridSize); 
    
    foundWords = [];
    score = 0;
    isDrawing = false; // Reset drawing state
    messageElement.textContent = '';
    
    currentWordMap = generateGrid(gridSize, wordList); 
    
    renderGrid();
    renderWordList();
    startTimer(); 
}

// --- TIMER FUNCTIONS ---

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerElement.textContent = `Time Left: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function startTimer() {
    stopTimer(); 
    updateTimerDisplay();

    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            stopTimer();
            endGame('time_up');
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

function endGame(reason) {
    stopTimer();
    // CRITICAL FIX: Ensure isDrawing is false when the game ends
    isDrawing = false; 
    
    // Disable all grid cells from further selection/interaction
    document.querySelectorAll('.grid-cell').forEach(cell => {
        cell.style.pointerEvents = 'none';
    });
    
    if (reason === 'time_up') {
        messageElement.textContent = "⌛ Time's Up! Game Over. Click 'New Puzzle' to play again.";
        messageElement.className = 'feedback incorrect';
    } else if (reason === 'won') {
        messageElement.textContent = `🏆 All words found in time! Your score: ${score}. Click 'New Puzzle' for a challenge.`;
        messageElement.className = 'feedback correct';
    }
}
// --- END TIMER FUNCTIONS ---


function generateGrid(size, words) {
    let grid = Array(size).fill(0).map(() => Array(size).fill(''));
    
    const directions = [
        [0, 1], [0, -1], [1, 0], [-1, 0], 
        [1, 1], [1, -1], [-1, 1], [-1, -1]
    ];

    words.forEach(word => {
        let placed = false;
        let attempts = 0;
        const maxAttempts = size * size * 4; 

        while (!placed && attempts < maxAttempts) {
            attempts++;

            const rStart = Math.floor(Math.random() * size);
            const cStart = Math.floor(Math.random() * size);
            const [rDir, cDir] = directions[Math.floor(Math.random() * directions.length)];

            let r = rStart;
            let c = cStart;
            let wordFits = true;
            
            for (let i = 0; i < word.length; i++) {
                if (r < 0 || r >= size || c < 0 || c >= size || (grid[r][c] !== '' && grid[r][c] !== word[i])) {
                    wordFits = false; 
                    break;
                }
                r += rDir;
                c += cDir;
            }

            if (wordFits) {
                r = rStart;
                c = cStart;
                for (let i = 0; i < word.length; i++) {
                    grid[r][c] = word[i];
                    r += rDir;
                    c += cDir;
                }
                placed = true;
            }
        }
    });
    
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (grid[r][c] === '') {
                const randomChar = alphabet[Math.floor(Math.random() * alphabet.length)];
                grid[r][c] = randomChar;
            }
        }
    }
    
    return grid;
}

function renderGrid() {
    gridElement.innerHTML = '';
    
    gridElement.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    gridElement.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;

    // Remove listeners before re-adding them to prevent memory leaks/double triggers
    document.removeEventListener('mousemove', handleSelectionProgress);
    document.removeEventListener('mouseup', handleEndSelection);
    document.removeEventListener('touchmove', handleTouchProgress);
    document.removeEventListener('touchend', handleEndSelection);
    
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            cell.textContent = currentWordMap[r][c];
            cell.dataset.row = r;
            cell.dataset.col = c;
            
            // Mouse event listener on the cell
            cell.addEventListener('mousedown', handleStartSelection);
            
            // Touch event listener on the cell
            cell.addEventListener('touchstart', (e) => {
                // Pass the touch object to the handler
                handleStartSelection(e.touches[0]);
                e.preventDefault(); 
            }, { passive: false });
            
            gridElement.appendChild(cell);
        }
    }
    
    // Add global listeners for drag/move events
    document.addEventListener('mousemove', handleSelectionProgress);
    document.addEventListener('mouseup', handleEndSelection);
    document.addEventListener('touchmove', handleTouchProgress, { passive: false });
    document.addEventListener('touchend', handleEndSelection);
}

function renderWordList() {
    wordListElement.innerHTML = '';
    totalCountElement.textContent = wordList.length;
    foundCountElement.textContent = foundWords.length;
    
    wordList.forEach(word => {
        const li = document.createElement('li');
        li.textContent = word;
        li.dataset.word = word;
        if (foundWords.includes(word)) {
            li.classList.add('found-word');
        }
        wordListElement.appendChild(li);
    });
}


// --- 2. Selection Handling ---

function getCellCoordinatesFromEvent(eventOrElement) {
    let target = eventOrElement.target || eventOrElement;
    
    if (target.dataset.row === undefined) {
         // If target isn't the cell itself (e.g., event target is text node or touch moves quickly), find the closest cell
        target = target.closest('.grid-cell');
    }
    
    if (target && target.dataset.row !== undefined) {
        return {
            r: parseInt(target.dataset.row),
            c: parseInt(target.dataset.col),
            element: target
        };
    }
    return null;
}

function handleStartSelection(event) {
    // FIX: Check if the game is still running (time left > 0)
    if (foundWords.length === wordList.length || timeLeft <= 0) return; 
    
    // FIX: Get the coordinates from the correct event type
    const startEvent = event.touches ? event : event.target; // event.target for mousedown, event for touchstart
    const coords = getCellCoordinatesFromEvent(startEvent);

    if (coords && !coords.element.classList.contains('found')) {
        // CRITICAL FIX: Set isDrawing to true immediately upon valid start
        isDrawing = true; 
        currentSelection = [];
        clearSelectionStyles();
        
        // Add the starting cell to the selection
        addToSelection(coords.r, coords.c);
    }

    if (!event.touches && event.preventDefault) {
        event.preventDefault(); 
    }
}

function handleSelectionProgress(event) {
    if (!isDrawing || timeLeft <= 0) return;
    
    // Stop selection if mouse button is released outside of the game container
    if (event.buttons !== 1 && !event.touches) { 
        handleEndSelection(event);
        return;
    }

    const targetElement = document.elementFromPoint(event.clientX, event.clientY);

    if (targetElement) {
        const gridCellTarget = targetElement.closest('.grid-cell');
        
        if (gridCellTarget) {
            const coords = getCellCoordinatesFromEvent(gridCellTarget); 
            if (coords) {
                addToSelection(coords.r, coords.c);
            }
        }
    }
}

function handleTouchProgress(event) {
    if (!isDrawing || timeLeft <= 0) return;
    
    const touch = event.touches[0];
    const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (targetElement) {
        const gridCellTarget = targetElement.closest('.grid-cell');

        if (gridCellTarget) {
            const coords = getCellCoordinatesFromEvent(gridCellTarget); 
            if (coords) {
                addToSelection(coords.r, coords.c);
            }
        }
    }
    event.preventDefault(); 
}

function handleEndSelection(event) {
    if (!isDrawing) return;

    const wasDrawing = isDrawing;
    isDrawing = false; // CRITICAL FIX: End drawing flag here
    
    if (wasDrawing && currentSelection.length >= 3) { 
        checkSelection();
    } else {
        // Only show message if selection failed (not if it was just a click)
        if (wasDrawing && currentSelection.length > 0) {
            messageElement.textContent = 'Selection too short: Must be at least 3 letters long.';
            messageElement.className = 'feedback incorrect';
        } else {
             messageElement.textContent = ''; // Clear message on simple click/tap release
        }
    }
    
    // Clear styles if the selection was not a successful word or game end
    if (!messageElement.textContent.includes('Correct') && !messageElement.textContent.includes('Time')) {
        setTimeout(clearSelectionStyles, 500);
    }
}


function clearSelectionStyles() {
    document.querySelectorAll('.grid-cell.selected').forEach(cell => {
        cell.classList.remove('selected');
    });
}

function addToSelection(r, c) {
    const lastCoord = currentSelection[currentSelection.length - 1];
    const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);

    if (!cell || cell.classList.contains('found') || timeLeft <= 0) return; 

    // 1. Handle first cell selection
    if (currentSelection.length === 0) {
        currentSelection.push({ r, c });
        cell.classList.add('selected');
        const currentWord = cell.textContent;
        messageElement.textContent = `Preview: ${currentWord}`;
        messageElement.className = 'feedback';
        return;
    }
    
    // 2. Check Adjacency
    const isAdjacent = (Math.abs(r - lastCoord.r) <= 1) && (Math.abs(c - lastCoord.c) <= 1);
    const existingIndex = currentSelection.findIndex(coord => coord.r === r && coord.c === c);

    if (isAdjacent) {
        if (existingIndex === -1) { 
            // New adjacent cell
            
            // Check direction consistency
            let isConsistent = true;
            if (currentSelection.length >= 2) {
                const prevCoord = currentSelection[currentSelection.length - 2];
                const rDir = lastCoord.r - prevCoord.r;
                const cDir = lastCoord.c - prevCoord.c;

                const newRDir = r - lastCoord.r;
                const newCDir = c - lastCoord.c;
                
                // If directions are established, the new direction must match OR it's the first step
                if ((rDir !== 0 || cDir !== 0) && (rDir !== newRDir || cDir !== newCDir)) {
                    isConsistent = false;
                }
            }
            
            if (isConsistent) {
                currentSelection.push({ r, c });
                cell.classList.add('selected');
            }
            
        } else if (existingIndex === currentSelection.length - 2) {
            // Moving back one step (undo)
            const undone = currentSelection.pop();
            document.querySelector(`[data-row="${undone.r}"][data-col="${undone.c}"]`).classList.remove('selected');
            
        } else if (existingIndex === currentSelection.length - 1) {
            // Attempting to select the same cell again
            return;
        }
    } else {
        // Not adjacent or tried to skip a cell
        return;
    }
    
    // Update preview if the selection length changed
    const currentWord = currentSelection.map(coord => currentWordMap[coord.r][coord.c]).join('');
    messageElement.textContent = `Preview: ${currentWord}`;
    messageElement.className = 'feedback';
}

// --- 3. Validation Logic ---

function checkSelection() {
    
    const selectedWord = currentSelection.map(coord => currentWordMap[coord.r][coord.c]).join('');
    
    // Check for reverse match as well (common in Word Search/Hunt)
    const reversedWord = selectedWord.split('').reverse().join('');
    
    const isWordFound = wordList.includes(selectedWord) || wordList.includes(reversedWord);

    if (isWordFound) {
        const foundTargetWord = wordList.includes(selectedWord) ? selectedWord : reversedWord;
        
        if (!foundWords.includes(foundTargetWord)) {
            // Correct Word Found
            foundWords.push(foundTargetWord);
            score++;
            messageElement.textContent = `🎉 Correct! Found "${foundTargetWord}"!`;
            messageElement.classList.remove('incorrect');
            messageElement.classList.add('correct');
            
            // Apply 'found' class to selected cells
            currentSelection.forEach(coord => {
                document.querySelector(`[data-row="${coord.r}"][data-col="${coord.c}"]`).classList.add('found');
                document.querySelector(`[data-row="${coord.r}"][data-col="${coord.c}"]`).classList.remove('selected');
            });
            
            renderWordList(); 
            
            if (foundWords.length === wordList.length) {
                endGame('won'); // END GAME when all words are found
            }
            
        } else {
            messageElement.textContent = `Word "${foundTargetWord}" already found!`;
            messageElement.className = 'feedback incorrect';
            setTimeout(clearSelectionStyles, 500);
        }
    } else {
        messageElement.textContent = `❌ "${selectedWord}" is not in the list.`;
        messageElement.className = 'feedback incorrect';
        setTimeout(clearSelectionStyles, 500);
    }
}


// --- 4. Event Listeners ---

sizeSelect.addEventListener('change', initializeGame);
newPuzzleButton.addEventListener('click', initializeGame);


// --- Initial Call ---
initializeGame();