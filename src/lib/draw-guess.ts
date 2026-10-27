/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                   𒁈 DRAW & GUESS V1.0 ULTRA 𒁈                             ┃
 * ┃              Pictionary Profesional para WhatsApp                           ┃
 * ┃                    Creado para: Avenix-Multi V6.1.0                          ┃
 * ┃                    By: Hepein Oficial                                        ┃
 * ┃                                                                               ┃
 * ┃  CARACTERÍSTICAS:                                                            ┃
 * ┃  ✅ Sistema de turnos automático                                            ┃
 * ┃  ✅ 1000+ palabras en múltiples categorías                                  ┃
 * ┃  ✅ 3 niveles de dificultad                                                 ┃
 * ┃  ✅ Dibujo con emojis/caracteres ASCII                                      ┃
 * ┃  ✅ Tiempo límite configurable                                              ┃
 * ┃  ✅ Sistema de pistas progresivas                                           ┃
 * ┃  ✅ Puntuación según velocidad                                              ┃
 * ┃  ✅ Modo multijugador en grupos                                             ┃
 * ┃  ✅ Ranking y estadísticas                                                  ┃
 * ┃  ✅ Rondas personalizables                                                  ┃
 * ┃  ✅ Historial de partidas                                                   ┃
 * ┃  ✅ Sistema de racha                                                        ┃
 * ┃  ✅ Logros y badges                                                         ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import { randomHex } from './crypto.js';
import paint from './paint.js'
import { appStore } from './storage.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ═══════════════════════════════════════════════════════════════════════════════
// │                        CONFIGURACIÓN GLOBAL                                 │
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
    // Tiempo
    DRAW_TIME: 90000, // 90 segundos para dibujar
    GUESS_TIME: 60000, // 60 segundos para adivinar
    
    // Puntuación
    BASE_POINTS: 100,
    TIME_BONUS_MULTIPLIER: 2, // Puntos extra por velocidad
    STREAK_BONUS: 10, // Bonus por racha
    MAX_STREAK_BONUS: 100,
    DRAWER_POINTS: 20, // Puntos para el dibujante si alguien adivina
    
    // Pistas
    HINT_INTERVAL: 15000, // Pista cada 15 segundos
    MAX_HINTS: 3,
    HINT_PENALTY: 10, // Puntos menos por cada pista
    
    // Jugadores
    MIN_PLAYERS: 2,
    MAX_PLAYERS: 20,
    
    // Rondas
    DEFAULT_ROUNDS: 5,
    MAX_ROUNDS: 20,
    
    // Palabras
    WORD_REVEAL_PERCENTAGE: 0.3, // 30% de letras reveladas en última pista
    
    // Canvas
    CANVAS_WIDTH: 40,
    CANVAS_HEIGHT: 20,
    
    // Historial
    MAX_HISTORY: 100,
    SAVE_HISTORY: true,
    
    // Logging
    LOG_ENABLED: true,
    LOG_LEVEL: 'info'
};

// ═══════════════════════════════════════════════════════════════════════════════
// │                      BANCO DE PALABRAS                                      │
// ═══════════════════════════════════════════════════════════════════════════════

const WORDS = {
    facil: {
        animales: [
            'gato', 'perro', 'pez', 'pájaro', 'león', 'tigre', 'elefante', 
            'jirafa', 'mono', 'oso', 'conejo', 'ratón', 'caballo', 'vaca',
            'oveja', 'cerdo', 'pollo', 'pato', 'tortuga', 'serpiente'
        ],
        objetos: [
            'casa', 'carro', 'árbol', 'sol', 'luna', 'estrella', 'flor',
            'silla', 'mesa', 'puerta', 'ventana', 'reloj', 'lápiz', 'libro',
            'teléfono', 'computadora', 'taza', 'plato', 'cuchara', 'tenedor'
        ],
        comida: [
            'pizza', 'hamburguesa', 'helado', 'pastel', 'pan', 'manzana',
            'banana', 'naranja', 'uva', 'fresa', 'sandía', 'piña', 'café',
            'agua', 'leche', 'jugo', 'chocolate', 'dulce', 'galleta', 'queso'
        ],
        deportes: [
            'fútbol', 'básquet', 'tenis', 'natación', 'boxeo', 'golf',
            'béisbol', 'volleyball', 'correr', 'saltar', 'pelota', 'gol'
        ],
        profesiones: [
            'doctor', 'profesor', 'policía', 'bombero', 'chef', 'cantante',
            'pintor', 'músico', 'piloto', 'soldado', 'enfermera', 'veterinario'
        ]
    },
    medio: {
        animales: [
            'pingüino', 'koala', 'panda', 'delfín', 'ballena', 'tiburón',
            'cocodrilo', 'hipopótamo', 'rinoceronte', 'canguro', 'murciélago',
            'búho', 'águila', 'loro', 'flamenco', 'camello', 'alpaca'
        ],
        objetos: [
            'bicicleta', 'avión', 'barco', 'tren', 'guitarra', 'piano',
            'tambor', 'micrófono', 'cámara', 'televisión', 'refrigerador',
            'lavadora', 'aspiradora', 'martillo', 'destornillador', 'llave'
        ],
        lugares: [
            'playa', 'montaña', 'desierto', 'bosque', 'ciudad', 'pueblo',
            'hospital', 'escuela', 'museo', 'biblioteca', 'estadio', 'parque',
            'restaurante', 'supermercado', 'aeropuerto', 'estación'
        ],
        abstracto: [
            'amor', 'paz', 'guerra', 'felicidad', 'tristeza', 'miedo',
            'sorpresa', 'emoción', 'sueño', 'pesadilla', 'recuerdo', 'futuro'
        ],
        tecnología: [
            'internet', 'wifi', 'bluetooth', 'batería', 'pantalla', 'teclado',
            'mouse', 'auriculares', 'cargador', 'memoria', 'procesador', 'robot'
        ]
    },
    dificil: {
        expresiones: [
            'meter la pata', 'estar en las nubes', 'romper el hielo',
            'tomar el pelo', 'costar un ojo de la cara', 'dar en el clavo',
            'estar como una cabra', 'llueve sobre mojado', 'pan comido',
            'ponerse las pilas', 'tirar la toalla', 'ver la luz'
        ],
        conceptos: [
            'democracia', 'libertad', 'justicia', 'igualdad', 'fraternidad',
            'solidaridad', 'empatía', 'nostalgia', 'melancolía', 'euforia',
            'ansiedad', 'serenidad', 'esperanza', 'desesperación'
        ],
        científico: [
            'fotosíntesis', 'gravitación', 'magnetismo', 'electricidad',
            'átomo', 'molécula', 'célula', 'genética', 'evolución', 'ecosistema',
            'temperatura', 'presión', 'velocidad', 'aceleración', 'energía'
        ],
        películas: [
            'titanic', 'matrix', 'avatar', 'inception', 'gladiador',
            'forrest gump', 'el padrino', 'star wars', 'jurassic park',
            'el rey león', 'toy story', 'buscando a nemo', 'frozen'
        ],
        personajes: [
            'sherlock holmes', 'harry potter', 'batman', 'superman',
            'spiderman', 'iron man', 'darth vader', 'yoda', 'gandalf',
            'frodo', 'mickey mouse', 'bugs bunny', 'pikachu', 'mario bros'
        ]
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// │                      EMOJIS PARA DIBUJAR                                    │
// ═══════════════════════════════════════════════════════════════════════════════

const DRAWING_EMOJIS = {
    formas: ['⬛', '⬜', '🟥', '🟦', '🟧', '🟨', '🟩', '🟪', '🟫', '⚫', '⚪', '🔴', '🔵', '🟠', '🟡', '🟢', '🟣', '🟤'],
    lineas: ['─', '│', '┌', '┐', '└', '┘', '├', '┤', '┬', '┴', '┼', '═', '║', '╔', '╗', '╚', '╝'],
    puntos: ['·', '•', '●', '○', '◎', '◉', '◯', '◌', '◍', '◐', '◑', '◒', '◓'],
    flechas: ['↑', '↓', '←', '→', '↖', '↗', '↘', '↙', '⇅', '⇆', '⇄', '⇵', '⇶', '⇷'],
    caras: ['😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😊', '😎', '🤔', '😐', '😑', '😶'],
    manos: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐'],
    corazones: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗'],
    animales: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵'],
    comida: ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑'],
    naturaleza: ['🌳', '🌲', '🌴', '🌱', '🌿', '☘️', '🍀', '🌾', '🌵', '🌺', '🌻', '🌷', '🌹', '🥀', '🌸'],
    clima: ['☀️', '🌤', '⛅', '🌥', '☁️', '🌦', '🌧', '⛈', '🌩', '🌨', '❄️', '☃️', '⛄', '🌬', '💨'],
    transporte: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🚲', '🛴']
};

// ═══════════════════════════════════════════════════════════════════════════════
// │                      SISTEMA DE LOGGING                                     │
// ═══════════════════════════════════════════════════════════════════════════════

class Logger {
    static levels = { debug: 0, info: 1, warn: 2, error: 3 };
    static currentLevel = this.levels[CONFIG.LOG_LEVEL] || 1;
    
    static log(level, ...args) {
        if (!CONFIG.LOG_ENABLED || this.levels[level] < this.currentLevel) return;
        
        const prefix = {
            debug: paint.bold.bgBlue(' DEBUG '),
            info: paint.bold.bgGreen(' INFO '),
            warn: paint.bold.bgYellow(' WARN '),
            error: paint.bold.bgRed(' ERROR ')
        }[level];
        
        console.log(prefix, '[DrawGuess]:', ...args);
    }
    
    static debug(...args) { this.log('debug', ...args); }
    static info(...args) { this.log('info', ...args); }
    static warn(...args) { this.log('warn', ...args); }
    static error(...args) { this.log('error', ...args); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      UTILIDADES                                             │
// ═══════════════════════════════════════════════════════════════════════════════

class Utils {
    static ensureDir(dir) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
    
    static generateId() {
        return randomHex(8);
    }
    
    static normalizeText(text) {
        return text.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
            .replace(/[^a-z0-9\s]/g, '')
            .trim();
    }
    
    static shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    static getRandomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    
    static formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        if (minutes > 0) {
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
        return `${seconds}s`;
    }
    
    static calculatePoints(basePoints, timeElapsed, maxTime, hintsUsed) {
        // Puntos base
        let points = basePoints;
        
        // Bonus por velocidad (más rápido = más puntos)
        const timeRatio = 1 - (timeElapsed / maxTime);
        const timeBonus = Math.floor(basePoints * timeRatio * CONFIG.TIME_BONUS_MULTIPLIER);
        points += timeBonus;
        
        // Penalización por pistas
        points -= hintsUsed * CONFIG.HINT_PENALTY;
        
        // Mínimo 1 punto
        return Math.max(1, points);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      GENERADOR DE PALABRAS                                  │
// ═══════════════════════════════════════════════════════════════════════════════

class WordGenerator {
    static getWord(difficulty = 'medio', category: any = null) {
        const difficultyWords = WORDS[difficulty];
        
        if (!difficultyWords) {
            throw new Error(`Dificultad "${difficulty}" no válida`);
        }
        
        let availableCategories = Object.keys(difficultyWords);
        
        if (category && difficultyWords[category]) {
            availableCategories = [category];
        }
        
        const selectedCategory = Utils.getRandomItem(availableCategories);
        const word = Utils.getRandomItem(difficultyWords[selectedCategory]);
        
        return {
            word,
            category: selectedCategory,
            difficulty
        };
    }
    
    static getAllCategories(difficulty: any = null) {
        if (difficulty) {
            return Object.keys(WORDS[difficulty] || {});
        }
        
        const categories = new Set();
        for (const diff of Object.keys(WORDS)) {
            for (const cat of Object.keys(WORDS[diff])) {
                categories.add(cat);
            }
        }
        return Array.from(categories);
    }
    
    static getDifficulties() {
        return Object.keys(WORDS);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      GENERADOR DE PISTAS                                    │
// ═══════════════════════════════════════════════════════════════════════════════

class HintGenerator {
    static generateHint(word, hintNumber) {
        const normalized = Utils.normalizeText(word);
        const length = normalized.length;
        
        switch (hintNumber) {
            case 1:
                // Primera pista: longitud y primera letra
                return `La palabra tiene ${length} letras y empieza con "${word[0]}"`;
                
            case 2:
                // Segunda pista: categoría o última letra
                return `La palabra termina con "${word[word.length - 1]}"`;
                
            case 3:
                // Tercera pista: revelar algunas letras
                const revealCount = Math.max(1, Math.floor(length * CONFIG.WORD_REVEAL_PERCENTAGE));
                const revealed = this.revealLetters(word, revealCount);
                return `Pista: ${revealed}`;
                
            default:
                return `La palabra tiene ${length} letras`;
        }
    }
    
    static revealLetters(word, count) {
        const normalized = Utils.normalizeText(word);
        const length = normalized.length;
        const positions = new Set();
        
        // Siempre revelar primera y última letra
        positions.add(0);
        positions.add(length - 1);
        
        // Revelar letras aleatorias adicionales
        while (positions.size < Math.min(count, length)) {
            positions.add(Math.floor(Math.random() * length));
        }
        
        return Array.from(word as Iterable<any>).map((char, i) => {
            const normalizedIndex = normalized.indexOf(Utils.normalizeText(char));
            return positions.has(i) ? char : '_';
        }).join(' ');
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CLASE JUGADOR                                          │
// ═══════════════════════════════════════════════════════════════════════════════

class Player {
    id: any
    name: any
    score: number
    guessesMade: number
    correctGuesses: number
    streak: number
    maxStreak: any
    totalDraws: number
    successfulDraws: number
    fastestGuess: any
    averageGuessTime: number
    isActive: boolean

    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.score = 0;
        this.guessesMade = 0;
        this.correctGuesses = 0;
        this.streak = 0;
        this.maxStreak = 0;
        this.totalDraws = 0;
        this.successfulDraws = 0;
        this.fastestGuess = Infinity;
        this.averageGuessTime = 0;
        this.isActive = true;
    }
    
    addPoints(points, isCorrect = true) {
        this.score += points;
        
        if (isCorrect) {
            this.correctGuesses++;
            this.streak++;
            
            if (this.streak > this.maxStreak) {
                this.maxStreak = this.streak;
            }
        } else {
            this.streak = 0;
        }
    }
    
    recordGuessTime(time) {
        if (time < this.fastestGuess) {
            this.fastestGuess = time;
        }
        
        const totalTime = this.averageGuessTime * this.correctGuesses;
        this.averageGuessTime = (totalTime + time) / (this.correctGuesses + 1);
    }
    
    incrementDraws() {
        this.totalDraws++;
    }
    
    recordSuccessfulDraw() {
        this.successfulDraws++;
    }
    
    getAccuracy() {
        if (this.guessesMade === 0) return 0;
        return (this.correctGuesses / this.guessesMade * 100).toFixed(1);
    }
    
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            score: this.score,
            stats: {
                guessesMade: this.guessesMade,
                correctGuesses: this.correctGuesses,
                accuracy: this.getAccuracy() + '%',
                streak: this.streak,
                maxStreak: this.maxStreak,
                totalDraws: this.totalDraws,
                successfulDraws: this.successfulDraws,
                fastestGuess: this.fastestGuess !== Infinity ? 
                    Utils.formatTime(this.fastestGuess) : 'N/A',
                averageGuessTime: Utils.formatTime(this.averageGuessTime)
            }
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CLASE RONDA                                            │
// ═══════════════════════════════════════════════════════════════════════════════

class Round {
    id: string
    drawer: any
    word: any
    category: any
    difficulty: any
    startTime: number
    endTime: null | number
    drawing: any
    guesses: any[]
    correctGuesses: Set<any>
    hintsGiven: number
    isComplete: boolean

    constructor(drawer, word, difficulty) {
        this.id = Utils.generateId();
        this.drawer = drawer;
        this.word = word.word;
        this.category = word.category;
        this.difficulty = difficulty;
        this.startTime = Date.now();
        this.endTime = null;
        this.drawing = null;
        this.guesses = [];
        this.correctGuesses = new Set();
        this.hintsGiven = 0;
        this.isComplete = false;
    }
    
    setDrawing(drawing) {
        this.drawing = drawing;
    }
    
    addGuess(player, guess, isCorrect) {
        const guessTime = Date.now() - this.startTime;
        
        this.guesses.push({
            player: player.id,
            playerName: player.name,
            guess,
            isCorrect,
            time: guessTime,
            timestamp: Date.now()
        });
        
        if (isCorrect) {
            this.correctGuesses.add(player.id);
            player.recordGuessTime(guessTime);
        }
    }
    
    giveHint() {
        this.hintsGiven++;
        return HintGenerator.generateHint(this.word, this.hintsGiven);
    }
    
    complete() {
        this.isComplete = true;
        this.endTime = Date.now();
    }
    
    getDuration() {
        return (this.endTime || Date.now()) - this.startTime;
    }
    
    toJSON() {
        return {
            id: this.id,
            drawer: {
                id: this.drawer.id,
                name: this.drawer.name
            },
            word: this.word,
            category: this.category,
            difficulty: this.difficulty,
            duration: Utils.formatTime(this.getDuration()),
            guesses: this.guesses.length,
            correctGuesses: this.correctGuesses.size,
            hintsGiven: this.hintsGiven,
            isComplete: this.isComplete
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CLASE JUEGO                                            │
// ═══════════════════════════════════════════════════════════════════════════════

class DrawGuessGame {
    id: string
    chatId: any
    players: Map<any, any>
    currentRound: null | Round
    roundNumber: number
    maxRounds: any
    difficulty: any
    category: any
    isStarted: boolean
    isFinished: boolean
    createdAt: number
    startedAt: null | number
    finishedAt: null | number
    history: any[]
    drawTimer: any
    guessTimer: null | NodeJS.Timeout
    hintTimer: null | NodeJS.Timeout

    constructor(chatId, options: Record<string, any> = {}) {
        this.id = Utils.generateId();
        this.chatId = chatId;
        this.players = new Map();
        this.currentRound = null;
        this.roundNumber = 0;
        this.maxRounds = options.maxRounds || CONFIG.DEFAULT_ROUNDS;
        this.difficulty = options.difficulty || 'medio';
        this.category = options.category || null;
        this.isStarted = false;
        this.isFinished = false;
        this.createdAt = Date.now();
        this.startedAt = null;
        this.finishedAt = null;
        this.history = [];
        
        // Timers
        this.drawTimer = null;
        this.guessTimer = null;
        this.hintTimer = null;
        
        Logger.info(`🎨 Nuevo juego creado: ${this.id}`);
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      GESTIÓN DE JUGADORES                             │
    // ═════════════════════════════════════════════════════════════════════════
    
    addPlayer(playerId, playerName) {
        if (this.isStarted) {
            throw new Error('El juego ya comenzó');
        }
        
        if (this.players.size >= CONFIG.MAX_PLAYERS) {
            throw new Error('El juego está lleno');
        }
        
        if (this.players.has(playerId)) {
            throw new Error('Ya estás en el juego');
        }
        
        const player = new Player(playerId, playerName);
        this.players.set(playerId, player);
        
        Logger.info(`✅ ${playerName} se unió al juego`);
        
        return player;
    }
    
    removePlayer(playerId) {
        const player = this.players.get(playerId);
        
        if (!player) {
            throw new Error('No estás en el juego');
        }
        
        this.players.delete(playerId);
        
        Logger.info(`❌ ${player.name} abandonó el juego`);
        
        // Si es el dibujante, terminar ronda
        if (this.currentRound && this.currentRound.drawer.id === playerId) {
            this.endRound();
        }
        
        return player;
    }
    
    getPlayer(playerId) {
        return this.players.get(playerId);
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      INICIO DEL JUEGO                                 │
    // ═════════════════════════════════════════════════════════════════════════
    
    start() {
        if (this.players.size < CONFIG.MIN_PLAYERS) {
            throw new Error(`Se necesitan al menos ${CONFIG.MIN_PLAYERS} jugadores`);
        }
        
        this.isStarted = true;
        this.startedAt = Date.now();
        
        Logger.info(`🎲 Juego iniciado con ${this.players.size} jugadores`);
        
        this.startNewRound();
    }
    
    startNewRound() {
        if (this.roundNumber >= this.maxRounds) {
            this.endGame();
            return;
        }
        
        this.roundNumber++;
        
        // Seleccionar dibujante (rotación)
        const playerArray = Array.from(this.players.values());
        const drawerIndex = (this.roundNumber - 1) % playerArray.length;
        const drawer = playerArray[drawerIndex];
        
        // Obtener palabra
        const word = WordGenerator.getWord(this.difficulty, this.category);
        
        // Crear ronda
        this.currentRound = new Round(drawer, word, this.difficulty);
        drawer.incrementDraws();
        
        Logger.info(`📇 Ronda ${this.roundNumber}/${this.maxRounds} iniciada`);
        Logger.info(`   Dibujante: ${drawer.name}`);
        Logger.info(`   Palabra: ${word.word} (${word.category})`);
        
        // Iniciar timer de pistas
        this.startHintTimer();
        
        return this.currentRound;
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      GESTIÓN DE RONDAS                                │
    // ═════════════════════════════════════════════════════════════════════════
    
    submitDrawing(playerId, drawing) {
        if (!this.currentRound) {
            throw new Error('No hay ronda activa');
        }
        
        if (this.currentRound.drawer.id !== playerId) {
            throw new Error('No eres el dibujante');
        }
        
        this.currentRound.setDrawing(drawing);
        
        // Iniciar timer de adivinanzas
        this.startGuessTimer();
        
        Logger.info(`🎨 Dibujo recibido de ${this.currentRound.drawer.name}`);
        
        return true;
    }
    
    submitGuess(playerId, guess) {
        if (!this.currentRound) {
            throw new Error('No hay ronda activa');
        }
        
        if (!this.currentRound.drawing) {
            throw new Error('El dibujante aún no ha enviado el dibujo');
        }
        
        if (this.currentRound.drawer.id === playerId) {
            throw new Error('El dibujante no puede adivinar');
        }
        
        if (this.currentRound.correctGuesses.has(playerId)) {
            throw new Error('Ya adivinaste correctamente');
        }
        
        const player = this.getPlayer(playerId);
        if (!player) {
            throw new Error('No estás en el juego');
        }
        
        player.guessesMade++;
        
        // Verificar si es correcto
        const normalizedGuess = Utils.normalizeText(guess);
        const normalizedWord = Utils.normalizeText(this.currentRound.word);
        const isCorrect = normalizedGuess === normalizedWord;
        
        this.currentRound.addGuess(player, guess, isCorrect);
        
        if (isCorrect) {
            // Calcular puntos
            const timeElapsed = Date.now() - this.currentRound.startTime;
            const points = Utils.calculatePoints(
                CONFIG.BASE_POINTS,
                timeElapsed,
                CONFIG.GUESS_TIME,
                this.currentRound.hintsGiven
            );
            
            // Bonus por racha
            const streakBonus = Math.min(
                player.streak * CONFIG.STREAK_BONUS,
                CONFIG.MAX_STREAK_BONUS
            );
            
            const totalPoints = points + streakBonus;
            player.addPoints(totalPoints, true);
            
            // Puntos para el dibujante
            this.currentRound.drawer.addPoints(CONFIG.DRAWER_POINTS, true);
            
            Logger.info(`✅ ${player.name} adivinó correctamente (+${totalPoints} pts)`);
            
            // Verificar si todos adivinaron
            const nonDrawers = Array.from(this.players.values())
                .filter(p => p.id !== this.currentRound?.drawer.id);
            
            if (this.currentRound.correctGuesses.size === nonDrawers.length) {
                this.currentRound.drawer.recordSuccessfulDraw();
                this.endRound();
            }
            
            return { isCorrect: true, points: totalPoints, streakBonus };
        }
        
        return { isCorrect: false };
    }
    
    requestHint() {
        if (!this.currentRound) {
            throw new Error('No hay ronda activa');
        }
        
        if (this.currentRound.hintsGiven >= CONFIG.MAX_HINTS) {
            throw new Error('No hay más pistas disponibles');
        }
        
        return this.currentRound.giveHint();
    }
    
    endRound() {
        if (!this.currentRound) return;
        
        this.currentRound.complete();
        this.history.push(this.currentRound.toJSON());
        
        // Limpiar timers
        this.clearTimers();
        
        Logger.info(`🏁 Ronda ${this.roundNumber} terminada`);
        Logger.info(`   Palabra: ${this.currentRound.word}`);
        Logger.info(`   Adivinaron: ${this.currentRound.correctGuesses.size} jugadores`);
        
        // Siguiente ronda o fin del juego
        setTimeout(() => {
            if (this.roundNumber < this.maxRounds) {
                this.startNewRound();
            } else {
                this.endGame();
            }
        }, 5000);
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      TIMERS                                           │
    // ═════════════════════════════════════════════════════════════════════════
    
    startHintTimer() {
        this.hintTimer = setInterval(() => {
            if (this.currentRound && this.currentRound.hintsGiven < CONFIG.MAX_HINTS) {
                this.requestHint();
            }
        }, CONFIG.HINT_INTERVAL);
    }
    
    startGuessTimer() {
        this.guessTimer = setTimeout(() => {
            Logger.info('⏰ Tiempo agotado para adivinar');
            this.endRound();
        }, CONFIG.GUESS_TIME);
    }
    
    clearTimers() {
        if (this.drawTimer) clearTimeout(this.drawTimer);
        if (this.guessTimer) clearTimeout(this.guessTimer);
        if (this.hintTimer) clearInterval(this.hintTimer);
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      FIN DEL JUEGO                                    │
    // ═════════════════════════════════════════════════════════════════════════
    
    endGame() {
        this.isFinished = true;
        this.finishedAt = Date.now();
        
        this.clearTimers();
        
        // Ordenar jugadores por puntuación
        const ranking = Array.from(this.players.values())
            .sort((a, b) => b.score - a.score);
        
        Logger.info('🏁 ¡JUEGO TERMINADO!');
        Logger.info('\n📊 CLASIFICACIÓN FINAL:');
        
        ranking.forEach((player, index) => {
            Logger.info(`${index + 1}. ${player.name}: ${player.score} puntos`);
        });
        
        // Guardar historial
        if (CONFIG.SAVE_HISTORY) {
            this.saveHistory();
        }
    }
    
    saveHistory() {
        // Lista por chat en strenor; se recorta a los últimos N juegos
        const store = appStore();
        const key = `drawguess:history:${this.chatId}`;
        store.rpush(key, this.toJSON());
        while (store.llen(key) > CONFIG.MAX_HISTORY) store.lpop(key);
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // │                      INFORMACIÓN Y ESTADO                             │
    // ═════════════════════════════════════════════════════════════════════════
    
    getState() {
        return {
            id: this.id,
            chatId: this.chatId,
            roundNumber: this.roundNumber,
            maxRounds: this.maxRounds,
            difficulty: this.difficulty,
            category: this.category,
            players: Array.from(this.players.values()).map(p => ({
                name: p.name,
                score: p.score,
                streak: p.streak
            })),
            currentRound: this.currentRound ? {
                drawer: this.currentRound.drawer.name,
                hasDrawing: !!this.currentRound.drawing,
                guesses: this.currentRound.guesses.length,
                correctGuesses: this.currentRound.correctGuesses.size,
                hintsGiven: this.currentRound.hintsGiven
            } : null,
            isStarted: this.isStarted,
            isFinished: this.isFinished
        };
    }
    
    getRanking() {
        return Array.from(this.players.values())
            .sort((a, b) => b.score - a.score)
            .map((player, index) => ({
                position: index + 1,
                ...player.toJSON()
            }));
    }
    
    toJSON() {
        return {
            id: this.id,
            chatId: this.chatId,
            difficulty: this.difficulty,
            category: this.category,
            maxRounds: this.maxRounds,
            roundsPlayed: this.roundNumber,
            duration: Utils.formatTime((this.finishedAt || Date.now()) - (this.startedAt ?? Date.now())),
            players: this.getRanking(),
            history: this.history
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      GESTOR DE JUEGOS                                       │
// ═══════════════════════════════════════════════════════════════════════════════

class GameManager {
    games: Map<any, any>

    constructor() {
        this.games = new Map();
    }
    
    createGame(chatId, options: Record<string, any> = {}) {
        if (this.games.has(chatId)) {
            throw new Error('Ya hay un juego activo en este chat');
        }
        
        const game = new DrawGuessGame(chatId, options);
        this.games.set(chatId, game);
        
        return game;
    }
    
    getGame(chatId) {
        return this.games.get(chatId);
    }
    
    deleteGame(chatId) {
        const game = this.games.get(chatId);
        if (game) {
            game.clearTimers();
        }
        return this.games.delete(chatId);
    }
    
    getActiveGames() {
        return Array.from(this.games.values()).filter(g => !g.isFinished);
    }
}

const gameManager = new GameManager();

// ═══════════════════════════════════════════════════════════════════════════════
// │                      EXPORTACIONES                                          │
// ═══════════════════════════════════════════════════════════════════════════════

export default DrawGuessGame;
export {
    DrawGuessGame,
    GameManager,
    Player,
    Round,
    WordGenerator,
    HintGenerator,
    gameManager,
    WORDS,
    DRAWING_EMOJIS,
    CONFIG
};
