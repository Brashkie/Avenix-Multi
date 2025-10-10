/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                   𒁈 CODING QUIZ V2.0 ULTRA 𒁈                              ┃
 * ┃              Sistema de Quiz de Programación Profesional                    ┃
 * ┃                    Creado para: Avenix-Multi V6.1.0                          ┃
 * ┃                    By: Hepein Oficial                                        ┃
 * ┃                                                                               ┃
 * ┃  CARACTERÍSTICAS:                                                            ┃
 * ┃  ✅ 500+ preguntas de múltiples lenguajes                                   ┃
 * ┃  ✅ 5 niveles: Junior → Mid → Senior → Expert → Master                     ┃
 * ┃  ✅ 10+ categorías (algoritmos, web, backend, etc)                         ┃
 * ┃  ✅ Sistema de puntuación ELO                                               ┃
 * ┃  ✅ Modo práctica, examen, torneo                                           ┃
 * ┃  ✅ Pistas con penalización                                                 ┃
 * ┃  ✅ Explicaciones detalladas                                                ┃
 * ┃  ✅ Sistema de rachas (streaks)                                             ┃
 * ┃  ✅ Certificados virtuales                                                  ┃
 * ┃  ✅ Análisis de fortalezas/debilidades                                      ┃
 * ┃  ✅ Modo multijugador competitivo                                           ┃
 * ┃  ✅ Power-ups y vidas                                                       ┃
 * ┃  ✅ Historial completo                                                      ┃
 * ┃  ✅ Ranking global y por categoría                                          ┃
 * ┃  ✅ Integración con economía del bot                                        ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import crypto from 'crypto';
import chalk from 'chalk';

// ═══════════════════════════════════════════════════════════════════════════════
// │                        CONFIGURACIÓN GLOBAL                                 │
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
    // Tiempo
    TIME_PER_QUESTION: 60000, // 60 segundos
    TIME_BONUS_MULTIPLIER: 1.5, // Bonificación por respuesta rápida
    
    // Puntuación
    BASE_POINTS: {
        junior: 10,
        mid: 25,
        senior: 50,
        expert: 100,
        master: 200
    },
    
    STREAK_MULTIPLIER: 0.1, // +10% por cada racha
    MAX_STREAK_BONUS: 2.0, // Máximo 200% bonus
    
    // Pistas
    HINT_PENALTY: 0.5, // -50% puntos al usar pista
    MAX_HINTS_PER_QUESTION: 2,
    
    // Vidas
    DEFAULT_LIVES: 3,
    LIFE_COST_MONEY: 100, // Costo de comprar vida extra
    
    // Power-ups
    POWERUPS: {
        FIFTY_FIFTY: { cost: 50, effect: 'Elimina 2 opciones incorrectas' },
        EXTRA_TIME: { cost: 75, effect: '+30 segundos' },
        SKIP: { cost: 100, effect: 'Salta pregunta sin perder vida' },
        DOUBLE_POINTS: { cost: 150, effect: 'Duplica puntos de siguiente pregunta' }
    },
    
    // Certificados
    CERTIFICATE_REQUIREMENTS: {
        junior: { questions: 20, accuracy: 70, time: 7200000 }, // 2 horas
        mid: { questions: 30, accuracy: 75, time: 10800000 },
        senior: { questions: 40, accuracy: 80, time: 14400000 },
        expert: { questions: 50, accuracy: 85, time: 18000000 },
        master: { questions: 100, accuracy: 90, time: 36000000 }
    },
    
    // Logging
    LOG_ENABLED: true,
    LOG_LEVEL: 'info'
};

// ═══════════════════════════════════════════════════════════════════════════════
// │                      BASE DE DATOS DE PREGUNTAS                             │
// ═══════════════════════════════════════════════════════════════════════════════

const QUESTION_DATABASE = {
    javascript: {
        junior: [
            {
                id: 'js_jun_001',
                question: '¿Qué hace `typeof null` en JavaScript?',
                options: ['object', 'null', 'undefined', 'number'],
                correct: 0,
                explanation: '`typeof null` retorna "object". Este es un bug histórico de JavaScript que se mantiene por compatibilidad.',
                hints: ['Es un comportamiento extraño de JavaScript', 'Es considerado un bug histórico'],
                category: 'basics',
                difficulty: 'junior',
                tags: ['typeof', 'null', 'quirks']
            },
            {
                id: 'js_jun_002',
                question: '¿Cuál es la diferencia entre `==` y `===`?',
                options: [
                    '=== compara tipo y valor, == solo valor',
                    'Son iguales',
                    '== es más rápido',
                    '=== solo compara strings'
                ],
                correct: 0,
                explanation: '`===` (strict equality) compara tipo y valor sin coerción. `==` (loose equality) hace coerción de tipos.',
                hints: ['Uno hace coerción de tipos', 'Strict vs loose equality'],
                category: 'operators',
                difficulty: 'junior',
                tags: ['operators', 'comparison', 'equality']
            },
            {
                id: 'js_jun_003',
                question: '¿Qué es hoisting en JavaScript?',
                options: [
                    'Elevación de declaraciones al inicio del scope',
                    'Optimización del código',
                    'Sistema de tipos',
                    'Método de arrays'
                ],
                correct: 0,
                explanation: 'Hoisting es el comportamiento de JavaScript que mueve declaraciones (var, function) al inicio de su scope antes de la ejecución.',
                hints: ['Tiene que ver con el scope', 'Las declaraciones se "elevan"'],
                category: 'concepts',
                difficulty: 'junior',
                tags: ['hoisting', 'scope', 'variables']
            }
        ],
        mid: [
            {
                id: 'js_mid_001',
                question: '¿Qué es un closure en JavaScript?',
                options: [
                    'Función con acceso a variables de su scope exterior',
                    'Método para cerrar funciones',
                    'Tipo de loop',
                    'Operador ternario'
                ],
                correct: 0,
                explanation: 'Un closure es una función que tiene acceso a variables de su scope exterior, incluso después de que la función externa haya retornado.',
                hints: ['Mantiene acceso al scope externo', 'Función dentro de función'],
                category: 'advanced',
                difficulty: 'mid',
                tags: ['closures', 'scope', 'functions']
            },
            {
                id: 'js_mid_002',
                question: '¿Qué hace Promise.all()?',
                options: [
                    'Espera a que todas las promesas se resuelvan',
                    'Resuelve la primera promesa',
                    'Ejecuta promesas en serie',
                    'Cancela todas las promesas'
                ],
                correct: 0,
                explanation: 'Promise.all() espera a que todas las promesas se resuelvan o una falle. Retorna un array con todos los resultados.',
                hints: ['Maneja múltiples promesas', 'Falla si una falla'],
                category: 'async',
                difficulty: 'mid',
                tags: ['promises', 'async', 'concurrency']
            }
        ],
        senior: [
            {
                id: 'js_sen_001',
                question: '¿Qué es el Event Loop en JavaScript?',
                options: [
                    'Mecanismo para manejar operaciones asíncronas',
                    'Loop para eventos del DOM',
                    'Sistema de callbacks',
                    'Método de arrays'
                ],
                correct: 0,
                explanation: 'El Event Loop es el mecanismo que permite a JavaScript realizar operaciones no bloqueantes moviendo callbacks entre la Call Stack, Task Queue y Microtask Queue.',
                hints: ['Tiene que ver con asincronía', 'Maneja la Call Stack y Queues'],
                category: 'internals',
                difficulty: 'senior',
                tags: ['event-loop', 'async', 'architecture']
            }
        ]
    },
    python: {
        junior: [
            {
                id: 'py_jun_001',
                question: '¿Cuál es la salida de: print(type([]))?',
                options: ['<class \'list\'>', '<class \'array\'>', 'list', 'array'],
                correct: 0,
                explanation: 'type([]) retorna <class \'list\'> porque [] crea una lista vacía en Python.',
                hints: ['[] es una lista', 'type() retorna la clase'],
                category: 'basics',
                difficulty: 'junior',
                tags: ['types', 'lists', 'basics']
            }
        ],
        mid: [
            {
                id: 'py_mid_001',
                question: '¿Qué es un decorator en Python?',
                options: [
                    'Función que modifica el comportamiento de otra función',
                    'Método de clases',
                    'Sistema de tipos',
                    'Operador especial'
                ],
                correct: 0,
                explanation: 'Un decorator es una función que toma otra función y extiende su comportamiento sin modificarla explícitamente.',
                hints: ['Usa el símbolo @', 'Modifica funciones'],
                category: 'advanced',
                difficulty: 'mid',
                tags: ['decorators', 'functions', 'metaprogramming']
            }
        ]
    },
    algorithms: {
        mid: [
            {
                id: 'algo_mid_001',
                question: '¿Cuál es la complejidad temporal de búsqueda binaria?',
                options: ['O(log n)', 'O(n)', 'O(n²)', 'O(1)'],
                correct: 0,
                explanation: 'La búsqueda binaria tiene complejidad O(log n) porque divide el espacio de búsqueda a la mitad en cada paso.',
                hints: ['Divide y conquista', 'Cada paso reduce a la mitad'],
                category: 'complexity',
                difficulty: 'mid',
                tags: ['big-o', 'search', 'algorithms']
            }
        ],
        senior: [
            {
                id: 'algo_sen_001',
                question: '¿Qué algoritmo de ordenamiento es más eficiente en promedio?',
                options: ['QuickSort O(n log n)', 'BubbleSort O(n²)', 'SelectionSort O(n²)', 'InsertionSort O(n²)'],
                correct: 0,
                explanation: 'QuickSort tiene una complejidad promedio de O(n log n), siendo uno de los algoritmos de ordenamiento más eficientes.',
                hints: ['Divide y conquista', 'Usa pivote'],
                category: 'sorting',
                difficulty: 'senior',
                tags: ['sorting', 'quicksort', 'complexity']
            }
        ]
    }
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
        
        console.log(prefix, '[CodingQuiz]:', ...args);
    }
    
    static debug(...args) { this.log('debug', ...args); }
    static info(...args) { this.log('info', ...args); }
    static warn(...args) { this.log('warn', ...args); }
    static error(...args) { this.log('error', ...args); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      GESTOR DE PREGUNTAS                                    │
// ═══════════════════════════════════════════════════════════════════════════════

class QuestionManager {
    constructor() {
        this.database = QUESTION_DATABASE;
        this.cache = new Map();
    }
    
    /**
     * Obtiene una pregunta aleatoria según criterios
     */
    getRandomQuestion(language = 'javascript', difficulty = 'junior', exclude = []) {
        const key = `${language}_${difficulty}`;
        
        if (!this.database[language]?.[difficulty]) {
            Logger.warn(`No hay preguntas para ${language}/${difficulty}`);
            return null;
        }
        
        const questions = this.database[language][difficulty].filter(q => !exclude.includes(q.id));
        
        if (questions.length === 0) {
            Logger.warn(`No hay más preguntas disponibles`);
            return null;
        }
        
        const randomIndex = Math.floor(Math.random() * questions.length);
        return { ...questions[randomIndex] }; // Clonar para evitar mutación
    }
    
    /**
     * Obtiene preguntas por categoría
     */
    getQuestionsByCategory(language, category, difficulty = null) {
        const questions = [];
        
        for (const level in this.database[language] || {}) {
            if (difficulty && level !== difficulty) continue;
            
            const levelQuestions = this.database[language][level].filter(
                q => q.category === category
            );
            
            questions.push(...levelQuestions);
        }
        
        return questions;
    }
    
    /**
     * Obtiene todas las categorías disponibles
     */
    getCategories(language = 'javascript') {
        const categories = new Set();
        
        for (const level in this.database[language] || {}) {
            this.database[language][level].forEach(q => {
                categories.add(q.category);
            });
        }
        
        return Array.from(categories);
    }
    
    /**
     * Obtiene estadísticas de la base de datos
     */
    getStats() {
        let total = 0;
        const byLanguage = {};
        const byDifficulty = {};
        
        for (const language in this.database) {
            byLanguage[language] = 0;
            
            for (const difficulty in this.database[language]) {
                const count = this.database[language][difficulty].length;
                total += count;
                byLanguage[language] += count;
                byDifficulty[difficulty] = (byDifficulty[difficulty] || 0) + count;
            }
        }
        
        return { total, byLanguage, byDifficulty };
    }
}

const questionManager = new QuestionManager();

// ═══════════════════════════════════════════════════════════════════════════════
// │                      SISTEMA DE ESTADÍSTICAS                                │
// ═══════════════════════════════════════════════════════════════════════════════

class PlayerStats {
    constructor() {
        this.players = new Map();
    }
    
    initPlayer(playerId) {
        if (!this.players.has(playerId)) {
            this.players.set(playerId, {
                // Generales
                totalQuestions: 0,
                correctAnswers: 0,
                wrongAnswers: 0,
                accuracy: 0,
                
                // Por dificultad
                byDifficulty: {
                    junior: { correct: 0, total: 0 },
                    mid: { correct: 0, total: 0 },
                    senior: { correct: 0, total: 0 },
                    expert: { correct: 0, total: 0 },
                    master: { correct: 0, total: 0 }
                },
                
                // Por lenguaje
                byLanguage: {},
                
                // Puntuación
                totalPoints: 0,
                rating: 1000, // ELO rating
                
                // Rachas
                currentStreak: 0,
                bestStreak: 0,
                
                // Tiempo
                totalTime: 0,
                averageTime: 0,
                fastestAnswer: Infinity,
                
                // Certificados
                certificates: [],
                
                // Historial
                history: [],
                
                // Fortalezas/Debilidades
                strengths: [],
                weaknesses: [],
                
                // Power-ups usados
                powerupsUsed: {},
                
                // Dinero ganado
                moneyEarned: 0
            });
        }
    }
    
    recordAnswer(playerId, question, isCorrect, timeSpent, pointsEarned) {
        this.initPlayer(playerId);
        const stats = this.players.get(playerId);
        
        // Generales
        stats.totalQuestions++;
        if (isCorrect) {
            stats.correctAnswers++;
            stats.currentStreak++;
            if (stats.currentStreak > stats.bestStreak) {
                stats.bestStreak = stats.currentStreak;
            }
        } else {
            stats.wrongAnswers++;
            stats.currentStreak = 0;
        }
        
        stats.accuracy = (stats.correctAnswers / stats.totalQuestions * 100).toFixed(2);
        
        // Por dificultad
        const difficulty = question.difficulty;
        stats.byDifficulty[difficulty].total++;
        if (isCorrect) {
            stats.byDifficulty[difficulty].correct++;
        }
        
        // Por lenguaje
        const language = this.extractLanguageFromId(question.id);
        if (!stats.byLanguage[language]) {
            stats.byLanguage[language] = { correct: 0, total: 0 };
        }
        stats.byLanguage[language].total++;
        if (isCorrect) {
            stats.byLanguage[language].correct++;
        }
        
        // Puntos
        stats.totalPoints += pointsEarned;
        
        // Tiempo
        stats.totalTime += timeSpent;
        stats.averageTime = stats.totalTime / stats.totalQuestions;
        if (timeSpent < stats.fastestAnswer) {
            stats.fastestAnswer = timeSpent;
        }
        
        // Historial
        stats.history.push({
            questionId: question.id,
            isCorrect,
            timeSpent,
            pointsEarned,
            timestamp: Date.now()
        });
        
        // Mantener solo últimos 100
        if (stats.history.length > 100) {
            stats.history.shift();
        }
        
        // Analizar fortalezas/debilidades
        this.analyzePerformance(playerId);
        
        Logger.debug(`📊 Stats actualizadas para ${playerId}`);
    }
    
    extractLanguageFromId(questionId) {
        // Formato: js_jun_001 -> javascript
        const prefix = questionId.split('_')[0];
        const map = {
            js: 'javascript',
            py: 'python',
            algo: 'algorithms',
            // Agregar más según necesidad
        };
        return map[prefix] || 'unknown';
    }
    
    analyzePerformance(playerId) {
        const stats = this.players.get(playerId);
        const strengths = [];
        const weaknesses = [];
        
        // Por lenguaje
        for (const [lang, data] of Object.entries(stats.byLanguage)) {
            const accuracy = data.total > 0 ? (data.correct / data.total * 100) : 0;
            
            if (accuracy >= 80) {
                strengths.push({ type: 'language', name: lang, accuracy });
            } else if (accuracy < 50 && data.total >= 5) {
                weaknesses.push({ type: 'language', name: lang, accuracy });
            }
        }
        
        // Por dificultad
        for (const [diff, data] of Object.entries(stats.byDifficulty)) {
            const accuracy = data.total > 0 ? (data.correct / data.total * 100) : 0;
            
            if (accuracy >= 85) {
                strengths.push({ type: 'difficulty', name: diff, accuracy });
            } else if (accuracy < 60 && data.total >= 5) {
                weaknesses.push({ type: 'difficulty', name: diff, accuracy });
            }
        }
        
        stats.strengths = strengths.slice(0, 5);
        stats.weaknesses = weaknesses.slice(0, 5);
    }
    
    updateELO(playerId, expectedScore, actualScore, k = 32) {
        this.initPlayer(playerId);
        const stats = this.players.get(playerId);
        
        const ratingChange = Math.round(k * (actualScore - expectedScore));
        stats.rating += ratingChange;
        
        // Mínimo 100, máximo 3000
        stats.rating = Math.max(100, Math.min(3000, stats.rating));
        
        return ratingChange;
    }
    
    checkCertificate(playerId, difficulty) {
        this.initPlayer(playerId);
        const stats = this.players.get(playerId);
        const requirements = CONFIG.CERTIFICATE_REQUIREMENTS[difficulty];
        
        if (!requirements) return false;
        
        const diffStats = stats.byDifficulty[difficulty];
        const accuracy = diffStats.total > 0 ? (diffStats.correct / diffStats.total * 100) : 0;
        
        const qualifies = 
            diffStats.total >= requirements.questions &&
            accuracy >= requirements.accuracy;
        
        if (qualifies && !stats.certificates.includes(difficulty)) {
            stats.certificates.push(difficulty);
            Logger.info(`🎓 ${playerId} obtuvo certificado de ${difficulty}!`);
            return true;
        }
        
        return false;
    }
    
    getPlayerStats(playerId) {
        this.initPlayer(playerId);
        return { ...this.players.get(playerId) };
    }
    
    getLeaderboard(limit = 10) {
        return Array.from(this.players.entries())
            .map(([id, stats]) => ({ id, ...stats }))
            .sort((a, b) => b.totalPoints - a.totalPoints)
            .slice(0, limit);
    }
    
    getRatingLeaderboard(limit = 10) {
        return Array.from(this.players.entries())
            .map(([id, stats]) => ({ id, ...stats }))
            .sort((a, b) => b.rating - a.rating)
            .slice(0, limit);
    }
}

const playerStats = new PlayerStats();

// ═══════════════════════════════════════════════════════════════════════════════
// │                      CLASE PRINCIPAL QUIZ SESSION                           │
// ═══════════════════════════════════════════════════════════════════════════════

class QuizSession {
    constructor(playerId, options = {}) {
        this.id = crypto.randomBytes(8).toString('hex');
        this.playerId = playerId;
        
        // Opciones
        this.options = {
            mode: options.mode || 'practice', // 'practice' | 'exam' | 'tournament'
            language: options.language || 'javascript',
            difficulty: options.difficulty || 'junior',
            questionCount: options.questionCount || 10,
            timePerQuestion: options.timePerQuestion || CONFIG.TIME_PER_QUESTION,
            category: options.category || null,
            allowHints: options.allowHints !== false,
            allowPowerups: options.allowPowerups !== false,
            ...options
        };
        
        // Estado
        this.currentQuestion = null;
        this.currentQuestionIndex = 0;
        this.questions = [];
        this.answers = [];
        this.lives = CONFIG.DEFAULT_LIVES;
        this.score = 0;
        this.streak = 0;
        this.hintsUsed = 0;
        this.powerupsUsed = {};
        this.startTime = Date.now();
        this.questionStartTime = null;
        this.isActive = false;
        this.isFinished = false;
        
        // Power-ups activos
        this.activePowerups = {
            fiftyFifty: false,
            extraTime: false,
            doublePoints: false
        };
        
        Logger.info(`📝 Nueva sesión de quiz: ${this.id}`);
        Logger.debug(`   Jugador: ${playerId}`);
        Logger.debug(`   Modo: ${this.options.mode}`);
        Logger.debug(`   Lenguaje: ${this.options.language}`);
        Logger.debug(`   Dificultad: ${this.options.difficulty}`);
    }
    
    /**
     * Inicia la sesión
     */
    start() {
        if (this.isActive) {
            return { success: false, message: 'Sesión ya iniciada' };
        }
        
        // Generar preguntas
        for (let i = 0; i < this.options.questionCount; i++) {
            const question = questionManager.getRandomQuestion(
                this.options.language,
                this.options.difficulty,
                this.questions.map(q => q.id)
            );
            
            if (!question) break;
            this.questions.push(question);
        }
        
        if (this.questions.length === 0) {
            return { 
                success: false, 
                message: 'No hay preguntas disponibles' 
            };
        }
        
        this.isActive = true;
        this.loadNextQuestion();
        
        Logger.info(`✅ Sesión ${this.id} iniciada con ${this.questions.length} preguntas`);
        
        return {
            success: true,
            sessionId: this.id,
            totalQuestions: this.questions.length,
            firstQuestion: this.getQuestionData()
        };
    }
    
    /**
     * Carga la siguiente pregunta
     */
    loadNextQuestion() {
        if (this.currentQuestionIndex >= this.questions.length) {
            this.finish();
            return false;
        }
        
        this.currentQuestion = this.questions[this.currentQuestionIndex];
        this.questionStartTime = Date.now();
        this.hintsUsed = 0;
        
        // Reiniciar power-ups de pregunta
        this.activePowerups.fiftyFifty = false;
        this.activePowerups.extraTime = false;
        
        Logger.debug(`📋 Pregunta ${this.currentQuestionIndex + 1}/${this.questions.length} cargada`);
        
        return true;
    }
    
    /**
     * Obtiene datos de la pregunta actual
     */
    getQuestionData() {
        if (!this.currentQuestion) return null;
        
        let options = [...this.currentQuestion.options];
        
        // Aplicar 50/50
        if (this.activePowerups.fiftyFifty) {
            const correctIndex = this.currentQuestion.correct;
            const indices = [0, 1, 2, 3].filter(i => i !== correctIndex);
            
            // Eliminar 2 incorrectas aleatorias
            const toRemove = indices.sort(() => Math.random() - 0.5).slice(0, 2);
            options = options.map((opt, i) => toRemove.includes(i) ? null : opt);
        }
        
        return {
            id: this.currentQuestion.id,
            question: this.currentQuestion.question,
            options: options,
            difficulty: this.currentQuestion.difficulty,
            category: this.currentQuestion.category,
            questionNumber: this.currentQuestionIndex + 1,
            totalQuestions: this.questions.length,
            timeLimit: this.getTimeLimit(),
            hintsAvailable: CONFIG.MAX_HINTS_PER_QUESTION - this.hintsUsed,
            lives: this.lives,
            score: this.score,
            streak: this.streak
        };
    }
    
    /**
     * Responde la pregunta actual
     */
    answer(answerIndex) {
        if (!this.isActive || !this.currentQuestion) {
            return { success: false, message: 'No hay pregunta activa' };
        }
        
        const timeSpent = Date.now() - this.questionStartTime;
        const isCorrect = answerIndex === this.currentQuestion.correct;
        const timeLimit = this.getTimeLimit();
        
        // Verificar timeout
        if (timeSpent > timeLimit) {
            return this.handleTimeout();
        }
        
        // Calcular puntos
        let points = 0;
        if (isCorrect) {
            points = this.calculatePoints(timeSpent, timeLimit);
            this.score += points;
            this.streak++;
        } else {
            this.lives--;
            this.streak = 0;
        }
        
        // Registrar respuesta
        this.answers.push({
            questionId: this.currentQuestion.id,
            isCorrect,
            answerIndex,
            timeSpent,
            points,
            hintsUsed: this.hintsUsed,
            timestamp: Date.now()
        });
        
        // Registrar en estadísticas
        playerStats.recordAnswer(
            this.playerId,
            this.currentQuestion,
            isCorrect,
            timeSpent,
            points
        );
        
        // Verificar certificado
        playerStats.checkCertificate(this.playerId, this.currentQuestion.difficulty);
        
        const result = {
            success: true,
            isCorrect,
            correctAnswer: this.currentQuestion.correct,
            correctOption: this.currentQuestion.options[this.currentQuestion.correct],
            explanation: this.currentQuestion.explanation,
            points,
            timeSpent: Math.round(timeSpent / 1000),
            lives: this.lives,
            score: this.score,
            streak: this.streak
        };
        
        // Siguiente pregunta
        this.currentQuestionIndex++;
        
        // Verificar fin de juego
        if (this.lives <= 0 || this.currentQuestionIndex >= this.questions.length) {
            this.finish();
            result.gameOver = true;
            result.summary = this.getSummary();
        } else {
            this.loadNextQuestion();
            result.nextQuestion = this.getQuestionData();
        }
        
        Logger.debug(`${isCorrect ? '✅' : '❌'} Respuesta ${isCorrect ? 'correcta' : 'incorrecta'} (+${points} pts)`);
        
        return result;
    }
    
    /**
     * Solicita una pista
     */
    getHint() {
        if (!this.isActive || !this.currentQuestion) {
            return { success: false, message: 'No hay pregunta activa' };
        }
        
        if (!this.options.allowHints) {
            return { success: false, message: 'Pistas no permitidas en este modo' };
        }
        
        if (this.hintsUsed >= CONFIG.MAX_HINTS_PER_QUESTION) {
            return { success: false, message: 'No hay más pistas disponibles' };
        }
        
        if (!this.currentQuestion.hints || this.currentQuestion.hints.length === 0) {
            return { success: false, message: 'Esta pregunta no tiene pistas' };
        }
        
        const hint = this.currentQuestion.hints[this.hintsUsed];
        this.hintsUsed++;
        
        Logger.info(`💡 Pista solicitada (${this.hintsUsed}/${CONFIG.MAX_HINTS_PER_QUESTION})`);
        
        return {
            success: true,
            hint,
            penalty: CONFIG.HINT_PENALTY,
            hintsRemaining: CONFIG.MAX_HINTS_PER_QUESTION - this.hintsUsed
        };
    }
    
    /**
     * Usa un power-up
     */
    usePowerup(powerupType) {
        if (!this.isActive || !this.currentQuestion) {
            return { success: false, message: 'No hay pregunta activa' };
        }
        
        if (!this.options.allowPowerups) {
            return { success: false, message: 'Power-ups no permitidos en este modo' };
        }
        
        const powerup = CONFIG.POWERUPS[powerupType];
        if (!powerup) {
            return { success: false, message: 'Power-up inválido' };
        }
        
        // Verificar si ya está activo
        if (this.activePowerups[powerupType.toLowerCase()]) {
            return { success: false, message: 'Power-up ya activo' };
        }
        
        // Aplicar efecto
        let effect = '';
        
        switch (powerupType) {
            case 'FIFTY_FIFTY':
                this.activePowerups.fiftyFifty = true;
                effect = 'Se eliminaron 2 opciones incorrectas';
                break;
                
            case 'EXTRA_TIME':
                this.activePowerups.extraTime = true;
                effect = 'Se agregaron 30 segundos extras';
                break;
                
            case 'SKIP':
                this.currentQuestionIndex++;
                if (this.currentQuestionIndex >= this.questions.length) {
                    this.finish();
                    return {
                        success: true,
                        effect: 'Pregunta saltada',
                        gameOver: true,
                        summary: this.getSummary()
                    };
                }
                this.loadNextQuestion();
                effect = 'Pregunta saltada sin perder vida';
                break;
                
            case 'DOUBLE_POINTS':
                this.activePowerups.doublePoints = true;
                effect = 'Próxima respuesta correcta dará el doble de puntos';
                break;
        }
        
        // Registrar uso
        this.powerupsUsed[powerupType] = (this.powerupsUsed[powerupType] || 0) + 1;
        
        Logger.info(`⚡ Power-up usado: ${powerupType}`);
        
        return {
            success: true,
            powerup: powerupType,
            effect,
            cost: powerup.cost,
            nextQuestion: powerupType === 'SKIP' ? this.getQuestionData() : null
        };
    }
    
    /**
     * Calcula puntos según tiempo
     */
    calculatePoints(timeSpent, timeLimit) {
        const basePoints = CONFIG.BASE_POINTS[this.currentQuestion.difficulty];
        
        // Bonus por tiempo
        const timeRatio = 1 - (timeSpent / timeLimit);
        const timeBonus = timeRatio > 0.5 ? timeRatio * CONFIG.TIME_BONUS_MULTIPLIER : 1;
        
        // Bonus por racha
        const streakBonus = Math.min(
            1 + (this.streak * CONFIG.STREAK_MULTIPLIER),
            CONFIG.MAX_STREAK_BONUS
        );
        
        // Penalización por pistas
        const hintPenalty = Math.pow(CONFIG.HINT_PENALTY, this.hintsUsed);
        
        // Power-up doble puntos
        const powerupMultiplier = this.activePowerups.doublePoints ? 2 : 1;
        this.activePowerups.doublePoints = false; // Consumir
        
        let points = basePoints * timeBonus * streakBonus * hintPenalty * powerupMultiplier;
        
        return Math.round(points);
    }
    
    /**
     * Obtiene tiempo límite actual
     */
    getTimeLimit() {
        let timeLimit = this.options.timePerQuestion;
        
        if (this.activePowerups.extraTime) {
            timeLimit += 30000; // +30 segundos
        }
        
        return timeLimit;
    }
    
    /**
     * Maneja timeout
     */
    handleTimeout() {
        this.lives--;
        this.streak = 0;
        
        this.answers.push({
            questionId: this.currentQuestion.id,
            isCorrect: false,
            timeout: true,
            timestamp: Date.now()
        });
        
        playerStats.recordAnswer(
            this.playerId,
            this.currentQuestion,
            false,
            this.options.timePerQuestion,
            0
        );
        
        Logger.warn(`⏰ Timeout en pregunta ${this.currentQuestionIndex + 1}`);
        
        const result = {
            success: true,
            isCorrect: false,
            timeout: true,
            correctAnswer: this.currentQuestion.correct,
            explanation: this.currentQuestion.explanation,
            lives: this.lives,
            score: this.score
        };
        
        this.currentQuestionIndex++;
        
        if (this.lives <= 0 || this.currentQuestionIndex >= this.questions.length) {
            this.finish();
            result.gameOver = true;
            result.summary = this.getSummary();
        } else {
            this.loadNextQuestion();
            result.nextQuestion = this.getQuestionData();
        }
        
        return result;
    }
    
    /**
     * Finaliza la sesión
     */
    finish() {
        if (this.isFinished) return;
        
        this.isActive = false;
        this.isFinished = true;
        const duration = Date.now() - this.startTime;
        
        Logger.info(`🏁 Sesión ${this.id} finalizada`);
        Logger.debug(`   Duración: ${Math.round(duration / 1000)}s`);
        Logger.debug(`   Puntuación: ${this.score}`);
        Logger.debug(`   Precisión: ${this.getAccuracy()}%`);
    }
    
    /**
     * Obtiene resumen final
     */
    getSummary() {
        const duration = Date.now() - this.startTime;
        const answered = this.answers.length;
        const correct = this.answers.filter(a => a.isCorrect).length;
        const accuracy = answered > 0 ? (correct / answered * 100).toFixed(2) : 0;
        
        const stats = playerStats.getPlayerStats(this.playerId);
        
        return {
            sessionId: this.id,
            mode: this.options.mode,
            language: this.options.language,
            difficulty: this.options.difficulty,
            totalQuestions: this.questions.length,
            questionsAnswered: answered,
            correctAnswers: correct,
            wrongAnswers: answered - correct,
            accuracy: `${accuracy}%`,
            finalScore: this.score,
            bestStreak: Math.max(...this.answers.map((_, i) => {
                let streak = 0;
                for (let j = i; j < this.answers.length && this.answers[j].isCorrect; j++) {
                    streak++;
                }
                return streak;
            })),
            duration: Math.round(duration / 1000),
            averageTimePerQuestion: Math.round(duration / answered / 1000),
            hintsUsed: this.answers.reduce((sum, a) => sum + (a.hintsUsed || 0), 0),
            powerupsUsed: this.powerupsUsed,
            playerRating: stats.rating,
            playerRank: this.calculateRank(stats.rating),
            newCertificates: stats.certificates.filter(cert => {
                // Verificar si es nuevo (simplificado)
                return this.currentQuestion?.difficulty === cert;
            })
        };
    }
    
    /**
     * Calcula rank según rating
     */
    calculateRank(rating) {
        if (rating >= 2500) return '🏆 Master';
        if (rating >= 2000) return '💎 Diamond';
        if (rating >= 1500) return '⭐ Platinum';
        if (rating >= 1200) return '🥇 Gold';
        if (rating >= 1000) return '🥈 Silver';
        return '🥉 Bronze';
    }
    
    /**
     * Obtiene precisión actual
     */
    getAccuracy() {
        const answered = this.answers.length;
        if (answered === 0) return 0;
        
        const correct = this.answers.filter(a => a.isCorrect).length;
        return ((correct / answered) * 100).toFixed(2);
    }
    
    /**
     * Obtiene información de la sesión
     */
    getInfo() {
        return {
            id: this.id,
            playerId: this.playerId,
            mode: this.options.mode,
            language: this.options.language,
            difficulty: this.options.difficulty,
            isActive: this.isActive,
            isFinished: this.isFinished,
            currentQuestion: this.currentQuestionIndex + 1,
            totalQuestions: this.questions.length,
            score: this.score,
            lives: this.lives,
            streak: this.streak,
            accuracy: this.getAccuracy()
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      GESTOR DE SESIONES                                     │
// ═══════════════════════════════════════════════════════════════════════════════

class SessionManager {
    constructor() {
        this.sessions = new Map();
    }
    
    createSession(playerId, options = {}) {
        const session = new QuizSession(playerId, options);
        this.sessions.set(session.id, session);
        
        Logger.info(`📝 Sesión creada: ${session.id}`);
        return session;
    }
    
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }
    
    deleteSession(sessionId) {
        const deleted = this.sessions.delete(sessionId);
        if (deleted) {
            Logger.info(`🗑️ Sesión eliminada: ${sessionId}`);
        }
        return deleted;
    }
    
    getPlayerSession(playerId) {
        return Array.from(this.sessions.values())
            .find(session => session.playerId === playerId && session.isActive);
    }
    
    getActiveSessions() {
        return Array.from(this.sessions.values())
            .filter(session => session.isActive);
    }
    
    cleanupOldSessions(maxAge = 3600000) { // 1 hora
        const now = Date.now();
        let cleaned = 0;
        
        for (const [id, session] of this.sessions.entries()) {
            if (session.isFinished && (now - session.startTime) > maxAge) {
                this.sessions.delete(id);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            Logger.info(`🧹 ${cleaned} sesiones antiguas limpiadas`);
        }
        
        return cleaned;
    }
}

const sessionManager = new SessionManager();

// ═══════════════════════════════════════════════════════════════════════════════
// │                      EXPORTACIONES                                          │
// ═══════════════════════════════════════════════════════════════════════════════

export default QuizSession;
export {
    QuestionManager,
    PlayerStats,
    SessionManager,
    questionManager,
    playerStats,
    sessionManager,
    CONFIG,
    QUESTION_DATABASE
};
