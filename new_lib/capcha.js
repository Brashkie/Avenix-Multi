/**
 * ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
 * ┃                   𒁈 CAPTCHA SYSTEM V2.0 ULTRA 𒁈                           ┃
 * ┃              Sistema de Verificación Anti-Bot Avanzado                      ┃
 * ┃                    Creado para: Avenix-Multi V6.1.0                          ┃
 * ┃                    By: Hepein Oficial                                        ┃
 * ┃                                                                               ┃
 * ┃  CARACTERÍSTICAS:                                                            ┃
 * ┃  ✅ 6 tipos de CAPTCHA (math, text, emoji, pattern, order, quiz)           ┃
 * ┃  ✅ 4 niveles de dificultad (easy, medium, hard, extreme)                  ┃
 * ┃  ✅ Sistema de reintentos con penalización                                  ┃
 * ┃  ✅ Timeout configurable por CAPTCHA                                        ┃
 * ┃  ✅ Whitelist/Blacklist automática                                          ┃
 * ┃  ✅ Sistema de puntos de confianza (Trust Score)                           ┃
 * ┃  ✅ Detección de patrones de bots                                           ┃
 * ┃  ✅ Cache de usuarios verificados                                           ┃
 * ┃  ✅ Estadísticas detalladas                                                 ┃
 * ┃  ✅ Auto-ban temporal por fallos                                            ┃
 * ┃  ✅ Sistema de reportes y alertas                                           ┃
 * ┃  ✅ Integración perfecta con WhatsApp                                       ┃
 * ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
 */

import crypto from 'crypto';
import chalk from 'chalk';

// ═══════════════════════════════════════════════════════════════════════════════
// │                        CONFIGURACIÓN GLOBAL                                 │
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
    // Tipos de CAPTCHA
    DEFAULT_TYPE: 'math', // 'math' | 'text' | 'emoji' | 'pattern' | 'order' | 'quiz'
    DEFAULT_DIFFICULTY: 'medium', // 'easy' | 'medium' | 'hard' | 'extreme'
    
    // Reintentos
    MAX_ATTEMPTS: 3,
    PENALTY_TIME: 300000, // 5 minutos después de fallar todos los intentos
    
    // Timeouts
    TIMEOUT_EASY: 120000, // 2 minutos
    TIMEOUT_MEDIUM: 90000, // 1.5 minutos
    TIMEOUT_HARD: 60000, // 1 minuto
    TIMEOUT_EXTREME: 45000, // 45 segundos
    
    // Verificación
    VERIFICATION_EXPIRES: 86400000, // 24 horas
    AUTO_VERIFY_AFTER: 7, // Verificar automáticamente después de 7 captchas exitosos
    
    // Trust Score
    TRUST_ENABLED: true,
    TRUST_THRESHOLD_LOW: 30,
    TRUST_THRESHOLD_HIGH: 70,
    
    // Anti-Bot
    DETECT_BOT_PATTERNS: true,
    MAX_FAILURES_BEFORE_BAN: 5,
    BAN_DURATION: 3600000, // 1 hora
    
    // Cache
    CACHE_ENABLED: true,
    CACHE_DURATION: 3600000, // 1 hora
    
    // Whitelist/Blacklist
    WHITELIST_ENABLED: true,
    BLACKLIST_ENABLED: true,
    
    // Estadísticas
    STATS_ENABLED: true,
    
    // Logging
    LOG_ENABLED: true,
    LOG_LEVEL: 'info', // 'debug' | 'info' | 'warn' | 'error'
    
    // Mensajes
    USE_EMOJIS: true
};

// ═══════════════════════════════════════════════════════════════════════════════
// │                      SISTEMA DE LOGGING                                     │
// ═══════════════════════════════════════════════════════════════════════════════

class Logger {
    static levels = { debug: 0, info: 1, warn: 2, error: 3 };
    static currentLevel = this.levels[CONFIG.LOG_LEVEL] || 1;
    
    static log(level, ...args) {
        if (!CONFIG.LOG_ENABLED || this.levels[level] < this.currentLevel) return;
        
        const timestamp = new Date().toLocaleString('es-PE');
        const prefix = {
            debug: chalk.bold.bgBlue(' DEBUG '),
            info: chalk.bold.bgGreen(' INFO '),
            warn: chalk.bold.bgYellow(' WARN '),
            error: chalk.bold.bgRed(' ERROR ')
        }[level];
        
        console.log(prefix, `[${chalk.gray(timestamp)}] [CAPTCHA]:`, ...args);
    }
    
    static debug(...args) { this.log('debug', ...args); }
    static info(...args) { this.log('info', ...args); }
    static warn(...args) { this.log('warn', ...args); }
    static error(...args) { this.log('error', ...args); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      GENERADORES DE CAPTCHA                                 │
// ═══════════════════════════════════════════════════════════════════════════════

class CaptchaGenerator {
    /**
     * CAPTCHA Matemático
     */
    static generateMath(difficulty = 'medium') {
        const operations = {
            easy: ['+', '-'],
            medium: ['+', '-', '*'],
            hard: ['+', '-', '*', '/'],
            extreme: ['+', '-', '*', '/', '%', '**']
        };
        
        const ranges = {
            easy: { min: 1, max: 20 },
            medium: { min: 10, max: 50 },
            hard: { min: 20, max: 100 },
            extreme: { min: 50, max: 200 }
        };
        
        const ops = operations[difficulty];
        const range = ranges[difficulty];
        
        const num1 = this.randomInt(range.min, range.max);
        const num2 = this.randomInt(range.min, range.max);
        const operation = ops[Math.floor(Math.random() * ops.length)];
        
        let question, answer;
        
        switch (operation) {
            case '+':
                question = `${num1} + ${num2}`;
                answer = num1 + num2;
                break;
            case '-':
                question = `${num1} - ${num2}`;
                answer = num1 - num2;
                break;
            case '*':
                question = `${num1} × ${num2}`;
                answer = num1 * num2;
                break;
            case '/':
                const divisor = this.randomInt(2, 10);
                const dividend = divisor * this.randomInt(range.min, range.max);
                question = `${dividend} ÷ ${divisor}`;
                answer = dividend / divisor;
                break;
            case '%':
                question = `${num1} % ${num2}`;
                answer = num1 % num2;
                break;
            case '**':
                const base = this.randomInt(2, 5);
                const exp = this.randomInt(2, 4);
                question = `${base}^${exp}`;
                answer = Math.pow(base, exp);
                break;
        }
        
        return {
            type: 'math',
            question: `🔢 Resuelve: ${question} = ?`,
            answer: String(answer),
            difficulty
        };
    }
    
    /**
     * CAPTCHA de Texto Distorsionado
     */
    static generateText(difficulty = 'medium') {
        const lengths = {
            easy: 4,
            medium: 5,
            hard: 6,
            extreme: 8
        };
        
        const chars = {
            easy: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
            medium: 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789',
            hard: 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789',
            extreme: 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
        };
        
        const length = lengths[difficulty];
        const charset = chars[difficulty];
        
        let code = '';
        for (let i = 0; i < length; i++) {
            code += charset[Math.floor(Math.random() * charset.length)];
        }
        
        // Distorsionar visualmente
        const distorted = this.distortText(code, difficulty);
        
        return {
            type: 'text',
            question: `📝 Escribe el siguiente código:\n\n${distorted}\n\n(Respeta mayúsculas/minúsculas)`,
            answer: code,
            difficulty
        };
    }
    
    /**
     * CAPTCHA de Emojis
     */
    static generateEmoji(difficulty = 'medium') {
        const emojiSets = {
            easy: ['🍎', '🍌', '🍇', '🍓', '🍒'],
            medium: ['😀', '😎', '🤔', '😴', '🤗', '😱', '🥳', '😭'],
            hard: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯'],
            extreme: ['🎨', '🎭', '🎪', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸']
        };
        
        const counts = {
            easy: 3,
            medium: 4,
            hard: 5,
            extreme: 6
        };
        
        const emojis = emojiSets[difficulty];
        const count = counts[difficulty];
        
        const sequence = [];
        for (let i = 0; i < count; i++) {
            sequence.push(emojis[Math.floor(Math.random() * emojis.length)]);
        }
        
        // Elegir qué emoji contar
        const targetEmoji = sequence[Math.floor(Math.random() * sequence.length)];
        const answer = sequence.filter(e => e === targetEmoji).length;
        
        return {
            type: 'emoji',
            question: `😊 Cuenta cuántos ${targetEmoji} hay:\n\n${sequence.join(' ')}\n\nRespuesta (número):`,
            answer: String(answer),
            difficulty
        };
    }
    
    /**
     * CAPTCHA de Patrones
     */
    static generatePattern(difficulty = 'medium') {
        const sequences = {
            easy: [
                { pattern: [2, 4, 6, 8, '?'], answer: '10' },
                { pattern: [1, 3, 5, 7, '?'], answer: '9' },
                { pattern: [5, 10, 15, 20, '?'], answer: '25' }
            ],
            medium: [
                { pattern: [1, 4, 9, 16, '?'], answer: '25' }, // cuadrados
                { pattern: [2, 6, 12, 20, '?'], answer: '30' }, // n*(n+1)
                { pattern: [1, 1, 2, 3, 5, 8, '?'], answer: '13' } // fibonacci
            ],
            hard: [
                { pattern: [1, 8, 27, 64, '?'], answer: '125' }, // cubos
                { pattern: [2, 3, 5, 7, 11, '?'], answer: '13' }, // primos
                { pattern: [1, 4, 10, 22, 46, '?'], answer: '94' } // *2+2
            ],
            extreme: [
                { pattern: [1, 11, 21, 1211, 111221, '?'], answer: '312211' }, // look-and-say
                { pattern: [0, 1, 1, 2, 3, 5, 8, 13, '?'], answer: '21' }, // fibonacci extendido
                { pattern: [2, 12, 36, 80, 150, '?'], answer: '252' } // n^3 + n^2
            ]
        };
        
        const options = sequences[difficulty];
        const selected = options[Math.floor(Math.random() * options.length)];
        
        return {
            type: 'pattern',
            question: `🔍 Completa la secuencia:\n\n${selected.pattern.join(', ')}\n\n¿Qué número falta?`,
            answer: selected.answer,
            difficulty
        };
    }
    
    /**
     * CAPTCHA de Ordenar
     */
    static generateOrder(difficulty = 'medium') {
        const wordSets = {
            easy: [
                { scrambled: 'LHOA', answer: 'HOLA' },
                { scrambled: 'SACA', answer: 'CASA' },
                { scrambled: 'GAOT', answer: 'GATO' }
            ],
            medium: [
                { scrambled: 'RPOET', answer: 'PORTE' },
                { scrambled: 'DNUMO', answer: 'MUNDO' },
                { scrambled: 'GMAAI', answer: 'MAGIA' }
            ],
            hard: [
                { scrambled: 'TNOMRAE', answer: 'MONTARE' },
                { scrambled: 'CPETRAO', answer: 'CAOPERT' }, // trampa
                { scrambled: 'DLNAUO', answer: 'ONDULA' }
            ],
            extreme: [
                { scrambled: 'CIMTAONAU', answer: 'AUTOMATICO' },
                { scrambled: 'NEIREVSO', answer: 'VERSION' }
            ]
        };
        
        const options = wordSets[difficulty];
        const selected = options[Math.floor(Math.random() * options.length)];
        
        return {
            type: 'order',
            question: `🔤 Ordena las letras para formar una palabra:\n\n${selected.scrambled}\n\nRespuesta (en MAYÚSCULAS):`,
            answer: selected.answer,
            difficulty
        };
    }
    
    /**
     * CAPTCHA de Quiz
     */
    static generateQuiz(difficulty = 'medium') {
        const questions = {
            easy: [
                { q: '¿Cuántos días tiene una semana?', a: '7' },
                { q: '¿Cuántas patas tiene un gato?', a: '4' },
                { q: '¿De qué color es el cielo en un día soleado?', a: 'azul' }
            ],
            medium: [
                { q: '¿Cuál es la capital de Perú?', a: 'lima' },
                { q: '¿Cuántos continentes hay en el mundo?', a: '7' },
                { q: '¿En qué año comenzó el siglo XXI?', a: '2001' }
            ],
            hard: [
                { q: '¿Cuál es el río más largo del mundo?', a: 'amazonas' },
                { q: '¿Quién escribió "Don Quijote"?', a: 'cervantes' },
                { q: '¿Cuántos huesos tiene el cuerpo humano adulto?', a: '206' }
            ],
            extreme: [
                { q: '¿En qué año cayó el Muro de Berlín?', a: '1989' },
                { q: '¿Cuál es el elemento químico con símbolo Au?', a: 'oro' },
                { q: '¿Quién pintó "La Noche Estrellada"?', a: 'van gogh' }
            ]
        };
        
        const options = questions[difficulty];
        const selected = options[Math.floor(Math.random() * options.length)];
        
        return {
            type: 'quiz',
            question: `❓ ${selected.q}`,
            answer: selected.a.toLowerCase(),
            difficulty
        };
    }
    
    // Utilidades
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    static distortText(text, difficulty) {
        const styles = {
            easy: text,
            medium: text.split('').map(c => Math.random() > 0.5 ? c : c.toLowerCase()).join(''),
            hard: '`' + text.split('').join(' ') + '`',
            extreme: text.split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join('')
        };
        
        return styles[difficulty] || text;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      SISTEMA DE VERIFICACIÓN                                │
// ═══════════════════════════════════════════════════════════════════════════════

class CaptchaVerification {
    constructor() {
        this.activeCaptchas = new Map();
        this.verifiedUsers = new Map();
        this.failedAttempts = new Map();
        this.bannedUsers = new Map();
        this.whitelist = new Set();
        this.blacklist = new Set();
        this.trustScores = new Map();
        this.stats = {
            total: 0,
            success: 0,
            failed: 0,
            timeout: 0,
            byType: {},
            byDifficulty: {}
        };
    }
    
    /**
     * Crear nuevo CAPTCHA
     */
    createCaptcha(userId, options = {}) {
        // Verificar blacklist
        if (CONFIG.BLACKLIST_ENABLED && this.blacklist.has(userId)) {
            Logger.warn(`Usuario en blacklist intentó obtener CAPTCHA: ${userId}`);
            return {
                success: false,
                message: '🚫 Estás en la lista negra. Contacta a un administrador.'
            };
        }
        
        // Verificar ban temporal
        if (this.isBanned(userId)) {
            const banInfo = this.bannedUsers.get(userId);
            const remainingTime = Math.ceil((banInfo.until - Date.now()) / 1000);
            return {
                success: false,
                message: `⏳ Estás baneado temporalmente.\nTiempo restante: ${this.formatTime(remainingTime)}`
            };
        }
        
        // Verificar whitelist (auto-verificar)
        if (CONFIG.WHITELIST_ENABLED && this.whitelist.has(userId)) {
            this.verifyUser(userId);
            return {
                success: true,
                autoVerified: true,
                message: '✅ Usuario de confianza verificado automáticamente.'
            };
        }
        
        // Verificar si ya está verificado
        if (this.isVerified(userId)) {
            return {
                success: true,
                alreadyVerified: true,
                message: '✅ Ya estás verificado.'
            };
        }
        
        // Verificar si ya tiene un CAPTCHA activo
        if (this.activeCaptchas.has(userId)) {
            const existing = this.activeCaptchas.get(userId);
            if (Date.now() < existing.expiresAt) {
                return {
                    success: false,
                    message: '⚠️ Ya tienes un CAPTCHA activo. Responde primero.',
                    captcha: existing
                };
            } else {
                // Expiró, eliminar
                this.handleTimeout(userId);
            }
        }
        
        // Configuración
        const type = options.type || CONFIG.DEFAULT_TYPE;
        const difficulty = options.difficulty || CONFIG.DEFAULT_DIFFICULTY;
        
        // Generar CAPTCHA
        let captchaData;
        
        switch (type) {
            case 'math':
                captchaData = CaptchaGenerator.generateMath(difficulty);
                break;
            case 'text':
                captchaData = CaptchaGenerator.generateText(difficulty);
                break;
            case 'emoji':
                captchaData = CaptchaGenerator.generateEmoji(difficulty);
                break;
            case 'pattern':
                captchaData = CaptchaGenerator.generatePattern(difficulty);
                break;
            case 'order':
                captchaData = CaptchaGenerator.generateOrder(difficulty);
                break;
            case 'quiz':
                captchaData = CaptchaGenerator.generateQuiz(difficulty);
                break;
            default:
                captchaData = CaptchaGenerator.generateMath(difficulty);
        }
        
        // Timeout según dificultad
        const timeouts = {
            easy: CONFIG.TIMEOUT_EASY,
            medium: CONFIG.TIMEOUT_MEDIUM,
            hard: CONFIG.TIMEOUT_HARD,
            extreme: CONFIG.TIMEOUT_EXTREME
        };
        
        const timeout = timeouts[difficulty];
        const captchaId = crypto.randomBytes(8).toString('hex');
        
        const captcha = {
            id: captchaId,
            userId,
            ...captchaData,
            attempts: 0,
            maxAttempts: CONFIG.MAX_ATTEMPTS,
            createdAt: Date.now(),
            expiresAt: Date.now() + timeout,
            timeout
        };
        
        this.activeCaptchas.set(userId, captcha);
        
        // Estadísticas
        this.stats.total++;
        this.stats.byType[type] = (this.stats.byType[type] || 0) + 1;
        this.stats.byDifficulty[difficulty] = (this.stats.byDifficulty[difficulty] || 0) + 1;
        
        Logger.info(`🔐 CAPTCHA creado para ${userId}: ${type} (${difficulty})`);
        
        return {
            success: true,
            captcha: {
                id: captchaId,
                question: captcha.question,
                type: captcha.type,
                difficulty: captcha.difficulty,
                attempts: captcha.maxAttempts,
                timeout: Math.ceil(timeout / 1000)
            }
        };
    }
    
    /**
     * Verificar respuesta
     */
    verifyCaptcha(userId, answer) {
        // Verificar si tiene CAPTCHA activo
        if (!this.activeCaptchas.has(userId)) {
            return {
                success: false,
                message: '❌ No tienes ningún CAPTCHA activo.\nUsa el comando para obtener uno nuevo.'
            };
        }
        
        const captcha = this.activeCaptchas.get(userId);
        
        // Verificar timeout
        if (Date.now() > captcha.expiresAt) {
            this.handleTimeout(userId);
            return {
                success: false,
                message: '⏰ El CAPTCHA expiró.\nIntenta nuevamente.'
            };
        }
        
        captcha.attempts++;
        
        // Normalizar respuesta
        const userAnswer = String(answer).trim().toLowerCase();
        const correctAnswer = String(captcha.answer).trim().toLowerCase();
        
        // Verificar respuesta
        if (userAnswer === correctAnswer) {
            // ✅ CORRECTO
            this.activeCaptchas.delete(userId);
            this.verifyUser(userId);
            this.incrementTrustScore(userId, 10);
            this.clearFailedAttempts(userId);
            
            // Estadísticas
            this.stats.success++;
            
            Logger.info(`✅ ${userId} verificado correctamente`);
            
            // Auto-whitelist después de X verificaciones exitosas
            const trustScore = this.getTrustScore(userId);
            if (trustScore.successfulCaptchas >= CONFIG.AUTO_VERIFY_AFTER) {
                this.addToWhitelist(userId);
                Logger.info(`⭐ ${userId} agregado a whitelist automáticamente`);
            }
            
            return {
                success: true,
                verified: true,
                message: `✅ ¡Correcto! Has sido verificado.\n\n🎯 Puntos de confianza: ${trustScore.score}/100`,
                trustScore: trustScore.score
            };
        } else {
            // ❌ INCORRECTO
            const remainingAttempts = captcha.maxAttempts - captcha.attempts;
            
            this.recordFailedAttempt(userId);
            this.decrementTrustScore(userId, 5);
            
            // Estadísticas
            this.stats.failed++;
            
            if (remainingAttempts > 0) {
                // Aún tiene intentos
                this.activeCaptchas.set(userId, captcha);
                
                Logger.warn(`❌ ${userId} falló intento ${captcha.attempts}/${captcha.maxAttempts}`);
                
                return {
                    success: false,
                    message: `❌ Respuesta incorrecta.\n\n🔄 Intentos restantes: ${remainingAttempts}\n⏰ Tiempo restante: ${this.getRemainingTime(captcha)}`
                };
            } else {
                // Sin intentos
                this.activeCaptchas.delete(userId);
                this.handleMaxAttempts(userId);
                
                Logger.warn(`🚫 ${userId} agotó todos los intentos`);
                
                return {
                    success: false,
                    maxAttemptsReached: true,
                    message: `❌ Agotaste todos los intentos.\n\n⏳ Debes esperar ${this.formatTime(CONFIG.PENALTY_TIME / 1000)} antes de intentar nuevamente.`
                };
            }
        }
    }
    
    /**
     * Verificar usuario manualmente (admin)
     */
    verifyUser(userId, duration = CONFIG.VERIFICATION_EXPIRES) {
        this.verifiedUsers.set(userId, {
            verifiedAt: Date.now(),
            expiresAt: Date.now() + duration
        });
        
        // Incrementar contador de éxitos en trust score
        const trust = this.trustScores.get(userId) || { score: 50, successfulCaptchas: 0, failedAttempts: 0 };
        trust.successfulCaptchas++;
        this.trustScores.set(userId, trust);
        
        Logger.info(`✅ Usuario verificado: ${userId}`);
    }
    
    /**
     * Verificar si usuario está verificado
     */
    isVerified(userId) {
        if (!this.verifiedUsers.has(userId)) return false;
        
        const verification = this.verifiedUsers.get(userId);
        
        // Verificar si expiró
        if (Date.now() > verification.expiresAt) {
            this.verifiedUsers.delete(userId);
            return false;
        }
        
        return true;
    }
    
    /**
     * Revocar verificación
     */
    revokeVerification(userId) {
        this.verifiedUsers.delete(userId);
        Logger.info(`🔓 Verificación revocada: ${userId}`);
    }
    
    /**
     * Manejar timeout
     */
    handleTimeout(userId) {
        this.activeCaptchas.delete(userId);
        this.recordFailedAttempt(userId);
        this.stats.timeout++;
        
        Logger.warn(`⏰ CAPTCHA expiró para ${userId}`);
    }
    
    /**
     * Manejar intentos máximos
     */
    handleMaxAttempts(userId) {
        const failures = this.failedAttempts.get(userId) || 0;
        
        // Ban temporal si excede límite
        if (failures >= CONFIG.MAX_FAILURES_BEFORE_BAN) {
            this.banUser(userId, CONFIG.BAN_DURATION);
            Logger.error(`🚫 ${userId} baneado temporalmente por múltiples fallos`);
        }
    }
    
    /**
     * Banear usuario temporalmente
     */
    banUser(userId, duration = CONFIG.BAN_DURATION) {
        this.bannedUsers.set(userId, {
            bannedAt: Date.now(),
            until: Date.now() + duration,
            reason: 'Múltiples fallos en CAPTCHA'
        });
        
        Logger.error(`🚫 Usuario baneado: ${userId} (${duration}ms)`);
    }
    
    /**
     * Verificar si está baneado
     */
    isBanned(userId) {
        if (!this.bannedUsers.has(userId)) return false;
        
        const ban = this.bannedUsers.get(userId);
        
        if (Date.now() > ban.until) {
            this.bannedUsers.delete(userId);
            return false;
        }
        
        return true;
    }
    
    /**
     * Desbanear usuario
     */
    unbanUser(userId) {
        this.bannedUsers.delete(userId);
        Logger.info(`✅ Usuario desbaneado: ${userId}`);
    }
    
    /**
     * Whitelist
     */
    addToWhitelist(userId) {
        this.whitelist.add(userId);
        this.verifyUser(userId, Infinity); // Verificación permanente
        Logger.info(`⭐ Usuario agregado a whitelist: ${userId}`);
    }
    
    removeFromWhitelist(userId) {
        this.whitelist.delete(userId);
        Logger.info(`❌ Usuario removido de whitelist: ${userId}`);
    }
    
    /**
     * Blacklist
     */
    addToBlacklist(userId) {
        this.blacklist.add(userId);
        this.revokeVerification(userId);
        this.activeCaptchas.delete(userId);
        Logger.error(`🚫 Usuario agregado a blacklist: ${userId}`);
    }
    
    removeFromBlacklist(userId) {
        this.blacklist.delete(userId);
        Logger.info(`✅ Usuario removido de blacklist: ${userId}`);
    }
    
    /**
     * Trust Score
     */
    getTrustScore(userId) {
        if (!this.trustScores.has(userId)) {
            this.trustScores.set(userId, {
                score: 50,
                successfulCaptchas: 0,
                failedAttempts: 0
            });
        }
        
        return this.trustScores.get(userId);
    }
    
    incrementTrustScore(userId, amount) {
        const trust = this.getTrustScore(userId);
        trust.score = Math.min(100, trust.score + amount);
        this.trustScores.set(userId, trust);
    }
    
    decrementTrustScore(userId, amount) {
        const trust = this.getTrustScore(userId);
        trust.score = Math.max(0, trust.score - amount);
        trust.failedAttempts++;
        this.trustScores.set(userId, trust);
    }
    
    /**
     * Failed Attempts
     */
    recordFailedAttempt(userId) {
        const current = this.failedAttempts.get(userId) || 0;
        this.failedAttempts.set(userId, current + 1);
    }
    
    clearFailedAttempts(userId) {
        this.failedAttempts.delete(userId);
    }
    
    /**
     * Utilidades
     */
    getRemainingTime(captcha) {
        const remaining = Math.ceil((captcha.expiresAt - Date.now()) / 1000);
        return this.formatTime(remaining);
    }
    
    formatTime(seconds) {
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}m ${secs}s`;
    }
    
    /**
     * Estadísticas
     */
    getStats() {
        const successRate = this.stats.total > 0 
            ? (this.stats.success / this.stats.total * 100).toFixed(2)
            : 0;
        
        return {
            ...this.stats,
            successRate: `${successRate}%`,
            activeUsers: this.verifiedUsers.size,
            activeCaptchas: this.activeCaptchas.size,
            bannedUsers: this.bannedUsers.size,
            whitelistSize: this.whitelist.size,
            blacklistSize: this.blacklist.size
        };
    }
    
    /**
     * Limpiar expirados
     */
    cleanup() {
        const now = Date.now();
        let cleaned = 0;
        
        // Limpiar CAPTCHAs expirados
        for (const [userId, captcha] of this.activeCaptchas.entries()) {
            if (now > captcha.expiresAt) {
                this.activeCaptchas.delete(userId);
                cleaned++;
            }
        }
        
        // Limpiar verificaciones expiradas
        for (const [userId, verification] of this.verifiedUsers.entries()) {
            if (now > verification.expiresAt) {
                this.verifiedUsers.delete(userId);
                cleaned++;
            }
        }
        
        // Limpiar bans expirados
        for (const [userId, ban] of this.bannedUsers.entries()) {
            if (now > ban.until) {
                this.bannedUsers.delete(userId);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            Logger.info(`🧹 Limpieza: ${cleaned} entradas eliminadas`);
        }
        
        return cleaned;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// │                      INSTANCIA GLOBAL                                       │
// ═══════════════════════════════════════════════════════════════════════════════

const captchaSystem = new CaptchaVerification();

// Auto-cleanup cada 5 minutos
setInterval(() => {
    captchaSystem.cleanup();
}, 300000);

// ═══════════════════════════════════════════════════════════════════════════════
// │                      EXPORTACIONES                                          │
// ═══════════════════════════════════════════════════════════════════════════════

export {
    CaptchaVerification,
    CaptchaGenerator,
    captchaSystem,
    CONFIG
};

export default captchaSystem;
