// --- Global Game State Variables ---
const memoryGrid = document.getElementById('memory-grid');
const startButton = document.getElementById('start-memory-button');
const difficultySelect = document.getElementById('difficulty-select');
const movesCountSpan = document.getElementById('moves-count');
const matchesFoundSpan = document.getElementById('matches-found');
const totalPairsSpan = document.getElementById('total-pairs');
const timerDisplay = document.getElementById('timer');
const messageDisplay = document.getElementById('message');

let cardsArray = []; // Array to hold the card objects
let flippedCards = []; // Stores the two cards currently flipped
let matchedPairs = 0;
let totalMoves = 0;
let gameTimer;
let seconds = 0;
let lockBoard = false; // Prevents clicking during the check delay

// --- Card Content (Emojis for easy visual matching) ---
const cardContent = [
    '🍕', '🍔', '🍟', '🍣', '🍩', '🍪', '🍎', '🍇', 
    '🍊', '🍓', '🍍', '🥝', '🍋', '🍒', '🌶️', '🥦'
];

// --- Utility Functions ---

/**
 * Shuffles an array using the Fisher-Yates algorithm.
 * @param {Array} array - The array to shuffle.
 * @returns {Array} - The shuffled array.
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// --- Timer Functions ---

function startTimer() {
    stopTimer(); // Clear any existing timer
    seconds = 0;
    timerDisplay.textContent = 'Time: 00:00';
    gameTimer = setInterval(() => {
        seconds++;
        const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
        const secs = String(seconds % 60).padStart(2, '0');
        timerDisplay.textContent = `Time: ${mins}:${secs}`;
    }, 1000);
}

function stopTimer() {
    clearInterval(gameTimer);
}

// --- Game Initialization ---

function initializeGame() {
    stopTimer();
    messageDisplay.textContent = 'Click Start to begin!';
    
    // Determine the number of pairs based on difficulty
    const numPairs = parseInt(difficultySelect.value);
    const totalCards = numPairs * 2;

    // 1. Prepare Card Content
    let contentForGame = cardContent.slice(0, numPairs);
    contentForGame = contentForGame.concat(contentForGame); // Duplicate for pairs
    
    // 2. Shuffle Content
    const shuffledContent = shuffleArray(contentForGame);

    // 3. Set Grid Layout
    let gridCols;
    if (numPairs === 6) gridCols = 3; // 3x4 grid
    else if (numPairs === 8) gridCols = 4; // 4x4 grid
    else if (numPairs === 10) gridCols = 4; // 4x5 grid
    else gridCols = 4;

    memoryGrid.style.gridTemplateColumns = `repeat(${gridCols}, 1fr)`;
    
    // 4. Reset Stats and Board
    memoryGrid.innerHTML = '';
    cardsArray = [];
    flippedCards = [];
    matchedPairs = 0;
    totalMoves = 0;
    lockBoard = false;
    
    movesCountSpan.textContent = '0';
    matchesFoundSpan.textContent = '0';
    totalPairsSpan.textContent = numPairs;

    // 5. Create Card Elements
    shuffledContent.forEach((content, index) => {
        const cardContainer = document.createElement('div');
        cardContainer.classList.add('card-container');
        cardContainer.dataset.index = index; // Store unique index
        
        const memoryCard = document.createElement('div');
        memoryCard.classList.add('memory-card');
        memoryCard.dataset.content = content; // Store the matching key
        memoryCard.addEventListener('click', flipCard);
        
        const frontFace = document.createElement('div');
        frontFace.classList.add('front-face');
        frontFace.textContent = content;
        
        const backFace = document.createElement('div');
        backFace.classList.add('back-face');
        backFace.textContent = '?'; // Optional: Use a fixed symbol for the back
        
        memoryCard.appendChild(frontFace);
        memoryCard.appendChild(backFace);
        cardContainer.appendChild(memoryCard);
        memoryGrid.appendChild(cardContainer);
        cardsArray.push(memoryCard);
    });
}

// --- Game Logic ---

function flipCard() {
    if (lockBoard) return; // Ignore clicks if board is locked
    if (this === flippedCards[0]) return; // Ignore double-click on the same card
    
    // 1. Flip the card
    this.classList.add('flipped');
    
    // 2. Add to flipped cards array
    flippedCards.push(this);

    // 3. Check if two cards are flipped
    if (flippedCards.length === 2) {
        lockBoard = true; // Lock board while checking
        totalMoves++;
        movesCountSpan.textContent = totalMoves;
        
        checkForMatch();
    }
}

function checkForMatch() {
    const [card1, card2] = flippedCards;
    const isMatch = card1.dataset.content === card2.dataset.content;

    if (isMatch) {
        // Cards match!
        matchedPairs++;
        matchesFoundSpan.textContent = matchedPairs;
        disableCards();
    } else {
        // Cards do NOT match, flip them back after a delay
        setTimeout(() => {
            unflipCards();
        }, 1000); // 1-second delay
    }

    // Check for win condition after match check
    if (matchedPairs === parseInt(difficultySelect.value)) {
        setTimeout(winGame, 500);
    }
}

function disableCards() {
    const [card1, card2] = flippedCards;
    
    card1.removeEventListener('click', flipCard);
    card2.removeEventListener('click', flipCard);
    
    card1.classList.add('matched');
    card2.classList.add('matched');

    resetBoard();
}

function unflipCards() {
    const [card1, card2] = flippedCards;
    card1.classList.remove('flipped');
    card2.classList.remove('flipped');
    
    resetBoard();
}

function resetBoard() {
    [flippedCards, lockBoard] = [[], false];
}

function winGame() {
    stopTimer();
    messageDisplay.textContent = `🎉 Congratulations! You won in ${totalMoves} moves and ${seconds} seconds! 🎉`;
    startButton.textContent = 'Play Again';
}

// --- Event Listeners ---

startButton.addEventListener('click', () => {
    // If the button says 'Start Game', start the timer and allow clicks
    if (startButton.textContent === 'Start Game' || startButton.textContent === 'Play Again') {
        initializeGame();
        startTimer();
        messageDisplay.textContent = 'Find the matching pairs!';
        startButton.textContent = 'Restart Game';
    } else {
        // If the button says 'Restart Game', confirm restart
        if (confirm('Are you sure you want to restart the current game?')) {
            initializeGame();
            startTimer();
            messageDisplay.textContent = 'Find the matching pairs!';
        }
    }
});

difficultySelect.addEventListener('change', initializeGame);

// --- Initial Setup ---
window.onload = initializeGame;