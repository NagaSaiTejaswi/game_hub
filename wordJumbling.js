// --- Core Game Variables ---
const allWords = {
  "easy": [
    "CAT", "DOG", "SUN", "MOON", "STAR"
  ],
  "medium": [
    "APPLE", "BANANA", "ORANGE", "GRAPE", "KIWI"
  ],
  "hard": [
    "PROGRAMMING", "JAVASCRIPT", "DEVELOPER", "ALGORITHM", "DATABASE"
  ]
};

let currentOriginalWord = '';
let score = 0;
let currentWordPool = [];
let hintCount = 0; // Tracks the number of letters revealed as hints for the current word

// --- Timer Variables ---
let timeLeft = 30; // Starting time in seconds
let timerInterval;

// --- DOM Element References ---
const scrambledWordElement = document.getElementById('scrambled-word');
const guessInput = document.getElementById('guess-input');
const submitButton = document.getElementById('submit-button');
const newWordButton = document.getElementById('new-word-button');
const messageElement = document.getElementById('message');
const scoreElement = document.getElementById('score'); // Reference to the span
const timerElement = document.getElementById('timer');
const difficultySelect = document.getElementById('difficulty-select');
const hintButton = document.getElementById('hint-button');
const hintDisplay = document.getElementById('hint-display');


// --- 2. Scrambling Function ---
function scrambleWord(word) {
    let chars = word.split('');
    
    // Fisher-Yates shuffle
    for (let i = chars.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [chars[i], chars[j]] = [chars[j], chars[i]]; 
    }
    
    let scrambled = chars.join('');
    
    // Ensure it's not the same as the original
    if (scrambled.toUpperCase() === word.toUpperCase()) {
        return scrambleWord(word);
    }
    return scrambled;
}

// --- 3. Timer Management Function ---
function startTimer() {
    clearInterval(timerInterval);
    timeLeft = 30;
    timerElement.textContent = `Time Left: ${timeLeft}s`;

    timerInterval = setInterval(() => {
        timeLeft--;
        timerElement.textContent = `Time Left: ${timeLeft}s`;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            messageElement.textContent = `⏰ Time's up! The word was: ${currentOriginalWord}`;
            
            // Disable interaction
            guessInput.disabled = true;
            submitButton.disabled = true;
            hintButton.disabled = true;
            
            // Auto-start next word after a delay
            setTimeout(() => {
                guessInput.disabled = false;
                submitButton.disabled = false;
                hintButton.disabled = false;
                startNewWord(false); // Don't reset score on timer end
            }, 3000);
        }
    }, 1000);
}

// --- 4. Game Control Functions ---

function startNewWord(resetScore = true) {
    const currentDifficulty = difficultySelect.value;
    
    // --- HINT RESET ---
    hintCount = 0;
    hintDisplay.textContent = ''; 
    hintDisplay.style.display = 'none'; // Initially hide the hint display area
    hintButton.disabled = false; // Ensure button is enabled
    // --- END HINT RESET ---

    // Check if the current word pool is empty
    if (currentWordPool.length === 0) {
        const wordListForDifficulty = allWords[currentDifficulty];
        
        if (!wordListForDifficulty || wordListForDifficulty.length === 0) {
             scrambledWordElement.textContent = `Error: No words defined for ${currentDifficulty}.`;
             clearInterval(timerInterval);
             return;
        }

        currentWordPool = [...wordListForDifficulty]; 
        
        if (scrambledWordElement.textContent !== "Click 'New Word' to start!") {
             messageElement.textContent = "🔁 Word list cycled! Starting over with new words.";
        }
    }

    // 1. Get a random word from the current pool
    const randomIndex = Math.floor(Math.random() * currentWordPool.length);
    currentOriginalWord = currentWordPool[randomIndex];

    // *** REMOVE THE SELECTED WORD FROM THE POOL ***
    currentWordPool.splice(randomIndex, 1); 

    // 2. Scramble and display it
    const scrambled = scrambleWord(currentOriginalWord);
    scrambledWordElement.textContent = scrambled;

    // 3. Reset input and messages
    guessInput.value = '';
    if (!messageElement.textContent.includes("Word list cycled")) { 
        messageElement.textContent = '';
    } else {
        setTimeout(() => messageElement.textContent = '', 1500);
    }

    // Reset score only if explicitly requested
    if (resetScore) {
        score = 0;
    }
    scoreElement.textContent = score; // Always update the score display
    
    guessInput.focus(); 

    // START THE TIMER
    startTimer();
}

function checkGuess() {
    const userGuess = guessInput.value.trim().toUpperCase();
    const correctWord = currentOriginalWord.toUpperCase();

    if (userGuess === '') {
        messageElement.textContent = 'Please enter a guess!';
        return;
    }

    if (userGuess === correctWord) {
        // Correct Guess
        score++;
        messageElement.textContent = '✅ Correct! Well done!';
        scoreElement.textContent = score; 
        hintDisplay.textContent = ''; // Clear hint on success

        // Stop the current timer
        clearInterval(timerInterval);
        
        // Load a new word automatically, do NOT reset score
        setTimeout(() => startNewWord(false), 1500);
    
    } else {
        // Incorrect Guess
        messageElement.textContent = '❌ Incorrect. Try again!';
        guessInput.value = '';
    }
}

// --- 5. Hint Logic ---

function getHint() {
    if (currentOriginalWord === '') {
        messageElement.textContent = "Please click 'New Word' to start the game first!";
        return;
    }

    // Make the hint area visible the first time the button is clicked
    if (hintDisplay.style.display === 'none') {
        hintDisplay.style.display = 'block';
    }

    // If all letters have been revealed as hints, stop.
    if (hintCount >= currentOriginalWord.length) {
        hintDisplay.textContent = "No more hints available!";
        hintButton.disabled = true;
        return;
    }

    // 1. Prepare the current hint display 
    let hintLetters = hintDisplay.textContent.split(' ');
    
    // If it's the first hint, initialize the display with underscores
    if (hintLetters.length !== currentOriginalWord.length || hintCount === 0) {
        hintLetters = Array(currentOriginalWord.length).fill('_');
    }

    let positions = [];
    for (let i = 0; i < currentOriginalWord.length; i++) {
        // Find positions where the letter hasn't been revealed yet
        if (hintLetters[i] === '_') {
            positions.push(i);
        }
    }
    
    // 2. Select a random un-revealed position
    if (positions.length > 0) {
        const revealIndex = positions[Math.floor(Math.random() * positions.length)];
        
        // Reveal the letter at that index
        hintLetters[revealIndex] = currentOriginalWord[revealIndex];
        
        // Update the display
        hintDisplay.textContent = hintLetters.join(' ');
        
        // Increment hint count and provide feedback
        hintCount++;
        messageElement.textContent = `🔍 Hint given! (-1 second off timer)`;
        
        // Penalty: Reduce timer by 1 second
        timeLeft = Math.max(0, timeLeft - 1);
    }
}


// --- 6. Event Listeners ---

newWordButton.addEventListener('click', () => startNewWord(true)); 
submitButton.addEventListener('click', checkGuess);
hintButton.addEventListener('click', getHint); 

guessInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); 
        checkGuess();
    }
});

difficultySelect.addEventListener('change', () => {
    currentWordPool = []; 
    startNewWord(true); // Reset score when difficulty changes
});

// --- Initial Call ---
startNewWord(true);