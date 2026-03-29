/**
 * Neon Tic-Tac-Toe: Cyber Grid
 * Core Architecture & Logic
 */

// --- STATE MANAGEMENT ---
const GameState = {
    player: {
        name: '',
        email: '',
        score: 0
    },
    settings: {
        sfx: true,
        bgm: true
    },
    currentScreen: 'loading-screen',
    mode: 'ai', // 'ai' or 'friend'
    difficulty: 'Easy', // Easy, Medium, Hard
    board: Array(9).fill(null), // null, 'X', or 'O'
    turn: 'X',
    history: [], // For undo functionality
    isGameOver: false,
    aiThinking: false,
    
    // Core Navigation function
    navigate: function(screenId) {
        console.log("Navigating to:", screenId);
        
        // Sembunyikan SEMUA elemen yang bersifat layar atau modal
        document.querySelectorAll('.screen, .modal').forEach(s => {
            s.classList.add('hidden');
            s.style.display = 'none'; 
        });
        
        const target = document.getElementById(screenId);
        if (target) {
            target.classList.remove('hidden');
            // Gunakan flex untuk screen, tapi sesuaikan jika itu modal
            target.style.display = 'flex'; 
            this.currentScreen = screenId;
        }
        
        if (screenId === 'leaderboard-screen') renderLeaderboard();
    }
};

const diffLevels = ['Easy', 'Medium', 'Hard'];
let diffIndex = 0;

// --- AUDIO HOOKS ---

// --- AUDIO HOOKS ---
const audioCache = {
    click: new Audio('musik/klik.ogg'), 
    win: new Audio('musik/menang.ogg'),          
    draw: new Audio('musik/draw.ogg'),      
    bgm: new Audio('musik/musik.mp3'),   
    start: new Audio('musik/start.ogg')  
};

function playSound(type) {
    // --- PERBAIKAN: Jika SFX di settings FALSE, maka langsung keluar (diam) ---
    if (!GameState.settings.sfx) return; 
    
    const sound = audioCache[type];
    if (sound) {
        sound.currentTime = 0;
        sound.volume = (type === 'win') ? 1.0 : 0.6;
        sound.play().catch(e => console.log("SFX Error:", e));
    }
}

function handleBGM(action) {
    const bgm = audioCache.bgm;
    if (!bgm) return;

    // --- PERBAIKAN: Jika ingin PLAY tapi BGM di settings FALSE, jangan diputar ---
    if (action === 'play') {
        if (GameState.settings.bgm) {
            bgm.loop = true;
            bgm.volume = 0.3;
            bgm.play().catch(e => console.log("BGM blocked by browser"));
        }
    } else if (action === 'stop') {
        bgm.pause();
    }
}

// --- DOM ELEMENTS ---
const screens = {
    loading: document.getElementById('loading-screen'),
    auth: document.getElementById('auth-screen'),
    menu: document.getElementById('main-menu'),
    gameplay: document.getElementById('gameplay-screen'),
    leaderboard: document.getElementById('leaderboard-screen')
};

const dom = {
    // Menu
    playerName: document.getElementById('menu-player-name'),
    playerScore: document.getElementById('menu-player-score'),
    diffLabel: document.getElementById('label-difficulty'),
    matchupHeader: document.getElementById('game-matchup'),
    turnIndicator: document.getElementById('turn-indicator'),
    
    // Auth Form
    authForm: document.getElementById('auth-form'),
    regName: document.getElementById('reg-name'),
    regEmail: document.getElementById('reg-email'),
    regPassword: document.getElementById('reg-password'),
    
    // Game Board
    cells: document.querySelectorAll('.cell'),
    winLine: document.getElementById('winning-line')
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // PASTIKAN saat pertama kali buka, hanya loading-screen yang tampil
    // Sembunyikan paksa modal-modal yang nakal di awal
    document.getElementById('settings-modal').classList.add('hidden');
    document.getElementById('result-modal').classList.add('hidden');
    
    // Mulai dengan loading screen
    GameState.navigate('loading-screen');

    setTimeout(() => {
        const loadingText = document.querySelector('.loading-text');
        if (loadingText) {
            loadingText.classList.remove('pulsing');
            loadingText.textContent = "SYSTEM READY";
        }
        const btnStart = document.getElementById('btn-start');
        if (btnStart) {
            btnStart.classList.remove('hidden');
            btnStart.style.display = 'block';
        }
    }, 1500);

    checkAutoLogin();
    loadSettings();
    setupEventListeners();
});

// --- AUTHENTICATION & LOGIN ---
function checkAutoLogin() {
    const savedPlayer = localStorage.getItem('neonTicTacToe_player');
    if (savedPlayer) {
        const p = JSON.parse(savedPlayer);
        GameState.player = p;
        updatePlayerMenu();
    }
}

function updatePlayerMenu() {
    dom.playerName.textContent = GameState.player.name;
    dom.playerScore.textContent = `🪙 ${GameState.player.score}`;
}

dom.authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = dom.regName.value.trim();
    const email = dom.regEmail.value.trim();
    const password = dom.regPassword.value;
    
    if (name.length > 0 && email.includes('@') && password.length >= 6) {
        GameState.player.name = name;
        GameState.player.email = email;
        const savedPlayer = localStorage.getItem('neonTicTacToe_player');
        if (savedPlayer) {
            const p = JSON.parse(savedPlayer);
            if (p.email === email) {
                GameState.player.score = p.score;
            } else {
                GameState.player.score = 0;
            }
        }
        
        savePlayerData();
        updatePlayerMenu();
        GameState.navigate('main-menu');
    }
});

function savePlayerData() {
    localStorage.setItem('neonTicTacToe_player', JSON.stringify(GameState.player));
}

// --- SETTINGS ---
function loadSettings() {
    const s = localStorage.getItem('neonTicTacToe_settings');
    if (s) {
        GameState.settings = JSON.parse(s);
        document.getElementById('toggle-sfx').checked = GameState.settings.sfx;
        document.getElementById('toggle-bgm').checked = GameState.settings.bgm;
    }
}

function saveSettings() {
    GameState.settings.sfx = document.getElementById('toggle-sfx').checked;
    GameState.settings.bgm = document.getElementById('toggle-bgm').checked;
    localStorage.setItem('neonTicTacToe_settings', JSON.stringify(GameState.settings));
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
    // --- START BUTTON ---
    document.getElementById('btn-start').addEventListener('click', () => {
        playSound('start');
        setTimeout(() => {
            handleBGM('play'); 
            if (GameState.player.name) {
                GameState.navigate('main-menu');
            } else {
                GameState.navigate('auth-screen');
            }
        }, 300);
    });

    // --- MENU CAROUSEL ---
    document.getElementById('btn-prev-level').addEventListener('click', () => {
        diffIndex = (diffIndex - 1 + diffLevels.length) % diffLevels.length;
        updateDifficulty();
    });
    
    document.getElementById('btn-next-level').addEventListener('click', () => {
        diffIndex = (diffIndex + 1) % diffLevels.length;
        updateDifficulty();
    });

    // --- MODE SELECTION ---
    document.getElementById('btn-vs-ai').onclick = () => { 
        GameState.mode = 'ai'; 
        startGame(); 
    };

    document.getElementById('btn-vs-friend').onclick = () => { 
        GameState.mode = 'friend'; 
        startGame(); 
    };
    
    document.getElementById('btn-leaderboard').onclick = () => {
        GameState.navigate('leaderboard-screen');
    };
    
    document.getElementById('btn-logout').addEventListener('click', () => {
        localStorage.removeItem('neonTicTacToe_player');
        GameState.player = { name: '', email: '', score: 0 };
        dom.authForm.reset();
        GameState.navigate('auth-screen');
    });

    // --- NAVIGATION BACK BUTTONS ---
    document.getElementById('btn-back-menu').addEventListener('click', () => {
        GameState.navigate('main-menu');
    });
    document.getElementById('btn-back-leaderboard').addEventListener('click', () => {
        GameState.navigate('main-menu');
    });

    // --- SETTINGS TOGGLES (SFX & BGM) ---
    document.getElementById('toggle-sfx').addEventListener('change', () => {
        saveSettings();
        playSound('click'); 
    });

    document.getElementById('toggle-bgm').addEventListener('change', () => {
        saveSettings(); 
        if (GameState.settings.bgm) {
            handleBGM('play');
        } else {
            handleBGM('stop'); 
        }
    });

    // --- FIX MULTIPLE SETTINGS BUTTONS (GABUNGAN BARU) ---
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('btn-close-settings');

    // Mengaktifkan semua tombol yang punya class .btn-trigger-settings atau ikon gear
    document.querySelectorAll('.header-icon, .btn-trigger-settings').forEach(btn => {
        // Cek jika tombol mengandung teks gear atau punya class trigger
        if (btn.textContent.includes('⚙️') || btn.classList.contains('btn-trigger-settings')) {
            btn.onclick = function() {
                settingsModal.classList.remove('hidden');
                settingsModal.style.display = 'flex';
                playSound('click');
            };
        }
    });

    if (closeSettingsBtn) {
        closeSettingsBtn.onclick = function() {
            settingsModal.classList.add('hidden');
            settingsModal.style.display = 'none';
            playSound('click');
        };
    }

    // --- GAMEPLAY BOARD ---
    dom.cells.forEach(cell => {
        cell.addEventListener('click', () => handleCellClick(cell.dataset.index));
    });

    // --- UNDO BUTTON ---
    document.getElementById('btn-undo').addEventListener('click', undoMove);

    // --- MODAL RESULTS (Default listeners jika modal tidak di-update innerHTML-nya) ---
    // Catatan: Fungsi ini akan ter-override oleh setupModalButtons() di handleGameOver
    const btnHome = document.getElementById('btn-modal-home');
    const btnReplay = document.getElementById('btn-modal-replay');
    
    if (btnHome) {
        btnHome.onclick = () => {
            document.getElementById('result-modal').classList.add('hidden');
            document.getElementById('result-modal').style.display = 'none';
            GameState.navigate('main-menu');
        };
    }
    if (btnReplay) {
        btnReplay.onclick = () => {
            document.getElementById('result-modal').classList.add('hidden');
            document.getElementById('result-modal').style.display = 'none';
            startGame();
        };
    }
}

function updateDifficulty() {
    GameState.difficulty = diffLevels[diffIndex];
    dom.diffLabel.textContent = GameState.difficulty;
    playSound('click');
    
    dom.diffLabel.className = 'difficulty-text'; 
    
    if (GameState.difficulty === 'Easy') {
        dom.diffLabel.classList.add('neon-text-green');
    } else if (GameState.difficulty === 'Medium') {
        dom.diffLabel.classList.add('neon-text-cyan');
    } else {
        dom.diffLabel.classList.add('neon-text-pink');
    }
}

// --- GAME LOGIC ---
const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6]             // diagonals
];

function startGame() {
    GameState.board = Array(9).fill(null);
    GameState.turn = 'X';
    GameState.history = [];
    GameState.isGameOver = false;
    GameState.aiThinking = false;
    
    dom.cells.forEach(c => {
        c.className = 'cell';
    });
    dom.winLine.style.display = 'none';
    dom.winLine.style.width = '0';
    
    if (GameState.mode === 'ai') {
        dom.matchupHeader.textContent = `${GameState.player.name} vs AI (${GameState.difficulty})`;
        document.getElementById('btn-undo').classList.remove('hidden');
    } else {
        dom.matchupHeader.textContent = `PLAYER 1 (❌) vs PLAYER 2 (⭕)`;
        document.getElementById('btn-undo').classList.remove('hidden');
    }
    
    updateTurnIndicator();
    GameState.navigate('gameplay-screen');
}

function handleCellClick(index) {
    if (GameState.isGameOver || GameState.aiThinking || GameState.board[index] !== null) return;
    
    GameState.history.push({ board: [...GameState.board], turn: GameState.turn });
    makeMove(index, GameState.turn);
    
    const winData = checkWin(GameState.board);
    if (winData) {
        handleGameOver(winData);
    } else if (GameState.board.every(c => c !== null)) {
        handleGameOver('Draw');
    } else {
        GameState.turn = GameState.turn === 'X' ? 'O' : 'X';
        updateTurnIndicator();
        
        if (GameState.mode === 'ai' && GameState.turn === 'O') {
            triggerAI();
        }
    }
}

function makeMove(index, marker) {
    GameState.board[index] = marker;
    const cell = document.querySelector(`.cell[data-index="${index}"]`);
    cell.classList.add(marker === 'X' ? 'x-mark' : 'o-mark');
    playSound('click');
}

function updateTurnIndicator() {
    dom.turnIndicator.textContent = `Turn: ${GameState.turn === 'X' ? '❌' : '⭕'}`;
    if (GameState.turn === 'X') {
        dom.turnIndicator.className = 'turn-text crimson-text';
    } else {
        dom.turnIndicator.className = 'turn-text yellow-text';
    }
}

function undoMove() {
    if (GameState.history.length === 0 || GameState.isGameOver || GameState.aiThinking) return;
    
    let previousState;
    if (GameState.mode === 'ai') {
        if (GameState.history.length >= 2 && GameState.turn === 'X') {
            GameState.history.pop(); 
            previousState = GameState.history.pop(); 
        } else {
             previousState = GameState.history.pop(); 
        }
    } else {
        previousState = GameState.history.pop();
    }
    
    if (!previousState) return;
    
    GameState.board = [...previousState.board];
    GameState.turn = previousState.turn;
    
    dom.cells.forEach((cell, i) => {
        cell.className = 'cell';
        if (GameState.board[i] === 'X') cell.classList.add('x-mark');
        else if (GameState.board[i] === 'O') cell.classList.add('o-mark');
    });
    
    updateTurnIndicator();
    playSound('click');
}

function checkWin(boardState) {
    for (let i = 0; i < winPatterns.length; i++) {
        const [a, b, c] = winPatterns[i];
        if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
            return { winner: boardState[a], patternIndex: i, cells: [a, b, c] };
        }
    }
    return null;
}

function drawWinningLine(patternIndex) {
    const wline = dom.winLine;
    wline.style.display = 'block';
    const cellW = 330 / 3;
    const halfW = cellW / 2;
    
    let top = 0;
    let left = 0;
    let angle = 0;
    let width = 330;

    switch(patternIndex) {
        case 0: top = halfW; left = 0; break;
        case 1: top = cellW + halfW; left = 0; break;
        case 2: top = cellW * 2 + halfW; left = 0; break;
        case 3: top = 0; left = halfW; angle = 90; break;
        case 4: top = 0; left = cellW + halfW; angle = 90; break;
        case 5: top = 0; left = cellW * 2 + halfW; angle = 90; break;
        case 6: top = 0; left = 0; angle = 45; width = 466; break;
        case 7: top = 0; left = 330; angle = 135; width = 466; break;
    }
    
    wline.style.top = `${top}px`;
    wline.style.left = `${left}px`;
    wline.style.transform = `rotate(${angle}deg)`;
    
    setTimeout(() => {
        wline.style.width = `${width}px`;
    }, 50);
}

function handleGameOver(result) {
    GameState.isGameOver = true;
    
    const resModal = document.getElementById('result-modal');
    const resIcon = document.getElementById('result-icon');
    const resTitle = document.getElementById('result-title');
    const resScore = document.getElementById('result-score');
    const modalContent = resModal.querySelector('.modal-content');
    const modalButtons = document.getElementById('modal-buttons-container');
    
    // Pastikan container tombol rapi
    modalButtons.style.display = 'flex';
    modalButtons.style.gap = '15px';

    if (result === 'Draw') {
        // --- TAMPILAN DRAW ---
        playSound('draw'); 
        resIcon.innerHTML = '😢';
        resTitle.textContent = 'DRAW';
        resTitle.className = 'result-title neon-text-cyan';
        modalContent.className = 'modal-content neon-box-blue text-center';
        resScore.textContent = 'Keep Fighting!';
        
        // Tombol tunggal untuk Continue (Lanjut main)
        modalButtons.innerHTML = `<button id="btn-continue" class="btn cyan-bg glow-btn-cyan w-100">CONTINUE</button>`;
        
        document.getElementById('btn-continue').onclick = () => {
            resModal.classList.add('hidden');
            resModal.style.display = 'none';
            startGame();
        };
    } else {
        const winner = result.winner; 
        drawWinningLine(result.patternIndex);
        
        result.cells.forEach(idx => {
            const cell = document.querySelector(`.cell[data-index="${idx}"]`);
            cell.classList.add(winner === 'X' ? 'win-yellow' : 'win-blue');
        });

        if (GameState.mode === 'ai') {
            if (winner === 'X') {
                // --- TAMPILAN MENANG (Dapat Poin) ---
                playSound('win'); 
                resIcon.innerHTML = '👑';
                resTitle.textContent = 'YOU WIN';
                resTitle.className = 'result-title yellow-text glow-text-pink';
                modalContent.className = 'modal-content neon-box-yellow text-center';
                
                let pointEarned = (GameState.difficulty === 'Easy') ? 10 : (GameState.difficulty === 'Medium' ? 20 : 50);
                GameState.player.score += pointEarned;
                savePlayerData();
                updatePlayerMenu();
                resScore.textContent = `+${pointEarned} 🪙 SCORE`;
            } else {
                // --- TAMPILAN KALAH (Pop-up Merah, Tidak dapat poin) ---
                playSound('draw'); 
                resIcon.innerHTML = '💀';
                resTitle.textContent = 'YOU LOSE';
                resTitle.className = 'result-title crimson-text';
                modalContent.className = 'modal-content neon-box-pink text-center';
                resScore.textContent = ''; // Kosongkan pemberitahuan poin
            }
        } else {
            // MODE VS TEMAN
            playSound('win');
            resIcon.innerHTML = '👑';
            resTitle.textContent = `P${winner === 'X' ? '1' : '2'} WINS`;
            resTitle.className = winner === 'X' ? 'yellow-text' : 'neon-text-cyan';
            modalContent.className = winner === 'X' ? 'modal-content neon-box-yellow' : 'modal-content neon-box-blue';
            resScore.textContent = '';
        }

        // Tampilkan tombol HOME & REPLAY
        modalButtons.innerHTML = `
            <button id="btn-modal-home" class="btn cyan-bg glow-btn-cyan">HOME</button>
            <button id="btn-modal-replay" class="btn yellow-bg glow-btn-yellow">REPLAY</button>
        `;
        setupModalButtons(); // Aktifkan klik tombol
    }
    
    setTimeout(() => {
        resModal.classList.remove('hidden');
        resModal.style.display = 'flex';
    }, 1200);
}

// FUNGSI BARU: Agar tombol HOME dan REPLAY bisa diklik setelah isinya diganti
function setupModalButtons() {
    const btnHome = document.getElementById('btn-modal-home');
    const btnReplay = document.getElementById('btn-modal-replay');

    if(btnHome) {
        btnHome.onclick = () => {
            const modal = document.getElementById('result-modal');
            modal.classList.add('hidden');
            modal.style.display = 'none';
            GameState.navigate('main-menu');
        };
    }
    if(btnReplay) {
        btnReplay.onclick = () => {
            const modal = document.getElementById('result-modal');
            modal.classList.add('hidden');
            modal.style.display = 'none';
            startGame();
        };
    }
}

// --- AI IMPLEMENTATION ---
function triggerAI() {
    GameState.aiThinking = true;
    setTimeout(() => {
        let moveIndex;
        if (GameState.difficulty === 'Easy') {
            moveIndex = aiRandomMove();
        } else if (GameState.difficulty === 'Medium') {
            moveIndex = aiDefensiveMove();
        } else {
            moveIndex = aiMinimaxMove();
        }
        
        if (moveIndex !== undefined && moveIndex !== -1) {
            GameState.history.push({ board: [...GameState.board], turn: GameState.turn });
            makeMove(moveIndex, 'O');
            
            const winData = checkWin(GameState.board);
            if (winData) {
                handleGameOver(winData);
            } else if (GameState.board.every(c => c !== null)) {
                handleGameOver('Draw');
            } else {
                GameState.turn = 'X';
                updateTurnIndicator();
            }
        }
        GameState.aiThinking = false;
    }, 500 + Math.random() * 300);
}

function getAvailableMoves(board) {
    return board.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
}

function aiRandomMove() {
    const available = getAvailableMoves(GameState.board);
    if (available.length === 0) return -1;
    return available[Math.floor(Math.random() * available.length)];
}

function aiDefensiveMove() {
    const board = [...GameState.board];
    const available = getAvailableMoves(board);
    for (let i of available) {
        board[i] = 'O';
        if (checkWin(board)) return i;
        board[i] = null;
    }
    for (let i of available) {
        board[i] = 'X';
        if (checkWin(board)) return i;
        board[i] = null;
    }
    return aiRandomMove();
}

function aiMinimaxMove() {
    let bestScore = -Infinity;
    let move = -1;
    let board = [...GameState.board];
    const available = getAvailableMoves(board);
    if (available.length === 9) return 4;
    if (available.length === 8) {
        if (board[4] === null) return 4;
        return [0, 2, 6, 8][Math.floor(Math.random() * 4)];
    }
    for (let i = 0; i < board.length; i++) {
        if (board[i] === null) {
            board[i] = 'O';
            let score = minimax(board, 0, false);
            board[i] = null;
            if (score > bestScore) {
                bestScore = score;
                move = i;
            }
        }
    }
    return move;
}

const scores = { 'O': 10, 'X': -10, 'Draw': 0 };

function minimax(board, depth, isMaximizing) {
    let result = checkWin(board);
    if (result) return result.winner === 'O' ? scores.O - depth : scores.X + depth;
    if (board.every(c => c !== null)) return scores.Draw;

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === null) {
                board[i] = 'O';
                let score = minimax(board, depth + 1, false);
                board[i] = null;
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === null) {
                board[i] = 'X';
                let score = minimax(board, depth + 1, true);
                board[i] = null;
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

// --- LEADERBOARD ---
const dummyData = [
    { rank: 1, avatar: '🐉', name: 'CyberDemon', score: 3500 },
    { rank: 2, avatar: '🤖', name: 'NeonBot', score: 2800 },
    { rank: 3, avatar: '👾', name: 'GridWalker', score: 2100 },
    { rank: 4, avatar: '👻', name: 'Ghost_99', score: 1500 },
    { rank: 5, avatar: '👽', name: 'AlienX', score: 1200 },
    { rank: 6, avatar: '🐱', name: 'NyanCat', score: 950 },
    { rank: 7, avatar: '🚀', name: 'StarRider', score: 800 },
    { rank: 8, avatar: '💀', name: 'SkullCrusher', score: 650 },
    { rank: 9, avatar: '😎', name: 'CoolDude', score: 400 },
    { rank: 10, avatar: '🤡', name: 'Joker', score: 150 }
];

function renderLeaderboard() {
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = '';
    let allData = [...dummyData];
    if (GameState.player.name) {
        allData.push({ 
            rank: 0, 
            avatar: '👤', 
            name: GameState.player.name + ' (You)', 
            score: GameState.player.score,
            isCurrentPlayer: true
        });
    }
    allData.sort((a, b) => b.score - a.score);
    const displayData = allData.slice(0, 10);
    displayData.forEach((user, index) => {
        const row = document.createElement('div');
        row.className = `lb-row ${index < 3 ? 'lb-rank-' + (index + 1) : ''}`;
        if (user.isCurrentPlayer) {
            row.style.border = '2px solid var(--neon-blue)';
            row.style.background = 'rgba(0, 243, 255, 0.2)';
        }
        row.innerHTML = `
            <div class="lb-rank">#${index + 1}</div>
            <div class="lb-avatar">${user.avatar}</div>
            <div class="lb-name">${user.name}</div>
            <div class="lb-score">🪙 ${user.score}</div>
        `;
        list.appendChild(row);
    });
}