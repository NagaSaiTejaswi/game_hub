// --- Core Game Variables ---
let currentSequence = [];
let missingNumber = null;
let missingIndex = -1;
let score = 0;

// --- Timer Variables ---
let timeLeft = 45; // Starting time in seconds (longer than word jumble)
let timerInterval;

// --- DOM Element References ---
const numberPatternElement = document.getElementById('number-pattern');
const guessInput = document.getElementById('guess-input');
const submitButton = document.getElementById('submit-button');
const newPuzzleButton = document.getElementById('new-puzzle-button');
const messageElement = document.getElementById('message');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const difficultySelect = document.getElementById('difficulty-select');

/**
 * 2. Generates a number sequence based on the difficulty setting.
 * @returns {number[]} The complete, non-masked sequence array.
 */
function generateSequence(difficulty) {
    let seq = [];
    const length = 5; // All sequences will have 5 numbers

    switch (difficulty) {
        case 'easy':
            // Simple arithmetic sequence (e.g., +2, +3)
            const start = Math.floor(Math.random() * 10) + 1; // 1 to 10
            const difference = Math.floor(Math.random() * 3) + 2; // Difference of 2, 3, or 4
            for (let i = 0; i < length; i++) {
                seq.push(start + i * difference);
            }
            break;

        case 'medium':
            // Multiplication sequence (e.g., x2, x3)
            const startM = Math.floor(Math.random() * 5) + 1; // 1 to 5
            const factor = Math.floor(Math.random() * 2) + 2; // Factor of 2 or 3
            let currentNum = startM;
            for (let i = 0; i < length; i++) {
                seq.push(currentNum);
                currentNum *= factor;
            }
            break;

        case 'hard':
            // Fibonacci-like sequence or a combination of two rules
            // Example: A(i) = A(i-1) + A(i-2) + C
            const c = Math.floor(Math.random() * 3) + 1; // Constant C (1, 2, or 3)
            seq = [
                Math.floor(Math.random() * 5) + 1, // A0
                Math.floor(Math.random() * 5) + 6  // A1
            ];
            for (let i = 2; i < length; i++) {
                seq.push(seq[i - 1] + seq[i - 2] + c);
            }
            break;
    }
    return seq;
}

/*--- 3. Timer Management---*/

function startTimer() {
    clearInterval(timerInterval);
    timeLeft = 45; // Reset to 45 seconds
    timerElement.textContent = `Time Left: ${timeLeft}s`;
    guessInput.disabled = false;
    submitButton.disabled = false;

    timerInterval = setInterval(() => {
        timeLeft--;
        timerElement.textContent = `Time Left: ${timeLeft}s`;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            messageElement.textContent = `⏰ Time's up! The missing number was: ${missingNumber}`;
            guessInput.disabled = true;
            submitButton.disabled = true;
            
            // Auto-start next puzzle after a delay
            setTimeout(startNewPuzzle, 3000); 
        }
    }, 1000);
}

/*--- 4. Game control functions ---*/
function startNewPuzzle() {
    // 1. Generate the sequence based on difficulty
    const currentDifficulty = difficultySelect.value;
    currentSequence = generateSequence(currentDifficulty);

    // 2. Select a random number to hide (missing number cannot be the first or last)
    missingIndex = Math.floor(Math.random() * (currentSequence.length - 2)) + 1; // Index 1 to length-2
    missingNumber = currentSequence[missingIndex];

    // 3. Create the display string, replacing the missing number with a placeholder
    const displaySequence = currentSequence.map((num, index) => 
        index === missingIndex ? '__' : num
    ).join(', ');

    // 4. Update DOM elements
    numberPatternElement.innerHTML = `<p>${displaySequence}</p>`;
    guessInput.value = '';
    messageElement.textContent = '';
    guessInput.focus(); 

    // 5. Start the timer and reset score on new puzzle start
    startTimer();
    scoreElement.textContent = `Score: ${score}`;
}

function checkGuess() {
    const userGuess = parseInt(guessInput.value);

    // Basic input validation
    if (isNaN(userGuess) || guessInput.value.trim() === '') {
        messageElement.textContent = 'Please enter a valid number!';
        return;
    }
    
    // Check if the guess is correct
    if (userGuess === missingNumber) {
        // Correct Guess
        score++;
        messageElement.textContent = '✅ Correct! Nice work!';
        scoreElement.textContent = `Score: ${score}`;

        // Stop timer and reveal the correct sequence
        clearInterval(timerInterval);
        numberPatternElement.innerHTML = `<p>${currentSequence.join(', ')}</p>`;
        
        // Load a new puzzle automatically
        setTimeout(startNewPuzzle, 1500);
    } else {
        // Incorrect Guess
        messageElement.textContent = '❌ Incorrect. Try again!';
        guessInput.value = '';
    }
}

// --- 5. Event Listeners ---

newPuzzleButton.addEventListener('click', () => {
    // Reset score if New Puzzle is clicked manually
    score = 0; 
    startNewPuzzle();
});

submitButton.addEventListener('click', checkGuess);

// Allow the user to press Enter in the input field to submit
guessInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        checkGuess();
    }
});

// When the difficulty changes, start a new puzzle and reset the score
difficultySelect.addEventListener('change', () => {
    score = 0; 
    startNewPuzzle();
});

// --- Initial Call ---
startNewPuzzle(); // Start the first puzzle immediately