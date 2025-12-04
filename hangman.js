// --- 1. Core Game Variables & Master Word Lists ---
const WORD_LISTS = {
    "easy": [
        // Updated structure: word and emoji clue
        { word: "CAT", clue: "🐈" },
        { word: "DOG", clue: "🐕" },
        { word: "MOUSE", clue: "🐁" },
        { word: "BIRD", clue: "🐦" },
        { word: "FISH", clue: "🐠" },
        { word: "LION", clue: "🦁" },
        { word: "TIGER", clue: "🐅" }
    ],
    "medium": [
        { word: "JAVASCRIPT", clue: "💻" },
        { word: "PYTHON", clue: "🐍" },
        { word: "HTML", clue: "🌐" },
        { word: "FUNCTION", clue: "⚙️" },
        { word: "VARIABLE", clue: "📊" },
        { word: "COMPILER", clue: "🛠️" }
    ],
    "hard": [
        { word: "BHUTAN", clue: "🐉" }, 
        { word: "ICELAND", clue: "❄️" },
        { word: "AUSTRALIA", clue: "🦘" },
        { word: "KYRGYZSTAN", clue: "🇰🇬" },
        { word: "MADAGASCAR", clue: "🇲🇬" },
        { word: "VENEZUELA", clue: "🇻🇪" }
    ]
};

let currentWord = '';
let maskedWord = [];
let guessesLeft = 7;
let guessedLetters = [];
let maxGuesses = 7; 

// --- 2. Global DOM Element References (Initialized later) ---
let canvas;
let ctx;
let wordDisplay;
let messageElement;
let guessesLeftElement;
let keyboardElement;
let difficultySelect;
let newGameButton;
let clueDisplay; 

// --- 3. Initialization Function ---
function initializeDOMReferences() {
    canvas = document.getElementById('hangman-canvas');
    ctx = canvas ? canvas.getContext('2d') : null; 
    
    if (!ctx) {
        console.error("Initialization Failed: Canvas context not found.");
        return;
    }
    
    wordDisplay = document.getElementById('word-display');
    messageElement = document.getElementById('message');
    guessesLeftElement = document.getElementById('max-guesses');
    keyboardElement = document.getElementById('keyboard');
    difficultySelect = document.getElementById('difficulty-select');
    
    newGameButton = document.getElementById('new-puzzle-button'); 
    if (!newGameButton) {
        newGameButton = document.getElementById('new-game-button');
    }
    
    clueDisplay = document.getElementById('clue-display');


    // Attach event listeners
    if (newGameButton) newGameButton.addEventListener('click', startGame);
    if (difficultySelect) difficultySelect.addEventListener('change', startGame);
}


// --- 4. Hangman Drawing Functions ---

function drawLine(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function drawHead(x, y, radius) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2, true);
    ctx.stroke();
}

function drawHangman() {
    if (!ctx) return; 
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#34495e'; 
    ctx.lineWidth = 4;
    
    const stage = maxGuesses - guessesLeft;

    // 0. Base
    drawLine(10, 240, 190, 240);

    // 1. Pole
    if (stage >= 1) {
        drawLine(30, 240, 30, 20);
    }

    // 2. Beam
    if (stage >= 2) {
        drawLine(30, 20, 140, 20);
    }
    
    // 3. Rope
    if (stage >= 3) {
        drawLine(140, 20, 140, 50); 
    }

    // 4. Head
    if (stage >= 4) {
        drawHead(140, 70, 20);
    }

    // 5. Body
    if (stage >= 5) {
        drawLine(140, 90, 140, 160);
    }

    // 6. Left Arm
    if (stage >= 6) {
        drawLine(140, 100, 110, 130);
    }
    
    // 7. Right Arm, Left Leg, Right Leg (All in the final stage)
    if (stage >= 7) {
        // Right Arm
        drawLine(140, 100, 170, 130);
        
        // Left Leg
        drawLine(140, 160, 110, 200);

        // Right Leg
        drawLine(140, 160, 170, 200);
    }
}

// --- 5. Game Control Functions ---

function startGame() {
    if (!ctx || !difficultySelect) {
        return;
    }
    
    const selectedCategory = difficultySelect.value;
    const wordPool = WORD_LISTS[selectedCategory];
    
    // Select a random WORD OBJECT (now contains word and clue)
    const randomIndex = Math.floor(Math.random() * wordPool.length);
    const selectedWordObject = wordPool[randomIndex]; 
    
    currentWord = selectedWordObject.word.toUpperCase();
    const emojiClue = selectedWordObject.clue; // Extracted Clue

    // Reset game state
    guessesLeft = maxGuesses;
    guessedLetters = [];
    maskedWord = Array(currentWord.length).fill('_');
    
    // UI update
    wordDisplay.textContent = maskedWord.join(' ');
    
    // Display the emoji clue
    if (clueDisplay) {
        clueDisplay.innerHTML = `Clue: <span style="font-size: 1.5em;">${emojiClue}</span>`;
    }
    
    messageElement.textContent = 'Guess a letter!';
    messageElement.classList.remove('correct', 'incorrect');
    guessesLeftElement.textContent = guessesLeft;
    
    drawHangman(); 
    renderKeyboard();
}

function renderKeyboard() {
    keyboardElement.innerHTML = '';
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    for (const letter of alphabet) {
        const button = document.createElement('button');
        button.classList.add('key-button');
        button.textContent = letter;
        button.dataset.letter = letter;
        
        if (guessedLetters.includes(letter)) {
            button.disabled = true;
            if (currentWord.includes(letter)) {
                button.classList.add('correct');
            } else {
                button.classList.add('missed');
            }
        }
        
        button.addEventListener('click', () => handleGuess(letter));
        keyboardElement.appendChild(button);
    }
}

function handleGuess(letter) {
    if (guessedLetters.includes(letter) || guessesLeft <= 0 || !maskedWord.includes('_')) {
        return; 
    }

    const button = document.querySelector(`.key-button[data-letter="${letter}"]`);
    button.disabled = true;

    guessedLetters.push(letter);
    
    if (currentWord.includes(letter)) {
        // Correct Guess
        messageElement.textContent = `✅ Good guess! "${letter}" is correct.`;
        messageElement.classList.remove('incorrect');
        messageElement.classList.add('correct');
        button.classList.add('correct');
        
        for (let i = 0; i < currentWord.length; i++) {
            if (currentWord[i] === letter) {
                maskedWord[i] = letter;
            }
        }
        wordDisplay.textContent = maskedWord.join(' ');

        if (!maskedWord.includes('_')) {
            endGame(true); // Triggers next game automatically
        }

    } else {
        // Incorrect Guess
        guessesLeft--;
        messageElement.textContent = `❌ Incorrect guess. "${letter}" is not in the word.`;
        messageElement.classList.remove('correct');
        messageElement.classList.add('incorrect');
        button.classList.add('missed');
        guessesLeftElement.textContent = guessesLeft;
        
        drawHangman(); 

        if (guessesLeft <= 0) {
            endGame(false);
        }
    }
}

function endGame(isWon) {
    document.querySelectorAll('.key-button').forEach(btn => btn.disabled = true);
    
    if (isWon) {
        messageElement.textContent = `🏆 YOU WIN! The word was "${currentWord}"! Loading next challenge...`;
        messageElement.classList.remove('incorrect');
        messageElement.classList.add('correct');
        
        // --- NEW LOGIC: Start next game after 2 seconds ---
        setTimeout(() => {
            startGame(); // Reloads the game with a new random word
        }, 2000); 

    } else {
        messageElement.textContent = `☠️ GAME OVER! The word was "${currentWord}". Try again!`;
        messageElement.classList.remove('correct');
        messageElement.classList.add('incorrect');
        wordDisplay.textContent = currentWord.split('').join(' '); 
        drawHangman(); 
    }
    
    // Clear the clue at the end of the game (before the new game loads, or immediately on loss)
    if (clueDisplay) {
        clueDisplay.textContent = '';
    }
}


// --- 6. Initial Call using DOMContentLoaded ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize DOM references
    initializeDOMReferences(); 
    
    // 2. Start the game only if the canvas context was successfully initialized
    if (ctx) {
        startGame();
    }
});