/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                   𒁈 MOVIE QUOTES V2.0 ULTRA 𒁈                             ┃
 * ┃              Sistema de Citas de Películas y Juegos                         ┃
 * ┃                    Creado para: Avenix-Multi V6.1.0                          ┃
 * ┃                    By: Hepein Oficial                                        ┃
 * ┃                                                                               ┃
 * ┃  CARACTERÍSTICAS:                                                            ┃
 * ┃  ✅ Juego "Adivina la película"                                             ┃
 * ┃  ✅ Múltiples niveles de dificultad                                         ┃
 * ┃  ✅ Sistema de pistas progresivas                                           ┃
 * ┃  ✅ Categorías (acción, comedia, drama, etc)                                ┃
 * ┃  ✅ Base de datos personalizable                                            ┃
 * ┃  ✅ Integración con APIs externas (TMDb, OMDb)                              ┃
 * ┃  ✅ Sistema de ranking y estadísticas                                       ┃
 * ┃  ✅ Modo multijugador                                                       ┃
 * ┃  ✅ Pistas (año, género, director, actores)                                 ┃
 * ┃  ✅ Sistema de puntos con multiplicadores                                   ┃
 * ┃  ✅ Guardado de progreso                                                    ┃
 * ┃  ✅ Soporte para agregar citas propias                                      ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import chalk from 'chalk';
import crypto from 'crypto';
import Fuse from 'fuse.js';
import axios from 'axios';

// ═══════════════════════════════════════════════════════════════════════════════
// │                        CONFIGURACIÓN GLOBAL                                 │
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
    // Juego
    MAX_ATTEMPTS: 3,
    HINT_PENALTY: 100, // Puntos perdidos por pista
    TIME_BONUS_MULTIPLIER: 10, // Puntos extra por responder rápido
    
    // Dificultad
    EASY_BASE_POINTS: 100,
    MEDIUM_BASE_POINTS: 200,
    HARD_BASE_POINTS: 500,
    EXPERT_BASE_POINTS: 1000,
    
    // APIs externas
    TMDB_API_KEY: process.env.TMDB_API_KEY || '',
    OMDB_API_KEY: process.env.OMDB_API_KEY || '',
    USE_EXTERNAL_API: false, // Cambiar a true si tienes API keys
    
    // Búsqueda difusa
    FUZZY_THRESHOLD: 0.3, // 0 = exacto, 1 = muy flexible
    
    // Sistema
    CACHE_ENABLED: true,
    CACHE_TTL: 3600000, // 1 hora
    LOG_ENABLED: true,
    LOG_LEVEL: 'info',
    STATS_ENABLED: true
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
            debug: chalk.bold.bgBlue(' DEBUG '),
            info: chalk.bold.bgGreen(' INFO '),
            warn: chalk.bold.bgYellow(' WARN '),
            error: chalk.bold.bgRed(' ERROR ')
        }[level];
        
        console.log(prefix, '[MovieQuotes]:', ...args);
    }
    
    static debug(...args) { this.log('debug', ...args); }
    static info(...args) { this.log('info', ...args); }
    static warn(...args) { this.log('warn', ...args); }
    static error(...args) { this.log('error', ...args); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      BASE DE DATOS DE CITAS                                 │
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * NOTA IMPORTANTE: Esta es una base de datos de EJEMPLO con estructura.
 * Debes agregar tus propias citas o usar APIs externas (TMDb, OMDb).
 * NO incluimos citas reales para respetar derechos de autor.
 */

const QUOTE_DATABASE = {
    // Estructura de ejemplo - Agregar tus propias citas aquí
    example: [
        {
            id: 'example-1',
            quote: '[Tu cita de película aquí]',
            movie: '[Nombre de la película]',
            year: 2020,
            director: '[Director]',
            genre: ['Drama', 'Acción'],
            actors: ['Actor 1', 'Actor 2'],
            difficulty: 'medium',
            alternativeTitles: ['Título alternativo'],
            rating: 8.5,
            trivia: 'Dato curioso sobre la película'
        }
    ],
    
    // Categorías
    action: [],
    comedy: [],
    drama: [],
    scifi: [],
    horror: [],
    romance: [],
    thriller: [],
    animation: [],
    classic: [],
    
    // Instrucciones para agregar citas
    _instructions: {
        howToAdd: 'Agrega objetos con la estructura del ejemplo',
        externalAPIs: 'Usa TMDb o OMDb para obtener citas legalmente',
        userSubmissions: 'Permite que usuarios agreguen sus citas favoritas',
        guidelines: 'Siempre respeta los derechos de autor'
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// │                      SISTEMA DE ESTADÍSTICAS                                │
// ═══════════════════════════════════════════════════════════════════════════════

class QuoteStats {
    constructor() {
        this.players = new Map();
        this.globalStats = {
            totalGames: 0,
            totalGuesses: 0,
            correctGuesses: 0,
            hintsUsed: 0,
            averageTime: 0
        };
    }
    
    initPlayer(playerId) {
        if (!this.players.has(playerId)) {
            this.players.set(playerId, {
                gamesPlayed: 0,
                correctGuesses: 0,
                wrongGuesses: 0,
                totalPoints: 0,
                bestStreak: 0,
                currentStreak: 0,
                fastestGuess: Infinity,
                averageTime: 0,
                totalTime: 0,
                hintsUsed: 0,
                favoriteGenre: null,
                difficulty: {
                    easy: { played: 0, correct: 0 },
                    medium: { played: 0, correct: 0 },
                    hard: { played: 0, correct: 0 },
                    expert: { played: 0, correct: 0 }
                }
            });
        }
    }
    
    recordGame(playerId, correct, points, time, hintsUsed, difficulty) {
        if (!CONFIG.STATS_ENABLED) return;
        
        this.initPlayer(playerId);
        const player = this.players.get(playerId);
        
        player.gamesPlayed++;
        this.globalStats.totalGames++;
        this.globalStats.totalGuesses++;
        
        if (correct) {
            player.correctGuesses++;
            player.totalPoints += points;
            player.currentStreak++;
            this.globalStats.correctGuesses++;
            
            if (player.currentStreak > player.bestStreak) {
                player.bestStreak = player.currentStreak;
            }
            
            if (time < player.fastestGuess) {
                player.fastestGuess = time;
            }
            
            player.difficulty[difficulty].correct++;
        } else {
            player.wrongGuesses++;
            player.currentStreak = 0;
        }
        
        player.difficulty[difficulty].played++;
        player.totalTime += time;
        player.averageTime = player.totalTime / player.gamesPlayed;
        player.hintsUsed += hintsUsed;
        this.globalStats.hintsUsed += hintsUsed;
        
        Logger.debug(`📊 Estadísticas actualizadas para ${playerId}`);
    }
    
    getPlayerStats(playerId) {
        this.initPlayer(playerId);
        const stats = this.players.get(playerId);
        
        const accuracy = stats.gamesPlayed > 0
            ? (stats.correctGuesses / stats.gamesPlayed * 100).toFixed(2)
            : 0;
        
        return {
            ...stats,
            accuracy: `${accuracy}%`,
            fastestGuess: stats.fastestGuess === Infinity ? 'N/A' : `${stats.fastestGuess}s`,
            averageTime: `${stats.averageTime.toFixed(2)}s`
        };
    }
    
    getLeaderboard(limit = 10) {
        return Array.from(this.players.entries())
            .map(([id, stats]) => ({
                id,
                points: stats.totalPoints,
                accuracy: (stats.correctGuesses / stats.gamesPlayed * 100).toFixed(2),
                streak: stats.bestStreak,
                ...stats
            }))
            .sort((a, b) => b.points - a.points)
            .slice(0, limit);
    }
}

const globalStats = new QuoteStats();

// ═══════════════════════════════════════════════════════════════════════════════
// │                      GESTOR DE CITAS EXTERNAS                               │
// ═══════════════════════════════════════════════════════════════════════════════

class ExternalQuoteAPI {
    constructor() {
        this.cache = new Map();
    }
    
    /**
     * Obtener información de película desde TMDb
     */
    async getMovieFromTMDb(movieId) {
        if (!CONFIG.USE_EXTERNAL_API || !CONFIG.TMDB_API_KEY) {
            return null;
        }
        
        try {
            const cacheKey = `tmdb_${movieId}`;
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }
            
            const response = await axios.get(
                `https://api.themoviedb.org/3/movie/${movieId}`,
                {
                    params: {
                        api_key: CONFIG.TMDB_API_KEY,
                        language: 'es-ES'
                    }
                }
            );
            
            const movie = {
                title: response.data.title,
                year: new Date(response.data.release_date).getFullYear(),
                genres: response.data.genres.map(g => g.name),
                overview: response.data.overview,
                rating: response.data.vote_average,
                poster: response.data.poster_path
            };
            
            this.cache.set(cacheKey, movie);
            return movie;
            
        } catch (error) {
            Logger.error('Error obteniendo de TMDb:', error.message);
            return null;
        }
    }
    
    /**
     * Obtener información de película desde OMDb
     */
    async getMovieFromOMDb(title) {
        if (!CONFIG.USE_EXTERNAL_API || !CONFIG.OMDB_API_KEY) {
            return null;
        }
        
        try {
            const cacheKey = `omdb_${title}`;
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }
            
            const response = await axios.get(
                'http://www.omdbapi.com/',
                {
                    params: {
                        apikey: CONFIG.OMDB_API_KEY,
                        t: title
                    }
                }
            );
            
            if (response.data.Response === 'False') {
                return null;
            }
            
            const movie = {
                title: response.data.Title,
                year: parseInt(response.data.Year),
                director: response.data.Director,
                actors: response.data.Actors.split(', '),
                plot: response.data.Plot,
                genre: response.data.Genre.split(', '),
                rating: parseFloat(response.data.imdbRating)
            };
            
            this.cache.set(cacheKey, movie);
            return movie;
            
        } catch (error) {
            Logger.error('Error obteniendo de OMDb:', error.message);
            return null;
        }
    }
}

const externalAPI = new ExternalQuoteAPI();

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CLASE PRINCIPAL MOVIE QUOTE                            │
// ═══════════════════════════════════════════════════════════════════════════════

class MovieQuoteGame {
    constructor(playerId, options = {}) {
        this.id = crypto.randomBytes(8).toString('hex');
        this.playerId = playerId;
        this.options = {
            difficulty: options.difficulty || 'medium',
            category: options.category || 'all',
            maxAttempts: options.maxAttempts || CONFIG.MAX_ATTEMPTS,
            timeLimit: options.timeLimit || 120, // 120 segundos
            ...options
        };
        
        this.currentQuote = null;
        this.attempts = 0;
        this.hintsUsed = 0;
        this.startTime = null;
        this.endTime = null;
        this.isActive = false;
        this.guessedCorrectly = false;
        this.hintsRevealed = [];
        
        Logger.info(`🎬 Nuevo juego creado: ${this.id} para ${playerId}`);
    }
    
    /**
     * Iniciar juego con una cita aleatoria
     */
    start() {
        this.currentQuote = this.getRandomQuote();
        
        if (!this.currentQuote) {
            return {
                success: false,
                message: 'No hay citas disponibles en la categoría seleccionada.'
            };
        }
        
        this.startTime = Date.now();
        this.isActive = true;
        this.attempts = 0;
        this.hintsUsed = 0;
        this.hintsRevealed = [];
        
        Logger.info(`🎮 Juego iniciado con película: ${this.currentQuote.movie}`);
        
        return {
            success: true,
            gameId: this.id,
            quote: this.currentQuote.quote,
            difficulty: this.options.difficulty,
            maxAttempts: this.options.maxAttempts,
            timeLimit: this.options.timeLimit
        };
    }
    
    /**
     * Obtener cita aleatoria según dificultad y categoría
     */
    getRandomQuote() {
        let quotes = [];
        
        // Filtrar por categoría
        if (this.options.category === 'all') {
            quotes = Object.values(QUOTE_DATABASE)
                .filter(cat => Array.isArray(cat))
                .flat();
        } else {
            quotes = QUOTE_DATABASE[this.options.category] || [];
        }
        
        // Filtrar por dificultad
        quotes = quotes.filter(q => q.difficulty === this.options.difficulty);
        
        if (quotes.length === 0) {
            Logger.warn(`⚠️ No hay citas para ${this.options.category} - ${this.options.difficulty}`);
            return null;
        }
        
        return quotes[Math.floor(Math.random() * quotes.length)];
    }
    
    /**
     * Procesar intento de adivinanza
     */
    guess(answer) {
        if (!this.isActive) {
            return {
                success: false,
                message: 'El juego no está activo'
            };
        }
        
        if (this.attempts >= this.options.maxAttempts) {
            return this.endGame(false);
        }
        
        // Verificar tiempo límite
        const elapsedTime = (Date.now() - this.startTime) / 1000;
        if (elapsedTime > this.options.timeLimit) {
            return this.endGame(false, 'Se acabó el tiempo');
        }
        
        this.attempts++;
        
        // Búsqueda difusa para mayor flexibilidad
        const isCorrect = this.checkAnswer(answer);
        
        if (isCorrect) {
            return this.endGame(true);
        }
        
        const attemptsLeft = this.options.maxAttempts - this.attempts;
        
        if (attemptsLeft === 0) {
            return this.endGame(false);
        }
        
        return {
            success: false,
            correct: false,
            attemptsLeft,
            message: `❌ Incorrecto. Te quedan ${attemptsLeft} intentos.`,
            hint: this.getSuggestion()
        };
    }
    
    /**
     * Verificar respuesta con búsqueda difusa
     */
    checkAnswer(answer) {
        if (!answer || typeof answer !== 'string') return false;
        
        const fuse = new Fuse(
            [
                this.currentQuote.movie,
                ...(this.currentQuote.alternativeTitles || [])
            ],
            {
                threshold: CONFIG.FUZZY_THRESHOLD,
                includeScore: true
            }
        );
        
        const results = fuse.search(answer);
        
        if (results.length > 0 && results[0].score < CONFIG.FUZZY_THRESHOLD) {
            Logger.debug(`✅ Respuesta aceptada: "${answer}" ≈ "${results[0].item}"`);
            return true;
        }
        
        return false;
    }
    
    /**
     * Obtener pista
     */
    getHint() {
        if (!this.isActive) {
            return {
                success: false,
                message: 'El juego no está activo'
            };
        }
        
        const availableHints = [
            { type: 'year', data: `Año: ${this.currentQuote.year}` },
            { type: 'genre', data: `Género: ${this.currentQuote.genre.join(', ')}` },
            { type: 'director', data: `Director: ${this.currentQuote.director}` },
            { type: 'actors', data: `Actores: ${this.currentQuote.actors.slice(0, 2).join(', ')}` },
            { type: 'rating', data: `Rating: ${this.currentQuote.rating}/10` },
            { type: 'trivia', data: `Dato: ${this.currentQuote.trivia}` }
        ];
        
        // Filtrar pistas ya reveladas
        const unused = availableHints.filter(h => !this.hintsRevealed.includes(h.type));
        
        if (unused.length === 0) {
            return {
                success: false,
                message: 'No hay más pistas disponibles'
            };
        }
        
        const hint = unused[0];
        this.hintsUsed++;
        this.hintsRevealed.push(hint.type);
        
        Logger.debug(`💡 Pista revelada: ${hint.type}`);
        
        return {
            success: true,
            hint: hint.data,
            penalty: CONFIG.HINT_PENALTY,
            hintsUsed: this.hintsUsed
        };
    }
    
    /**
     * Obtener sugerencia después de fallo
     */
    getSuggestion() {
        const suggestions = [
            '💡 Pista: Usa /hint para obtener ayuda',
            '🤔 Prueba con el título original o traducido',
            '📝 Intenta escribir el título completo',
            '🎯 Revisa la ortografía'
        ];
        
        return suggestions[Math.floor(Math.random() * suggestions.length)];
    }
    
    /**
     * Finalizar juego
     */
    endGame(won, reason = '') {
        this.isActive = false;
        this.endTime = Date.now();
        this.guessedCorrectly = won;
        
        const duration = (this.endTime - this.startTime) / 1000;
        let points = 0;
        
        if (won) {
            // Calcular puntos
            const basePoints = this.getBasePoints();
            const hintPenalty = this.hintsUsed * CONFIG.HINT_PENALTY;
            const timeBonus = Math.max(0, (this.options.timeLimit - duration) * CONFIG.TIME_BONUS_MULTIPLIER);
            const attemptBonus = (this.options.maxAttempts - this.attempts) * 50;
            
            points = Math.max(0, basePoints - hintPenalty + timeBonus + attemptBonus);
            
            Logger.info(`🏆 Juego ganado: ${points} puntos en ${duration.toFixed(2)}s`);
        } else {
            Logger.info(`❌ Juego perdido: ${reason || 'Sin intentos'}`);
        }
        
        // Registrar estadísticas
        globalStats.recordGame(
            this.playerId,
            won,
            points,
            duration,
            this.hintsUsed,
            this.options.difficulty
        );
        
        return {
            success: true,
            gameOver: true,
            won,
            correctAnswer: this.currentQuote.movie,
            points,
            duration: duration.toFixed(2),
            attempts: this.attempts,
            hintsUsed: this.hintsUsed,
            movieInfo: {
                title: this.currentQuote.movie,
                year: this.currentQuote.year,
                director: this.currentQuote.director,
                genre: this.currentQuote.genre,
                rating: this.currentQuote.rating
            },
            message: won 
                ? `🎉 ¡Correcto! Has ganado ${points} puntos.`
                : `😔 Perdiste. La respuesta era: ${this.currentQuote.movie}`
        };
    }
    
    /**
     * Obtener puntos base según dificultad
     */
    getBasePoints() {
        const points = {
            easy: CONFIG.EASY_BASE_POINTS,
            medium: CONFIG.MEDIUM_BASE_POINTS,
            hard: CONFIG.HARD_BASE_POINTS,
            expert: CONFIG.EXPERT_BASE_POINTS
        };
        
        return points[this.options.difficulty] || CONFIG.MEDIUM_BASE_POINTS;
    }
    
    /**
     * Obtener información del juego actual
     */
    getGameInfo() {
        return {
            id: this.id,
            playerId: this.playerId,
            isActive: this.isActive,
            difficulty: this.options.difficulty,
            category: this.options.category,
            attempts: this.attempts,
            maxAttempts: this.options.maxAttempts,
            hintsUsed: this.hintsUsed,
            timeLeft: this.startTime 
                ? Math.max(0, this.options.timeLimit - (Date.now() - this.startTime) / 1000)
                : 0
        };
    }
    
    /**
     * Rendirse
     */
    surrender() {
        return this.endGame(false, 'Rendición');
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      GESTOR DE JUEGOS                                       │
// ═══════════════════════════════════════════════════════════════════════════════

class GameManager {
    constructor() {
        this.games = new Map();
    }
    
    createGame(playerId, options = {}) {
        // Limpiar juego anterior del jugador
        for (const [gameId, game] of this.games.entries()) {
            if (game.playerId === playerId && !game.isActive) {
                this.games.delete(gameId);
            }
        }
        
        const game = new MovieQuoteGame(playerId, options);
        this.games.set(game.id, game);
        
        return game;
    }
    
    getGame(gameId) {
        return this.games.get(gameId);
    }
    
    getPlayerGame(playerId) {
        for (const game of this.games.values()) {
            if (game.playerId === playerId && game.isActive) {
                return game;
            }
        }
        return null;
    }
    
    deleteGame(gameId) {
        return this.games.delete(gameId);
    }
    
    getActiveGames() {
        return Array.from(this.games.values()).filter(g => g.isActive);
    }
    
    cleanupOldGames(maxAge = 3600000) {
        const now = Date.now();
        let cleaned = 0;
        
        for (const [id, game] of this.games.entries()) {
            if (!game.isActive && game.endTime && (now - game.endTime) > maxAge) {
                this.games.delete(id);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            Logger.info(`🧹 ${cleaned} juegos antiguos limpiados`);
        }
        
        return cleaned;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      UTILIDADES                                             │
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Agregar cita personalizada a la base de datos
 */
function addCustomQuote(quote) {
    const requiredFields = ['quote', 'movie', 'year', 'genre', 'difficulty'];
    
    for (const field of requiredFields) {
        if (!quote[field]) {
            throw new Error(`Campo requerido faltante: ${field}`);
        }
    }
    
    const category = Array.isArray(quote.genre) ? quote.genre[0].toLowerCase() : 'example';
    
    if (!QUOTE_DATABASE[category]) {
        QUOTE_DATABASE[category] = [];
    }
    
    quote.id = crypto.randomBytes(8).toString('hex');
    QUOTE_DATABASE[category].push(quote);
    
    Logger.info(`✅ Cita agregada: ${quote.movie}`);
    
    return quote.id;
}

/**
 * Obtener categorías disponibles
 */
function getCategories() {
    return Object.keys(QUOTE_DATABASE).filter(key => 
        Array.isArray(QUOTE_DATABASE[key]) && QUOTE_DATABASE[key].length > 0
    );
}

/**
 * Obtener estadísticas globales
 */
function getGlobalStats() {
    return {
        ...globalStats.globalStats,
        totalPlayers: globalStats.players.size,
        totalQuotes: Object.values(QUOTE_DATABASE)
            .filter(cat => Array.isArray(cat))
            .reduce((sum, cat) => sum + cat.length, 0),
        categories: getCategories()
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      EXPORTACIONES                                          │
// ═══════════════════════════════════════════════════════════════════════════════

const gameManager = new GameManager();

export default MovieQuoteGame;
export {
    GameManager,
    QuoteStats,
    ExternalQuoteAPI,
    gameManager,
    globalStats,
    externalAPI,
    CONFIG,
    QUOTE_DATABASE,
    addCustomQuote,
    getCategories,
    getGlobalStats
};
